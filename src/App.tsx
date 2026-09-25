import { useMemo, useState } from 'react'
import './App.css'
import AttributePanel from '@/components/AttributePanel'
import Header from '@/components/Header'
import StatPanel from '@/components/StatPanel'
import DamagePanel from '@/components/DamagePanel'
import ResistancePanel from '@/components/ResistancePanel'
import WorkspaceTabs from '@/components/WorkspaceTabs'
import ItemPanel from '@/domain/item/components/ItemPanel'
import type { Item } from '@/domain/item/types'
import EquipmentPanel from '@/domain/hero/components/EquipmentPanel'
import SkillsView from '@/domain/skill/components/SkillsView'
import type { SkillDamageRow } from '@/domain/skill/components/ActiveSkillPanel'
import DevotionPanel from '@/domain/devotion/components/DevotionPanel'
import { useSkillData } from '@/domain/skill/skill.hooks'
import { useDevotionData } from '@/domain/devotion/devotion.hooks'
import { getEquippedSkillBonuses, getEquippedSetInfo, parseSkillBonus } from '@/domain/item/item.utils'
import { useItemLibrary } from '@/domain/item/item.hooks'
import { formatSkillEffect, formatSkillValue } from '@/domain/skill/skill.utils'
import {
  getCharacterAttributeTotals,
  getDamageTypeModifierPercent,
  applyArmorPiercingConversion,
  getWeaponArmorPiercingPercent,
} from '@/domain/skill/damage.utils'
import { useHero } from '@/domain/hero/hero.hooks'

function App() {
  const { masteries, skillsets } = useSkillData()
  const { data: devotions, selected: selectedDevotions, setSelected: setSelectedDevotions } = useDevotionData()
  const [view, setView] = useState<'items' | 'equipment' | 'masteries' | 'devotions'>('masteries')
  const [collectionItems, setCollectionItems] = useState<Item[]>([])
  const { character, setCharacter, changeLevel, adjustAttribute, equipItem, unequipItem, changeMastery } =
    useHero(skillsets)
  const itemLibrary = useItemLibrary(character.level)
  const { itemSets } = itemLibrary
  const itemSkillBonuses = useMemo(() => getEquippedSkillBonuses(character.equipment), [character.equipment])
  const equippedSetInfo = useMemo(
    () => getEquippedSetInfo(character.equipment, itemSets),
    [character.equipment, itemSets],
  )
  const createItemInstance = (template: Item) =>
    setCollectionItems((current) => [
      ...current,
      {
        ...template,
        id: `${template.id}::instance::${Date.now()}-${current.length}`,
        isInstance: true,
        originRarity: template.rarity,
        baseAttributes: [...(template.attributes ?? [])],
      },
    ])
  const selectedMasterySkillNames = useMemo(() => {
    const names = new Set<string>()
    for (const id of [character.mastery1, character.mastery2])
      if (id) names.add(masteries.find((mastery) => mastery.id === id)?.name ?? '')
    for (const id of [character.mastery1, character.mastery2])
      for (const skill of skillsets[id ?? ''] ?? []) names.add(skill.name)
    return names
  }, [character.mastery1, character.mastery2, masteries, skillsets])
  const activeSkills = useMemo(() => {
    const entries = new Map<
      string,
      {
        level: number
        sources: Set<string>
        stats: Set<string>
        damageRows: Map<string, SkillDamageRow>
        icon?: string
      }
    >()
    const masteryLevels = new Map<string, number>()
    const masteryIcons = new Map<string, string>()
    const excludedSkillNames = new Set<string>()
    const weaponDamage = new Map<string, { min: number; max: number }>()
    for (const attribute of character.equipment.Weapon?.attributes ?? []) {
      const match = /^(Physical|Fire|Cold|Lightning|Poison|Piercing|Bleeding|Aether|Chaos|Vitality) Damage$/i.exec(
        attribute.label,
      )
      if (!match || /%$/.test(String(attribute.value))) continue
      const values = String(attribute.value).match(/^([+-]?\d+(?:\.\d+)?)(?:-([+-]?\d+(?:\.\d+)?))?$/)
      if (!values) continue
      const type = `${match[1][0].toUpperCase()}${match[1].slice(1)}`
      weaponDamage.set(type, { min: Number(values[1]), max: Number(values[2] ?? values[1]) })
    }
    // gathers the same item/devotion/set % damage bonuses and attribute conversions used by DamagePanel,
    // so a skill's weapon-damage-% and flat damage get the same "current total" the player sees there
    const { cunning, spirit } = getCharacterAttributeTotals(character, masteries)
    const sourceAttributes: Array<{ label: string; value: string }> = []
    for (const item of Object.values(character.equipment))
      for (const attribute of item?.attributes ?? [])
        sourceAttributes.push({ label: attribute.label, value: String(attribute.value) })
    for (const constellation of devotions?.constellations ?? [])
      for (const skill of constellation.skills) {
        if (!selectedDevotions.includes(skill.id)) continue
        for (const attribute of skill.attributes) sourceAttributes.push(attribute)
      }
    for (const { activeTier } of equippedSetInfo)
      for (const attribute of activeTier?.attributes ?? []) sourceAttributes.push(attribute)
    const damageModifierPercent = new Map<string, number>()
    const getDamageModifierPercent = (type: string) => {
      if (!damageModifierPercent.has(type))
        damageModifierPercent.set(type, getDamageTypeModifierPercent(type, false, sourceAttributes, cunning, spirit))
      return damageModifierPercent.get(type) ?? 0
    }
    const armorPiercingPercent = getWeaponArmorPiercingPercent(character.equipment.Weapon?.attributes)
    for (const skills of Object.values(skillsets))
      for (const skill of skills) {
        masteryLevels.set(skill.name, character.skillLevels[skill.id] ?? 0)
        if (skill.icon) masteryIcons.set(skill.name, skill.icon)
        if (skill.isModifier || skill.isTransmuter) excludedSkillNames.add(skill.name)
      }
    const addSkill = (name: string, level: number, source: string, stats: string[] = [], icon?: string) => {
      if (!name || !level || excludedSkillNames.has(name)) return
      const entry = entries.get(name) ?? {
        level: 0,
        sources: new Set<string>(),
        stats: new Set<string>(),
        damageRows: new Map<string, SkillDamageRow>(),
      }
      entry.level = Math.max(entry.level, level)
      entry.icon ??= icon ?? masteryIcons.get(name)
      entry.sources.add(source)
      for (const stat of stats) entry.stats.add(stat)
      entries.set(name, entry)
    }
    for (const item of Object.values(character.equipment)) {
      if (!item) continue
      if (
        item.grantedSkill &&
        (!masteryLevels.has(item.grantedSkill.name) || (masteryLevels.get(item.grantedSkill.name) ?? 0) > 0)
      )
        addSkill(
          item.grantedSkill.name,
          item.grantedSkill.level,
          item.name,
          item.grantedSkill.attributes.map((attribute) => `${attribute.value} ${attribute.label}`),
        )
      for (const attribute of item.attributes ?? []) {
        if (attribute.label !== 'Skill Bonus') continue
        const bonus = parseSkillBonus(attribute.value)
        if (bonus && !bonus.masteryWide && (!masteryLevels.has(bonus.name) || (masteryLevels.get(bonus.name) ?? 0) > 0))
          addSkill(bonus.name, bonus.amount, item.name)
      }
    }
    for (const masteryId of [character.mastery1, character.mastery2])
      for (const skill of skillsets[masteryId ?? ''] ?? []) {
        if (skill.isModifier || skill.isTransmuter) continue
        const level = character.skillLevels[skill.id] ?? 0
        if (level > 0) {
          const effectiveLevel = level + (itemSkillBonuses[skill.name] ?? 0)
          const activeModifiers = (skillsets[masteryId ?? ''] ?? []).filter(
            (modifier) =>
              modifier.groupId === skill.groupId &&
              (modifier.isModifier || modifier.isTransmuter) &&
              ((character.skillLevels[modifier.id] ?? 0) > 0 || (itemSkillBonuses[modifier.name] ?? 0) > 0),
          )
          const convertsAllLightningToAether = activeModifiers.some((modifier) =>
            modifier.effects.some(
              (effect) =>
                effect.key === 'conversionPercentage' &&
                effect.label === 'Lightning Damage converted to Aether Damage' &&
                effect.values.includes(100),
            ),
          )
          const totalDamageMultiplier =
            1 +
            activeModifiers.reduce(
              (total, modifier) =>
                total +
                modifier.effects
                  .filter((effect) => effect.key === 'offensiveDamageMultModifier')
                  .reduce((sum, effect) => {
                    const modifierLevel =
                      (character.skillLevels[modifier.id] ?? 0) + (itemSkillBonuses[modifier.name] ?? 0)
                    return sum + (effect.values[Math.min(modifierLevel, effect.values.length) - 1] ?? 0)
                  }, 0) /
                  100,
              0,
            )
          const damageRows: SkillDamageRow[] = []
          let weaponDamagePercent = 0
          const stats = skill.effects
            .filter(
              (effect) =>
                !(convertsAllLightningToAether && /electrocute|slowLightning/i.test(`${effect.key} ${effect.label}`)),
            )
            .map((effect) => {
              const rawValue = effect.values[Math.min(effectiveLevel, effect.values.length) - 1]
              const isDamage = /^(offensive|weaponDamagePct|retaliation)/i.test(effect.key)
              const isWeaponDamage = effect.key === 'weaponDamagePct'
              if (isDamage) {
                const typeMatch = effect.key.match(
                  /offensive(?:Base)?(Physical|Fire|Cold|Lightning|Poison|Piercing|Bleeding|Aether|Chaos|Vitality)/i,
                )
                const type = typeMatch ? `${typeMatch[1][0].toUpperCase()}${typeMatch[1].slice(1)}` : 'Physical'
                if (isWeaponDamage) weaponDamagePercent += rawValue
                const min =
                  effect.minValues?.[Math.min(effectiveLevel, effect.minValues.length) - 1] ??
                  (isWeaponDamage ? 0 : rawValue)
                // some flat (non-range) damage effects only expose a placeholder maxValues array
                // (length 1, e.g. Cadence's Physical Damage) instead of real per-level max data -
                // in that case the effect is a single flat number, so max should mirror min
                const hasRangeMaxValues =
                  (effect.maxValues?.length ?? 0) >= (effect.minValues?.length ?? effect.values.length)
                const max = hasRangeMaxValues
                  ? effect.maxValues![Math.min(effectiveLevel, effect.maxValues!.length) - 1]
                  : isWeaponDamage
                    ? 0
                    : min
                if (!isWeaponDamage) {
                  const modifierPercent = getDamageModifierPercent(type)
                  const flatMultiplier = (1 + modifierPercent / 100) * totalDamageMultiplier
                  damageRows.push({
                    type,
                    label: type === 'Poison' ? 'Poison Damage' : `${type} Damage`,
                    min,
                    max,
                    percent: modifierPercent,
                    totalMin: min * flatMultiplier,
                    totalMax: max * flatMultiplier,
                  })
                }
              }
              if (isWeaponDamage) return rawValue ? `${formatSkillValue(rawValue)}% Weapon Damage` : ''
              const converted = convertsAllLightningToAether && /lightning/i.test(effect.key)
              const label = converted ? effect.label.replace(/Lightning/gi, 'Aether') : effect.label
              const value = isDamage ? rawValue * totalDamageMultiplier : rawValue
              return Number.isFinite(value) && value !== 0
                ? formatSkillEffect(
                    { ...effect, value: rawValue },
                    effectiveLevel,
                    isDamage ? totalDamageMultiplier : 1,
                    label,
                  )
                : ''
            })
            .filter(Boolean)
          for (const summon of skill.summonEffects)
            for (const effect of summon.effects) {
              const value = effect.values[Math.min(effectiveLevel, effect.values.length) - 1]
              if (Number.isFinite(value) && value !== 0)
                stats.push(`${formatSkillValue(value)}${effect.suffix ?? ''} ${effect.label} (${summon.name})`)
            }
          for (const modifier of activeModifiers)
            for (const effect of modifier.effects.filter(
              (candidate) => candidate.key === 'offensiveDamageMultModifier',
            )) {
              const modifierLevel = (character.skillLevels[modifier.id] ?? 0) + (itemSkillBonuses[modifier.name] ?? 0)
              const value = effect.values[Math.min(modifierLevel, effect.values.length) - 1]
              if (Number.isFinite(value) && value !== 0)
                stats.push(`Total Damage Modified by ${formatSkillValue(value)}% (${modifier.name})`)
            }
          if (weaponDamagePercent > 0) {
            for (const [type, weapon] of weaponDamage) {
              const existing = damageRows.find((row) => row.type === type)
              const modifierPercent = getDamageModifierPercent(type)
              const flatMultiplier = (1 + modifierPercent / 100) * totalDamageMultiplier
              // weapon damage is scaled by the skill's own weapon-damage-% before adding it to the
              // already-modified flat skill damage, matching how e.g. Cadence combines its bonuses
              const weaponMin = weapon.min * flatMultiplier * (weaponDamagePercent / 100)
              const weaponMax = weapon.max * flatMultiplier * (weaponDamagePercent / 100)
              if (existing) {
                existing.min += weapon.min
                existing.max += weapon.max
                existing.totalMin += weaponMin
                existing.totalMax += weaponMax
              } else {
                damageRows.push({
                  type,
                  label: `${type} Damage`,
                  min: weapon.min,
                  max: weapon.max,
                  percent: modifierPercent,
                  totalMin: weaponMin,
                  totalMax: weaponMax,
                })
              }
            }
          }
          addSkill(skill.name, effectiveLevel, 'Mastery', stats, skill.icon)
          const entry = entries.get(skill.name)
          // Armor Piercing converts a % of ALL Physical attack damage (weapon + flat skill bonuses) to Piercing
          const convertedDamageRows = applyArmorPiercingConversion(damageRows, armorPiercingPercent).map((row) => ({
            ...row,
            label: row.type === 'Piercing' ? 'Piercing Damage' : row.label,
          }))
          if (entry) for (const row of convertedDamageRows) entry.damageRows.set(`${row.type}-${row.label}`, row)
        }
      }
    return [...entries.entries()]
      .map(([name, entry]) => ({
        name,
        level: entry.level,
        source: [...entry.sources].join(' + '),
        stats: [...entry.stats],
        damageRows: [...entry.damageRows.values()],
        icon: entry.icon,
      }))
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [character, itemSkillBonuses, skillsets, devotions, selectedDevotions, equippedSetInfo, masteries])
  const masteryCombinations = masteries.flatMap((mastery) => mastery.combinations)
  const selectedCombination =
    character.mastery1 && character.mastery2
      ? masteryCombinations.find(
          (combo) =>
            [combo.first, combo.second].sort().join('-') === [character.mastery1, character.mastery2].sort().join('-'),
        )
      : undefined
  const firstMasteryName = masteries.find((mastery) => mastery.id === character.mastery1)?.name
  return (
    <main className="min-h-screen w-full px-4 pb-10 text-neutral-100 sm:px-6 lg:px-8 xl:px-10">
      <Header
        level={character.level}
        onLevelChange={changeLevel}
        masteries={masteries}
        mastery1={character.mastery1}
        mastery2={character.mastery2}
        combinedClassName={selectedCombination?.name ?? firstMasteryName}
        onMasteryChange={changeMastery}
      />
      <WorkspaceTabs value={view} onChange={setView} />
      <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)_minmax(300px,360px)]">
        <AttributePanel character={character} onAttributeChange={adjustAttribute} />
        <div className="min-w-0">
          {view === 'equipment' ? (
            <EquipmentPanel
              character={character}
              setCharacter={setCharacter}
              equippedSetInfo={equippedSetInfo}
              itemSets={itemSets}
              activeSkillNames={selectedMasterySkillNames}
            />
          ) : view === 'masteries' ? (
            <SkillsView
              character={character}
              setCharacter={setCharacter}
              itemBonuses={itemSkillBonuses}
              activeSkills={activeSkills}
            />
          ) : view === 'devotions' && devotions ? (
            <DevotionPanel data={devotions} selected={selectedDevotions} setSelected={setSelectedDevotions} />
          ) : (
            <ItemPanel
              itemLibrary={itemLibrary}
              onEquip={equipItem}
              onUnequip={unequipItem}
              isEquipped={(item) =>
                Object.values(character.equipment).some((equippedItem) => equippedItem?.id === item.id)
              }
              activeSkillNames={selectedMasterySkillNames}
              equippedSetInfo={equippedSetInfo}
              collectionItems={collectionItems}
              onCreateInstance={createItemInstance}
              onUpdateInstance={(item) =>
                setCollectionItems((current) =>
                  current.map((entry) => (entry.id === item.id ? { ...entry, ...item, isInstance: true } : entry)),
                )
              }
              onRemoveInstance={(item) =>
                setCollectionItems((current) => current.filter((entry) => entry.id !== item.id))
              }
            />
          )}
        </div>
        <div className="grid gap-4 lg:sticky lg:top-4">
          <DamagePanel
            character={character}
            devotions={devotions}
            selectedDevotions={selectedDevotions}
            equippedSetInfo={equippedSetInfo}
            masteries={masteries}
          />
          <ResistancePanel
            character={character}
            devotions={devotions}
            selectedDevotions={selectedDevotions}
            equippedSetInfo={equippedSetInfo}
          />
          <StatPanel
            character={character}
            masteries={masteries}
            devotions={devotions}
            selectedDevotions={selectedDevotions}
            equippedSetInfo={equippedSetInfo}
          />
        </div>
      </div>
    </main>
  )
}

export default App
