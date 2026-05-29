import { getTrigramInfo } from '@/lib/trigram'

interface TrigramBadgesProps {
  upper: string
  lower: string
  size?: 'sm' | 'md'
}

export default function TrigramBadges({ upper, lower, size = 'md' }: TrigramBadgesProps) {
  const u = getTrigramInfo(upper)
  const l = getTrigramInfo(lower)
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className={`flex items-center justify-center gap-1 ${textSize} text-inkDark/50`}>
      <span>{u?.symbol} {upper}・{u?.nature}</span>
      <span className="mx-1.5 text-inkDark/20">｜</span>
      <span>{l?.symbol} {lower}・{l?.nature}</span>
    </div>
  )
}
