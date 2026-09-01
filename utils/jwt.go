package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte(os.Getenv("JWTSECRETE"))

func CreateToken(userid int) (string, bool) {
	claims := jwt.MapClaims{
		"user_id": userid,
		"exp":     time.Now().Add(3 * 24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	str, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", false
	}
	return str, true
}
