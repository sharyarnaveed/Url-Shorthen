package utils

import (
	"log"

	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, bool) {
	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		log.Println("Password hash error:", err)
		return "", false
	}
	return string(hash), true
}
