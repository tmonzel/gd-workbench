import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

type Masteries = {
  id: string
  name: string
  progression?: Record<string, number[]>
  combinations: Array<{ id: string; first: string; second: string; name: string }>
}[]

const outputPath = resolve('public/data/masteries.json')
const tags = new Map<string, string>()
const languagePath = resolve('data/lang/text_en')
for (const file of (await readdir(languagePath)).filter((name) => /^tags.*_skills\.txt$/i.test(name))) {
  const contents = await readFile(join(languagePath, file), 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const separator = line.indexOf('=')
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^"|"$/g, '')
    if (value && value !== '?') tags.set(key, value)
  }
}

const cleanName = (value: string) => value.replace(/\[ms\]|\[fs\]/g, '').trim()
const parseRecord = async (file: string) => {
  const record = new Map<string, string>()
  for (const line of (await readFile(file, 'utf8')).split(/\r?\n/)) {
    const split = line.indexOf(',')
    if (split > 0)
      record.set(
        line.slice(0, split).trim(),
        line
          .slice(split + 1)
          .replace(/,\s*$/, '')
          .trim(),
      )
  }
  return record
}
const masteryEntries = [...tags.entries()]
  .filter(([key, value]) => /^tagSkillClassName\d{2}$/.test(key) && value !== '?')
  .map(([key, value]) => ({ id: key.slice('tagSkillClassName'.length), name: cleanName(value) }))

const masteries: Masteries = masteryEntries.map((mastery) => ({
  ...mastery,
  combinations: [],
}))
const byId = new Map(masteries.map((mastery) => [mastery.id, mastery]))
for (const [tag, rawName] of tags.entries()) {
  const key = tag.replace('tagSkillClassName', '')
  const value = cleanName(rawName)
  if (!/^\d{4}$/.test(key) || !value) continue
  const first = byId.get(key.slice(0, 2))
  const second = byId.get(key.slice(2))
  if (first && second) first.combinations.push({ id: key, first: first.id, second: second.id, name: value })
}
for (const mastery of masteries) {
  const record = await parseRecord(
    resolve(`data/game/records/skills/playerclass${mastery.id}/_classtraining_class${mastery.id}.dbr`),
  ).catch(() => new Map())
  const fields: Record<string, string> = {
    characterStrength: 'Physique',
    characterDexterity: 'Cunning',
    characterIntelligence: 'Spirit',
    characterLife: 'Health',
    characterMana: 'Energy',
  }
  mastery.progression = Object.fromEntries(
    Object.entries(fields).map(([field, label]) => [
      label,
      (record.get(field) ?? '').split(';').map(Number).filter(Number.isFinite),
    ]),
  )
}

await mkdir(resolve('public/data'), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(masteries, null, 2)}\n`, 'utf8')
console.log(`Extracted ${masteries.length} masteries to ${outputPath}`)
