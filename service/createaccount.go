package service

import (
	"context"
	"log"

	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
	"github.com/sharyarnaveed/Url-Shorthen.git/utils"
)

func CreateAccount(firstname, lastname, email, password string) bool {

	hashpasword, success := utils.HashPassword(password)

	if success != true {
		return false
	}

	_, err := database.DB.Exec(
		context.Background(),
		`INSERT INTO users (firstname,lastname,email,password) values ($1,$2,$3,$4)`,
		firstname, lastname, email, hashpasword,
	)

	if err != nil {
		log.Fatal(err)
		return false
	}

	sendmail := utils.SendSmtpmail(email, "Your Account Has Been Created")

	if sendmail != true {
		return false
	}

	return true
}
