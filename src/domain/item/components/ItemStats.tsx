import { parseSkillBonus } from '@/domain/item/item.utils'
import { getVisibleItemStats } from '@/domain/item/components/item-stats.utils'

type ItemStatsProps = {
  attributes?: Array<{ label: string; value: string | number }>
  stats?: Record<string, string | number>
  activeSkillNames?: Set<string>
}

function ItemStats({ attributes, stats, activeSkillNames }: ItemStatsProps) {
  const bonusStats = getVisibleItemStats(attributes, stats).filter(({ value }) => String(value).startsWith('+'))
  const regularBonusStats = bonusStats.filter(({ label }) => label !== 'Skill Bonus')
  const skillBonusStats = bonusStats.filter(({ label }) => label === 'Skill Bonus')

  return (
    (regularBonusStats.length > 0 || skillBonusStats.length > 0) && (
      <div className="mt-3">
        {[...regularBonusStats, ...skillBonusStats].map(({ label, value }, index) => {
          const skillBonus = label === 'Skill Bonus' ? parseSkillBonus(value) : null
          const inactive =
            skillBonus &&
            activeSkillNames &&
            (skillBonus.masteryWide
              ? !activeSkillNames.has(skillBonus.masteryName ?? '')
              : !activeSkillNames.has(skillBonus.name))
          return (
            <p
              className={`truncate text-[0.78rem] ${inactive ? 'text-neutral-600' : 'text-neutral-400'}`}
              key={`${label}-${value}-${index}`}
              title={inactive ? 'Not part of your currently selected masteries' : undefined}
            >
              <span className={inactive ? 'text-neutral-500' : 'text-white'}>{value}</span>
              {label !== 'Skill Bonus' && ` ${label}`}
            </p>
          )
        })}
      </div>
    )
  )
}

export default ItemStats
