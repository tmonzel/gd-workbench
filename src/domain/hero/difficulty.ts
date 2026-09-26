export const DIFFICULTY_MODES = ['Normal', 'Veteran', 'Elite', 'Ultimate', 'Ascendant'] as const

export type DifficultyMode = (typeof DIFFICULTY_MODES)[number]

export const DIFFICULTY_RESISTANCE_PENALTIES: Record<DifficultyMode, number> = {
  Normal: 0,
  Veteran: 0,
  Elite: -25,
  Ultimate: -50,
  Ascendant: -75,
}
