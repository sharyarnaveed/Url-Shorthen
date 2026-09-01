package service

import (
	"context"
	"errors"
	"log"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
	"github.com/sharyarnaveed/Url-Shorthen.git/utils"
)

func CreateAccount(firstname, lastname, email, password string) (string, bool, string) {

	var emailexsists string
	var message string
	var id int64

	therr := database.DB.QueryRow(
		context.Background(),
		`SELECT email from users WHERE email=$1`,
		email,
	).Scan(&emailexsists)
	if therr != nil && !errors.Is(therr, pgx.ErrNoRows) {
		log.Println(therr)
		message = "Error in Finding Email"
		return message, false, ""
	}
	if emailexsists != "" {
		message = "Email already exsists"

		return message, false, ""
	}

	hashpasword, success := utils.HashPassword(password)

	if success != true {
		message = "password failed to hash"

		return message, false, ""
	}

	err := database.DB.QueryRow(
		context.Background(),
		`INSERT INTO users (firstname,lastname,email,password) values ($1,$2,$3,$4) RETURNING id`,
		firstname, lastname, email, hashpasword,
	).Scan(&id)

	if err != nil {
		log.Println("Error inserting user:", err)
		message = "error saving data"

		return message, false, ""
	}

	sendmail := utils.SendSmtpmail(email, "Your Account Has Been Created")

	if sendmail != true {
		message = "falied to sned email"
		return message, false, ""
	}

	return "Account Created", true, strconv.FormatInt(id, 10)
}
