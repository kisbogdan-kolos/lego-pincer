package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kisbogdan-kolos/lego-pincer/backend/db"
	"github.com/kisbogdan-kolos/lego-pincer/backend/email"
	"github.com/kisbogdan-kolos/lego-pincer/backend/helper"
	"gorm.io/gorm"
)

var validRooms map[string]struct{}

func init() {
	if err := loadValidRooms(); err != nil {
		log.Fatalf("failed to load room list: %v", err)
	}
}

func loadValidRooms() error {
	_, filePath, _, ok := runtime.Caller(0)
	if !ok {
		return fmt.Errorf("could not determine api package path")
	}

	roomsPath := filepath.Join(filepath.Dir(filePath), "..", "rooms.json")
	roomsPath = helper.EnvGet("ROOMS_JSON_PATH", roomsPath)
	content, err := os.ReadFile(roomsPath)
	if err != nil {
		return err
	}

	var rooms []string
	if err := json.Unmarshal(content, &rooms); err != nil {
		return err
	}

	validRooms = make(map[string]struct{}, len(rooms))
	for _, room := range rooms {
		validRooms[room] = struct{}{}
	}

	return nil
}

type CreateOrderRequest struct {
	ItemID     uint   `json:"item_id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	RoomNumber string `json:"room_number"`
	Quantity   uint   `json:"quantity"`
	Bonus      bool   `json:"bonus"`
}

type OrderResponse struct {
	ID         uint             `json:"id"`
	UUID       string           `json:"uuid"`
	ItemID     uint             `json:"item_id"`
	Product    *ProductResponse `json:"product,omitempty"`
	Name       string           `json:"name"`
	Email      string           `json:"email"`
	RoomNumber string           `json:"room_number"`
	Time       time.Time        `json:"time"`
	Quantity   uint             `json:"quantity"`
	Bonus      bool             `json:"bonus"`
	CreatedAt  time.Time        `json:"created_at"`
}

func orderToResponse(order *db.Order) *OrderResponse {
	return &OrderResponse{
		ID:         order.ID,
		UUID:       order.UUID.String(),
		ItemID:     order.ItemID,
		Name:       *order.Name,
		Email:      *order.Email,
		RoomNumber: *order.RoomNumber,
		Time:       *order.Time,
		Quantity:   order.Quantity,
		Bonus:      order.Bonus,
		CreatedAt:  order.CreatedAt,
	}
}

func productToResponse(item *db.Item) *ProductResponse {
	if item == nil {
		return nil
	}

	name := ""
	desc := ""
	if item.Name != nil {
		name = *item.Name
	}
	if item.Description != nil {
		desc = *item.Description
	}

	return &ProductResponse{
		ID:                item.ID,
		Name:              name,
		Description:       desc,
		Price:             item.Price,
		BonusPrice:        item.BonusPrice,
		AvailableQuantity: item.AvailableQuantity,
		AvailableFrom:     item.AvailableFrom,
		AvailableUntil:    item.AvailableUntil,
	}
}

func orderToResponseWithProduct(order *db.Order) *OrderResponse {
	response := orderToResponse(order)
	response.Product = productToResponse(&order.Item)
	return response
}

func orderListAuth() gin.HandlerFunc {
	username := helper.EnvGet("ORDERS_BASIC_AUTH_USER", "lego")
	password := helper.EnvGet("ORDERS_BASIC_AUTH_PASS", "Almafa12")

	return gin.BasicAuth(gin.Accounts{
		username: password,
	})
}

func Register(router *gin.RouterGroup) {
	router.POST("/order", handleCreateOrder)
	router.GET("/order/:uuid", handleGetOrder)
	router.DELETE("/order/:uuid", handleDeleteOrder)
	router.GET("/product", handleGetAllProducts)
	router.GET("/order", orderListAuth(), handleGetAllOrders)
}

type ProductResponse struct {
	ID                uint       `json:"id"`
	Name              string     `json:"name"`
	Description       string     `json:"description"`
	Price             float64    `json:"price"`
	BonusPrice        float64    `json:"bonus_price"`
	AvailableQuantity uint       `json:"available_quantity"`
	AvailableFrom     *time.Time `json:"available_from,omitempty"`
	AvailableUntil    *time.Time `json:"available_until,omitempty"`
}

func handleGetAllProducts(c *gin.Context) {
	var items []db.Item
	res := db.DB.Find(&items)
	if res.Error != nil {
		log.Printf("DB error fetching items: %v", res.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	resp := make([]ProductResponse, 0)

	for _, item := range items {
		var totalOrdered uint
		err := db.DB.Model(&db.Order{}).Where("item_id = ?", item.ID).Select("COALESCE(SUM(quantity),0)").Row().Scan(&totalOrdered)
		if err != nil {
			log.Printf("DB error calculating ordered quantity for item %d: %v", item.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		available := uint(0)
		if item.AvailableQuantity > totalOrdered {
			available = item.AvailableQuantity - totalOrdered
		}

		name := ""
		desc := ""
		if item.Name != nil {
			name = *item.Name
		}
		if item.Description != nil {
			desc = *item.Description
		}

		resp = append(resp, ProductResponse{
			ID:                item.ID,
			Name:              name,
			Description:       desc,
			Price:             item.Price,
			BonusPrice:        item.BonusPrice,
			AvailableQuantity: available,
			AvailableFrom:     item.AvailableFrom,
			AvailableUntil:    item.AvailableUntil,
		})
	}

	c.JSON(http.StatusOK, resp)
}

func handleCreateOrder(c *gin.Context) {
	var req CreateOrderRequest

	err := c.ShouldBindBodyWithJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.RoomNumber = strings.TrimSpace(req.RoomNumber)

	if _, ok := validRooms[strings.TrimSpace(req.RoomNumber)]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid room number"})
		return
	}

	// Fetch the item
	var item db.Item
	res := db.DB.First(&item, req.ItemID)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
			return
		}
		log.Printf("DB error fetching item: %v", res.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	// Check if item is available
	now := time.Now()
	if item.AvailableFrom != nil && now.Before(*item.AvailableFrom) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "item not available yet"})
		return
	}

	if item.AvailableUntil != nil && now.After(*item.AvailableUntil) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "item availability period has ended"})
		return
	}

	// Calculate available quantity from existing orders
	var totalOrderedQuantity uint
	err = db.DB.Model(&db.Order{}).Where("item_id = ?", req.ItemID).Select("COALESCE(SUM(quantity), 0)").Row().Scan(&totalOrderedQuantity)
	if err != nil {
		log.Printf("DB error calculating ordered quantity: %v", res.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	availableQuantity := item.AvailableQuantity - totalOrderedQuantity

	// Check if item has sufficient quantity
	if availableQuantity < req.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{"error": "insufficient quantity available"})
		return
	}

	// Create order with UUID
	orderUUID := uuid.New()
	order := db.Order{
		UUID:       &orderUUID,
		ItemID:     req.ItemID,
		Name:       &req.Name,
		Email:      &req.Email,
		RoomNumber: &req.RoomNumber,
		Time:       &now,
		Quantity:   req.Quantity,
		Bonus:      req.Bonus,
	}

	// Insert order into DB
	res = db.DB.Create(&order)
	if res.Error != nil {
		log.Printf("DB error creating order: %v", res.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	// Send confirmation email
	editURL := helper.EnvGet("ORDER_EDIT_URL", "http://localhost:3000/order")
	editLink := fmt.Sprintf("%s/%s", editURL, orderUUID.String())
	subject := "LEGO Pincér - sikeres rendelés"
	// prepare template data
	bonusStr := "nem"
	if req.Bonus {
		bonusStr = "igen"
	}
	totalPrice := (item.Price + func() float64 {
		if req.Bonus {
			return item.BonusPrice
		}
		return 0
	}()) * float64(req.Quantity)
	message, err := email.RenderOrderConfirmation(email.OrderTemplateData{
		UserName:   req.Name,
		ItemName:   *item.Name,
		Quantity:   req.Quantity,
		Bonus:      bonusStr,
		TotalPrice: fmt.Sprintf("%.0f JMF", totalPrice),
		EditLink:   editLink,
	})
	if err != nil {
		log.Printf("Email template error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	err = email.SendEnqueue(req.Email, subject, message)
	if err != nil {
		log.Printf("Email enqueue error: %v", err)
		// Don't fail the request, just log the error
	}

	c.JSON(http.StatusCreated, orderToResponse(&order))
}

func handleGetOrder(c *gin.Context) {
	uuidStr := c.Param("uuid")

	orderUUID, err := uuid.Parse(uuidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid format"})
		return
	}

	var order db.Order
	res := db.DB.Preload("Item").Where("uuid = ?", orderUUID).First(&order)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
			return
		}
		log.Printf("DB error fetching order: %v", res.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, orderToResponseWithProduct(&order))
}

func handleDeleteOrder(c *gin.Context) {
	uuidStr := c.Param("uuid")

	orderUUID, err := uuid.Parse(uuidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid format"})
		return
	}

	var order db.Order
	res := db.DB.Where("uuid = ?", orderUUID).First(&order)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
			return
		}
		log.Printf("DB error fetching order: %v", res.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	// Delete the order
	if err := db.DB.Delete(&order).Error; err != nil {
		log.Printf("DB error deleting order: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	var item db.Item
	itemName := "your item"
	var totalPriceStr string
	if err := db.DB.First(&item, order.ItemID).Error; err == nil {
		if item.Name != nil {
			itemName = *item.Name
		}
		// compute total price
		total := (item.Price + func() float64 {
			if order.Bonus {
				return item.BonusPrice
			}
			return 0
		}()) * float64(order.Quantity)
		totalPriceStr = fmt.Sprintf("%.0f JMF", total)
	} else {
		totalPriceStr = ""
	}

	userName := ""
	if order.Name != nil {
		userName = *order.Name
	}

	cancellationSubject := "LEGO Pincér - rendelés visszamondás"
	cancellationMessage, err := email.RenderOrderCancellation(email.OrderCancellationTemplateData{
		UserName:  userName,
		OrderUUID: orderUUID.String(),
		ItemName:  itemName,
		Quantity:  order.Quantity,
		Bonus: func() string {
			if order.Bonus {
				return "igen"
			}
			return "nem"
		}(),
		TotalPrice: totalPriceStr,
	})
	if err != nil {
		log.Printf("Email template error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if err := email.SendEnqueue(*order.Email, cancellationSubject, cancellationMessage); err != nil {
		log.Printf("Email enqueue error: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "order deleted successfully"})
}

func handleGetAllOrders(c *gin.Context) {
	var orders []db.Order

	res := db.DB.Preload("Item").Find(&orders)
	if res.Error != nil {
		log.Printf("DB error fetching orders: %v", res.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	responseOrders := make([]*OrderResponse, 0, len(orders))
	for _, order := range orders {
		responseOrders = append(responseOrders, orderToResponseWithProduct(&order))
	}

	c.JSON(http.StatusOK, responseOrders)
}
