package service

import (
	"context"
	"log"

	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
)

func DeleteShortLink(linkid int64) bool {
	result, err := database.DB.Exec(
		context.Background(),
		`DELETE FROM urls WHERE id=$1`,
		linkid,
	)
	if err != nil {
		log.Println("data not deleted", err)
		return false
	}
	if result.RowsAffected() == 0 {
		log.Println("no URL found with id:", linkid)
		return false
	}
	return true
}
