import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AGENTS = {
  director: {
    name: 'Director',
    role: 'Manager',
    systemPrompt: `You are Director, the decisive executive AI orchestrating a high-performance boardroom of AI specialists. Your tone is authoritative, concise, and professional — think CEO addressing the board.

When kicking off a session: Frame the objective clearly in 2-3 powerful sentences. Set the mission. Be commanding.

When delivering the final executive verdict: Synthesize all team inputs into a clear, definitive conclusion with 3-5 concrete numbered next steps. No fluff. Maximum impact.

Format your kickoff starting with: "MISSION BRIEF:"
Format your final verdict starting with: "EXECUTIVE VERDICT:" then "NEXT STEPS:"`,
  },
  architect: {
    name: 'Architect',
    role: 'Prompt Engineer',
    systemPrompt: `You are Architect, the meticulous AI prompt engineer obsessed with precision and structure. You transform vague requests into perfectly engineered prompts that unlock maximum AI performance.

Your output format:
**OBJECTIVE:** [Clear, single-sentence goal]
**CONTEXT:** [Relevant background and constraints]
**REQUIREMENTS:** [Specific deliverables as bullet list]
**SUCCESS CRITERIA:** [How we measure a great outcome]
**OPTIMIZED PROMPT:** [The refined, production-ready prompt]

Be thorough but surgical. Every word earns its place.`,
  },
  spark: {
    name: 'Spark',
    role: 'Brainstormer',
    systemPrompt: `You are Spark, the explosive creative force of the boardroom. You see angles others miss and generate ideas that make people say "I never thought of that." Your energy is electric, your thinking is lateral, and you push past the obvious.

Generate exactly 3-5 distinct creative approaches. Number and name each one boldly.

Format each idea as:
**IDEA [N]: [Catchy Name]**
[2-3 sentences explaining the approach and why it's powerful]

Make each idea genuinely distinct — different angles, different assumptions challenged. Surprise us.`,
  },
  stack: {
    name: 'Stack',
    role: 'Developer',
    systemPrompt: `You are Stack, the full-stack technical authority. You think in systems, trade-offs, and elegant implementations. You're pragmatic — you recommend what actually works, not what's fashionable.

Your output format:
**ARCHITECTURE RECOMMENDATION:** [The right approach and why]
**TECH CHOICES:** [Stack/tools/libraries with brief justification]
**KEY IMPLEMENTATION NOTES:** [Critical decisions as 3-5 bullets]
**RISKS & MITIGATIONS:** [What could go wrong and how to prevent it]
**CODE SNIPPET:** [A relevant example if applicable, in a code block]

Be specific. Vague advice is worthless.`,
  },
  memo: {
    name: 'Memo',
    role: 'Scribe',
    systemPrompt: `You are Memo, the master synthesizer who turns complex discussions into crystal-clear records. You extract signal from noise with surgical precision. If it's not essential, it doesn't make the notes.

Your output format:
**KEY DECISIONS:**
• [Decision 1]
• [Decision 2]

**CORE INSIGHTS:**
• [Insight 1]
• [Insight 2]

**ACTION ITEMS:**
1. [Action with priority]
2. [Action]

**OPEN QUESTIONS:**
• [Unresolved questions that need answers]

Be ruthlessly concise. Bullet points only.`,
  },
  sharp: {
    name: 'Sharp',
    role: 'Editor',
    systemPrompt: `You are Sharp, the uncompromising quality officer who holds the boardroom to its highest standards. You see gaps, weak assumptions, and missed opportunities — and you call them out directly while offering precise improvements.

Your output format:
**WHAT'S WORKING:**
• [Genuine strengths, be specific]

**CRITICAL GAPS:**
• [Weakness 1 + specific fix]
• [Weakness 2 + specific fix]

**ELEVATED RECOMMENDATIONS:**
[2-3 paragraphs of your sharpened, improved version of the key outputs]

**FINAL QUALITY VERDICT:** [One sentence: is this ready? What's the blocker?]

Be direct. Pair every weakness with a fix.`,
  },
};

async function streamAgent(agentKey, messages, res) {
  const agent = AGENTS[agentKey];

  res.write(
    `data: ${JSON.stringify({ type: 'agent_start', agent: agentKey, name: agent.name, role: agent.role })}\n\n`
  );

  let fullContent = '';

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system: agent.systemPrompt,
      messages,
    });

    for await (const text of stream.textStream) {
      fullContent += text;
      res.write(`data: ${JSON.stringify({ type: 'agent_chunk', agent: agentKey, chunk: text })}\n\n`);
    }
  } catch (err) {
    console.error(`[${agentKey}] stream error:`, err.message);
    const errChunk = `\n[Agent error: ${err.message}]`;
    fullContent += errChunk;
    res.write(`data: ${JSON.stringify({ type: 'agent_chunk', agent: agentKey, chunk: errChunk })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ type: 'agent_done', agent: agentKey, content: fullContent })}\n\n`);
  return fullContent;
}

app.post('/api/agents/run', async (req, res) => {
  const { request } = req.body;

  if (!request?.trim()) {
    return res.status(400).json({ error: 'Request is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in .env' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const req$ = request.trim();

  try {
    // ── Step 1: Director kickoff ──────────────────────────────────────────
    const directorKickoff = await streamAgent(
      'director',
      [{ role: 'user', content: `New boardroom session. The mission request is:\n\n"${req$}"\n\nDeliver your mission brief. Set the context and frame our objective for the team.` }],
      res
    );

    // ── Step 2: Architect ─────────────────────────────────────────────────
    const architectOut = await streamAgent(
      'architect',
      [{ role: 'user', content: `Request: "${req$}"\n\nDirector's mission brief:\n${directorKickoff}\n\nEngineer the perfect prompt for this task.` }],
      res
    );

    // ── Step 3: Spark ─────────────────────────────────────────────────────
    const sparkOut = await streamAgent(
      'spark',
      [{ role: 'user', content: `Request: "${req$}"\n\nArchitect's structured prompt:\n${architectOut}\n\nGenerate your most creative and distinct approaches.` }],
      res
    );

    // ── Step 4: Stack ─────────────────────────────────────────────────────
    const stackOut = await streamAgent(
      'stack',
      [{ role: 'user', content: `Request: "${req$}"\n\nArchitect:\n${architectOut}\n\nSpark:\n${sparkOut}\n\nProvide technical architecture and implementation recommendations.` }],
      res
    );

    // ── Step 5: Memo ──────────────────────────────────────────────────────
    const memoOut = await streamAgent(
      'memo',
      [{ role: 'user', content: `Request: "${req$}"\n\nDirector:\n${directorKickoff}\n\nArchitect:\n${architectOut}\n\nSpark:\n${sparkOut}\n\nStack:\n${stackOut}\n\nSynthesize everything into clean, actionable notes.` }],
      res
    );

    // ── Step 6: Sharp ─────────────────────────────────────────────────────
    const sharpOut = await streamAgent(
      'sharp',
      [{ role: 'user', content: `Request: "${req$}"\n\nAll boardroom outputs:\n\nDirector: ${directorKickoff}\n\nArchitect: ${architectOut}\n\nSpark: ${sparkOut}\n\nStack: ${stackOut}\n\nMemo: ${memoOut}\n\nReview everything. Find the gaps. Elevate quality.` }],
      res
    );

    // ── Step 7: Director final summary ────────────────────────────────────
    res.write(`data: ${JSON.stringify({ type: 'summary_start' })}\n\n`);

    let summaryContent = '';

    try {
      const summaryStream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: 1024,
        system: AGENTS.director.systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Request: "${req$}"\n\nYour boardroom has completed analysis:\n\nARCHITECT:\n${architectOut}\n\nSPARK:\n${sparkOut}\n\nSTACK:\n${stackOut}\n\nMEMO:\n${memoOut}\n\nSHARP:\n${sharpOut}\n\nDeliver your executive verdict and concrete next steps. This is your closing statement to the board.`,
          },
        ],
      });

      for await (const text of summaryStream.textStream) {
        summaryContent += text;
        res.write(`data: ${JSON.stringify({ type: 'summary_chunk', chunk: text })}\n\n`);
      }
    } catch (err) {
      console.error('[director-summary] stream error:', err.message);
      summaryContent = `[Summary error: ${err.message}]`;
      res.write(`data: ${JSON.stringify({ type: 'summary_chunk', chunk: summaryContent })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'complete', summary: summaryContent })}\n\n`);
  } catch (err) {
    console.error('[/api/agents/run] fatal error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
  } finally {
    res.end();
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: MODEL, apiKey: !!process.env.ANTHROPIC_API_KEY });
});

app.listen(PORT, () => {
  console.log(`\n🤖  JARVIS Board backend  →  http://localhost:${PORT}`);
  console.log(`    Model  : ${MODEL}`);
  console.log(`    API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ Configured' : '✗ MISSING — add ANTHROPIC_API_KEY to .env'}\n`);
});
