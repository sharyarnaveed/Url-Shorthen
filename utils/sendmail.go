package utils

import (
	"log"
	"net/smtp"
	"os"
)

func SendSmtpmail(email, message string) bool {
	from := os.Getenv("EMAIL_FROM")
	host := os.Getenv("EMAIL_HOST")
	port := os.Getenv("EMAIL_PORT")
	password := os.Getenv("EMAIL_PASS")

	auth := smtp.PlainAuth(
		"",
		from,
		password,
		host,
	)

	to := []string{email}
	messagetosend := []byte(message)

	err := smtp.SendMail(
		host+":"+port,
		auth,
		from,
		to,
		messagetosend,
	)

	if err != nil {
		log.Println("Send mail error:", err)
		return false
	}

	return true
}
