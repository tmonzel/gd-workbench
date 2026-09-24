export const DAMAGE_TYPES: Record<string, string> = {
  physical: 'Physical',
  fire: 'Fire',
  cold: 'Cold',
  lightning: 'Lightning',
  poison: 'Poison',
  pierce: 'Piercing',
  bleeding: 'Bleeding',
  aether: 'Aether',
  chaos: 'Chaos',
  life: 'Vitality',
  elemental: 'Elemental',
}

export const DAMAGE_OVER_TIME_TYPES: Array<[string, string]> = [
  ['Physical', 'Internal Trauma'],
  ['Bleeding', 'Bleeding'],
  ['Cold', 'Frostburn'],
  ['Fire', 'Burn'],
  ['Lightning', 'Electrocute'],
  ['Poison', 'Poison'],
]

export const fieldName = (prefix: string, key: string) => `${prefix}${key[0].toUpperCase()}${key.slice(1)}`
export const damageLabel = (type: string) => `${type} Damage`
export const damageOverTimeLabel = (type: string, duration?: number) =>
  `${type} Damage${duration ? ` over ${duration} seconds` : ''}`
export const conversionLabel = (input: string, output: string) => `${input} Damage converted to ${output} Damage`
