import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

type Masteries = {
  id: string
  name: string
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

await mkdir(resolve('public/data'), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(masteries, null, 2)}\n`, 'utf8')
console.log(`Extracted ${masteries.length} masteries to ${outputPath}`)
