import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic()

function buildSystemPrompt(profile: {
  name?: string
  role?: string
  years_exp?: number
} | null): string {
  if (!profile) {
    return `You are Sparky, an expert electrician with 20+ years of experience and deep knowledge of the NEC codebook. Answer electrical questions clearly and practically. Always cite the relevant NEC article number when applicable. Keep answers concise enough to read on a job site. Never guess — if you're unsure, say so.`
  }

  const name = profile.name || 'there'
  const yearsExp = profile.years_exp ?? 0

  // Normalize role — handles both "Journeyman" and "journeyman" and "journeyman_electrician" etc.
  const rawRole = (profile.role || '').toLowerCase().replace(/\s+/g, '_')

  let roleLabel = 'electrician'
  let roleGuidance = ''

  if (rawRole.includes('master')) {
    roleLabel = 'Master Electrician'
    roleGuidance = `${name} is a Master Electrician with ${yearsExp} year(s) of experience. Skip basics entirely. Get straight to code interpretation, design decisions, load calc nuance, AHJ variance, and liability considerations. Peer-to-peer tone. Cite NEC sections directly including exceptions and fine print notes.`
  } else if (rawRole.includes('journeyman') || rawRole.includes('journey')) {
    roleLabel = 'Journeyman Electrician'
    roleGuidance = `${name} is a Journeyman with ${yearsExp} year(s) of experience. Get to the answer quickly. Cite NEC article numbers directly. Note exceptions and edge cases. They understand derating, conduit fill, and load calcs — no need to explain basics unless asked.`
  } else if (rawRole.includes('apprentice_4') || rawRole.includes('4th') || rawRole.includes('fourth')) {
    roleLabel = '4th Year Apprentice'
    roleGuidance = `${name} is a 4th year apprentice with ${yearsExp} year(s) of experience. Near journeyman level. Discuss inspection logic, code exceptions, and design intent. Challenge them to think through the why behind the code. NEC article numbers are fine.`
  } else if (rawRole.includes('apprentice_3') || rawRole.includes('3rd') || rawRole.includes('third')) {
    roleLabel = '3rd Year Apprentice'
    roleGuidance = `${name} is a 3rd year apprentice with ${yearsExp} year(s) of experience. They know conduit fill, wire sizing, and load calc basics. Connect code intent to field practice. Explain derating and exceptions step by step.`
  } else if (rawRole.includes('apprentice_2') || rawRole.includes('2nd') || rawRole.includes('second')) {
    roleLabel = '2nd Year Apprentice'
    roleGuidance = `${name} is a 2nd year apprentice with ${yearsExp} year(s) of experience. They know basics. Introduce NEC article numbers but explain the logic behind them. Walk through derating and conduit fill step by step.`
  } else if (rawRole.includes('apprentice') || rawRole.includes('1st') || rawRole.includes('first')) {
    roleLabel = 'Apprentice'
    roleGuidance = `${name} is an apprentice with ${yearsExp} year(s) of experience. Use simple language. Explain every term. Reference NEC articles by name not just number. Assume they're still building foundational knowledge — be encouraging and thorough.`
  } else {
    // Fallback — unknown role, use years_exp to guess level
    if (yearsExp >= 8) {
      roleGuidance = `${name} has ${yearsExp} year(s) of experience. Treat them as experienced — get to the answer, cite NEC directly, note edge cases.`
    } else if (yearsExp >= 3) {
      roleGuidance = `${name} has ${yearsExp} year(s) of experience. Intermediate level — explain code logic but don't over-explain basics.`
    } else {
      roleGuidance = `${name} has ${yearsExp} year(s) of experience. Keep explanations clear and thorough — they're still building their foundation.`
    }
  }

  return `You are Sparky, an expert electrician AI assistant embedded in a field app for working electricians.

${roleGuidance}

Always cite NEC 2023 article numbers when applicable. When unsure, say so and suggest they verify with their AHJ (Authority Having Jurisdiction). Keep answers practical and field-applicable. No fluff. If math is involved, show your work so they can learn the calculation.`
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json()

    // Create a Supabase client using the service role for server-side access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch user profile for dynamic system prompt
    let profile = null
    if (userId) {
      const { data } = await supabase
        .from('profiles')
        .select('name, role, years_exp')
        .eq('id', userId)
        .single()
      profile = data
    }

    // Build role-aware system prompt
    const systemPrompt = buildSystemPrompt(profile)

    // Call Claude
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save the latest user message + assistant reply to conversations table
    if (userId && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1]
      await supabase.from('conversations').insert([
        {
          user_id: userId,
          role: lastUserMessage.role,
          content: lastUserMessage.content,
        },
        {
          user_id: userId,
          role: 'assistant',
          content: reply,
        },
      ])
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Ask Sparky API error:', error)
    return NextResponse.json(
      { reply: 'Something went wrong on my end. Check your connection and try again.' },
      { status: 500 }
    )
  }
}
