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
])

type ItemCardProps = {
  item: Item
}

function ItemCard({ item }: ItemCardProps) {
  const rarityClass = `rarity-${item.rarity.toLowerCase()}`
  const visibleStats = item.attributes?.length
    ? item.attributes
    : Object.entries(item.stats ?? {})
        .filter(([label, value]) => !hiddenStatLabels.has(label) && !isPathValue(value))
        .slice(0, 8)
        .map(([label, value]) => ({ label, value }))

  return (
    <article className={`item-card ${rarityClass}`}>
      <div className="item-art">
        <img
          src={item.image}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
        <small>LVL {item.level}</small>
      </div>
      <div className="item-body">
        <div className="item-title">
          <h3>{item.name}</h3>
          <span className="item-category">{item.category}</span>
        </div>
        {/* <span className="rarity-text">{item.rarity}</span> */}
        {item.description && <p>{item.description}</p>}
        <dl>
          {visibleStats.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  )
}

export default ItemCard
