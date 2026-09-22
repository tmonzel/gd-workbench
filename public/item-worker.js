let items = []
const pageSize = 24
let pendingRequest = { page: 0, search: '', category: 'All', maxLevel: undefined, rarities: [] }
const categoryGroups = {
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

const matchesCategory = (itemCategory, category) =>
  category === 'All' || itemCategory === category || categoryGroups[category]?.includes(itemCategory)

const normalizedRarity = (rarity) => (rarity === 'Magical' ? 'Magic' : rarity)

const matches = (item, search, category, maxLevel, rarities) => {
  const haystack = `${item.qualityTag ?? ''} ${item.name} ${item.description} ${item.category}`.toLowerCase()
  const requiredLevel = Number(item.stats?.levelRequirement ?? item.level) || 0
  return (
    (!search || haystack.includes(search)) &&
    matchesCategory(item.category, category) &&
    (maxLevel == null || requiredLevel <= maxLevel) &&
    (!rarities.length || rarities.includes(normalizedRarity(item.rarity)))
  )
}

const sendPage = (page, search = '', category = 'All', maxLevel = undefined, rarities = []) => {
  const filtered = items.filter((item) => matches(item, search, category, maxLevel, rarities))
  postMessage({
    type: 'page',
    page,
    pageSize,
    total: filtered.length,
    items: filtered.slice(page * pageSize, (page + 1) * pageSize),
  })
}

onmessage = (event) => {
  const { type, page = 0, search = '', category = 'All', maxLevel, rarities = [], item } = event.data
  if (type === 'load') {
    fetch('/data/items.json')
      .then((response) => response.json())
      .then((data) => {
        items = data
        postMessage({
          type: 'ready',
          total: items.length,
          categories: ['All', ...new Set(items.map((item) => item.category))],
        })
        sendPage(
          pendingRequest.page,
          pendingRequest.search,
          pendingRequest.category,
          pendingRequest.maxLevel,
          pendingRequest.rarities,
        )
      })
      .catch((error) =>
        postMessage({
          type: 'error',
          message: error instanceof Error ? error.message : String(error),
        }),
      )
  }
  if (type === 'addItem' && item) {
    items = [item, ...items.filter((existing) => existing.id !== item.id)]
    sendPage(
      pendingRequest.page,
      pendingRequest.search,
      pendingRequest.category,
      pendingRequest.maxLevel,
      pendingRequest.rarities,
    )
  }
  if (type === 'page') {
    pendingRequest = { page, search: search.trim().toLowerCase(), category, maxLevel, rarities }
    if (items.length)
      sendPage(
        pendingRequest.page,
        pendingRequest.search,
        pendingRequest.category,
        pendingRequest.maxLevel,
        pendingRequest.rarities,
      )
  }
}
