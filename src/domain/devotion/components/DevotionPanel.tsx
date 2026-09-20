import type { Dispatch, SetStateAction } from 'react'
import { Card } from '@/components/Card'

// affinity colors follow the star/icon colors used in the in-game devotion map
const AFFINITY_COLORS: Record<string, { text: string; border: string; bg: string; dot: string }> = {
  Ascendant: { text: 'text-purple-300', border: 'border-purple-400/60', bg: 'bg-purple-400/10', dot: 'bg-purple-400' },
  Chaos: { text: 'text-rose-400', border: 'border-rose-500/60', bg: 'bg-rose-500/10', dot: 'bg-rose-500' },
  Eldritch: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/60',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  Order: { text: 'text-amber-400', border: 'border-amber-500/60', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  Primordial: { text: 'text-blue-400', border: 'border-blue-500/60', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  Other: { text: 'text-neutral-400', border: 'border-neutral-500/60', bg: 'bg-neutral-500/10', dot: 'bg-neutral-500' },
}
const affinityColor = (name: string) => AFFINITY_COLORS[name] ?? AFFINITY_COLORS.Other

type Devotion = {
  name: string
  description: string
  cost: number
  affinity: string
  requirements: Array<{ name?: string; amount: number }>
  grants: Array<{ name?: string; amount: number }>
  skills: Array<{
    id: string
    name: string
    description: string
    attributes: Array<{ label: string; value: string }>
  }>
}
type Data = { maxPoints: number; affinities: string[]; constellations: Devotion[] }
type Props = { data: Data; selected: string[]; setSelected: Dispatch<SetStateAction<string[]>> }

function DevotionPanel({ data, selected, setSelected }: Props) {
  const affinity = Object.fromEntries(data.affinities.map((name) => [name, 0]))
  for (const constellation of data.constellations)
    if (constellation.skills.every((skill) => selected.includes(skill.id)))
      for (const grant of constellation.grants) affinity[grant.name ?? ''] += grant.amount
  const points = selected.length
  const canEnter = (constellation: Devotion) =>
    constellation.requirements.every((req) => (affinity[req.name ?? ''] ?? 0) >= req.amount)
  // nodes unlock in order: a node can only be (de)selected if it's the current front/back of the chain
  const canToggleNode = (constellation: Devotion, index: number) => {
    const active = selected.includes(constellation.skills[index].id)
    if (active) return !selected.includes(constellation.skills[index + 1]?.id ?? '')
    const previousActive = index === 0 || selected.includes(constellation.skills[index - 1].id)
    return previousActive && canEnter(constellation) && points < data.maxPoints
  }
  const toggleNode = (constellation: Devotion, index: number) => {
    if (!canToggleNode(constellation, index)) return
    const node = constellation.skills[index]
    setSelected((current) =>
      current.includes(node.id) ? current.filter((id) => id !== node.id) : [...current, node.id],
    )
  }
  return (
    <Card as="section" size="lg" variant="elevated">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Devotions</p>
          <h2 className="text-xl font-medium text-neutral-50">Build your constellation path</h2>
        </div>
        <strong className="text-[#fcd34d]">
          {points} / {data.maxPoints} points
        </strong>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {data.affinities.map((name) => {
          const color = affinityColor(name)
          return (
            <span
              className={`rounded-md border ${color.border} bg-neutral-900 px-3 py-2 text-xs ${color.text}`}
              key={name}
            >
              {name} <strong>{affinity[name]}</strong>
            </span>
          )
        })}
      </div>
      <div className="grid gap-8">
        {[...data.affinities, 'Other']
          .filter((name) => data.constellations.some((constellation) => constellation.affinity === name))
          .map((name) => {
            const color = affinityColor(name)
            return (
              <div key={name}>
                <h3
                  className={`mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-widest ${color.text}`}
                >
                  <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                  {name}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.constellations
                    .filter((constellation) => constellation.affinity === name)
                    .map((constellation) => {
                      const selectedCount = constellation.skills.filter((skill) => selected.includes(skill.id)).length
                      const complete = selectedCount === constellation.skills.length
                      const entered = selectedCount > 0
                      const locked = !entered && !canEnter(constellation)
                      return (
                        <div
                          className={`grid gap-2 rounded-lg border p-4 ${complete ? `${color.border} ${color.bg}` : entered ? `${color.border} bg-neutral-900` : locked ? 'border-neutral-900 bg-neutral-950 opacity-45' : 'border-neutral-700 bg-neutral-900'}`}
                          key={constellation.name}
                        >
                          <strong className="text-sm text-neutral-100">{constellation.name}</strong>
                          <span className="text-xs text-neutral-500">
                            {selectedCount} / {constellation.skills.length} points
                          </span>
                          <span className="text-xs text-neutral-400">
                            Requires{' '}
                            {constellation.requirements.map((req) => `${req.amount} ${req.name}`).join(', ') ||
                              'nothing'}
                          </span>
                          <span className={`text-xs ${complete ? color.text : 'text-neutral-600'}`}>
                            Grants {constellation.grants.map((grant) => `${grant.amount} ${grant.name}`).join(', ')}
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {constellation.skills.map((skill, index) => {
                              const active = selected.includes(skill.id)
                              const available = canToggleNode(constellation, index)
                              return (
                                <div className="group relative" key={skill.id}>
                                  <button
                                    className={`h-6 w-6 rounded-full border text-[10px] font-semibold ${active ? `${color.border} ${color.dot} text-neutral-950` : available ? 'border-neutral-600 bg-neutral-800 text-neutral-300 hover:border-neutral-400' : 'cursor-not-allowed border-neutral-900 bg-neutral-950 text-neutral-700'}`}
                                    type="button"
                                    disabled={!available}
                                    onClick={() => toggleNode(constellation, index)}
                                  >
                                    {index + 1}
                                  </button>
                                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max max-w-55 -translate-x-1/2 rounded-md border border-neutral-700 bg-neutral-950 p-2 text-left shadow-xl group-hover:block">
                                    <strong className="block text-xs text-neutral-100">{skill.name}</strong>
                                    {skill.description && (
                                      <p className="mt-1 text-[11px] text-neutral-400">{skill.description}</p>
                                    )}
                                    {skill.attributes.length > 0 && (
                                      <ul className="mt-1 space-y-0.5">
                                        {skill.attributes.map((attribute) => (
                                          <li className="text-[11px] text-neutral-300" key={attribute.label}>
                                            {attribute.label}: {attribute.value}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })}
      </div>
    </Card>
  )
}
export default DevotionPanel
