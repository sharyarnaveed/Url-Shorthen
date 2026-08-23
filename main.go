package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/joho/godotenv"
	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
	"github.com/sharyarnaveed/Url-Shorthen.git/service"
)

type CreateURLREQUEST struct {
	URL string `json:"url"`
}

func sendtoservice(w http.ResponseWriter, r *http.Request) {
	var userurl CreateURLREQUEST
	err := json.NewDecoder(r.Body).Decode(&userurl)

	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if userurl.URL == "" {
		http.Error(w, "No Url", http.StatusBadRequest)
		return
	}
	shortcode, success := service.SaveURl(userurl.URL)

	if success == false {
		http.Error(w, "Error in saving url", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"meassage":  "url saved",
		"shortCode": shortcode,
	})

}

func gettheredirect(w http.ResponseWriter, r *http.Request) {
	getshortcode := r.PathValue("code")
	if getshortcode == "" {

		http.Error(w, "No Url", http.StatusBadRequest)
		return

	}
	url, success := service.Getredirect(getshortcode)

	if success == false {
		http.Error(w, "cannot get the url", http.StatusBadRequest)
		return
	}

	http.Redirect(w, r, url, http.StatusFound)
}

func main() {

	err := godotenv.Load()

	if err != nil {
		log.Fatal(err)
	}

	database.Connect()

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/shorten", sendtoservice)
	mux.HandleFunc("GET /{code}", gettheredirect)
	log.Println("Server running on :8080")

	log.Fatal(http.ListenAndServe(":8080", mux))
}
