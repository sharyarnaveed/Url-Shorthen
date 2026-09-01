package service

import (
	"context"
	"errors"
	"log"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
	"golang.org/x/crypto/bcrypt"
)

func UserSignIn(email, password string) (string, string, bool) {
	var passwordexsist string
	var id int64

	err := database.DB.QueryRow(
		context.Background(),
		`SELECT id, password from users WHERE email=$1`,
		email,
	).Scan(&id, &passwordexsist)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", "Email doesnot exsists", false
		}
		log.Println("Database query error:", err)
		return "", "Email doesnot exsists", false
	}

	comparepass := bcrypt.CompareHashAndPassword(
		[]byte(passwordexsist),
		[]byte(password),
	)
	if comparepass != nil {
		return "", "Invalid information", false
	}

	return strconv.FormatInt(id, 10), "User found", true
}

