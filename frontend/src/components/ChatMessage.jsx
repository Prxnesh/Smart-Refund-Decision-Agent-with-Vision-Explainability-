import { Bot, User } from 'lucide-react'

function renderContent(text) {
  // Bold: **text**  →  <strong>
  // Italic: _text_  →  <em>
  // Line breaks
  return text
    .split('\n')
    .map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*|_[^_]+_)/g)
      return (
        <span key={i}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>
            }
            if (part.startsWith('_') && part.endsWith('_')) {
              return <em key={j} className="text-slate-400">{part.slice(1, -1)}</em>
            }
            return part
          })}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
}

export default function ChatMessage({ role, content }) {
  const isBot = role === 'bot'
  return (
    <div className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'} mb-3 animate-fade-in`}>
      {isBot && (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900">
          <Bot className="h-3.5 w-3.5 text-white" />
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isBot
            ? 'rounded-tl-sm border border-slate-200 bg-white text-slate-700 shadow-sm'
            : 'rounded-tr-sm bg-slate-900 text-white'
        }`}
      >
        {content ? renderContent(content) : <span className="animate-pulse text-slate-300">▍</span>}
      </div>
      {!isBot && (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200">
          <User className="h-3.5 w-3.5 text-slate-600" />
        </span>
      )}
    </div>
  )
}
