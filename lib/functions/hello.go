//go:build lambda
// +build lambda

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/iancullinane/prisoner/pkg/prisoner"
)

type Response struct {
	PlayerMove    string `json:"playerMove"`
	ComputerMove  string `json:"computerMove"`
	PlayerScore   int32  `json:"playerScore"`
	ComputerScore int32  `json:"computerScore"`
	Message       string `json:"message"`
}

func randomMove() string {
	if rand.Float32() < 0.5 {
		return "COOPERATE"
	}
	return "CHEAT"
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	rand.Seed(time.Now().UnixNano())

	playerMove := request.QueryStringParameters["move"]
	if playerMove == "" {
		playerMove = "COOPERATE"
	}

	playerMove = strings.ToUpper(playerMove)

	if playerMove != "COOPERATE" && playerMove != "CHEAT" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: `{"error": "Invalid move. Must be either 'COOPERATE' or 'CHEAT'"}`,
		}, nil
	}

	computerMove := randomMove()

	p := prisoner.New()
	playerScore, computerScore := p.Compute(playerMove, computerMove)

	message := fmt.Sprintf("You chose %s, computer chose %s. Your score: %d, Computer score: %d",
		playerMove, computerMove, playerScore, computerScore)

	response := Response{
		PlayerMove:    playerMove,
		ComputerMove:  computerMove,
		PlayerScore:   playerScore,
		ComputerScore: computerScore,
		Message:       message,
	}

	body, _ := json.Marshal(response)

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(body),
	}, nil
}

func main() {
	lambda.Start(Handler)
}
