import { useEffect } from 'react'
import { Card } from '@/components/Card'
import ItemList from '@/domain/item/components/ItemList'
import ItemFilters from '@/domain/item/components/ItemFilters'
import ItemSideNav from '@/domain/item/components/ItemSideNav'
import type { Item } from '@/domain/item/types'
import type { EquippedSetInfo } from '@/domain/item/types'
import type { ItemLibraryState } from '@/domain/item/item.hooks'

type ItemPanelProps = {
  itemLibrary: ItemLibraryState
  onEquip: (item: Item) => void
  onUnequip: (item: Item) => void
  isEquipped: (item: Item) => boolean
  activeSkillNames?: Set<string>
  equippedSetInfo?: EquippedSetInfo[]
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
  categoryOverride,
  embedded = false,
  allowTemplateEquip = false,
}: ItemPanelProps) {
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
  const loading = status === 'loading'
  return (
    <div className={embedded ? 'min-w-0' : 'grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]'}>
      {!embedded && <ItemSideNav category={category} onCategoryChange={changeCategory} />}
      <Card as="section" size="md" variant="filled">
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
      </Card>
    </div>
  )
}

export default ItemPanel
