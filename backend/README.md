## Backend API

This backend exposes a small order API plus the static frontend assets.

### Startup

The server starts the database connection, initializes the email queue, loads the room list from `rooms.json`, and listens on `SERVER_ADDRESS`.

### Environment variables

Required for production:

- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `DB_PORT`
- `SMTP_SERVER`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_MAIL_FROM`
- `ORDER_EDIT_URL`
- `ORDERS_BASIC_AUTH_USER`
- `ORDERS_BASIC_AUTH_PASS`
- `SERVER_ADDRESS`
- `FRONTEND_DIR`

Defaults used by the code:

- `DB_HOST=localhost`
- `DB_USER=gorm`
- `DB_PASS=gorm`
- `DB_NAME=lego-pincer`
- `DB_PORT=5432`
- `SMTP_SERVER=email-smtp.eu-west-1.amazonaws.com:587`
- `SMTP_MAIL_FROM=LEGO Pincér <lego-pincer@kszi2.hu>`
- `ORDER_EDIT_URL=http://localhost:3000/order`
- `ORDERS_BASIC_AUTH_USER=lego`
- `ORDERS_BASIC_AUTH_PASS=Almafa12`
- `SERVER_ADDRESS=0.0.0.0:8080`
- `FRONTEND_DIR=../frontend/dist`

### API endpoints

#### `POST /api/order`

Creates a new order.

Request body:

```json
{
	"item_id": 1,
	"name": "Jane Doe",
	"email": "jane@example.com",
	"room_number": "101",
	"quantity": 1,
	"bonus": false
}
```

Behavior:

- Verifies the room number exists in `rooms.json`.
- Verifies the item exists.
- Verifies the current time is within the item availability window.
- Calculates available quantity from the item base quantity minus all ordered quantities for that item.
- Stores the order with a generated UUID.
- Sends a confirmation email using the template in `email/templates/order_confirmation.tmpl`.

#### `DELETE /api/order/:uuid`

Deletes an order by UUID.

Behavior:

- Returns `404` if the order does not exist.
- Deletes the order from the database.
- Sends a cancellation email using `email/templates/order_cancellation.tmpl`.

#### `GET /api/order/:uuid`

Returns a single order by UUID.

Behavior:

- Returns `400` if the UUID format is invalid.
- Returns `404` if the order does not exist.
- Returns the order payload with an additional nested `product` object.

Response example:

```json
{
	"id": 1,
	"uuid": "2d7fd4db-6d54-4d02-a4b0-3d9efaf1d8f8",
	"item_id": 1,
	"product": {
		"id": 1,
		"name": "MARGHERITA",
		"description": "Paradicsomos alap, Paradicsom, Sajt",
		"price": 1500.0,
		"bonus_price": 0.0,
		"available_quantity": 12,
		"available_from": null,
		"available_until": null
	},
	"name": "Jane Doe",
	"email": "jane@example.com",
	"room_number": "101",
	"time": "2026-05-22T12:00:00Z",
	"quantity": 1,
	"bonus": false,
	"created_at": "2026-05-22T12:00:00Z"
}
```

#### `GET /api/order`

Returns all orders.

Authentication:

- Protected by HTTP Basic Auth.
- Credentials come from `ORDERS_BASIC_AUTH_USER` and `ORDERS_BASIC_AUTH_PASS`.
- If no orders exist, the response is `[]`.
- Each order includes a nested `product` object with the ordered item details.

#### `GET /api/product`

Returns all products with computed available quantities (base `AvailableQuantity` minus all orders for that item).

Response example:

```json
[
	{
		"id": 1,
		"name": "MARGHERITA",
		"description": "Paradicsomos alap, Paradicsom, Sajt",
		"price": 1500.0,
		"bonus_price": 0.0,
		"available_quantity": 12,
		"available_from": null,
		"available_until": null
	}
]
```

### Response shape

Orders are returned as:

```json
{
	"id": 1,
	"uuid": "2d7fd4db-6d54-4d02-a4b0-3d9efaf1d8f8",
	"item_id": 1,
	"product": {
		"id": 1,
		"name": "MARGHERITA",
		"description": "Paradicsomos alap, Paradicsom, Sajt",
		"price": 1500.0,
		"bonus_price": 0.0,
		"available_quantity": 12,
		"available_from": null,
		"available_until": null
	},
	"name": "Jane Doe",
	"email": "jane@example.com",
	"room_number": "101",
	"time": "2026-05-22T12:00:00Z",
	"quantity": 1,
	"bonus": false,
	"created_at": "2026-05-22T12:00:00Z"
}
```

### Email templates

Templates live in `email/templates`:

- `order_confirmation.tmpl`
- `order_cancellation.tmpl`

### Notes

- `rooms.json` is loaded once at startup.
- The available quantity is not stored as a decrementing counter; it is derived from the item base quantity and all orders for that item.
