package dilemma

import (
	"github.com/iancullinane/prisoner/internal/entity"
)

// Once will play the prisoners dilemma one time
func Once(player1, player2 *entity.Entity) {

	moveA := player1.Play()
	moveB := player2.Play()

	a, b := Compute(moveA, moveB)

	player1.RecordMoves(moveA, moveB)
	player2.RecordMoves(moveB, moveA)

	player1.Score += a
	player2.Score += b

}

// Select the number of rounds two entities should engage in 'the prisoners
// dilemma' and update their score
func PlayRepeated(player1, player2 *entity.Entity, rounds int) {

	for i := 1; i <= rounds; i++ {
		Once(player1, player2)
	}

}

// PlayOneTournament will pit every entity against every other entity one
// time for the amount of rounds passed in.
func PlayOneTournament(agents []*entity.Entity, turns int) {

	// agentsCopy := agents

	for i := 0; i < len(agents); i++ {
		agents[i].Reset()
	}

	// Round robin
	for i := 0; i < len(agents); i++ {
		playerA := agents[i]

		for j := i + 1; j < len(agents); j++ {
			playerB := agents[j]
			PlayRepeated(playerA, playerB, turns)
		}
	}

}
