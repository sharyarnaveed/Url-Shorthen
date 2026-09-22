package service

import (
	"context"
	"log"
	"net"
	"net/http"
	"strings"

	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
)

func getclientip(r *http.Request) string {
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		return strings.Split(ip, ",")[0]
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}

	return host

}

func SaveAnalytics(shortcode string, r *http.Request) {

	userip := getclientip(r)

	query := `INSERT INTO analytics (shortcode,clicks,ipaddress) VALUES ($1,$2,$3)
	ON CONFLICT (shortcode,ipaddress) DO UPDATE SET clicks =analytics.clicks+1 
	 `

	_, err := database.DB.Exec(
		context.Background(),
		query,
		shortcode,
		1,
		userip,
	)
	if err != nil {
		log.Println("error saving the analytics", err)
	}

}
