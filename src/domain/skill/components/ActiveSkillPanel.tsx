import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/Card'

export type SkillEntry = {
  name: string
  level: number
  source: string
  stats: string[]
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
              {expanded && (
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
