import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/Card'
import ItemList from '@/domain/item/components/ItemList'
import ItemFilters from '@/domain/item/components/ItemFilters'
import ItemSideNav from '@/domain/item/components/ItemSideNav'
import ItemCraftModal from '@/domain/item/components/ItemCraftModal'
import type { Item } from '@/domain/item/types'
import type { EquippedSetInfo } from '@/domain/item/types'
import type { ItemLibraryState } from '@/domain/item/item.hooks'
import { RARITIES } from '@/domain/item/item.utils'
import { CATEGORY_GROUPS } from '@/domain/item/components/ItemSideNav'

type ItemPanelProps = {
  itemLibrary: ItemLibraryState
  onEquip: (item: Item) => void
  onUnequip: (item: Item) => void
  isEquipped: (item: Item) => boolean
  activeSkillNames?: Set<string>
  equippedSetInfo?: EquippedSetInfo[]
  collectionItems?: Item[]
  onCreateInstance?: (item: Item) => void
  onUpdateInstance?: (item: Item) => void
  onRemoveInstance?: (item: Item) => void
  categoryOverride?: string
  embedded?: boolean
  allowTemplateEquip?: boolean
}

function ItemPanel({
  itemLibrary,
  onEquip,
  onUnequip,
  isEquipped,
  activeSkillNames,
  equippedSetInfo,
  collectionItems = [],
  onCreateInstance,
  onUpdateInstance,
  onRemoveInstance,
  categoryOverride,
  embedded = false,
  allowTemplateEquip = false,
}: ItemPanelProps) {
  const [mode, setMode] = useState<'library' | 'collection'>('library')
  const [selectedCollectionItem, setSelectedCollectionItem] = useState<Item>()
  const [collectionSearch, setCollectionSearch] = useState('')
  const [collectionCategory, setCollectionCategory] = useState('All')
  const [collectionRarities, setCollectionRarities] = useState<string[]>([])
  const [collectionHideAboveLevel, setCollectionHideAboveLevel] = useState(false)
  const [collectionMonsterInfrequentOnly, setCollectionMonsterInfrequentOnly] = useState(false)
  const [collectionStats, setCollectionStats] = useState<string[]>([])
  const [collectionPage, setCollectionPage] = useState(0)
  const {
    items,
    itemSets,
    search,
    category,
    hideAboveLevel,
    rarities,
    page,
    pageSize,
    total,
    status,
    pageCount,
    changeCategory,
    changeSearch,
    requestPage,
    toggleHideAboveLevel,
    toggleRarity,
  } = itemLibrary
  useEffect(() => {
    if (categoryOverride && categoryOverride !== category) changeCategory(categoryOverride)
  }, [category, categoryOverride, changeCategory])
  const displayMode = embedded ? 'library' : mode
  const loading = status === 'loading'
  const collectionCategories = useMemo(() => {
    const categories = new Set(collectionItems.map((item) => item.category))
    const weaponTypes: Record<string, RegExp> = {
      Swords: /WeaponMelee_Sword/i,
      Axes: /WeaponMelee_Axe/i,
      Maces: /WeaponMelee_Mace/i,
      Daggers: /WeaponMelee_Dagger/i,
      Scepters: /WeaponMelee_Scepter/i,
      Spears: /WeaponMelee_Spear/i,
      Ranged: /WeaponHunting_Ranged/i,
      Shields: /shield/i,
    }
    for (const [type, pattern] of Object.entries(weaponTypes))
      if (
        collectionItems.some(
          (item) =>
            (type === 'Shields' ? item.category === 'Off-Hand' : item.category === 'Weapon') &&
            pattern.test(String(item.stats?.Class ?? '')),
        )
      )
        categories.add(type)
    return categories
  }, [collectionItems])
  const collectionStatOptions = useMemo(
    () =>
      [
        ...new Set([...collectionItems.flatMap((item) => (item.attributes ?? []).map((attribute) => attribute.label))]),
      ].sort(),
    [collectionItems],
  )
  const collectionFilteredItems = useMemo(() => {
    const query = collectionSearch.trim().toLowerCase()
    const matchesStat = (item: Item, stat: string) => {
      return (item.attributes ?? []).some((attribute) => attribute.label === stat)
    }
    const matchesCategory = (item: Item) =>
      collectionCategory === 'All' ||
      item.category === collectionCategory ||
      CATEGORY_GROUPS[collectionCategory]?.includes(item.category) ||
      (item.category === 'Weapon' &&
        {
          Swords: /WeaponMelee_Sword/i,
          Axes: /WeaponMelee_Axe/i,
          Maces: /WeaponMelee_Mace/i,
          Daggers: /WeaponMelee_Dagger/i,
          Scepters: /WeaponMelee_Scepter/i,
          Spears: /WeaponMelee_Spear/i,
          Ranged: /WeaponHunting_Ranged/i,
          Shields: /shield/i,
        }[collectionCategory]?.test(String(item.stats?.Class ?? '')))
    return collectionItems.filter((item) => {
      const requiredLevel = Number(item.stats?.levelRequirement ?? item.level) || 0
      return (
        (!query ||
          `${item.qualityTag ?? ''} ${item.prefix ?? ''} ${item.name} ${item.suffix ?? ''} ${item.category}`
            .toLowerCase()
            .includes(query)) &&
        matchesCategory(item) &&
        (!collectionHideAboveLevel || requiredLevel <= itemLibrary.level) &&
        (!collectionMonsterInfrequentOnly || item.isMonsterInfrequent) &&
        (!collectionRarities.length || collectionRarities.includes(item.rarity)) &&
        (!collectionStats.length || collectionStats.every((stat) => matchesStat(item, stat)))
      )
    })
  }, [
    collectionCategory,
    collectionHideAboveLevel,
    collectionMonsterInfrequentOnly,
    collectionItems,
    collectionRarities,
    collectionSearch,
    collectionStats,
    itemLibrary.level,
  ])
  const collectionPageSize = 24
  const collectionPageCount = Math.max(1, Math.ceil(collectionFilteredItems.length / collectionPageSize))
  const visibleCollectionItems = collectionFilteredItems.slice(
    collectionPage * collectionPageSize,
    (collectionPage + 1) * collectionPageSize,
  )
  const changeCollectionCategory = (value: string) => {
    setCollectionCategory(value)
    setCollectionPage(0)
  }
  return (
    <div className={displayMode === 'collection' ? 'grid gap-4' : ''}>
      <Card as="section" size="md" variant="filled">
        {!embedded && (
          <div className="mb-5 flex gap-1 border-b border-neutral-800 pb-3">
            {(['library', 'collection'] as const).map((value) => (
              <button
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${mode === value ? 'bg-purple-400/15 text-purple-100' : 'text-purple-300/60 hover:bg-purple-400/10 hover:text-purple-200'}`}
                key={value}
                type="button"
                onClick={() => setMode(value)}
              >
                {value === 'library' ? 'Catalog' : `Collection (${collectionItems.length})`}
              </button>
            ))}
          </div>
        )}
        {displayMode === 'collection' ? (
          collectionItems.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
              <ItemSideNav
                category={collectionCategory}
                onCategoryChange={changeCollectionCategory}
                availableCategories={collectionCategories}
              />
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="min-w-0">
                  <ItemFilters
                    search={collectionSearch}
                    onSearchChange={(value) => {
                      setCollectionSearch(value)
                      setCollectionPage(0)
                    }}
                    searchPlaceholder="Search collection"
                    rarities={collectionRarities}
                    availableRarities={RARITIES.filter((rarity) =>
                      collectionItems.some((item) => item.rarity === rarity),
                    )}
                    onRarityToggle={(rarity) => {
                      setCollectionRarities((current) =>
                        current.includes(rarity) ? current.filter((value) => value !== rarity) : [...current, rarity],
                      )
                      setCollectionPage(0)
                    }}
                    hideAboveLevel={collectionHideAboveLevel}
                    monsterInfrequentOnly={collectionMonsterInfrequentOnly}
                    onMonsterInfrequentToggle={() => {
                      setCollectionMonsterInfrequentOnly((current) => !current)
                      setCollectionPage(0)
                    }}
                    stats={collectionStats}
                    availableStats={collectionStatOptions}
                    onStatsChange={(value) => {
                      setCollectionStats(value)
                      setCollectionPage(0)
                    }}
                    onHideAboveLevelToggle={() => {
                      setCollectionHideAboveLevel((current) => !current)
                      setCollectionPage(0)
                    }}
                    matchingCount={collectionFilteredItems.length}
                    page={collectionPage}
                    pageCount={collectionPageCount}
                  />
                  {visibleCollectionItems.length > 0 ? (
                    <ItemList
                      items={visibleCollectionItems}
                      page={collectionPage}
                      pageCount={collectionPageCount}
                      pageSize={collectionPageSize}
                      total={collectionFilteredItems.length}
                      onPageChange={setCollectionPage}
                      onEquip={onEquip}
                      onUnequip={onUnequip}
                      isEquipped={isEquipped}
                      activeSkillNames={activeSkillNames}
                      itemSets={itemSets}
                      equippedSetInfo={equippedSetInfo}
                      onSelect={setSelectedCollectionItem}
                      onRemoveInstance={(item) => {
                        onRemoveInstance?.(item)
                        if (selectedCollectionItem?.id === item.id) setSelectedCollectionItem(undefined)
                      }}
                      allowTemplateEquip={allowTemplateEquip}
                      maxColumns={embedded ? 2 : undefined}
                    />
                  ) : (
                    <p className="py-12 text-center text-sm text-neutral-500">
                      No collection items match these filters.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              No real item instances yet. Create one from the template library.
            </p>
          )
        ) : (
          <div className={embedded ? 'min-w-0' : 'grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]'}>
            {!embedded && <ItemSideNav category={category} onCategoryChange={changeCategory} />}
            <div className="min-w-0">
              <ItemFilters
                search={search}
                onSearchChange={changeSearch}
                searchPlaceholder="Search the archive"
                rarities={rarities}
                onRarityToggle={toggleRarity}
                hideAboveLevel={hideAboveLevel}
                monsterInfrequentOnly={itemLibrary.monsterInfrequentOnly}
                onMonsterInfrequentToggle={itemLibrary.toggleMonsterInfrequentOnly}
                stats={itemLibrary.stats}
                availableStats={itemLibrary.statOptions}
                onStatsChange={itemLibrary.changeStats}
                onHideAboveLevelToggle={toggleHideAboveLevel}
                matchingCount={total}
                page={page}
                pageCount={pageCount}
              />
              {loading ? (
                <div className="grid gap-2 py-20 text-center text-sm text-neutral-500">
                  <strong className="text-lg font-medium text-neutral-200">Loading database</strong>
                  <span>The JSON file is loading in the background.</span>
                </div>
              ) : status === 'error' ? (
                <div className="grid gap-2 py-20 text-center text-sm text-neutral-500">
                  <strong className="text-lg font-medium text-neutral-200">Could not load items</strong>
                  <span>Check that public/data/items.json exists.</span>
                </div>
              ) : items.length > 0 ? (
                <ItemList
                  items={items}
                  page={page}
                  pageCount={pageCount}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={requestPage}
                  onEquip={onEquip}
                  onUnequip={onUnequip}
                  isEquipped={isEquipped}
                  activeSkillNames={activeSkillNames}
                  itemSets={itemSets}
                  equippedSetInfo={equippedSetInfo}
                  onCreateInstance={onCreateInstance}
                  allowTemplateEquip={allowTemplateEquip}
                  maxColumns={embedded ? 2 : undefined}
                />
              ) : null}
              {!loading && status === 'ready' && items.length === 0 && (
                <div className="grid gap-2 py-20 text-center text-sm text-neutral-500">
                  <strong className="text-lg font-medium text-neutral-200">No records found</strong>
                  <span>Try a different search or item type.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
      {mode === 'collection' && onUpdateInstance && selectedCollectionItem && (
        <ItemCraftModal
          item={selectedCollectionItem}
          itemSets={itemSets}
          equippedSetInfo={equippedSetInfo}
          activeSkillNames={activeSkillNames}
          onSave={(item) => {
            onUpdateInstance(item)
            setSelectedCollectionItem(item)
          }}
          onClose={() => setSelectedCollectionItem(undefined)}
        />
      )}
    </div>
  )
}

export default ItemPanel
