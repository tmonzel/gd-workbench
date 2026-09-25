import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { DAMAGE_TYPES, fieldName } from './damage-utils.js'

type RecordMap = Map<string, string>
const root = resolve('data/game/records')
const langRoot = resolve('data/lang/text_en')
const tags = new Map<string, string>()
for (const file of await readdir(langRoot)) {
  if (!/^tags.*_skills\.txt$/i.test(file)) continue
  for (const line of (await readFile(join(langRoot, file), 'utf8')).split(/\r?\n/)) {
    const split = line.indexOf('=')
    if (split > 0)
      tags.set(
        line.slice(0, split).trim(),
        line
          .slice(split + 1)
          .trim()
          .replace(/^"|"$/g, ''),
      )
  }
}
const parse = async (file: string): Promise<RecordMap> => {
  const result = new Map<string, string>()
  for (const line of (await readFile(file, 'utf8')).split(/\r?\n/)) {
    const split = line.indexOf(',')
    if (split > 0)
      result.set(
        line.slice(0, split).trim(),
        line
          .slice(split + 1)
          .replace(/,\s*$/, '')
          .trim()
          .replace(/^"|"$/g, ''),
      )
  }
  return result
}
const formatNumber = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
const knownAttributes: Array<[string, string, 'number' | 'percent']> = [
  ['characterStrength', 'Physique', 'number'],
  ['characterStrengthModifier', 'Physique', 'percent'],
  ['characterDexterity', 'Cunning', 'number'],
  ['characterDexterityModifier', 'Cunning', 'percent'],
  ['characterIntelligence', 'Spirit', 'number'],
  ['characterIntelligenceModifier', 'Spirit', 'percent'],
  ['characterLife', 'Health', 'number'],
  ['characterLifeModifier', 'Health', 'percent'],
  ['characterLifeRegen', 'Health Regenerated per second', 'number'],
  ['characterLifeRegenModifier', 'Health Regeneration', 'percent'],
  ['characterMana', 'Energy', 'number'],
  ['characterManaModifier', 'Energy', 'percent'],
  ['characterManaRegen', 'Energy Regenerated per second', 'number'],
  ['characterManaRegenModifier', 'Energy Regeneration', 'percent'],
  ['characterOffensiveAbility', 'Offensive Ability', 'number'],
  ['characterOffensiveAbilityModifier', 'Offensive Ability', 'percent'],
  ['characterDefensiveAbility', 'Defensive Ability', 'number'],
  ['characterDefensiveAbilityModifier', 'Defensive Ability', 'percent'],
  ['characterAttackSpeedModifier', 'Attack Speed', 'percent'],
  ['characterSpellCastSpeedModifier', 'Cast Speed', 'percent'],
  ['characterRunSpeedModifier', 'Movement Speed', 'percent'],
  ['offensiveTotalDamageModifier', 'to All Damage', 'percent'],
  ['retaliationTotalDamageModifier', 'Retaliation Damage', 'percent'],
]
// devotion star bonuses use the same skill_passive fields as item modifiers
const nodeAttributes = (record: RecordMap): Array<{ label: string; value: string }> => {
  const attributes: Array<{ label: string; value: string }> = []
  const numeric = (key: string) => Number(record.get(key) ?? 0)
  const add = (label: string, value: string) => attributes.push({ label, value })
  for (const [key, label] of Object.entries(DAMAGE_TYPES)) {
    const minimum = numeric(`${fieldName('offensive', key)}Min`)
    const maximum = numeric(`${fieldName('offensive', key)}Max`)
    const modifier = numeric(`${fieldName('offensive', key)}Modifier`)
    if (minimum || maximum)
      add(
        `${label} Damage`,
        minimum && maximum ? `${formatNumber(minimum)}-${formatNumber(maximum)}` : formatNumber(minimum || maximum),
      )
    if (modifier) add(`${label} Damage`, `${modifier > 0 ? '+' : ''}${formatNumber(modifier)}%`)
  }
  for (const [key, label] of Object.entries(DAMAGE_TYPES)) {
    const resistance = numeric(fieldName('defensive', key))
    if (resistance) add(`${label} Resistance`, `${formatNumber(resistance)}%`)
  }
  const protection = numeric('defensiveProtection')
  const bonusProtection = numeric('defensiveBonusProtection')
  const absorption = numeric('defensiveAbsorption')
  if (protection) add('Armor', formatNumber(protection))
  if (bonusProtection) add('Armor Bonus', `${bonusProtection > 0 ? '+' : ''}${formatNumber(bonusProtection)}`)
  if (absorption) add('Damage Absorption', `${formatNumber(absorption)}%`)
  for (const [key, label, format] of knownAttributes) {
    const value = numeric(key)
    if (value)
      add(
        label,
        format === 'percent'
          ? `${value > 0 ? '+' : ''}${formatNumber(value)}%`
          : `${value > 0 ? '+' : ''}${formatNumber(value)}`,
      )
  }
  return attributes
}
const constellations = []
const directory = resolve(root, 'ui/skills/devotion/constellations')
for (const file of (await readdir(directory)).filter((name) => /^constellation\d+\.dbr$/.test(name))) {
  const record = await parse(join(directory, file))
  const requirements = [1, 2, 3]
    .map((n) => ({
      name: record.get(`affinityRequiredName${n}`),
      amount: Number(record.get(`affinityRequired${n}`) ?? 0),
    }))
    .filter((x) => x.name && x.amount)
  const grants = [1, 2, 3]
    .map((n) => ({ name: record.get(`affinityGivenName${n}`), amount: Number(record.get(`affinityGiven${n}`) ?? 0) }))
    .filter((x) => x.name && x.amount)
  const nodes = Object.entries(Object.fromEntries(record))
    .filter(([key]) => /^devotionButton\d+$/.test(key))
    .map(([, value]) => value.replace('records/ui/skills/devotion/', '').replace(/\.dbr$/, ''))
  const skills = []
  for (const node of nodes) {
    const button = await parse(resolve(root, 'ui/skills/devotion', `${node}.dbr`))
    const skillPath = button.get('skillName')
    if (!skillPath) continue
    const skill = await parse(resolve(root, skillPath.replace(/^records\//, '')))
    const tag = skill.get('skillDisplayName')
    const attributes = nodeAttributes(skill)
    // some stars additionally grant a bonus that only affects the player's pets
    const petBonusPath = skill.get('petBonusName')
    if (petBonusPath) {
      const petBonus = await parse(resolve(root, petBonusPath.replace(/^records\//, '')))
      for (const attribute of nodeAttributes(petBonus))
        attributes.push({ label: 'to All Pets', value: `${attribute.value} ${attribute.label}` })
    }
    skills.push({
      id: skillPath.replace(/^records\/skills\/devotion\//, '').replace(/\.dbr$/, ''),
      name: tag ? (tags.get(tag) ?? tag) : basename(skillPath),
      description: skill.get('skillBaseDescription') ? (tags.get(skill.get('skillBaseDescription')!) ?? '') : '',
      attributes,
    })
  }
  const displayTag = record.get('constellationDisplayTag')
  const infoTag = record.get('constellationInfoTag')
  // group constellations by whichever affinity they grant the most of
  const affinity = grants.length
    ? grants.reduce((max, grant) => (grant.amount > max.amount ? grant : max)).name
    : (requirements[0]?.name ?? 'Other')
  constellations.push({
    id: basename(file, '.dbr'),
    name: displayTag ? (tags.get(displayTag) ?? displayTag) : (record.get('FileDescription') ?? basename(file, '.dbr')),
    description: infoTag ? (tags.get(infoTag) ?? '') : '',
    cost: skills.length,
    affinity,
    requirements,
    grants,
    skills,
  })
}
await mkdir(resolve('public/data'), { recursive: true })
await writeFile(
  resolve('public/data/devotions.json'),
  `${JSON.stringify({ maxPoints: 55, affinities: ['Ascendant', 'Chaos', 'Eldritch', 'Order', 'Primordial'], constellations }, null, 2)}\n`,
  'utf8',
)
console.log(`Extracted ${constellations.length} constellations`)
