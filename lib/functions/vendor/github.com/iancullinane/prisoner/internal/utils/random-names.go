package utils

// import "github.com/Pallinder/go-randomdata"
import (
	randomdata "github.com/Pallinder/go-randomdata"
)

func GetRandomName() string {
	return randomdata.FirstName(randomdata.RandomGender)
}
