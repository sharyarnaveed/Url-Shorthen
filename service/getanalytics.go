package service

import (
	"context"
	"fmt"

	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
)

func GetServiceAnalytics(shortcode string) []struct {
	Clicks    int
	IPAddress string
	Timestamp string
} {

	query := `SELECT clicks, ipaddress, created_at::text FROM analytics WHERE shortcode=$1 ORDER BY created_at DESC`

	rows, err := database.DB.Query(
		context.Background(),
		query,
		shortcode,
	)

	if err != nil {
		fmt.Printf("Error fetching analytics for shortcode: %s, error: %v\n", shortcode, err)
		return nil
	}

	defer rows.Close()

	var analytics []struct {
		Clicks    int
		IPAddress string
		Timestamp string
	}

	for rows.Next() {
		var clicks int
		var ipaddress string
		var timestamp string
		err := rows.Scan(&clicks, &ipaddress, &timestamp)
		if err != nil {
			fmt.Printf("Error scanning row for shortcode: %s, error: %v\n", shortcode, err)
			return nil
		}

		analytics = append(analytics, struct {
			Clicks    int
			IPAddress string
			Timestamp string
		}{
			Clicks:    clicks,
			IPAddress: ipaddress,
			Timestamp: timestamp,
		})
	}

	return analytics
}
