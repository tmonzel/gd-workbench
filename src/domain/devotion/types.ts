export type DevotionAttribute = { label: string; value: string }

export type DevotionSkill = {
  id: string
  name: string
  description: string
  attributes: DevotionAttribute[]
}

export type DevotionConstellation = {
  name: string
  description: string
  cost: number
  affinity: string
  requirements: Array<{ name?: string; amount: number }>
  grants: Array<{ name?: string; amount: number }>
  skills: DevotionSkill[]
}

export type DevotionData = {
  maxPoints: number
  affinities: string[]
  constellations: DevotionConstellation[]
}
