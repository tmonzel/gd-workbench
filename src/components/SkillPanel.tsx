import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useState } from 'react'
import CollapsiblePanel from './CollapsiblePanel'

type SkillEntry = {
  name: string
  level: number
  source: string
  stats: string[]
  icon?: string
}

type SkillPanelProps = {
  skills: SkillEntry[]
}

function SkillPanel({ skills }: SkillPanelProps) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())

  const toggleSkill = (skillKey: string) => {
    setExpandedSkills((current) => {
      const next = new Set(current)
      if (next.has(skillKey)) next.delete(skillKey)
      else next.add(skillKey)
      return next
    })
  }

  return (
    <CollapsiblePanel eyebrow="Active" title="Skills">
      {skills.length === 0 ? (
        <p className="m-0 text-sm text-neutral-500">No item or allocated mastery skills are currently active.</p>
      ) : (
        <div className="grid gap-2">
          {skills.map((skill) => {
            const skillKey = `${skill.name}-${skill.source}`
            const expanded = expandedSkills.has(skillKey)
            return (
              <div
                className={`rounded-md border p-2 transition-colors ${
                  expanded
                    ? 'border-neutral-700 bg-neutral-900'
                    : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-900/70'
                }`}
                key={skillKey}
              >
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
              </div>
            )
          })}
        </div>
      )}
    </CollapsiblePanel>
  )
}

export default SkillPanel
