import { useMemo, useState } from 'react'
import { IconBolt, IconChartBar, IconShield, IconSparkles } from '@tabler/icons-react'
import './App.css'
import Header from '@/components/Header'
import StatPanel from '@/components/StatPanel'
import DamagePanel from '@/components/DamagePanel'
import ResistancePanel from '@/components/ResistancePanel'
import WorkspaceTabs from '@/components/WorkspaceTabs'
import ItemPanel from '@/domain/item/components/ItemPanel'
import type { Item } from '@/domain/item/types'
import EquipmentPanel from '@/domain/hero/components/EquipmentPanel'
import MasteriesView from '@/domain/mastery/components/MasteriesView'
import DevotionPanel from '@/domain/devotion/components/DevotionPanel'
import { useMasteryData } from '@/domain/mastery/mastery.hooks'
import { useDevotionData } from '@/domain/devotion/devotion.hooks'
import { getEquippedSkillBonuses, getEquippedSetInfo } from '@/domain/item/item.utils'
import { useItemLibrary } from '@/domain/item/item.hooks'
import { useHero } from '@/domain/hero/hero.hooks'
import { getActiveSkills } from '@/domain/mastery/active-skills.utils'
import ActiveSkillList from '@/domain/mastery/components/ActiveSkillList'
import type { DifficultyMode } from '@/domain/hero/difficulty'
import { ItemDndProvider } from '@/contexts/ItemDndContext'

function App() {
  const { masteries, skillsets } = useMasteryData()
  const { data: devotions, selected: selectedDevotions, setSelected: setSelectedDevotions } = useDevotionData()
  const [view, setView] = useState<'items' | 'masteries' | 'devotions'>('masteries')
  const [rightPanel, setRightPanel] = useState<'offense' | 'defense' | 'general' | 'mastery-skills' | null>('offense')
  const [difficulty, setDifficulty] = useState<DifficultyMode>('Normal')
  const { character, setCharacter, changeLevel, adjustAttribute, equipItem, unequipItem, changeMastery } =
    useHero(skillsets)
  const itemLibrary = useItemLibrary(character.level)
  const { itemSets } = itemLibrary
  const equippedSetInfo = useMemo(
    () => getEquippedSetInfo(character.equipment, itemSets, character.disabledEquipmentSlots),
    [character.disabledEquipmentSlots, character.equipment, itemSets],
  )
  const itemSkillBonuses = useMemo(() => {
    const additionalAttributes = [
      ...equippedSetInfo.flatMap(({ activeTier }) => activeTier?.attributes ?? []),
      ...(devotions?.constellations ?? [])
        .filter((constellation) => constellation.skills.some((skill) => selectedDevotions.includes(skill.id)))
        .flatMap((constellation) =>
          constellation.skills
            .filter((skill) => selectedDevotions.includes(skill.id))
            .flatMap((skill) => skill.attributes),
        ),
    ]
    const bonuses = getEquippedSkillBonuses(
      character.equipment,
      Object.fromEntries(
        masteries.map((mastery) => [mastery.name, (skillsets[mastery.id] ?? []).map((skill) => skill.name)]),
      ),
      additionalAttributes,
      character.disabledEquipmentSlots,
    )
    const allocatedSkillNames = new Set(
      Object.values(skillsets)
        .flat()
        .filter((skill) => (character.skillLevels[skill.id] ?? 0) > 0)
        .map((skill) => skill.name),
    )
    return Object.fromEntries(Object.entries(bonuses).filter(([name]) => allocatedSkillNames.has(name)))
  }, [
    character.disabledEquipmentSlots,
    character.equipment,
    character.skillLevels,
    devotions,
    equippedSetInfo,
    masteries,
    selectedDevotions,
    skillsets,
  ])
  const createEquipmentInstance = (template: Item) => ({
    ...template,
    id: `${template.id}::instance::${Date.now()}`,
    templateId: template.id,
    isInstance: true,
    originRarity: template.rarity,
    baseAttributes: [...(template.attributes ?? [])],
  })
  const equipAvailableItem = (item: Item, targetSlot?: string) =>
    equipItem(item.isInstance ? item : createEquipmentInstance(item), targetSlot)
  const isEquipmentItem = (item: Item) =>
    Object.values(character.equipment).some(
      (equippedItem) => equippedItem?.id === item.id || equippedItem?.templateId === item.id,
    )
  const unequipAvailableItem = (item: Item) => {
    const equippedItem = Object.values(character.equipment).find(
      (candidate) => candidate?.id === item.id || candidate?.templateId === item.id,
    )
    if (equippedItem) unequipItem(equippedItem)
  }
  const updateItemInstance = (item: Item) => {
    setCharacter((current) => {
      const equipment = { ...current.equipment }
      let changed = false
      for (const [slot, equippedItem] of Object.entries(equipment))
        if (equippedItem?.id === item.id) {
          equipment[slot] = { ...equippedItem, ...item, isInstance: true }
          changed = true
        }
      return changed ? { ...current, equipment } : current
    })
  }
  const selectedMasterySkillNames = useMemo(() => {
    const names = new Set<string>()
    for (const id of [character.mastery1, character.mastery2])
      if (id) names.add(masteries.find((mastery) => mastery.id === id)?.name ?? '')
    for (const id of [character.mastery1, character.mastery2])
      for (const skill of skillsets[id ?? ''] ?? []) names.add(skill.name)
    return names
  }, [character.mastery1, character.mastery2, masteries, skillsets])
  const activeSkills = useMemo(
    () =>
      getActiveSkills({
        character,
        itemSkillBonuses,
        skillsets,
        devotions,
        selectedDevotions,
        equippedSetInfo,
        masteries,
      }),
    [character, itemSkillBonuses, skillsets, devotions, selectedDevotions, equippedSetInfo, masteries],
  )
  const activeMasterySkills = useMemo(
    () => activeSkills.filter((skill) => skill.source === 'Mastery' || skill.source.startsWith('Modifier of ')),
    [activeSkills],
  )
  const toggleSkill = (skillId: string, isProc: boolean) =>
    setCharacter((current) => {
      if (isProc) {
        const enabled = new Set(current.enabledProcSkills ?? [])
        if (enabled.has(skillId)) enabled.delete(skillId)
        else enabled.add(skillId)
        return { ...current, enabledProcSkills: [...enabled] }
      }
      const disabled = new Set(current.disabledPassiveSkills ?? [])
      if (disabled.has(skillId)) disabled.delete(skillId)
      else disabled.add(skillId)
      return { ...current, disabledPassiveSkills: [...disabled] }
    })
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
    <ItemDndProvider
      character={character}
      setCharacter={setCharacter}
      equipAvailableItem={equipAvailableItem}
      unequipItem={unequipItem}
    >
      <main className="min-h-screen w-full px-4 pb-10 text-neutral-100 sm:px-6 lg:px-8 xl:px-10">
        <Header
          level={character.level}
          onLevelChange={changeLevel}
          combinedClassName={selectedCombination?.name ?? firstMasteryName}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          character={character}
          onAttributeChange={adjustAttribute}
        />
        <WorkspaceTabs value={view} onChange={setView} />
        <div
          className={`grid items-start gap-4 ${rightPanel ? 'lg:grid-cols-[minmax(0,1fr)_minmax(380px,480px)]' : 'lg:grid-cols-[minmax(0,1fr)_2.5rem]'}`}
        >
          <div className="min-w-0">
            {view === 'masteries' ? (
              <MasteriesView character={character} setCharacter={setCharacter} onMasteryChange={changeMastery} />
            ) : view === 'devotions' && devotions ? (
              <DevotionPanel data={devotions} selected={selectedDevotions} setSelected={setSelectedDevotions} />
            ) : (
              <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,500px)]">
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
                <EquipmentPanel
                  character={character}
                  setCharacter={setCharacter}
                  itemLibrary={itemLibrary}
                  onEquip={equipAvailableItem}
                  onUnequip={unequipAvailableItem}
                  isEquipped={(item, slot) =>
                    slot
                      ? Boolean(character.equipment[slot] && character.equipment[slot]?.id === item.id)
                      : isEquipmentItem(item)
                  }
                  equippedSetInfo={equippedSetInfo}
                  activeSkillNames={selectedMasterySkillNames}
                  onUpdateInstance={updateItemInstance}
                />
              </div>
            )}
          </div>
          <div
            className={`grid min-w-0 items-start gap-2 ${rightPanel ? 'grid-cols-[minmax(0,1fr)_2.5rem]' : 'grid-cols-[2.5rem] justify-end'} lg:sticky lg:top-4`}
          >
            {rightPanel && (
              <div
                className="min-w-0"
                id="character-panel-content"
                role="tabpanel"
                aria-labelledby={`character-panel-tab-${rightPanel}`}
              >
                {rightPanel === 'offense' && (
                  <DamagePanel
                    character={character}
                    devotions={devotions}
                    selectedDevotions={selectedDevotions}
                    equippedSetInfo={equippedSetInfo}
                    masteries={masteries}
                    skillsets={skillsets}
                    itemSkillBonuses={itemSkillBonuses}
                  />
                )}
                {rightPanel === 'defense' && (
                  <ResistancePanel
                    character={character}
                    devotions={devotions}
                    selectedDevotions={selectedDevotions}
                    equippedSetInfo={equippedSetInfo}
                    difficulty={difficulty}
                  />
                )}
                {rightPanel === 'general' && (
                  <StatPanel
                    character={character}
                    masteries={masteries}
                    skillsets={skillsets}
                    itemSkillBonuses={itemSkillBonuses}
                    devotions={devotions}
                    selectedDevotions={selectedDevotions}
                    equippedSetInfo={equippedSetInfo}
                  />
                )}
                {rightPanel === 'mastery-skills' && (
                  <ActiveSkillList skills={activeMasterySkills} onSkillToggle={toggleSkill} />
                )}
              </div>
            )}
            <nav
              className="grid content-start gap-1"
              aria-label="Character panels"
              role="tablist"
              aria-orientation="vertical"
            >
              {(
                [
                  { id: 'general', label: 'General stats', icon: IconChartBar },
                  { id: 'offense', label: 'Offense', icon: IconBolt },
                  { id: 'defense', label: 'Defense', icon: IconShield },
                  { id: 'mastery-skills', label: 'Mastery skills', icon: IconSparkles },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const selected = rightPanel === id
                return (
                  <button
                    className={`flex size-10 items-center justify-center rounded-md border transition-colors ${selected ? 'border-orange-300/50 bg-orange-300/10 text-orange-200' : 'border-transparent text-neutral-500 hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-200'}`}
                    key={id}
                    type="button"
                    role="tab"
                    id={`character-panel-tab-${id}`}
                    aria-selected={selected}
                    aria-label={label}
                    aria-controls={rightPanel ? 'character-panel-content' : undefined}
                    title={label}
                    onClick={() => setRightPanel((current) => (current === id ? null : id))}
                  >
                    <Icon size={18} stroke={1.8} aria-hidden="true" />
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </main>
    </ItemDndProvider>
  )
}

export default App
