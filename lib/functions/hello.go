package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
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

// Helper function to generate random move for computer
func randomMove() string {
	rand.Seed(time.Now().UnixNano())
	if rand.Float32() < 0.5 {
		return "COOPERATE"
	}
	return "CHEAT"
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Processing Lambda request %s\n", request.RequestContext.RequestID)

	// Get player's move from query parameter
	playerMove := request.QueryStringParameters["move"]
	if playerMove == "" {
		// Default to COOPERATE if no move is specified
		playerMove = "COOPERATE"
	}

	// Normalize input to uppercase
	playerMove = strings.ToUpper(playerMove)

	// Validate input
	if playerMove != "COOPERATE" && playerMove != "CHEAT" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: `{"error": "Invalid move. Must be either 'COOPERATE' or 'CHEAT'"}`,
		}, nil
	}

	// Generate random move for computer
	computerMove := randomMove()

	// Calculate results
	p := prisoner.New()
	playerScore, computerScore := p.Compute(playerMove, computerMove)

	// Create response
	message := fmt.Sprintf("You chose %s, computer chose %s. Your score: %d, Computer score: %d",
		playerMove, computerMove, playerScore, computerScore)

	response := Response{
		PlayerMove:    playerMove,
		ComputerMove:  computerMove,
		PlayerScore:   playerScore,
		ComputerScore: computerScore,
		Message:       message,
	}

	body, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshaling response: %v\n", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       "Error generating response",
		}, nil
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(body),
	}, nil
}

func main() {
	lambda.Start(handler)
}
