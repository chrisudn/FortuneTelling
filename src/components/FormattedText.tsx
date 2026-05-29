interface FormattedTextProps {
  text: string
  className?: string
}

export default function FormattedText({ text, className }: FormattedTextProps) {
  const paragraphs = text.split('\n\n').filter(p => p.trim())

  return (
    <div className={className}>
      {paragraphs.map((para, i) => (
        <p key={i} className={i < paragraphs.length - 1 ? 'mb-3' : ''}>
          {para.split('\n').map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  )
}
