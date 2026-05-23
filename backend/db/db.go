package db

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/kisbogdan-kolos/lego-pincer/backend/helper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

type Item struct {
	gorm.Model

	AvailableFrom     *time.Time `gorm:"not null"`
	AvailableUntil    *time.Time `gorm:"not null"`
	AvailableQuantity uint       `gorm:"not null"`

	Price      float64 `gorm:"not null"`
	BonusPrice float64 `gorm:"not null"`

	Name        *string `gorm:"not null"`
	Description *string `gorm:"not null"`

	Orders []Order `gorm:"foreignKey:ItemID"`
}

type Order struct {
	gorm.Model

	UUID *uuid.UUID `gorm:"not null"`

	ItemID uint `gorm:"not null"`
	Item   Item `gorm:"foreignKey:ItemID"`

	Name       *string    `gorm:"not null"`
	Email      *string    `gorm:"not null"`
	RoomNumber *string    `gorm:"not null"`
	Time       *time.Time `gorm:"not null"`

	Quantity uint `gorm:"not null"`
	Bonus    bool `gorm:"not null"`
}

func DbConnect() error {
	host := helper.EnvGet("DB_HOST", "localhost")
	user := helper.EnvGet("DB_USER", "gorm")
	pass := helper.EnvGet("DB_PASS", "gorm")
	name := helper.EnvGet("DB_NAME", "lego-pincer")
	port := helper.EnvGet("DB_PORT", "5432")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Europe/Budapest", host, user, pass, name, port)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	DB = db

	models := []any{&Item{}, &Order{}}

	for _, model := range models {
		err = DB.AutoMigrate(model)
		if err != nil {
			return err
		}
	}

	return err
}
