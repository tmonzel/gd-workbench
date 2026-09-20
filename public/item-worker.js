let items = []
let setItemIds = new Set()
const pageSize = 24
let pendingRequest = { page: 0, search: '', category: 'All', maxLevel: undefined, onlySetItems: false, rarities: [] }
const categoryGroups = {
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

const matchesCategory = (itemCategory, category) =>
  category === 'All' || itemCategory === category || categoryGroups[category]?.includes(itemCategory)

const normalizedRarity = (rarity) => (rarity === 'Magical' ? 'Magic' : rarity)

const matches = (item, search, category, maxLevel, onlySetItems, rarities) => {
  const haystack = `${item.name} ${item.description} ${item.category}`.toLowerCase()
  const requiredLevel = Number(item.stats?.levelRequirement ?? item.level) || 0
  return (
    (!search || haystack.includes(search)) &&
    matchesCategory(item.category, category) &&
    (maxLevel == null || requiredLevel <= maxLevel) &&
    (!onlySetItems || setItemIds.has(item.id)) &&
    (!rarities.length || rarities.includes(normalizedRarity(item.rarity)))
  )
}

const sendPage = (page, search = '', category = 'All', maxLevel = undefined, onlySetItems = false, rarities = []) => {
  const filtered = items.filter((item) => matches(item, search, category, maxLevel, onlySetItems, rarities))
  postMessage({
    type: 'page',
    page,
    pageSize,
    total: filtered.length,
    items: filtered.slice(page * pageSize, (page + 1) * pageSize),
  })
}

onmessage = (event) => {
  const { type, page = 0, search = '', category = 'All', maxLevel, onlySetItems = false, rarities = [] } = event.data
  if (type === 'setIds') {
    setItemIds = new Set(event.data.ids)
  }
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
          pendingRequest.onlySetItems,
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
  if (type === 'page') {
    pendingRequest = { page, search: search.trim().toLowerCase(), category, maxLevel, onlySetItems, rarities }
    if (items.length)
      sendPage(
        pendingRequest.page,
        pendingRequest.search,
        pendingRequest.category,
        pendingRequest.maxLevel,
        pendingRequest.onlySetItems,
        pendingRequest.rarities,
      )
  }
}
