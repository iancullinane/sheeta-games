package utils

import (
	"sort"

	"github.com/iancullinane/prisoner/internal/entity"
)

func SortByScore(entities []*entity.Entity) []*entity.Entity {
	c := make([]*entity.Entity, len(entities))
	_ = copy(c, entities)
	sort.Slice(c, func(i, j int) bool {
		return c[i].Score < c[j].Score
	})

	return c
}
