import { useMemo, useState } from 'react'
import { Card } from '@/components/Card'
import ItemList from '@/domain/item/components/ItemList'
import ItemSideNav from '@/domain/item/components/ItemSideNav'
import type { Item } from '@/domain/item/types'
import type { EquippedSetInfo } from '@/domain/item/types'
import type { ItemLibraryState } from '@/domain/item/item.hooks'
import { RARITIES, rarityBackgroundClasses, rarityBorderClasses, rarityTextClasses } from '@/domain/item/item.utils'
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
}: ItemPanelProps) {
  const [mode, setMode] = useState<'library' | 'collection'>('library')
  const [collectionSearch, setCollectionSearch] = useState('')
  const [collectionCategory, setCollectionCategory] = useState('All')
  const [collectionRarities, setCollectionRarities] = useState<string[]>([])
  const [collectionHideAboveLevel, setCollectionHideAboveLevel] = useState(false)
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
  const collectionFilteredItems = useMemo(() => {
    const groupMatches = (category: string) =>
      category === 'All' || category === collectionCategory || CATEGORY_GROUPS[collectionCategory]?.includes(category)
    const query = collectionSearch.trim().toLowerCase()
    return collectionItems.filter((item) => {
      const requiredLevel = Number(item.stats?.levelRequirement ?? item.level) || 0
      return (
        (!query ||
          `${item.qualityTag ?? ''} ${item.prefix ?? ''} ${item.name} ${item.suffix ?? ''} ${item.category}`
            .toLowerCase()
            .includes(query)) &&
        groupMatches(item.category) &&
        (!collectionHideAboveLevel || requiredLevel <= itemLibrary.level) &&
        (!collectionRarities.length || collectionRarities.includes(item.rarity))
      )
    })
  }, [
    collectionCategory,
    collectionHideAboveLevel,
    collectionItems,
    collectionRarities,
    collectionSearch,
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
            <div className="min-w-0">
              <section
                className="mb-4 flex flex-wrap items-center justify-between gap-2"
                aria-label="Filter collection"
              >
                <div className="flex flex-wrap items-center gap-1">
                  {RARITIES.filter((rarity) => collectionItems.some((item) => item.rarity === rarity)).map((rarity) => (
                    <label
                      className={`cursor-pointer rounded border px-2.5 py-1.5 text-xs ${collectionRarities.includes(rarity) ? `${rarityBorderClasses[rarity.toLowerCase()]} ${rarityBackgroundClasses[rarity.toLowerCase()]} ${rarityTextClasses[rarity.toLowerCase()]}` : 'border-neutral-700 bg-neutral-900/80 text-neutral-500'}`}
                      key={rarity}
                    >
                      <input
                        className="sr-only"
                        type="checkbox"
                        checked={collectionRarities.includes(rarity)}
                        onChange={() => {
                          setCollectionRarities((current) =>
                            current.includes(rarity)
                              ? current.filter((value) => value !== rarity)
                              : [...current, rarity],
                          )
                          setCollectionPage(0)
                        }}
                      />
                      {rarity}
                    </label>
                  ))}
                </div>
                <label className="flex min-w-48 items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 px-2 text-orange-300 sm:max-w-52">
                  <span aria-hidden="true">⌕</span>
                  <input
                    className="w-full bg-transparent py-1.5 text-xs text-neutral-100 outline-none placeholder:text-neutral-600"
                    value={collectionSearch}
                    onChange={(event) => {
                      setCollectionSearch(event.target.value)
                      setCollectionPage(0)
                    }}
                    placeholder="Search collection"
                  />
                </label>
              </section>
              <section className="mb-4 flex items-center justify-between text-[0.68rem] uppercase tracking-[0.14em] text-neutral-500">
                <span>{collectionFilteredItems.length} matching items</span>
                <label className="flex items-center gap-1.5 normal-case tracking-normal">
                  <input
                    type="checkbox"
                    checked={collectionHideAboveLevel}
                    onChange={(event) => {
                      setCollectionHideAboveLevel(event.target.checked)
                      setCollectionPage(0)
                    }}
                  />
                  Equipable only
                </label>
              </section>
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
                />
              ) : (
                <p className="py-12 text-center text-sm text-neutral-500">No collection items match these filters.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No real item instances yet. Create one from the template library.</p>
        )
      ) : (
        <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
          <ItemSideNav category={category} onCategoryChange={changeCategory} />
          <div className="min-w-0">
            <section className="flex flex-wrap items-center justify-between gap-2 mb-4" aria-label="Filter items">
              <div className="flex flex-wrap items-center gap-1" aria-label="Rarity filters">
                {RARITIES.map((rarity) => (
                  <label
                    className={`cursor-pointer rounded border px-2.5 py-1.5 text-md transition-colors ${
                      rarities.includes(rarity)
                        ? `${rarityBorderClasses[rarity.toLowerCase()] ?? 'border-neutral-400/70'} brightness-125 ${rarityBackgroundClasses[rarity.toLowerCase()] ?? 'bg-neutral-800/80'} ${rarityTextClasses[rarity.toLowerCase()] ?? 'text-neutral-100'}`
                        : 'border-neutral-700 bg-neutral-900/80 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300'
                    }`}
                    key={rarity}
                  >
                    <input
                      className="sr-only"
                      type="checkbox"
                      checked={rarities.includes(rarity)}
                      onChange={() => toggleRarity(rarity)}
                    />
                    {rarity}
                  </label>
                ))}
              </div>
              <label className="flex min-w-48 flex-1 items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 px-2 text-orange-300 sm:max-w-52 sm:flex-none">
                <span aria-hidden="true" className="text-base">
                  ⌕
                </span>
                <input
                  className="w-full bg-transparent py-1.5 text-xs text-neutral-100 outline-none placeholder:text-neutral-600"
                  value={search}
                  onChange={(event) => changeSearch(event.target.value)}
                  placeholder="Search the archive"
                />
              </label>
            </section>
            <section className="mt-1 flex flex-wrap items-center justify-end gap-1" aria-label="Additional filters">
              <label
                className={`flex cursor-pointer items-center gap-1.5 px-1 py-0.5 text-xs transition-colors ${
                  hideAboveLevel ? 'text-neutral-200' : 'text-neutral-500 hover:text-neutral-300'
                }`}
                htmlFor="equipable-only"
              >
                <span className="relative flex size-4 shrink-0 items-center justify-center">
                  <input
                    className="peer size-4 appearance-none rounded-sm border border-neutral-700 bg-neutral-950 checked:border-orange-300 checked:bg-orange-300 focus:ring-1 focus:ring-orange-300/50"
                    type="checkbox"
                    id="equipable-only"
                    checked={hideAboveLevel}
                    onChange={toggleHideAboveLevel}
                  />
                  <span className="pointer-events-none absolute text-xs font-bold leading-none text-neutral-950 opacity-0 peer-checked:opacity-100">
                    ✓
                  </span>
                </span>
                <span>Equipable only</span>
              </label>
            </section>
            <section className="flex items-center justify-between px-1 py-5 text-[0.68rem] uppercase tracking-[0.14em] text-neutral-500">
              <p className="m-0 text-neutral-300">{total} matching items</p>
              <span className="tabular-nums">
                Page {Math.min(page + 1, pageCount)} of {pageCount}
              </span>
            </section>
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
  )
}

export default ItemPanel
