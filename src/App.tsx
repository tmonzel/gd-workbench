import { useMemo, useState } from 'react'
import './App.css'
import AttributePanel from '@/components/AttributePanel'
import Header from '@/components/Header'
import StatPanel from '@/components/StatPanel'
import DamagePanel from '@/components/DamagePanel'
import ResistancePanel from '@/components/ResistancePanel'
import WorkspaceTabs from '@/components/WorkspaceTabs'
import ItemPanel from '@/domain/item/components/ItemPanel'
import EquipmentPanel from '@/domain/hero/components/EquipmentPanel'
import SkillsView from '@/domain/skill/components/SkillsView'
import DevotionPanel from '@/domain/devotion/components/DevotionPanel'
import { useSkillData } from '@/domain/skill/skill.hooks'
import { useDevotionData } from '@/domain/devotion/devotion.hooks'
import { getEquippedSkillBonuses, getEquippedSetInfo, parseSkillBonus } from '@/domain/item/item.utils'
import { useItemLibrary } from '@/domain/item/item.hooks'
import { formatSkillEffect, formatSkillValue } from '@/domain/skill/skill.utils'
import { useHero } from '@/domain/hero/hero.hooks'

function App() {
  const { masteries, skillsets } = useSkillData()
  const { data: devotions, selected: selectedDevotions, setSelected: setSelectedDevotions } = useDevotionData()
  const [view, setView] = useState<'items' | 'equipment' | 'masteries' | 'devotions'>('masteries')
  const { character, setCharacter, changeLevel, adjustAttribute, equipItem, unequipItem, changeMastery } =
    useHero(skillsets)
  const itemLibrary = useItemLibrary(character.level)
  const { itemSets } = itemLibrary
  const itemSkillBonuses = useMemo(() => getEquippedSkillBonuses(character.equipment), [character.equipment])
  const equippedSetInfo = useMemo(
    () => getEquippedSetInfo(character.equipment, itemSets),
    [character.equipment, itemSets],
  )
  const selectedMasterySkillNames = useMemo(() => {
    const names = new Set<string>()
    for (const id of [character.mastery1, character.mastery2])
      for (const skill of skillsets[id ?? ''] ?? []) names.add(skill.name)
    return names
  }, [character.mastery1, character.mastery2, skillsets])
  const activeSkills = useMemo(() => {
    const entries = new Map<string, { level: number; sources: Set<string>; stats: Set<string>; icon?: string }>()
    const masteryLevels = new Map<string, number>()
    const masteryIcons = new Map<string, string>()
    const excludedSkillNames = new Set<string>()
    for (const skills of Object.values(skillsets))
      for (const skill of skills) {
        masteryLevels.set(skill.name, character.skillLevels[skill.id] ?? 0)
        if (skill.icon) masteryIcons.set(skill.name, skill.icon)
        if (skill.isModifier || skill.isTransmuter) excludedSkillNames.add(skill.name)
      }
    const addSkill = (name: string, level: number, source: string, stats: string[] = [], icon?: string) => {
      if (!name || !level || excludedSkillNames.has(name)) return
      const entry = entries.get(name) ?? { level: 0, sources: new Set<string>(), stats: new Set<string>() }
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
        if (bonus && (!masteryLevels.has(bonus.name) || (masteryLevels.get(bonus.name) ?? 0) > 0))
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
          const stats = skill.effects
            .filter(
              (effect) =>
                !(convertsAllLightningToAether && /electrocute|slowLightning/i.test(`${effect.key} ${effect.label}`)),
            )
            .map((effect) => {
              const rawValue = effect.values[Math.min(effectiveLevel, effect.values.length) - 1]
              const isDamage = /^(offensive|weaponDamagePct|retaliation)/i.test(effect.key)
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
          addSkill(skill.name, effectiveLevel, 'Mastery', stats, skill.icon)
        }
      }
    return [...entries.entries()]
      .map(([name, entry]) => ({
        name,
        level: entry.level,
        source: [...entry.sources].join(' + '),
        stats: [...entry.stats],
        icon: entry.icon,
      }))
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [character, itemSkillBonuses, skillsets])
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
            />
          )}
        </div>
        <div className="grid gap-4 lg:sticky lg:top-4">
          <DamagePanel
            character={character}
            devotions={devotions}
            selectedDevotions={selectedDevotions}
            equippedSetInfo={equippedSetInfo}
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
