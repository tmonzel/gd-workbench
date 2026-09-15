type Item = {
  id: string
  name: string
  description: string
  category: string
  rarity: string
  level: number
  image?: string
  attributes?: Array<{ label: string; value: string | number }>
  stats?: Record<string, string | number>
}

const isPathValue = (value: string | number) =>
  typeof value === 'string' && (/[\\/]/.test(value) || /\.(dbr|tex|msh|arc|tpl|wav|mp3)$/i.test(value))

const hiddenStatLabels = new Set([
  'templateName',
  'artifactFormulaBitmapName',
  'artifactName',
  'baseTexture',
  'bitmap',
  'randomizerName',
  'actorHeight',
  'actorRadius',
  'allowTransparency',
  'cannotPickUp',
  'cannotPickUpMultiple',
  'castsShadows',
  'dexterityRequirement',
  'intelligenceRequirement',
  'forcedRelicCompletion',
  'artifactCreateQuantity',
  'itemLevel',
])

type ItemCardProps = {
  item: Item
}

function ItemCard({ item }: ItemCardProps) {
  const rarityClass = `rarity-${item.rarity.toLowerCase()}`
  const visibleStats = item.attributes?.length
    ? item.attributes.filter(({ label, value }) => !hiddenStatLabels.has(label) && !isPathValue(value))
    : Object.entries(item.stats ?? {})
        .filter(([label, value]) => !hiddenStatLabels.has(label) && !isPathValue(value))
        .slice(0, 8)
        .map(([label, value]) => ({ label, value }))
  const primaryStats = visibleStats.filter(({ value }) => !String(value).startsWith('+'))
  const bonusStats = visibleStats.filter(({ value }) => String(value).startsWith('+'))
  const typeLine =
    item.category.toLowerCase() === item.rarity.toLowerCase() ? item.category : `${item.rarity} ${item.category}`
  const requiredLevel = Number(item.stats?.levelRequirement ?? item.level)
  const itemLevel = Number(item.stats?.itemLevel ?? item.level)

  return (
    <article className={`item-card ${rarityClass}`}>
      <div className="item-header">
        <div className="item-art">
          <img
            src={item.image}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        </div>
        <div className="item-heading">
          <h3>{item.name}</h3>
          {item.description && <p className="item-lore">&ldquo;{item.description}&rdquo;</p>}
          <span className="item-category">{typeLine}</span>
          {primaryStats.length > 0 && (
            <div className="item-stats-primary">
              {primaryStats.map(({ label, value }) => (
                <p key={label}>
                  <strong>{value}</strong> {label}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      {bonusStats.length > 0 && (
        <div className="item-stats-bonus">
          {bonusStats.map(({ label, value }) => (
            <p key={label}>
              <strong>{value}</strong> {label}
            </p>
          ))}
        </div>
      )}
      <div className="item-requirements">
        <p>
          Required Level: <strong>{requiredLevel}</strong>
        </p>
        <p>
          Item Level: <strong>{itemLevel}</strong>
        </p>
      </div>
    </article>
  )
}

export default ItemCard
