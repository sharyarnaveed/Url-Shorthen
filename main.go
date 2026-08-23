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
	success := service.SaveURl(userurl.URL)

	if success == false {
		http.Error(w, "Error in saving url", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"meassage": "url saved",
	})

}

func main() {

	err := godotenv.Load()

	if err != nil {
		log.Fatal(err)
	}

	database.Connect()

	mux := http.NewServeMux()

	mux.HandleFunc("POST /save", sendtoservice)

	log.Println("Server running on :8080")

	log.Fatal(http.ListenAndServe(":8080", mux))
}
