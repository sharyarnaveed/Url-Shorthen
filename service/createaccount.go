package service

import (
	"context"
	"log"

	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
	"github.com/sharyarnaveed/Url-Shorthen.git/utils"
)

func CreateAccount(firstname, lastname, email, password string) (string, bool) {

	var emailexsists string
	var message string
	therr := database.DB.QueryRow(
		context.Background(),
		`SELECT email from users WHERE email=$1`,
		email,
	).Scan(&emailexsists)
	if therr == nil {
		log.Fatal(therr)
		message = "Error in Finding Email"
		return message, false
	}
	if emailexsists != "" {
		message = "Email already exsists"

		return message, false
	}

	hashpasword, success := utils.HashPassword(password)

	if success != true {
		message = "password failed to hash"

		return message, false
	}

	_, err := database.DB.Exec(
		context.Background(),
		`INSERT INTO users (firstname,lastname,email,password) values ($1,$2,$3,$4)`,
		firstname, lastname, email, hashpasword,
	)

	if err != nil {
		log.Fatal(err)
		message = "error saving data"

		return message, false
	}

	sendmail := utils.SendSmtpmail(email, "Your Account Has Been Created")

	if sendmail != true {
		message = "falied to sned email"
		return message, false
	}

	return "Account Created", true
}
