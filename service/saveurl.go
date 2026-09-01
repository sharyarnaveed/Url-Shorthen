package service

import (
	"context"
	"fmt"
	"log"

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

func SaveURl(url string) (string, bool) {
	var id int64
	err := database.DB.QueryRow(
		context.Background(),
		`INSERT INTO urls (original_url) values ($1) RETURNING id`,
		url,
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
