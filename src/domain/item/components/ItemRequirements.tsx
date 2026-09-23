type ItemRequirementsProps = {
  stats?: Record<string, string | number>
  level: number
}

function ItemRequirements({ stats, level }: ItemRequirementsProps) {
  const requiredLevel = Number(stats?.levelRequirement ?? level)
  const requirements = [
    ['Physique', stats?.strengthRequirement],
    ['Cunning', stats?.dexterityRequirement],
    ['Spirit', stats?.intelligenceRequirement],
  ].filter(([, value]) => Number(value) > 0) as Array<[string, string | number]>

  return (
    <>
      <p className="m-0">
        Required Level: <strong>{requiredLevel}</strong>
      </p>
      {requirements.map(([label, value]) => (
        <p className="m-0" key={label}>
          Requires {label}: <strong>{value}</strong>
        </p>
      ))}
    </>
  )
}

export default ItemRequirements
