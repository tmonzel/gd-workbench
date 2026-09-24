import { useMemo, useState } from 'react'
import { Card } from '@/components/Card'
import ItemCard from '@/domain/item/components/ItemCard'
import ItemList from '@/domain/item/components/ItemList'
import ItemFilters from '@/domain/item/components/ItemFilters'
import ItemSideNav from '@/domain/item/components/ItemSideNav'
import CraftItemPanel from '@/domain/item/components/CraftItemPanel'
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
}: ItemPanelProps) {
  const [mode, setMode] = useState<'library' | 'collection'>('library')
  const [selectedCollectionItem, setSelectedCollectionItem] = useState<Item>()
  const [draftCollectionItem, setDraftCollectionItem] = useState<Item | undefined>()
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
  const loading = status === 'loading'
  const collectionCategories = useMemo(() => new Set(collectionItems.map((item) => item.category)), [collectionItems])
  const collectionStatOptions = useMemo(
    () =>
      [
        ...new Set([
          ...collectionItems.flatMap((item) => (item.attributes ?? []).map((attribute) => attribute.label)),
        ]),
      ].sort(),
    [collectionItems],
  )
  const collectionFilteredItems = useMemo(() => {
    const query = collectionSearch.trim().toLowerCase()
    const matchesStat = (item: Item, stat: string) => {
      return (item.attributes ?? []).some((attribute) => attribute.label === stat)
    }
    const matchesCategory = (category: string) =>
      collectionCategory === 'All' ||
      category === collectionCategory ||
      CATEGORY_GROUPS[collectionCategory]?.includes(category)
    return collectionItems.filter((item) => {
      const requiredLevel = Number(item.stats?.levelRequirement ?? item.level) || 0
      return (
        (!query ||
          `${item.qualityTag ?? ''} ${item.prefix ?? ''} ${item.name} ${item.suffix ?? ''} ${item.category}`
            .toLowerCase()
            .includes(query)) &&
        matchesCategory(item.category) &&
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
    <div className={mode === 'collection' ? 'grid gap-4' : ''}>
      <Card as="section" size="md" variant="filled">
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
        {mode === 'collection' ? (
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
                      onSelect={(item) => {
                        setSelectedCollectionItem(item)
                        setDraftCollectionItem(item)
                      }}
                      onRemoveInstance={(item) => {
                        onRemoveInstance?.(item)
                        if (selectedCollectionItem?.id === item.id) setSelectedCollectionItem(undefined)
                      }}
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
          <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
            <ItemSideNav category={category} onCategoryChange={changeCategory} />
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
      {mode === 'collection' && onUpdateInstance && selectedCollectionItem && draftCollectionItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative my-auto flex h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] w-full max-w-6xl flex-col overflow-visible rounded-lg border border-neutral-700 bg-neutral-950 p-5 shadow-2xl shadow-black/60 lg:ml-64">
            <div className="mb-5 flex shrink-0 items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Crafting</p>
                <h2 className="text-lg font-medium text-neutral-50">Edit selected item</h2>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <div className="grid h-full gap-6">
                <section
                  className="min-w-0 lg:absolute lg:right-full lg:top-0 lg:mr-5 lg:w-80"
                  aria-label="Item preview"
                >
                  <ItemCard
                    item={draftCollectionItem}
                    itemSets={itemSets}
                    equippedSetInfo={equippedSetInfo}
                    activeSkillNames={activeSkillNames}
                  />
                </section>
                <section className="min-h-0 min-w-0 overflow-y-auto pr-2" aria-label="Item configuration">
                  <CraftItemPanel
                    key={selectedCollectionItem.id}
                    item={draftCollectionItem}
                    onPreview={setDraftCollectionItem}
                  />
                </section>
              </div>
            </div>
            <div className="mt-5 flex shrink-0 justify-end gap-2 border-t border-neutral-800 pt-4">
              <button
                className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-100"
                type="button"
                onClick={() => {
                  setSelectedCollectionItem(undefined)
                  setDraftCollectionItem(undefined)
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-md border border-orange-300/60 bg-orange-300/10 px-3 py-2 text-sm text-orange-100 hover:bg-orange-300/20"
                type="button"
                onClick={() => {
                  onUpdateInstance(draftCollectionItem)
                  setSelectedCollectionItem(draftCollectionItem)
                  setDraftCollectionItem(undefined)
                }}
              >
                Save item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ItemPanel
