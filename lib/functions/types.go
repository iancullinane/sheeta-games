package main

import "math/rand"

type Response struct {
	PlayerMove    string `json:"playerMove"`
	ComputerMove  string `json:"computerMove"`
	PlayerScore   int32  `json:"playerScore"`
	ComputerScore int32  `json:"computerScore"`
	Message       string `json:"message"`
}

// Helper function to generate random move for computer
func randomMove() string {
	if rand.Float32() < 0.5 {
		return "COOPERATE"
	}
	return "CHEAT"
}
