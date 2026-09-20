type ItemSideNavProps = {
  category: string
  onCategoryChange: (value: string) => void
}

export const CATEGORY_GROUPS: Record<string, string[]> = {
  Accessories: ['Medal', 'Amulet', 'Ring', 'Belt'],
  Armor: ['Chest Armor', 'Gloves', 'Pants', 'Boots', 'Helm', 'Shoulders'],
  Weapon: ['Weapon', 'Off-Hand'],
  Other: [
    'Relics',
    'Augments',
    'Components',
    'Consumables',
    'Blueprints',
    'Quest Items',
    'Potion Containers',
    'Potion Modifiers',
    'Lore Notes',
  ],
}

function ItemSideNav({ category, onCategoryChange }: ItemSideNavProps) {
  const selectedGroup = Object.entries(CATEGORY_GROUPS).find(([, subcategories]) =>
    subcategories.includes(category),
  )?.[0]
  const activeTopCategory = selectedGroup ?? category

  return (
    <nav className="border-b border-neutral-800 pb-4 lg:border-b-0 lg:border-r lg:pr-5" aria-label="Item categories">
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
        {Object.entries(CATEGORY_GROUPS).map(([group, subcategories]) => (
          <section className="pt-4 first:pt-0" key={group}>
            <button
              className={`mb-1 w-full border-l-2 px-2 py-1 text-left uppercase transition-colors ${
                activeTopCategory === group
                  ? 'border-orange-300 text-orange-200'
                  : 'border-transparent text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
              }`}
              type="button"
              style={{ fontSize: '0.75rem', lineHeight: '0.9rem', fontWeight: 500, letterSpacing: '0.15em' }}
              onClick={() => onCategoryChange(group)}
            >
              {group}
            </button>
            <div className="grid gap-0.5 pl-3 text-sm">
              {subcategories.map((name) => (
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
                  {name}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </nav>
  )
}

export default ItemSideNav
