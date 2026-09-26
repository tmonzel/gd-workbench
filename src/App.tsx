import { useMemo, useState } from 'react'
import './App.css'
import Header from '@/components/Header'
import StatPanel from '@/components/StatPanel'
import DamagePanel from '@/components/DamagePanel'
import ResistancePanel from '@/components/ResistancePanel'
import WorkspaceTabs from '@/components/WorkspaceTabs'
import ItemPanel from '@/domain/item/components/ItemPanel'
import type { Item } from '@/domain/item/types'
import EquipmentPanel from '@/domain/hero/components/EquipmentPanel'
import SkillsView from '@/domain/skill/components/SkillsView'
import DevotionPanel from '@/domain/devotion/components/DevotionPanel'
import { useSkillData } from '@/domain/skill/skill.hooks'
import { useDevotionData } from '@/domain/devotion/devotion.hooks'
import { getEquippedSkillBonuses, getEquippedSetInfo } from '@/domain/item/item.utils'
import { useItemLibrary } from '@/domain/item/item.hooks'
import { useHero } from '@/domain/hero/hero.hooks'
import { getActiveSkills } from '@/domain/skill/active-skills.utils'
import type { DifficultyMode } from '@/domain/hero/difficulty'

function App() {
  const { masteries, skillsets } = useSkillData()
  const { data: devotions, selected: selectedDevotions, setSelected: setSelectedDevotions } = useDevotionData()
  const [view, setView] = useState<'items' | 'equipment' | 'masteries' | 'devotions'>('masteries')
  const [difficulty, setDifficulty] = useState<DifficultyMode>('Normal')
  const [collectionItems, setCollectionItems] = useState<Item[]>([])
  const { character, setCharacter, changeLevel, adjustAttribute, equipItem, unequipItem, changeMastery } =
    useHero(skillsets)
  const itemLibrary = useItemLibrary(character.level)
  const { itemSets } = itemLibrary
  const equippedSetInfo = useMemo(
    () => getEquippedSetInfo(character.equipment, itemSets),
    [character.equipment, itemSets],
  )
  const itemSkillBonuses = useMemo(() => {
    const additionalAttributes = [
      ...equippedSetInfo.flatMap(({ activeTier }) => activeTier?.attributes ?? []),
      ...(devotions?.constellations ?? [])
        .filter((constellation) => constellation.skills.some((skill) => selectedDevotions.includes(skill.id)))
        .flatMap((constellation) =>
          constellation.skills.filter((skill) => selectedDevotions.includes(skill.id)).flatMap((skill) => skill.attributes),
        ),
    ]
    return getEquippedSkillBonuses(
      character.equipment,
      Object.fromEntries(masteries.map((mastery) => [mastery.name, (skillsets[mastery.id] ?? []).map((skill) => skill.name)])),
      additionalAttributes,
    )
  }, [character.equipment, devotions, equippedSetInfo, masteries, selectedDevotions, skillsets])
  const createItemInstance = (template: Item) => {
    const instance = {
      ...template,
      id: `${template.id}::instance::${Date.now()}-${collectionItems.length}`,
      templateId: template.id,
      isInstance: true,
      originRarity: template.rarity,
      baseAttributes: [...(template.attributes ?? [])],
    }
    setCollectionItems((current) => [...current, instance])
    return instance
  }
  const equipAvailableItem = (item: Item, targetSlot?: string) =>
    equipItem(item.isInstance ? item : createItemInstance(item), targetSlot)
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
  const selectedMasterySkillNames = useMemo(() => {
    const names = new Set<string>()
    for (const id of [character.mastery1, character.mastery2])
      if (id) names.add(masteries.find((mastery) => mastery.id === id)?.name ?? '')
    for (const id of [character.mastery1, character.mastery2])
      for (const skill of skillsets[id ?? ''] ?? []) names.add(skill.name)
    return names
  }, [character.mastery1, character.mastery2, masteries, skillsets])
  const activeSkills = useMemo(
    () => getActiveSkills({ character, itemSkillBonuses, skillsets, devotions, selectedDevotions, equippedSetInfo, masteries }),
    [character, itemSkillBonuses, skillsets, devotions, selectedDevotions, equippedSetInfo, masteries],
  )
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
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        character={character}
        onAttributeChange={adjustAttribute}
      />
      <WorkspaceTabs value={view} onChange={setView} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <div className="min-w-0">
          {view === 'equipment' ? (
            <EquipmentPanel
              character={character}
              setCharacter={setCharacter}
              itemLibrary={itemLibrary}
              onEquip={equipAvailableItem}
              onUnequip={unequipAvailableItem}
              isEquipped={isEquipmentItem}
              equippedSetInfo={equippedSetInfo}
              activeSkillNames={selectedMasterySkillNames}
            />
          ) : view === 'masteries' ? (
            <SkillsView
              character={character}
              setCharacter={setCharacter}
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
            skillsets={skillsets}
            itemSkillBonuses={itemSkillBonuses}
          />
          <ResistancePanel
            character={character}
            devotions={devotions}
            selectedDevotions={selectedDevotions}
            equippedSetInfo={equippedSetInfo}
            difficulty={difficulty}
          />
          <StatPanel
            character={character}
            masteries={masteries}
            skillsets={skillsets}
            itemSkillBonuses={itemSkillBonuses}
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
