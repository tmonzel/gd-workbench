import { useState } from 'react'
import { Card } from '@/components/Card'
import ItemCard from '@/domain/item/components/ItemCard'
import CraftItemPanel from '@/domain/item/components/CraftItemPanel'
import type { Item } from '@/domain/item/types'
import type { EquippedSetInfo, ItemSet } from '@/domain/item/types'
import type { ItemLibraryState } from '@/domain/item/item.hooks'
import { rarityTextClasses } from '@/domain/item/item.utils'

type CraftingViewProps = {
  itemLibrary: ItemLibraryState
  itemSets?: ItemSet[]
  onCraft: (item: Item) => void
  onEquip: (item: Item) => void
  onUnequip: (item: Item) => void
  isEquipped: (item: Item) => boolean
  activeSkillNames?: Set<string>
  equippedSetInfo?: EquippedSetInfo[]
}

function CraftingView({ itemLibrary, itemSets, onCraft, activeSkillNames, equippedSetInfo }: CraftingViewProps) {
  const [selectedItem, setSelectedItem] = useState<Item>()
  const [previewItem, setPreviewItem] = useState<Item>()
  const [quickFindOpen, setQuickFindOpen] = useState(false)

  return (
    <div className="grid gap-4">
      <Card as="section" size="md" variant="filled">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Crafting</p>
            <h2 className="text-lg font-medium text-neutral-50">Selected item</h2>
          </div>
          <div className="relative">
            <button
              className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 hover:border-orange-300/60 hover:text-orange-100"
              type="button"
              onClick={() => setQuickFindOpen((current) => !current)}
              aria-expanded={quickFindOpen}
            >
              Quick find item
            </button>
            {quickFindOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-[min(90vw,680px)] rounded-md border border-neutral-700 bg-neutral-950 p-3 shadow-2xl shadow-black/50">
                <label className="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-900 px-3 text-orange-300">
                  <span aria-hidden="true">⌕</span>
                  <input
                    autoFocus
                    className="w-full bg-transparent py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
                    value={itemLibrary.search}
                    onChange={(event) => itemLibrary.changeSearch(event.target.value)}
                    placeholder="Search by item name"
                  />
                </label>
                {itemLibrary.status === 'loading' ? (
                  <p className="mt-3 text-sm text-neutral-500">Loading items...</p>
                ) : !itemLibrary.search.trim() ? (
                  <p className="mt-3 text-sm text-neutral-500">Type an item name to see matching results.</p>
                ) : itemLibrary.items.filter((item) => item.rarity !== 'Legendary').length > 0 ? (
                  <div className="mt-3 max-h-80 overflow-auto rounded border border-neutral-800">
                    <table className="w-full min-w-[520px] border-collapse text-sm">
                      <thead className="sticky top-0 border-b border-neutral-800 bg-neutral-900 text-left text-[0.65rem] uppercase tracking-[0.12em] text-neutral-500">
                        <tr>
                          <th className="w-14 px-3 py-2 font-normal">Image</th>
                          <th className="px-3 py-2 font-normal">Name</th>
                          <th className="px-3 py-2 font-normal">Rarity</th>
                          <th className="px-3 py-2 font-normal">Type</th>
                          <th className="px-3 py-2 text-right font-normal">Required Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemLibrary.items
                          .filter((item) => item.rarity !== 'Legendary')
                          .map((item) => (
                            <tr
                              className="cursor-pointer border-b border-neutral-800/80 text-neutral-300 transition-colors last:border-b-0 hover:bg-neutral-800/70"
                              key={item.id}
                              onClick={() => {
                                setSelectedItem(item)
                                setPreviewItem(item)
                                setQuickFindOpen(false)
                              }}
                            >
                              <td className="px-3 py-2 align-middle">
                                <img className="block" src={item.image} alt="" />
                              </td>
                              <td className="px-3 py-2 font-medium text-neutral-100">
                                {item.qualityTag && <span className="text-neutral-400">{item.qualityTag} </span>}
                                {item.name}
                              </td>
                              <td
                                className={`px-3 py-2 ${rarityTextClasses[item.rarity.toLowerCase()] ?? 'text-neutral-400'}`}
                              >
                                {item.rarity}
                              </td>
                              <td className="px-3 py-2 text-neutral-500">{item.category}</td>
                              <td className="px-3 py-2 text-right tabular-nums text-neutral-400">
                                {Number(item.stats?.levelRequirement ?? item.level)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-neutral-500">No matching craftable items.</p>
                )}
              </div>
            )}
          </div>
        </div>
        {!selectedItem ? (
          <p className="text-sm text-neutral-500">Select an eligible item above to start crafting.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
            <ItemCard
              item={previewItem ?? selectedItem}
              itemSets={itemSets}
              equippedSetInfo={equippedSetInfo}
              activeSkillNames={activeSkillNames}
            />
            <div>
              <p className="mb-3 text-sm text-neutral-400">
                Choose valid affixes for this item. The preview updates as you work.
              </p>
              <CraftItemPanel
                item={selectedItem}
                onPreview={setPreviewItem}
                onCraft={(item) => {
                  onCraft(item)
                  setSelectedItem(item)
                  setPreviewItem(item)
                }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default CraftingView
