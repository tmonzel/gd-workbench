import type { Character } from './types'

export const skillPointsForLevel = (level: number) =>
  Math.max(0, Math.min(level, 50) - 1) * 3 +
  Math.max(0, Math.min(level, 90) - 50) * 2 +
  Math.max(0, Math.min(level, 100) - 90)

export const spentSkillPoints = (character: Character) =>
  Object.values(character.masteryLevels).reduce((total, value) => total + value, 0) +
  Object.values(character.skillLevels).reduce((total, value) => total + value, 0)
