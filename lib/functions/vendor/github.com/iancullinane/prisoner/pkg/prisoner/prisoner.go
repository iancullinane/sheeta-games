package prisoner

import (
	"log"

	"github.com/iancullinane/prisoner/internal/dilemma"
	"github.com/iancullinane/prisoner/internal/entity"
	"github.com/iancullinane/prisoner/internal/utils"
)

//
// Many sites masking the dilmena
//
//

// Client represents a prisoner's dilemma game client
type Client struct {
}

// New creates a new prisoner's dilemma game client
func New() *Client {
	return &Client{}
}

// GetPersonalities creates n entities with random personalities
func (c *Client) GetPersonalities(n int) []*entity.Entity {
	f := entity.NewBehaviorFactory()
	entityList := make([]*entity.Entity, n)

	for i := 0; i < len(entityList); i++ {
		tmpEntity := entity.New(
			utils.GetRandomName(),
			f.GetRandomBehavior(),
		)
		entityList[i] = tmpEntity
	}

	return entityList
}

// PlayTournament plays n rounds of the prisoner's dilemma with the given entities
func (c *Client) PlayTournament(e []*entity.Entity, n int) {
	dilemma.PlayOneTournament(e, n)
}

// Once plays a single round of the prisoner's dilemma between two entities
func (c *Client) Once(e1, e2 *entity.Entity) {
	dilemma.Once(e1, e2)
}

// Just return CHEAT or COOPERATE with no other anything
func (c *Client) Compute(moveOne, moveTwo string) (int32, int32) {
	r1, r2 := dilemma.Compute(moveOne, moveTwo)
	return r1, r2
}

// PrintResults prints the results of the tournament
func (c *Client) PrintResults(players []*entity.Entity) {
	resultsSorted := utils.SortByScore(players)
	log.Printf("%-10s\t%s\t%s", "Name", "Score", "Personality")
	log.Printf("------------------------------------")
	for _, e := range resultsSorted {
		log.Printf("%-10s\t%d\t%s", e.Name, e.Score, e.GetBehaviorName())
	}
}
