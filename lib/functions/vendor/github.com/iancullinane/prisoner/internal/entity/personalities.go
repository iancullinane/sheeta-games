package entity

import (
	"log"
	"math/rand"
	"time"
)

type BehaviorFactory struct {
	behaviors []Behavior
}

type Behavior struct {
	behaviorName string
	behavior     func(Memory) string
}

type Memory struct {
	lastMove    string
	oppLastMove string
	betrayed    int
}

func NewBehaviorFactory() *BehaviorFactory {
	return &BehaviorFactory{
		behaviors: []Behavior{
			{"cheater", AlwaysCheat},
			{"niceguy", AlwaysCooperate},
			{"copycat", CopyCat},
			{"revenge", Revenge},
			{"tolerant", Tolerant},
			{"random", Random},
		},
	}
}

// GetBehaviorByName is to set a behavior
func (f *BehaviorFactory) GetBehaviorByName(name string) Behavior {

	keys := make(map[string]int, len(f.behaviors))
	for i, v := range f.behaviors {
		keys[v.behaviorName] = i
	}

	log.Printf("%v", f.behaviors[keys[name]])

	return f.behaviors[keys[name]]
}

// GetRandomBehavior returns a random behavior
func (f *BehaviorFactory) GetRandomBehavior() Behavior {

	return f.behaviors[rand.Intn(len(f.behaviors))]
}

// GetName returns the name of this instance
func (b *Behavior) GetName() string {
	return b.behaviorName
}

// AlwaysCooperate will always act altruistically, giving 3
func AlwaysCooperate(mem Memory) string {
	return "COOPERATE"
}

// AlwaysCheat will never add +1
func AlwaysCheat(mem Memory) string {
	return "CHEAT"
}

// Tolerant will only CHEAT after it has been betrayed n times
func Tolerant(mem Memory) string {
	if mem.betrayed > 5 {
		return "CHEAT"
	}

	return "COOPERATE"
}

// CopyCat will blindly do whatever their opponent did last time, except the
// first round where they will COOOPERATE
func CopyCat(mem Memory) string {
	return mem.oppLastMove
}

// Revenge will always CHEAT if it has been cheated against once
func Revenge(mem Memory) string {

	if mem.betrayed > 0 {
		return "CHEAT"
	}

	return "COOPERATE"
}

// Random is random
func Random(mem Memory) string {

	rand.Seed(time.Now().UnixNano())
	if rand1() == true {
		return "COOPERATE"
	}

	return "CHEAT"
}

func rand1() bool {
	val := rand.Float32()
	return val < 0.5
}
