'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Zap } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AskSparkyTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "What's your electrical question? I know the NEC inside and out and I'll give you a straight answer.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMessage: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ask-sparky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      const data = await response.json()
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Check your connection and try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Messages */}
      <div className="flex flex-col gap-3 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#ff6b00] mt-1">
                <Zap className="h-3.5 w-3.5 text-[#0f1115]" />
              </div>
            )}
            <div
              className={`max-w-[82%] px-3 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1a1f2e] text-[#f0f0f0] border border-[#333]'
                  : 'bg-[#111] text-[#e0e0e0] border border-[#2a2a2a]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#ff6b00] mt-1">
              <Zap className="h-3.5 w-3.5 text-[#0f1115]" />
            </div>
            <div className="bg-[#111] border border-[#2a2a2a] px-3 py-2.5">
              <div className="flex gap-1 items-center h-5">
                <span className="w-1.5 h-1.5 bg-[#ff6b00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#ff6b00] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#ff6b00] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input - fixed at bottom */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-[#333] bg-[#0f1115] px-4 py-3">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask an electrical question..."
            className="flex-1 h-11 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-[#ff6b00] focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center bg-[#ff6b00] text-[#0f1115] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
