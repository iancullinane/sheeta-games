package entity

type Entity struct {
	Name        string
	Score       int32
	b           Behavior
	lastMove    string
	oppLastMove string
	betrayed    int
}

func New(name string, behavior Behavior) *Entity {
	return &Entity{
		Name:        name,
		Score:       0,
		b:           behavior,
		lastMove:    "COOPERATE", // Assume cooperation
		oppLastMove: "COOPERATE", // ...from everyone
		betrayed:    0,
	}
}

// Play entity will return either "COOPERATE" or "CHEAT"
func (e *Entity) Play() string {

	memory := Memory{
		lastMove:    e.lastMove,
		oppLastMove: e.oppLastMove,
		betrayed:    e.betrayed,
	}

	move := e.b.behavior(memory)
	return move
}

func (e *Entity) GetBehavior() Behavior {
	return e.b
}

func (e *Entity) GetBehaviorName() string {
	return e.b.behaviorName
}

// RecordMoves updates the object with its last move and the opponents move
func (e *Entity) RecordMoves(move, oppMove string) {
	e.lastMove = move
	e.oppLastMove = oppMove

	if oppMove == "CHEAT" {
		e.betrayed++
	}
}

// Reset the score for a new round
func (e *Entity) Reset() {
	e.Score = 0
}
