export type ItemStat = { label: string; value: string | number }

const isRollRangeValue = (value: string) => /^[+-]?\d+(\.\d+)?\/\d+(\.\d+)?%?$/.test(value)

const isPathValue = (value: string | number) =>
  typeof value === 'string' &&
  !isRollRangeValue(value) &&
  (/[\\/]/.test(value) || /\.(dbr|tex|msh|arc|tpl|wav|mp3)$/i.test(value))

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
  'strengthRequirement',
  'dexterityRequirement',
  'intelligenceRequirement',
  'forcedRelicCompletion',
  'artifactCreateQuantity',
  'itemLevel',
  'armorClassification',
  'Armor Classification',
])

export const getVisibleItemStats = (
  attributes?: ItemStat[],
  stats?: Record<string, string | number>,
): ItemStat[] => {
  const visibleStats = attributes?.length
    ? attributes.filter(({ label, value }) => !hiddenStatLabels.has(label) && !isPathValue(value))
    : Object.entries(stats ?? {})
        .filter(([label, value]) => !hiddenStatLabels.has(label) && !isPathValue(value))
        .slice(0, 8)
        .map(([label, value]) => ({ label, value }))
  return [...visibleStats].sort((left, right) => {
    const leftSkill = left.label === 'Skill Bonus' ? 1 : 0
    const rightSkill = right.label === 'Skill Bonus' ? 1 : 0
    return leftSkill - rightSkill
  })
}
