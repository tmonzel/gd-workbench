let items = []
const pageSize = 24
let pendingRequest = {
  page: 0,
  search: '',
  category: 'All',
  maxLevel: undefined,
  rarities: [],
  monsterInfrequentOnly: false,
  stats: [],
}
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
const matchesStat = (item, stat) => (item.attributes ?? []).some((attribute) => attribute.label === stat)

const matches = (item, search, category, maxLevel, rarities, monsterInfrequentOnly, stats) => {
  const haystack = `${item.qualityTag ?? ''} ${item.name} ${item.description} ${item.category}`.toLowerCase()
  const requiredLevel = Number(item.stats?.levelRequirement ?? item.level) || 0
  return (
    (!search || haystack.includes(search)) &&
    matchesCategory(item.category, category) &&
    (maxLevel == null || requiredLevel <= maxLevel) &&
    (!rarities.length || rarities.includes(normalizedRarity(item.rarity))) &&
    (!monsterInfrequentOnly || item.isMonsterInfrequent) &&
    (!stats.length || stats.every((stat) => matchesStat(item, stat)))
  )
}

const sendPage = (
  page,
  search = '',
  category = 'All',
  maxLevel = undefined,
  rarities = [],
  monsterInfrequentOnly = false,
  stats = [],
) => {
  const filtered = items.filter((item) => matches(item, search, category, maxLevel, rarities, monsterInfrequentOnly, stats))
  postMessage({
    type: 'page',
    page,
    pageSize,
    total: filtered.length,
    items: filtered.slice(page * pageSize, (page + 1) * pageSize),
  })
}

onmessage = (event) => {
  const {
    type,
    page = 0,
    search = '',
    category = 'All',
    maxLevel,
    rarities = [],
    monsterInfrequentOnly = false,
    stats = [],
    item,
  } = event.data
  if (type === 'load') {
    fetch('/data/items.json')
      .then((response) => response.json())
      .then((data) => {
        items = data
        postMessage({
          type: 'ready',
          total: items.length,
          categories: ['All', ...new Set(items.map((item) => item.category))],
          stats: [...new Set(items.flatMap((item) => (item.attributes ?? []).map((attribute) => attribute.label)))].sort(),
        })
        sendPage(
          pendingRequest.page,
          pendingRequest.search,
          pendingRequest.category,
          pendingRequest.maxLevel,
          pendingRequest.rarities,
          pendingRequest.monsterInfrequentOnly,
          pendingRequest.stats,
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
      pendingRequest.monsterInfrequentOnly,
      pendingRequest.stats,
    )
  }
  if (type === 'page') {
    pendingRequest = {
      page,
      search: search.trim().toLowerCase(),
      category,
      maxLevel,
      rarities,
      monsterInfrequentOnly,
      stats,
    }
    if (items.length)
      sendPage(
        pendingRequest.page,
        pendingRequest.search,
        pendingRequest.category,
        pendingRequest.maxLevel,
        pendingRequest.rarities,
        pendingRequest.monsterInfrequentOnly,
        pendingRequest.stats,
      )
  }
}
