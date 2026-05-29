import YaoLine from './YaoLine'

interface HexagramDisplayProps {
  lines: (0 | 1)[]          // lines[0]=初爻(底), lines[5]=上爻(頂)
  changingPositions?: number[]
  size?: 'sm' | 'md' | 'lg'
}

const widths = { sm: 'w-24', md: 'w-36', lg: 'w-48' }
const gaps   = { sm: 'gap-2', md: 'gap-3', lg: 'gap-3.5' }

export default function HexagramDisplay({
  lines,
  changingPositions = [],
  size = 'md',
}: HexagramDisplayProps) {
  // 顯示順序：上爻(index 5) 在頂，初爻(index 0) 在底
  const displayOrder = [5, 4, 3, 2, 1, 0]

  return (
    <div className={`${widths[size]} ${gaps[size]} flex flex-col mx-auto`}>
      {displayOrder.map(i => (
        <YaoLine
          key={i}
          value={lines[i]}
          isChanging={changingPositions.includes(i)}
          size={size}
        />
      ))}
    </div>
  )
}
