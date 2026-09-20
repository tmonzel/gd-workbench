import LevelProgressControl from '@/components/LevelProgressControl'
import { IconChevronDown } from '@tabler/icons-react'
import type { Mastery } from '@/domain/skill/types'

type HeaderProps = {
  level: number
  onLevelChange: (delta: number) => void
  masteries: Mastery[]
  mastery1?: string
  mastery2?: string
  combinedClassName?: string
  onMasteryChange: (slot: 'mastery1' | 'mastery2', value: string) => void
}

function Header({
  level,
  onLevelChange,
  masteries,
  mastery1,
  mastery2,
  combinedClassName,
  onMasteryChange,
}: HeaderProps) {
  return (
    <header>
      <div className="-mx-4 flex items-center justify-end  px-4 py-2 text-[0.68rem] text-neutral-600 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
        <span className="flex items-center gap-2">
          GD Workbench <span className="size-1 rounded-full bg-neutral-600" aria-hidden="true" /> Game Version 1.3.0.8
        </span>
      </div>
      <section className="flex items-end justify-between gap-6 py-5">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Hero class</p>
          <h1 className="text-4xl font-medium tracking-tight text-neutral-50">
            {combinedClassName ?? 'Choose a mastery'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {(['mastery1', 'mastery2'] as const).map((slot) => (
            <span className="relative" key={slot}>
              <select
                className="w-auto appearance-none rounded-md border border-neutral-700 bg-neutral-900 py-1.5 pl-2 pr-7 text-xs text-neutral-200 outline-none focus:border-orange-300 disabled:cursor-not-allowed disabled:border-neutral-900 disabled:bg-neutral-950 disabled:text-neutral-600"
                value={slot === 'mastery1' ? (mastery1 ?? '') : (mastery2 ?? '')}
                onChange={(event) => onMasteryChange(slot, event.target.value)}
                aria-label={slot === 'mastery1' ? 'First mastery' : 'Second mastery'}
                disabled={slot === 'mastery2' && !mastery1}
              >
                <option value="">{slot === 'mastery1' ? 'First mastery' : 'Second mastery'}</option>
                {masteries.map((mastery) => (
                  <option disabled={slot === 'mastery2' && mastery.id === mastery1} key={mastery.id} value={mastery.id}>
                    {mastery.name}
                  </option>
                ))}
              </select>
              <IconChevronDown
                className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-500"
                size={14}
                stroke={2}
                aria-hidden="true"
              />
            </span>
          ))}
        </div>
      </section>
      <LevelProgressControl level={level} onLevelChange={onLevelChange} />
    </header>
  )
}

export default Header
