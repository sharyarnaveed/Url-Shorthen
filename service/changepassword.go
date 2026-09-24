package service

import (
	"context"
	"errors"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
	"github.com/sharyarnaveed/Url-Shorthen.git/utils"
	"golang.org/x/crypto/bcrypt"
)

func Changepasswords(oldpasssword string, newpasswords string, userid int) (string, bool) {

	var savedpassword string
	var useremail string
	err := database.DB.QueryRow(
		context.Background(),
		`SELECT email,password from users WHERE id=$1`,
		userid,
	).Scan(&useremail, &savedpassword)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "no user found", false
		}
		log.Println("Database query error:", err)
		return "no user found", false
	}

	comparepass := bcrypt.CompareHashAndPassword([]byte(savedpassword), []byte(oldpasssword))

	if comparepass != nil {
		return "Wrong Password", false
	}

	hashpassword, success := utils.HashPassword(newpasswords)
	if !success {
		log.Println("pasword not hased")
		return "pasword not hased", false
	}

	query := `UPDATE users SET password=$1 WHERE id=$2`

	_, errinupdating := database.DB.Exec(
		context.Background(),
		query,
		hashpassword,
		userid,
	)
	if errinupdating != nil {
		log.Println("password not updated found an error:", errinupdating)
		return "password not updated found an error:", false
	}
	if useremail == "" {
		log.Println("no email for user", errinupdating)
		return "no email for user", false
	}
	go utils.SendSmtpmail(useremail, "Your Password has been changed!")
	return "password udpated successfully", true
}
