import { useState } from 'react'
import { IconSparkles } from '@tabler/icons-react'

type SkillIconProps = {
  src?: string
  label: string
  className?: string
}

function SkillIcon({ src, label, className = 'size-6' }: SkillIconProps) {
  const [failedSrc, setFailedSrc] = useState<string>()
  const showImage = Boolean(src && failedSrc !== src)

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded border border-neutral-700 bg-neutral-900 text-neutral-500 ${className}`}
      role="img"
      aria-label={`${label} skill icon`}
    >
      {showImage ? (
        <img className="max-h-full max-w-full object-contain" src={src} alt="" onError={() => setFailedSrc(src)} />
      ) : (
        <IconSparkles className="size-4" stroke={1.6} aria-hidden="true" />
      )}
    </span>
  )
}

export default SkillIcon
