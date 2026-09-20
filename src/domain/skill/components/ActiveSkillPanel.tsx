import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/Card'
import { DAMAGE_COLORS } from '@/domain/skill/skill.utils'

export type SkillDamageRow = {
  type: string
  label: string
  min: number
  max: number
  percent: number
  totalMin: number
  totalMax: number
}

export type SkillEntry = {
  name: string
  level: number
  source: string
  stats: string[]
  damageRows?: SkillDamageRow[]
  icon?: string
}

type ActiveSkillPanelProps = {
  skills: SkillEntry[]
}

function ActiveSkillPanel({ skills }: ActiveSkillPanelProps) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())
  const initializedExpansion = useRef(false)

  useEffect(() => {
    if (initializedExpansion.current || skills.length === 0) return
    setExpandedSkills(
      new Set(skills.filter((skill) => skill.stats.length > 0).map((skill) => `${skill.name}-${skill.source}`)),
    )
    initializedExpansion.current = true
  }, [skills])

  const toggleSkill = (skillKey: string) => {
    setExpandedSkills((current) => {
      const next = new Set(current)
      if (next.has(skillKey)) next.delete(skillKey)
      else next.add(skillKey)
      return next
    })
  }

  const formatRange = (min: number, max: number) => {
    const roundedMin = Math.round(min * 10) / 10
    const roundedMax = Math.round(max * 10) / 10
    if (roundedMin === 0) return `${roundedMax}`
    if (roundedMax === 0) return `${roundedMin}`
    return roundedMin === roundedMax ? `${roundedMin}` : `${roundedMin}-${roundedMax}`
  }

  const renderDamageTable = (rows: SkillDamageRow[]) => (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="text-[0.62rem] uppercase tracking-[0.08em] text-neutral-600">
          <th className="pb-1.5 text-left font-normal">Type</th>
          <th className="pb-1.5 text-right font-normal">Base</th>
          <th className="pb-1.5 pl-2 text-right font-normal">Modifier</th>
          <th className="pb-1.5 pl-2 text-right font-normal">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr className="border-b border-neutral-800 last:border-b-0" key={`${row.type}-${row.label}`}>
            <td className="py-1.5 pr-2">
              <span className="flex items-center gap-2 text-neutral-300">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: DAMAGE_COLORS[row.type] ?? '#a3a3a3' }}
                />
                {row.label}
              </span>
            </td>
            <td className="py-1.5 text-right tabular-nums text-neutral-400">{formatRange(row.min, row.max)}</td>
            <td className="py-1.5 pl-2 text-right tabular-nums text-neutral-500">
              {row.percent ? `+${Math.round(row.percent * 10) / 10}%` : '—'}
            </td>
            <td className="py-1.5 pl-2 text-right tabular-nums text-neutral-100">
              <strong>{row.totalMin || row.totalMax ? formatRange(row.totalMin, row.totalMax) : '—'}</strong>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <div className="grid gap-3">
      {skills.length === 0 ? (
        <Card as="section" size="md" variant="filled">
          <p className="m-0 text-sm text-neutral-500">No item or allocated mastery skills are currently active.</p>
        </Card>
      ) : (
        skills.map((skill) => {
          const skillKey = `${skill.name}-${skill.source}`
          const expanded = expandedSkills.has(skillKey)
          return (
            <Card as="section" size="md" variant="filled" className="transition-colors" key={skillKey}>
              <button
                className={`flex w-full items-start gap-3 rounded text-left ${skill.stats.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                type="button"
                disabled={skill.stats.length === 0}
                aria-expanded={expanded}
                onClick={() => toggleSkill(skillKey)}
              >
                {skill.icon && <img className="shrink-0" src={skill.icon} alt="" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-neutral-200">
                    {skill.name} ({skill.level})
                  </span>
                  <span className="block text-[0.68rem] text-neutral-600">{skill.source}</span>
                </span>
                {skill.stats.length > 0 && (
                  <span className="shrink-0 text-neutral-500">
                    {expanded ? (
                      <IconChevronUp size={16} stroke={2} aria-hidden="true" />
                    ) : (
                      <IconChevronDown size={16} stroke={2} aria-hidden="true" />
                    )}
                  </span>
                )}
              </button>
              {expanded && skill.damageRows && skill.damageRows.length > 0 && (
                <div className="mt-2 border-t border-neutral-800 px-1 pt-2">{renderDamageTable(skill.damageRows)}</div>
              )}
              {expanded && skill.stats.length > 0 && (
                <div className="mt-2 grid gap-0.5 border-t border-neutral-800 px-1 pt-2 text-xs text-neutral-400">
                  {skill.stats.map((stat) => (
                    <span key={stat}>{stat}</span>
                  ))}
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}

export default ActiveSkillPanel
