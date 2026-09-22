package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
)

var base64 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func generateshortcode(id int64) string {
	if id == 0 {
		return string(base64[0])
	}
	var result []byte
	for id > 0 {
		reminder := id % 62
		result = append(result, base64[reminder])
		id = id / 62
	}

	// reverse becuse charters are generated backeward

	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}
	fmt.Println(string(result))
	return string(result)

}

func SaveURl(url string, userid int64, title string) (string, bool) {
	var id int64
	var userplan string
	var paymentexipry string

	errpaymentexiry := database.DB.QueryRow(
		context.Background(),
		`SELECT planselected,payment_expire from users WHERE id=$1`,
		userid,
	).Scan(&userplan, &paymentexipry)

	if errpaymentexiry != nil {
		if errors.Is(errpaymentexiry, pgx.ErrNoRows) {
			println("User does not exist", userid)
			return "User doesnot exsist", false
		}
		log.Println("Database query error:", errpaymentexiry)
		return "Email doesnot exsists", false
	}

	expirytime, expiryerr := time.Parse(time.RFC3339, paymentexipry)

	if expiryerr != nil {
		log.Println("failed to parse time", expiryerr)
		return "failed to aprse time", false
	}

	if time.Now().UTC().After(expirytime) {
		return "Payment has expired", false
	}

	if userplan != "basic price" && userplan != "pro plan" {
		return "payment plan is invalid", false

	}
	fmt.Println("checking user plan", userplan)
	var urlcount int

	urlcountcheckerr := database.DB.QueryRow(
		context.Background(),
		`SELECT COUNT(*)
	FROM urls
	WHERE userid = $1;`,
		userid,
	).Scan(&urlcount)
	println("checking url count", urlcount)
	if urlcountcheckerr != nil {
		log.Println("Database query error:", urlcountcheckerr)
		return "failed to check url count", false
	}

	if userplan == "basic price" && urlcount == 100 {
		return "Limit has been reached", false

	}

	err := database.DB.QueryRow(
		context.Background(),
		`INSERT INTO urls (original_url, userid, title) values ($1, $2, $3) RETURNING id`,
		url, userid, title,
	).Scan(&id)
	if err != nil {
		log.Println("data not saved found an error:", err)
		return "", false
	}
	shortcode := generateshortcode(id)

	_, errinudpating := database.DB.Exec(
		context.Background(),
		`UPDATE urls SET short_code=$1
		WHERE id=$2`,
		shortcode, id,
	)
	if errinudpating != nil {
		log.Println("data not saved found an error:", errinudpating)
		return "", false
	}
	return shortcode, true
}
