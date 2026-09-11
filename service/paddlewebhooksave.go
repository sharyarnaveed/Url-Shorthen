package service

import (
	"context"
	"encoding/json"
	"log"
	"strconv"

	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
)

type PaddleWebhook struct {
	Data      PaddleSubscriptionData `json:"data"`
	EventID   string                 `json:"event_id"`
	EventType string                 `json:"event_type"`
}

type PaddleSubscriptionData struct {
	ID                   string                   `json:"id"`
	CustomerID           string                   `json:"customer_id"`
	Status               string                   `json:"status"`
	CustomData           PaddleCustomData         `json:"custom_data"`
	Items                []PaddleSubscriptionItem `json:"items"`
	TransactionID        string                   `json:"transaction_id"`
	CurrentBillingPeriod PaddleBillingPeriod      `json:"current_billing_period"`
}

type PaddleCustomData struct {
	UserID int `json:"user_id"`
}

type PaddleSubscriptionItem struct {
	Price PaddlePrice `json:"price"`
}

type PaddlePrice struct {
	ID        string    `json:"id"`
	ProductID string    `json:"product_id"`
	UnitPrice UnitPrice `json:"unit_price"`
	Name      string    `json:"name"`
}

type PaddleBillingPeriod struct {
	StartsAt string `json:"starts_at"`
	EndsAt   string `json:"ends_at"`
}

type UnitPrice struct {
	Amount       string `json:"amount"`
	CurrencyCode string `json:"currency_code"`
}

func SavePayment(data any) bool {
	log.Println(data)
	var webhook PaddleWebhook
	payload, ok := data.([]byte)
	if !ok {
		return false
	}

	err := json.Unmarshal(payload, &webhook)
	if err != nil {
		return false
	}

	if webhook.EventType != "subscription.created" {
		log.Println("not subscribed event")
		return false
	}
	userid := webhook.Data.CustomData.UserID

	eventid := webhook.EventID
	eventtype := webhook.EventType

	result, err := database.DB.Exec(
		context.Background(),
		`
    INSERT INTO webhook_events (paddle_event_id, event_type)
    VALUES ($1, $2)
    ON CONFLICT (paddle_event_id) DO NOTHING
    `,
		eventid,
		eventtype,
	)

	if err != nil {
		log.Println("error saving webhook event:", err)
		return false
	}

	rowsAffected := result.RowsAffected()

	if rowsAffected == 0 {
		log.Println("Webhook already processed:", eventid)
		return true
	}

	transctionid := webhook.Data.TransactionID
	subscriptionid := webhook.Data.ID
	customerid := webhook.Data.CustomerID
	productid := webhook.Data.Items[0].Price.ProductID
	priceID := webhook.Data.Items[0].Price.ID
	amount, err := strconv.ParseInt(
		webhook.Data.Items[0].Price.UnitPrice.Amount,
		10,
		64,
	)

	if err != nil {
		log.Println("invalid amount:", err)
		return false
	}

	amount = amount / 100

	currency := webhook.Data.Items[0].Price.UnitPrice.CurrencyCode
	status := webhook.Data.Status
	_, savingpaymenterror := database.DB.Exec(context.Background(),
		`INSERT INTO payments (user_id,paddle_transaction_id,paddle_subscription_id,paddle_customer_id,paddle_product_id,paddle_price_id,amount,currency,status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		userid, transctionid, subscriptionid, customerid, productid, priceID, amount, currency, status,
	)

	if savingpaymenterror != nil {
		log.Println("error saving subscription", savingpaymenterror)
		return false
	}

	curentperiodstart := webhook.Data.CurrentBillingPeriod.StartsAt
	periodenddate := webhook.Data.CurrentBillingPeriod.EndsAt

	_, subsciptionerror := database.DB.Exec(context.Background(),
		`INSERT INTO subscriptions (
    user_id,
    paddle_subscription_id,
    paddle_customer_id,
    paddle_product_id,
    paddle_price_id,
    status,
    current_period_start,
    current_period_end
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		userid, subscriptionid, customerid, productid, priceID, status, curentperiodstart, periodenddate)

	if subsciptionerror != nil {
		log.Println("error saving subscription", subsciptionerror)
		return false
	}
	planName := webhook.Data.Items[0].Price.Name
	_, userssavingerror := database.DB.Exec(
		context.Background(),
		` UPDATE users
    SET
        planselected = $1,
        amount = $2,
        payment_date = $3,
        payment_expire = $4,
		status=$5
    	WHERE id = $6 `,
		planName, amount, curentperiodstart, periodenddate, "paid", userid,
	)
	if userssavingerror != nil {
		log.Println("error saving subscription", subsciptionerror)
		return false
	}

	return true

}
