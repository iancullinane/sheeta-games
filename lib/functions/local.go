//go:build !lambda
// +build !lambda

package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/iancullinane/prisoner/pkg/prisoner"
)

func localHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("Processing request: %s %s\n", r.Method, r.URL.Path)

	// Get player's move from query parameter
	playerMove := r.URL.Query().Get("move")
	if playerMove == "" {
		// Default to empty response for initial page load
		playerMove = ""
	}

	var response Response

	if playerMove != "" {
		// Normalize input to uppercase
		playerMove = strings.ToUpper(playerMove)

		// Validate input
		if playerMove != "COOPERATE" && playerMove != "CHEAT" {
			http.Error(w, "Invalid move. Must be either 'COOPERATE' or 'CHEAT'", http.StatusBadRequest)
			return
		}

		// Generate random move for computer
		rand.Seed(time.Now().UnixNano())
		computerMove := randomMove()

		// Calculate results
		p := prisoner.New()
		playerScore, computerScore := p.Compute(playerMove, computerMove)

		// Create response
		message := fmt.Sprintf("You chose %s, computer chose %s. Your score: %d, Computer score: %d",
			playerMove, computerMove, playerScore, computerScore)

		response = Response{
			PlayerMove:    playerMove,
			ComputerMove:  computerMove,
			PlayerScore:   playerScore,
			ComputerScore: computerScore,
			Message:       message,
		}
	}

	// Render HTML using templ
	w.Header().Set("Content-Type", "text/html")
	err := GamePage(response).Render(context.Background(), w)
	if err != nil {
		log.Printf("Error rendering template: %v\n", err)
		http.Error(w, "Error generating HTML", http.StatusInternalServerError)
		return
	}
}

func main() {
	http.HandleFunc("/", localHandler)

	port := ":8080"
	log.Printf("🚀 Starting local server on http://localhost%s\n", port)
	log.Printf("Visit http://localhost%s to play the game\n", port)

	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
