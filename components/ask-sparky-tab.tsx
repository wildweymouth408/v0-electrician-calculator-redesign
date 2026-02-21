'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Zap, Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    abort(): void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
    onstart: (() => void) | null
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
  }
  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult
    length: number
  }
  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative
    isFinal: boolean
  }
  interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
  }
  interface SpeechRecognitionErrorEvent extends Event {
    error: string
  }
}

export function AskSparkyTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "What's your electrical question? I know the NEC inside and out and I'll give you a straight answer. Tap the mic to speak, or type below.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const [speakEnabled, setSpeakEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // ── KEY FIX: store voices once they load ──────────────────────────────────
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) setVoiceSupported(true)

    if ('speechSynthesis' in window) {
      setSpeechSupported(true)

      // Load voices — they may already be ready or need the event
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices()
        if (v.length > 0) voicesRef.current = v
      }

      loadVoices() // try immediately
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices) // fires when ready

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      }
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, transcript])

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
    }

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = 0; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) final += text
        else interim += text
      }
      setTranscript(interim || final)
      if (final) setInput(prev => prev + (prev ? ' ' : '') + final)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      setTranscript('')
    }

    recognition.onend = () => {
      setIsListening(false)
      setTranscript('')
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setTranscript('')
  }, [])

  const toggleListening = () => {
    if (isListening) stopListening()
    else startListening()
  }

  // ── Voice Output — fixed ──────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!speechSupported || !speakEnabled) return
    window.speechSynthesis.cancel()

    const cleaned = text
      .replace(/\*\*/g, '')
      .replace(/#{1,3}\s/g, '')
      .substring(0, 500)

    const utterance = new SpeechSynthesisUtterance(cleaned)
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Use the pre-loaded voices from ref — not getVoices() inline
    const preferred = voicesRef.current.find(v =>
      v.lang.startsWith('en') &&
      (v.name.includes('Google') || v.name.includes('Samantha') ||
       v.name.includes('Alex') || v.name.includes('David'))
    )
    if (preferred) utterance.voice = preferred

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [speechSupported, speakEnabled])

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMessage: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    stopSpeaking()

    try {
      const response = await fetch('/api/ask-sparky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      const data = await response.json()
      const reply = data.reply || 'Something went wrong. Try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      if (speakEnabled) speak(reply)

    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Check your signal and try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5 text-[10px] text-[#555] uppercase tracking-wider">
          <Zap className="h-3 w-3 text-[#ff6b00]" />
          Ask Sparky AI
        </div>
        <div className="flex items-center gap-2">
          {speechSupported && (
            <button
              onClick={() => { setSpeakEnabled(v => !v); if (isSpeaking) stopSpeaking() }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[10px] uppercase tracking-wider font-bold transition-all ${
                speakEnabled
                  ? 'border-[#00d4ff] text-[#00d4ff] bg-[#00d4ff12]'
                  : 'border-[#333] text-[#555]'
              }`}
            >
              {isSpeaking
                ? <><Volume2 className="h-3 w-3 animate-pulse" /> Speaking...</>
                : speakEnabled
                  ? <><Volume2 className="h-3 w-3" /> Voice On</>
                  : <><VolumeX className="h-3 w-3" /> Voice Off</>
              }
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-4 flex-1 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#ff6b00] mt-1">
                <Zap className="h-3.5 w-3.5 text-[#0f1115]" />
              </div>
            )}
            <div className={`max-w-[82%] px-3 py-2.5 text-sm leading-relaxed relative group ${
              msg.role === 'user'
                ? 'bg-[#1a1f2e] text-[#f0f0f0] border border-[#333]'
                : 'bg-[#111] text-[#e0e0e0] border border-[#2a2a2a]'
            }`}>
              {msg.content}
              {msg.role === 'assistant' && speechSupported && speakEnabled && (
                <button
                  onClick={() => speak(msg.content)}
                  className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0f1115] border border-[#333] p-1"
                >
                  <Volume2 className="h-3 w-3 text-[#555]" />
                </button>
              )}
            </div>
          </div>
        ))}

        {isListening && transcript && (
          <div className="flex gap-2.5 flex-row-reverse">
            <div className="max-w-[82%] px-3 py-2.5 text-sm text-[#888] border border-dashed border-[#444] bg-[#111] italic">
              {transcript}...
            </div>
          </div>
        )}

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

      <div className="border-t border-[#222] pt-3">
        {isListening && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="flex gap-1">
              {[0,1,2,3].map(i => (
                <div key={i} className="w-1 bg-[#ff6b00] rounded-full animate-bounce"
                  style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
            <span className="text-[10px] text-[#ff6b00] uppercase tracking-wider font-bold">Listening...</span>
            <span className="text-[10px] text-[#555]">Tap mic to stop</span>
          </div>
        )}

        <div className="flex gap-2">
          {voiceSupported && (
            <button onClick={toggleListening} disabled={loading}
              className={`flex h-11 w-11 shrink-0 items-center justify-center border transition-all ${
                isListening
                  ? 'border-[#ff6b00] bg-[#ff6b0020] text-[#ff6b00] animate-pulse'
                  : 'border-[#333] text-[#555] hover:border-[#ff6b00] hover:text-[#ff6b00]'
              } disabled:opacity-40`}>
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}

          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : 'Ask an electrical question...'}
            className="flex-1 h-11 border border-[#333] bg-[#111] px-3 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-[#ff6b00] focus:outline-none"
            disabled={loading} />

          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center bg-[#ff6b00] text-[#0f1115] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[9px] text-[#444]">
            {voiceSupported ? '🎤 Tap mic to speak • Enter to send' : 'Enter to send'}
          </span>
          {isSpeaking && (
            <button onClick={stopSpeaking} className="text-[9px] text-[#00d4ff] uppercase tracking-wider">
              Stop speaking
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
