package utils

import (
	"net/mail"
	"regexp"
)

func IsVerified(email string) bool {
	_, err := mail.ParseAddress(email)
	if err != nil {
		return false
	}

	return true
}

func IsVerifiedName(name string) bool {
	matched, _ := regexp.MatchString(`^[A-Za-z]+$`, name)
	return matched
}
