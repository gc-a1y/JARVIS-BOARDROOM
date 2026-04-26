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
app.use(express.json({ limit: '2mb' }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Default agent definitions ────────────────────────────────────────────────
const DEFAULT_AGENTS = {
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

// ── Helpers ──────────────────────────────────────────────────────────────────
const PHONETIC = [
  'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT',
  'GOLF', 'HOTEL', 'INDIA', 'JULIET', 'KILO', 'LIMA',
  'MIKE', 'NOVEMBER', 'OSCAR', 'PAPA', 'QUEBEC', 'ROMEO',
];

function generateMissionId() {
  const num = Math.floor(Math.random() * 9000) + 1000;
  const code = PHONETIC[Math.floor(Math.random() * PHONETIC.length)];
  return `MSN-${num}-${code}`;
}

async function callAgent(systemPrompt, messages) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });
  return {
    content: response.content[0]?.text ?? '',
    usage: response.usage,
  };
}

function buildContextMessages(agentKey, request, prev) {
  const o = prev || {};
  switch (agentKey) {
    case 'director':
      return [{ role: 'user', content: `New boardroom session. The mission request is:\n\n"${request}"\n\nDeliver your mission brief. Set the context and frame our objective for the team.` }];
    case 'architect':
      return [{ role: 'user', content: `Request: "${request}"\n\nDirector's mission brief:\n${o.director || '(not available)'}\n\nEngineer the perfect prompt for this task.` }];
    case 'spark':
      return [{ role: 'user', content: `Request: "${request}"\n\nArchitect's structured prompt:\n${o.architect || '(not available)'}\n\nGenerate your most creative and distinct approaches.` }];
    case 'stack':
      return [{ role: 'user', content: `Request: "${request}"\n\nArchitect:\n${o.architect || '(not available)'}\n\nSpark:\n${o.spark || '(not available)'}\n\nProvide technical architecture and implementation recommendations.` }];
    case 'memo':
      return [{ role: 'user', content: `Request: "${request}"\n\nDirector:\n${o.director || ''}\n\nArchitect:\n${o.architect || ''}\n\nSpark:\n${o.spark || ''}\n\nStack:\n${o.stack || ''}\n\nSynthesize everything into clean, actionable notes.` }];
    case 'sharp':
      return [{ role: 'user', content: `Request: "${request}"\n\nAll boardroom outputs:\n\nDirector: ${o.director || ''}\n\nArchitect: ${o.architect || ''}\n\nSpark: ${o.spark || ''}\n\nStack: ${o.stack || ''}\n\nMemo: ${o.memo || ''}\n\nReview everything. Find the gaps. Elevate quality.` }];
    default:
      return [{ role: 'user', content: request }];
  }
}

// ── POST /api/agents/run ─────────────────────────────────────────────────────
app.post('/api/agents/run', async (req, res) => {
  const { request, customAgents } = req.body;

  if (!request?.trim()) {
    return res.status(400).json({ error: 'Request is required' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in .env' });
  }

  const req$ = request.trim();
  const missionId = generateMissionId();
  const agentOutputs = {};
  let totalInput = 0;
  let totalOutput = 0;

  const getPrompt = (key) =>
    customAgents?.[key]?.systemPrompt?.trim() || DEFAULT_AGENTS[key].systemPrompt;

  try {
    const SEQUENCE = ['director', 'architect', 'spark', 'stack', 'memo', 'sharp'];

    for (const key of SEQUENCE) {
      const messages = buildContextMessages(key, req$, agentOutputs);
      const { content, usage } = await callAgent(getPrompt(key), messages);
      agentOutputs[key] = content;
      totalInput  += usage.input_tokens;
      totalOutput += usage.output_tokens;
    }

    // Director final summary
    const summaryMessages = [
      {
        role: 'user',
        content: `Request: "${req$}"\n\nYour boardroom has completed analysis:\n\nARCHITECT:\n${agentOutputs.architect}\n\nSPARK:\n${agentOutputs.spark}\n\nSTACK:\n${agentOutputs.stack}\n\nMEMO:\n${agentOutputs.memo}\n\nSHARP:\n${agentOutputs.sharp}\n\nDeliver your executive verdict and concrete next steps. This is your closing statement to the board.`,
      },
    ];
    const { content: summary, usage: sumUsage } = await callAgent(getPrompt('director'), summaryMessages);
    totalInput  += sumUsage.input_tokens;
    totalOutput += sumUsage.output_tokens;

    res.json({
      missionId,
      agentOutputs,
      summary,
      totalTokens: { input: totalInput, output: totalOutput },
    });
  } catch (err) {
    console.error('[/api/agents/run]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/agents/single ──────────────────────────────────────────────────
app.post('/api/agents/single', async (req, res) => {
  const { agentKey, request, previousOutputs, customAgents } = req.body;

  if (!agentKey || !request?.trim()) {
    return res.status(400).json({ error: 'agentKey and request are required' });
  }
  if (!DEFAULT_AGENTS[agentKey]) {
    return res.status(400).json({ error: `Unknown agent: ${agentKey}` });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in .env' });
  }

  const getPrompt = (key) =>
    customAgents?.[key]?.systemPrompt?.trim() || DEFAULT_AGENTS[key].systemPrompt;

  try {
    const messages = buildContextMessages(agentKey, request.trim(), previousOutputs || {});
    const { content, usage } = await callAgent(getPrompt(agentKey), messages);
    res.json({ agentKey, content, tokens: usage });
  } catch (err) {
    console.error(`[/api/agents/single/${agentKey}]`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/health ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: MODEL, apiKey: !!process.env.ANTHROPIC_API_KEY });
});

app.listen(PORT, () => {
  console.log(`\n🤖  JARVIS Board backend  →  http://localhost:${PORT}`);
  console.log(`    Model  : ${MODEL}`);
  console.log(`    API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ Configured' : '✗ MISSING — add ANTHROPIC_API_KEY to .env'}\n`);
});
