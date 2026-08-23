package service

import (
	"context"
	"fmt"
	"log"

	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
)

func Getredirect(shortcode string) (string, bool) {
	var redirecturl string
	var success bool

	err := database.DB.QueryRow(
		context.Background(),
		`SELECT original_url from urls WHERE short_code=$1`,
		shortcode,
	).Scan(&redirecturl)

	if err != nil {
		success = false
		log.Fatal("URL NOT FOUND", err)
	}
	success = true
	fmt.Println(redirecturl)
	return redirecturl, success
}
