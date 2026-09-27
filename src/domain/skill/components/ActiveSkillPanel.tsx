import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/Card'
import CollapsiblePanel from '@/components/CollapsiblePanel'
import { DAMAGE_COLORS } from '@/domain/skill/skill.utils'
import type { SkillDamageRow, SkillEntry } from '@/domain/skill/active-skills.utils'

type ActiveSkillPanelProps = {
  skills: SkillEntry[]
  onSkillToggle: (skillId: string, isProc: boolean) => void
  compact?: boolean
}

function ActiveSkillPanel({ skills, onSkillToggle, compact = false }: ActiveSkillPanelProps) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())
  const initializedExpansion = useRef(false)

  useEffect(() => {
    if (initializedExpansion.current || skills.length === 0) return
    setExpandedSkills(
      compact
        ? new Set()
        : new Set(skills.filter((skill) => skill.stats.length > 0).map((skill) => `${skill.name}-${skill.source}`)),
    )
    initializedExpansion.current = true
  }, [compact, skills])

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
  const renderSkillStat = (stat: string) => {
    const match = /^(.*?)([+-]?\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?%?)(.*)$/.exec(stat)
    if (!match) return <span>{stat}</span>
    return (
      <span>
        {match[1]}
        <strong className="text-neutral-200">{match[2]}</strong>
        <span className="text-neutral-500">{match[3]}</span>
      </span>
    )
  }

  if (compact) {
    return (
      <CollapsiblePanel eyebrow="Skills" title="Active skills">
        {skills.length === 0 ? (
          <p className="m-0 text-sm text-neutral-500">No active skills.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {skills.map((skill) => {
              const skillKey = `${skill.name}-${skill.source}`
              const expanded = expandedSkills.has(skillKey)
              const rankLabel =
                skill.allocatedLevel === undefined
                  ? String(skill.level)
                  : `${skill.allocatedLevel}${skill.bonusLevel ? ` +${skill.bonusLevel}` : ''}`
              return (
                <div className="border-b border-neutral-800 last:border-b-0" key={skillKey}>
                  <div className="flex items-center gap-2 px-1 py-1.5">
                    <button
                      className={`flex min-w-0 flex-1 items-center gap-2 text-left ${skill.isToggleable && !skill.enabled ? 'text-neutral-500' : 'text-neutral-200'}`}
                      type="button"
                      disabled={skill.stats.length === 0 && !(skill.damageRows?.length ?? 0)}
                      aria-expanded={expanded}
                      onClick={() => toggleSkill(skillKey)}
                    >
                      {skill.stats.length > 0 || (skill.damageRows?.length ?? 0) > 0 ? (
                        expanded ? <IconChevronUp size={14} stroke={2} aria-hidden="true" /> : <IconChevronDown size={14} stroke={2} aria-hidden="true" />
                      ) : <span className="size-3.5" />}
                      <span className="min-w-0 truncate text-xs">{skill.name}</span>
                      <span className="shrink-0 text-[0.65rem] tabular-nums text-neutral-500">{rankLabel}</span>
                    </button>
                    {skill.isToggleable && skill.toggleSkillId && (
                      <input
                        className="app-checkbox"
                        type="checkbox"
                        checked={skill.enabled ?? true}
                        onChange={() => onSkillToggle(skill.toggleSkillId!, skill.isProc ?? false)}
                        aria-label={`${skill.enabled ? 'Disable' : 'Enable'} ${skill.name}`}
                      />
                    )}
                  </div>
                  {expanded && skill.damageRows && skill.damageRows.length > 0 && (
                    <div className={`border-t border-neutral-800 px-1 py-2 ${skill.isToggleable && !skill.enabled ? 'opacity-40' : ''}`}>
                      {renderDamageTable(skill.damageRows)}
                    </div>
                  )}
                  {expanded && skill.stats.length > 0 && (
                    <div className={`grid gap-0.5 border-t border-neutral-800 px-1 py-2 text-xs text-neutral-400 ${skill.isToggleable && !skill.enabled ? 'opacity-40' : ''}`}>
                      {skill.stats.map((stat) => <span key={stat}>{renderSkillStat(stat)}</span>)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CollapsiblePanel>
    )
  }

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
          const rankLabel =
            skill.allocatedLevel === undefined
              ? String(skill.level)
              : `${skill.allocatedLevel}${skill.bonusLevel ? ` ${skill.bonusLevel > 0 ? '+' : ''}${skill.bonusLevel}` : ''}`
          return (
            <Card as="section" size="md" variant="filled" className="transition-colors" key={skillKey}>
              <div className="flex items-start gap-3">
                {skill.icon && <img className="shrink-0" src={skill.icon} alt="" />}
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <button
                    className={`min-w-0 flex-1 rounded text-left ${skill.stats.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                    type="button"
                    disabled={skill.stats.length === 0}
                    aria-expanded={expanded}
                    onClick={() => toggleSkill(skillKey)}
                  >
                    <span className={`block ${skill.isToggleable && !skill.enabled ? 'text-neutral-500' : 'text-neutral-200'}`}>
                      {skill.name} ({rankLabel})
                    </span>
                    <span className="block text-[0.68rem] text-neutral-600">{skill.source}</span>
                  </button>
                  {skill.isToggleable && skill.toggleSkillId && (
                    <input
                      className="app-checkbox mt-1"
                      type="checkbox"
                      checked={skill.enabled ?? true}
                      onChange={() => onSkillToggle(skill.toggleSkillId!, skill.isProc ?? false)}
                      aria-label={`${skill.enabled ? 'Disable' : 'Enable'} ${skill.name}`}
                      title={`${skill.enabled ? 'Disable' : 'Enable'} ${skill.name}`}
                    />
                  )}
                </div>
                {skill.stats.length > 0 && (
                  <button
                    className="shrink-0 rounded text-neutral-500 hover:text-neutral-300"
                    type="button"
                    aria-label={`${expanded ? 'Collapse' : 'Expand'} ${skill.name}`}
                    aria-expanded={expanded}
                    onClick={() => toggleSkill(skillKey)}
                  >
                    {expanded ? (
                      <IconChevronUp size={16} stroke={2} aria-hidden="true" />
                    ) : (
                      <IconChevronDown size={16} stroke={2} aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
              {expanded && skill.damageRows && skill.damageRows.length > 0 && (
                <div
                  className={`mt-2 border-t border-neutral-800 px-1 pt-2 ${skill.isToggleable && !skill.enabled ? 'opacity-40' : ''}`}
                >
                  {renderDamageTable(skill.damageRows)}
                </div>
              )}
              {expanded && skill.stats.length > 0 && (
                <div
                  className={`mt-2 grid gap-0.5 border-t border-neutral-800 px-1 pt-2 text-xs text-neutral-400 ${skill.isToggleable && !skill.enabled ? 'opacity-40' : ''}`}
                >
                  {skill.stats.map((stat) => (
                    <span key={stat}>{renderSkillStat(stat)}</span>
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
