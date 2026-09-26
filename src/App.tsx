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
            difficulty={difficulty}
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
