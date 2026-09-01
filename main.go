package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/joho/godotenv"
	"github.com/sharyarnaveed/Url-Shorthen.git/internal/database"
	"github.com/sharyarnaveed/Url-Shorthen.git/service"
	"github.com/sharyarnaveed/Url-Shorthen.git/utils"
)

type CreateURLREQUEST struct {
	URL string `json:"url"`
}
type CREATEACCOUNT struct {
	FIRSTNAME  string `json:"firstname"`
	LASTNAME   string `json:"lastname"`
	EMAIL      string `json:"email"`
	PASSWORD   string `json:"password"`
	REPASSWORD string `json:"repassword"`
}

type SIGNINUSER struct {
	EMAIL    string `json:"email"`
	PASSWORD string `json:"password"`
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

func createuseraccount(w http.ResponseWriter, r *http.Request) {
	var req CREATEACCOUNT

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.FIRSTNAME == "" || req.LASTNAME == "" || req.EMAIL == "" || req.PASSWORD == "" || req.REPASSWORD == "" {
		http.Error(w, "Missing Data", http.StatusBadRequest)
		return

	}

	if req.PASSWORD != req.REPASSWORD {
		http.Error(w, "Passwords are Not Same", http.StatusBadRequest)
		return
	}
	success := utils.IsVerified(req.EMAIL)
	if success != true {
		http.Error(w, "Email not valid", http.StatusBadRequest)
		return
	}

	firstnamevalid := utils.IsVerifiedName(req.FIRSTNAME)
	if !firstnamevalid {
		http.Error(w, "First Name not valid", http.StatusBadRequest)
		return
	}
	lastnamevalid := utils.IsVerifiedName(req.LASTNAME)
	if !lastnamevalid {
		http.Error(w, "Last Name not valid", http.StatusBadRequest)
		return
	}

	message, createaccount, userid := service.CreateAccount(req.FIRSTNAME, req.LASTNAME, req.EMAIL, req.PASSWORD)

	if createaccount != true {
		http.Error(w, message, http.StatusBadRequest)
		return
	}
	if userid == "" {
		http.Error(w, "Failed to get user id", http.StatusBadRequest)
		return
	}
	user_id, err := strconv.Atoi(userid)
	if err != nil {
		http.Error(w, "Failed to convert userid ", http.StatusBadRequest)
		return
	}

	token, thesucc := utils.CreateToken(user_id)
	if thesucc != true {
		http.Error(w, "Failed to generate token ", http.StatusBadRequest)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   3 * 24 * 60 * 60,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": message,
	})
}

func signINUser(w http.ResponseWriter, r *http.Request) {
	var req SIGNINUSER
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.EMAIL == "" || req.PASSWORD == "" {
		http.Error(w, "Missing Data", http.StatusBadRequest)
		return
	}

	userid, themessage, success := service.UserSignIn(req.EMAIL, req.PASSWORD)

	if success != true {
		http.Error(w, themessage, http.StatusBadRequest)
		return
	}

	if userid == "" {
		http.Error(w, "Failed to get user id", http.StatusBadRequest)
		return
	}

	user_id, err := strconv.Atoi(userid)

	if err != nil {
		http.Error(w, "Failed to convert userid ", http.StatusBadRequest)
		return
	}

	token, thesucc := utils.CreateToken(user_id)
	if thesucc != true {
		http.Error(w, "Failed to generate token ", http.StatusBadRequest)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   3 * 24 * 60 * 60,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Login Successful",
	})

}

func enablecors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {

	err := godotenv.Load()

	if err != nil {
		log.Fatal(err)
	}

	database.Connect()

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/shorten", sendtoservice)
	mux.HandleFunc("POST /shorten", sendtoservice)

	mux.HandleFunc("POST /api/createaccount", createuseraccount)
	mux.HandleFunc("POST /createaccount", createuseraccount)

	mux.HandleFunc("POST /api/login", signINUser)
	mux.HandleFunc("POST /api/login/", signINUser)
	mux.HandleFunc("POST /login", signINUser)
	mux.HandleFunc("POST /login/", signINUser)
	mux.HandleFunc("POST /api/signin", signINUser)
	mux.HandleFunc("POST /api/signin/", signINUser)

	mux.HandleFunc("GET /api/login", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Login API endpoint. Send a POST request with email and password.",
		})
	})

	mux.HandleFunc("GET /{code}", gettheredirect)
	handler := enablecors(mux)
	log.Println("Server running on :8080")

	log.Fatal(http.ListenAndServe(":8080", handler))
}
