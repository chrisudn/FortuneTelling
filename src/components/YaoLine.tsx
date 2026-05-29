interface YaoLineProps {
  value: 0 | 1
  isChanging?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/* 線條粗細：sm=6px md=8px lg=10px */
const heights = { sm: 'h-1.5', md: 'h-2',   lg: 'h-2.5' }
const gaps    = { sm: 'gap-2', md: 'gap-3',  lg: 'gap-4'  }

export default function YaoLine({ value, isChanging = false, size = 'md' }: YaoLineProps) {
  const h = heights[size]
  const g = gaps[size]
  const color = isChanging ? 'bg-vermilion' : 'bg-inkDark'

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1">
        {value === 1 ? (
          /* 陽爻：實線 */
          <div className={`w-full ${h} ${color} rounded-full`} />
        ) : (
          /* 陰爻：斷線 */
          <div className={`w-full flex ${g}`}>
            <div className={`flex-1 ${h} ${color} rounded-full`} />
            <div className={`flex-1 ${h} ${color} rounded-full`} />
          </div>
        )}
      </div>

      {/* 動爻標記 */}
      <div className="w-5 text-right flex-shrink-0">
        {isChanging && (
          <span className="text-vermilion font-bold leading-none text-base">×</span>
        )}
      </div>
    </div>
  )
}
