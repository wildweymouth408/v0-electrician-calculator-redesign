import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are Sparky, an expert electrician with 20+ years of experience and deep knowledge of the NEC codebook. Answer electrical questions clearly and practically. Always cite the relevant NEC article number when applicable. Keep answers concise enough to read on a job site. Never guess — if you're unsure, say so.`,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ reply })
}
