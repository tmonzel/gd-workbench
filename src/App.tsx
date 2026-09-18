import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import AttributePanel, { clampAttributes } from './components/AttributePanel'
import Header from './components/Header'
import StatPanel from './components/StatPanel'
import DamagePanel from './components/DamagePanel'
import ResistancePanel from './components/ResistancePanel'
import SkillPanel from './components/SkillPanel'
import WorkspaceTabs from './components/WorkspaceTabs'
import EquipmentView from './views/EquipmentView'
import LibraryView from './views/LibraryView'
import MasteriesView from './views/MasteriesView'
import DevotionsView from './views/DevotionsView'
import type { Character, Item, Mastery, MasterySkill } from './types'
import { getEquippedSkillBonuses, parseSkillBonus } from './skillBonus'
import { getEquippedSetInfo, type ItemSet } from './itemSets'
import { formatSkillEffect, formatSkillValue } from './damage-utils'

type DevotionData = Parameters<typeof DevotionsView>[0]['data']

type WorkerMessage =
  | { type: 'ready'; total: number }
  | { type: 'page'; page: number; pageSize: number; total: number; items: Item[] }
  | { type: 'error'; message: string }

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [masteries, setMasteries] = useState<Mastery[]>([])
  const [skillsets, setSkillsets] = useState<Record<string, MasterySkill[]>>({})
  const [devotions, setDevotions] = useState<DevotionData | null>(null)
  const [selectedDevotions, setSelectedDevotions] = useState<string[]>([])
  const [itemSets, setItemSets] = useState<ItemSet[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [hideAboveLevel, setHideAboveLevel] = useState(false)
  const [onlySetItems, setOnlySetItems] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(24)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [view, setView] = useState<'library' | 'character' | 'masteries' | 'devotions'>('masteries')
  const [character, setCharacter] = useState<Character>({
    level: 1,
    physique: 0,
    cunning: 0,
    spirit: 0,
    skillLevels: {},
    equipment: {},
  })
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    fetch('/data/masteries.json')
      .then((response) => response.json() as Promise<Mastery[]>)
      .then(setMasteries)
      .catch(() => setMasteries([]))
    fetch('/data/mastery-skills.json')
      .then((response) => response.json() as Promise<Record<string, MasterySkill[]>>)
      .then(setSkillsets)
      .catch(() => setSkillsets({}))
    fetch('/data/devotions.json')
      .then((response) => response.json() as Promise<DevotionData>)
      .then(setDevotions)
      .catch(() => setDevotions(null))
    fetch('/data/item-sets.json')
      .then((response) => response.json() as Promise<ItemSet[]>)
      .then((data) => {
        setItemSets(data)
        workerRef.current?.postMessage({ type: 'setIds', ids: data.flatMap((set) => set.members) })
      })
      .catch(() => setItemSets([]))
    const worker = new Worker('/item-worker.js')
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data
      if (message.type === 'ready') {
        setStatus('ready')
      }
      if (message.type === 'page') {
        setItems(message.items)
        setPageSize(message.pageSize)
        setTotal(message.total)
        setStatus('ready')
      }
      if (message.type === 'error') setStatus('error')
    }
    worker.postMessage({ type: 'load' })
    return () => worker.terminate()
  }, [])

  const requestPage = (
    nextPage: number,
    nextSearch = search,
    nextCategory = category,
    nextHideAboveLevel = hideAboveLevel,
    nextOnlySetItems = onlySetItems,
  ) => {
    setPage(nextPage)
    workerRef.current?.postMessage({
      type: 'page',
      page: nextPage,
      search: nextSearch,
      category: nextCategory,
      maxLevel: nextHideAboveLevel ? character.level : undefined,
      onlySetItems: nextOnlySetItems,
    })
  }

  const changeFilter = (value: string) => {
    setCategory(value)
    requestPage(0, search, value)
  }
  const changeSearch = (value: string) => {
    setSearch(value)
    requestPage(0, value, category)
  }
  const toggleHideAboveLevel = () => {
    const next = !hideAboveLevel
    setHideAboveLevel(next)
    requestPage(0, search, category, next, onlySetItems)
  }
  const toggleOnlySetItems = () => {
    const next = !onlySetItems
    setOnlySetItems(next)
    requestPage(0, search, category, hideAboveLevel, next)
  }
  useEffect(() => {
    if (hideAboveLevel) requestPage(0, search, category, hideAboveLevel, onlySetItems)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.level])
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const loading = status === 'loading'
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
  const equipItem = (item: Item) => {
    setCharacter((current) => {
      // a two-handed weapon blocks the off-hand slot; an off-hand item can't go on while one is equipped
      if (item.category === 'Off-Hand' && current.equipment.Weapon?.twoHanded) return current
      const equipment = { ...current.equipment }
      equipment[item.category === 'Ring' ? (equipment['Ring 1'] ? 'Ring 2' : 'Ring 1') : item.category] = item
      if (item.category === 'Weapon' && item.twoHanded) delete equipment['Off-Hand']
      return { ...current, equipment }
    })
  }
  const unequipItem = (item: Item) => {
    setCharacter((current) => {
      const equipment = { ...current.equipment }
      for (const slot of Object.keys(equipment)) {
        if (equipment[slot]?.id === item.id) delete equipment[slot]
      }
      return { ...current, equipment }
    })
  }
  const changeLevel = (delta: number) => {
    setCharacter((current) => {
      const level = Math.max(1, Math.min(100, current.level + delta))
      return {
        ...current,
        level,
        ...clampAttributes(level, current.physique, current.cunning, current.spirit),
      }
    })
  }
  const masteryCombinations = masteries.flatMap((mastery) => mastery.combinations)
  const selectedCombination =
    character.mastery1 && character.mastery2
      ? masteryCombinations.find(
          (combo) =>
            [combo.first, combo.second].sort().join('-') === [character.mastery1, character.mastery2].sort().join('-'),
        )
      : undefined
  const firstMasteryName = masteries.find((mastery) => mastery.id === character.mastery1)?.name
  const changeMastery = (slot: 'mastery1' | 'mastery2', value: string) =>
    setCharacter((current) => {
      if (slot === 'mastery2' && !current.mastery1) return current
      if (slot === 'mastery1')
        return { ...current, mastery1: value || undefined, mastery2: value ? current.mastery2 : undefined }
      return { ...current, mastery2: value || undefined }
    })

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
        <AttributePanel character={character} setCharacter={setCharacter} />
        <div className="min-w-0">
          {view === 'character' ? (
            <EquipmentView
              character={character}
              setCharacter={setCharacter}
              equippedSetInfo={equippedSetInfo}
              itemSets={itemSets}
              activeSkillNames={selectedMasterySkillNames}
            />
          ) : view === 'masteries' ? (
            <MasteriesView
              character={character}
              setCharacter={setCharacter}
              masteries={masteries}
              skillsets={skillsets}
              itemBonuses={itemSkillBonuses}
            />
          ) : view === 'devotions' && devotions ? (
            <DevotionsView data={devotions} selected={selectedDevotions} setSelected={setSelectedDevotions} />
          ) : (
            <LibraryView
              items={items}
              category={category}
              search={search}
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              total={total}
              loading={loading}
              status={status}
              onSearchChange={changeSearch}
              onCategoryChange={changeFilter}
              onPageChange={requestPage}
              onEquip={equipItem}
              onUnequip={unequipItem}
              isEquipped={(item) =>
                Object.values(character.equipment).some((equippedItem) => equippedItem?.id === item.id)
              }
              activeSkillNames={selectedMasterySkillNames}
              itemSets={itemSets}
              equippedSetInfo={equippedSetInfo}
              hideAboveLevel={hideAboveLevel}
              onToggleHideAboveLevel={toggleHideAboveLevel}
              onlySetItems={onlySetItems}
              onToggleOnlySetItems={toggleOnlySetItems}
            />
          )}
        </div>
        <div className="grid gap-4 lg:sticky lg:top-4">
          <SkillPanel skills={activeSkills} />
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
