package dilemma

var (
	outcomes = map[string]int32{
		"P": 0,  // punishment: neither of you get anything
		"S": -1, // sucker: you put in coin, other didn't.
		"R": 2,  // reward: you both put 1 coin in, both got 3 back
		"T": 3,  // temptation: you put no coin, got 3 coins anyway
	}
)

func Compute(move1, move2 string) (int32, int32) {
	if move1 == "COOPERATE" && move2 == "COOPERATE" {
		return outcomes["R"], outcomes["R"]
	} else if move1 == "CHEAT" && move2 == "COOPERATE" {
		return outcomes["T"], outcomes["S"]
	} else if move1 == "COOPERATE" && move2 == "CHEAT" {
		return outcomes["S"], outcomes["T"]
	}
	// Both Cheated
	return outcomes["P"], outcomes["P"]

}
