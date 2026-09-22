import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { useState } from 'react'

type ItemSideNavProps = {
  category: string
  onCategoryChange: (value: string) => void
  availableCategories?: Set<string>
}

export const CATEGORY_GROUPS: Record<string, string[]> = {
  Accessories: ['Medal', 'Amulet', 'Ring', 'Belt', 'Relic'],
  Armor: ['Chest Armor', 'Gloves', 'Pants', 'Boots', 'Helm', 'Shoulders'],
  Weapon: ['Weapon', 'Off-Hand'],
  Other: [
    'Augment',
    'Component',
    'Consumable',
    'Blueprint',
    'Quest Item',
    'Potion Container',
    'Potion Modifier',
    'Lore Note',
  ],
}

const CATEGORY_LABELS: Record<string, string> = {
  Relic: 'Relics',
  Augment: 'Augments',
  Component: 'Components',
  Consumable: 'Consumables',
  Blueprint: 'Blueprints',
  'Quest Item': 'Quest Items',
  'Potion Container': 'Potion Containers',
  'Potion Modifier': 'Potion Modifiers',
  'Lore Note': 'Lore Notes',
  Medal: 'Medals',
  Amulet: 'Amulets',
  Ring: 'Rings',
  Belt: 'Belts',
  'Chest Armor': 'Chest Armors',
  Gloves: 'Gloves',
  Pants: 'Pants',
  Boots: 'Boots',
  Helm: 'Helms',
  Shoulders: 'Shoulders',
  Weapon: 'Weapons',
  'Off-Hand': 'Off-Hands',
}

function ItemSideNav({ category, onCategoryChange, availableCategories }: ItemSideNavProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(Object.keys(CATEGORY_GROUPS).map((group) => [group, true])),
  )
  const selectedGroup = Object.entries(CATEGORY_GROUPS).find(([, subcategories]) =>
    subcategories.includes(category),
  )?.[0]
  const activeTopCategory = selectedGroup ?? category

  const visibleGroups = Object.entries(CATEGORY_GROUPS).filter(
    ([, subcategories]) =>
      !availableCategories || subcategories.some((subcategory) => availableCategories.has(subcategory)),
  )

  return (
    <nav
      className="self-start border-b border-neutral-800 pb-4 lg:sticky lg:top-4 lg:border-b-0 lg:border-r lg:pr-5"
      aria-label="Item categories"
    >
      <button
        className={`mb-4 w-full rounded border px-3 py-2 text-left text-xs font-medium transition-colors ${
          category === 'All'
            ? 'border-neutral-500 bg-neutral-600 text-white'
            : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800 hover:text-neutral-100'
        }`}
        type="button"
        onClick={() => onCategoryChange('All')}
      >
        All items
      </button>
      <div>
        {visibleGroups.map(([group, subcategories]) => (
          <section className="pt-4 first:pt-0" key={group}>
            <div className="mb-1 flex items-center gap-1">
              <button
                className={`min-w-0 flex-1 border-l-2 px-2 py-1 text-left uppercase transition-colors ${
                  activeTopCategory === group
                    ? 'border-orange-300 text-orange-200'
                    : 'border-transparent text-neutral-300 hover:border-neutral-600 hover:text-neutral-200'
                }`}
                type="button"
                style={{ fontSize: '0.75rem', lineHeight: '0.9rem', fontWeight: 500, letterSpacing: '0.15em' }}
                onClick={() => onCategoryChange(group)}
              >
                {group}
              </button>
              <button
                className="flex size-6 shrink-0 items-center justify-center rounded text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
                type="button"
                aria-label={`${openGroups[group] ? 'Collapse' : 'Expand'} ${group}`}
                aria-expanded={openGroups[group]}
                onClick={() => setOpenGroups((current) => ({ ...current, [group]: !current[group] }))}
              >
                {openGroups[group] ? (
                  <IconChevronDown size={15} stroke={2} />
                ) : (
                  <IconChevronRight size={15} stroke={2} />
                )}
              </button>
            </div>
            {openGroups[group] && (
              <div className="grid gap-0.5 pl-3 text-sm">
                {subcategories
                  .filter((name) => !availableCategories || availableCategories.has(name))
                  .map((name) => (
                    <button
                      className={`rounded px-2 py-1 text-left transition-colors ${
                        category === name
                          ? 'bg-neutral-800 text-neutral-100'
                          : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300'
                      }`}
                      key={name}
                      type="button"
                      onClick={() => onCategoryChange(name)}
                    >
                      {CATEGORY_LABELS[name] ?? name}
                    </button>
                  ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </nav>
  )
}

export default ItemSideNav
