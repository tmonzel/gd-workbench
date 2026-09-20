export const clampAttributes = (level: number, physique: number, cunning: number, spirit: number) => {
  const values = { physique, cunning, spirit }
  const order: Array<keyof typeof values> = ['spirit', 'cunning', 'physique']
  let index = 0
  while (values.physique + values.cunning + values.spirit > level && index < 100000) {
    const field = order[index % order.length]
    if (values[field] > 0) values[field] -= 1
    index += 1
  }
  return values
}
