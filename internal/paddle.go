package internal

import (
	"os"

	paddle "github.com/PaddleHQ/paddle-go-sdk/v5"
)

func NewClient() (any, error) {
	client, err := paddle.New(
		os.Getenv("PADDLE_API_KEY"),
		paddle.WithBaseURL(paddle.SandboxBaseURL),
	)

	if err != nil {
		return nil, err
	}

	return client, nil
}
