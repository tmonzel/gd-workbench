export const BASE_ATTRIBUTE_VALUE = 50
export const BASE_HEALTH_VALUE = 250
export const BASE_ENERGY_VALUE = 250
// each spent attribute point grants a flat +8 to the chosen stat
export const ATTRIBUTE_POINT_VALUE = 8

export const clampAttributes = (level: number, physique: number, cunning: number, spirit: number) => {
  const values = { physique, cunning, spirit }
  const order: Array<keyof typeof values> = ['spirit', 'cunning', 'physique']
  let index = 0
  while (
    values.physique + values.cunning + values.spirit > BASE_ATTRIBUTE_VALUE * 3 + level * ATTRIBUTE_POINT_VALUE &&
    index < 100000
  ) {
    const field = order[index % order.length]
    if (values[field] > BASE_ATTRIBUTE_VALUE) values[field] -= ATTRIBUTE_POINT_VALUE
    index += 1
  }
  return values
}
