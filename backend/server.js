import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app  = express();
const PORT = process.env.PORT || 3001;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '4mb' }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Default agent definitions ────────────────────────────────────────────────
const DEFAULT_AGENTS = {
  director: {
    name: 'Director', role: 'Manager',
    systemPrompt: `You are Director, the decisive executive AI orchestrating a high-performance boardroom of AI specialists. Your tone is authoritative, concise, and professional — think CEO addressing the board.

When kicking off a session: Frame the objective clearly in 2-3 powerful sentences. Set the mission. Be commanding.

When delivering the final executive verdict: Synthesize all team inputs into a clear, definitive conclusion with 3-5 concrete numbered next steps. No fluff. Maximum impact.

Format your kickoff starting with: "MISSION BRIEF:"
Format your final verdict starting with: "EXECUTIVE VERDICT:" then "NEXT STEPS:"

IMPORTANT: Always end your FINAL EXECUTIVE VERDICT with this section formatted exactly as shown:

CLAUDE CODE PROMPT:
[Write a comprehensive, ready-to-use prompt a developer can paste directly into Claude Code. Include: the specific implementation task, full technical context, requirements from Architect, creative approaches from Spark, technical stack from Stack, key decisions from Memo, and quality criteria from Sharp. One cohesive, actionable prompt.]`,
  },
  architect: {
    name: 'Architect', role: 'Prompt Engineer',
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
    name: 'Spark', role: 'Brainstormer',
    systemPrompt: `You are Spark, the explosive creative force of the boardroom. You see angles others miss and generate ideas that make people say "I never thought of that." Your energy is electric, your thinking is lateral, and you push past the obvious.

Generate exactly 3-5 distinct creative approaches. Number and name each one boldly.

Format each idea as:
**IDEA [N]: [Catchy Name]**
[2-3 sentences explaining the approach and why it's powerful]

Make each idea genuinely distinct — different angles, different assumptions challenged. Surprise us.`,
  },
  stack: {
    name: 'Stack', role: 'Developer',
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
    name: 'Memo', role: 'Scribe',
    systemPrompt: `You are Memo, the master synthesizer who turns complex discussions into crystal-clear records. You extract signal from noise with surgical precision. If it's not essential, it doesn't make the notes.

Your output format:
**KEY DECISIONS:**
• [Decision 1]

**CORE INSIGHTS:**
• [Insight 1]

**ACTION ITEMS:**
1. [Action with priority]

**OPEN QUESTIONS:**
• [Unresolved questions that need answers]

Be ruthlessly concise. Bullet points only.`,
  },
  sharp: {
    name: 'Sharp', role: 'Editor',
    systemPrompt: `You are Sharp, the uncompromising quality officer who holds the boardroom to its highest standards. You see gaps, weak assumptions, and missed opportunities — and you call them out directly while offering precise improvements.

Your output format:
**WHAT'S WORKING:**
• [Genuine strengths, be specific]

**CRITICAL GAPS:**
• [Weakness 1 + specific fix]

**ELEVATED RECOMMENDATIONS:**
[2-3 paragraphs of your sharpened, improved version of the key outputs]

**FINAL QUALITY VERDICT:** [One sentence: is this ready? What's the blocker?]

Be direct. Pair every weakness with a fix.`,
  },
};

// ── Agency profile injection ──────────────────────────────────────────────────
function injectAgencyProfile(systemPrompt, profile) {
  if (!profile || !profile.enabled) return systemPrompt;
  const lines = ['=== AGENCY CONTEXT — always incorporate this in your responses ==='];
  if (profile.operatorName) lines.push(`You are working for: ${profile.operatorName}`);
  if (profile.agencyName)   lines.push(`Agency: ${profile.agencyName}`);
  if (profile.techStack)    lines.push(`Preferred tech stack: ${profile.techStack}`);
  if (profile.clients)      lines.push(`Current clients: ${profile.clients}`);
  if (profile.notes)        lines.push(`Additional context: ${profile.notes}`);
  lines.push('=== END AGENCY CONTEXT ===', '');
  return lines.join('\n') + systemPrompt;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const PHONETIC = [
  'ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT',
  'GOLF','HOTEL','INDIA','JULIET','KILO','LIMA',
  'MIKE','NOVEMBER','OSCAR','PAPA','QUEBEC','ROMEO',
];

function generateMissionId() {
  const num  = Math.floor(Math.random() * 9000) + 1000;
  const code = PHONETIC[Math.floor(Math.random() * PHONETIC.length)];
  return `MSN-${num}-${code}`;
}

async function callAgent(systemPrompt, messages, maxTokens = 1024) {
  const response = await anthropic.messages.create({
    model: MODEL, max_tokens: maxTokens, system: systemPrompt, messages,
  });
  return { content: response.content[0]?.text ?? '', usage: response.usage };
}

function buildContextMessages(agentKey, request, prev, followUpContext) {
  const o = prev || {};
  const followUpNote = followUpContext
    ? `\n\nPREVIOUS SESSION CONTEXT (for reference):\n${followUpContext}\n`
    : '';

  switch (agentKey) {
    case 'director':
      return [{ role: 'user', content: `New boardroom session.${followUpNote} The mission request is:\n\n"${request}"\n\nDeliver your mission brief. Set the context and frame our objective for the team.` }];
    case 'architect':
      return [{ role: 'user', content: `Request: "${request}"\n\nDirector's mission brief:\n${o.director || '(not available)'}\n\nEngineer the perfect prompt for this task.` }];
    case 'spark':
      return [{ role: 'user', content: `Request: "${request}"\n\nArchitect's structured prompt:\n${o.architect || '(not available)'}\n\nGenerate your most creative and distinct approaches.` }];
    case 'stack':
      return [{ role: 'user', content: `Request: "${request}"\n\nArchitect:\n${o.architect || '(not available)'}\n\nSpark:\n${o.spark || '(not available)'}\n\nProvide technical architecture and implementation recommendations.` }];
    case 'memo':
      return [{ role: 'user', content: `Request: "${request}"\n\nDirector:\n${o.director || ''}\nArchitect:\n${o.architect || ''}\nSpark:\n${o.spark || ''}\nStack:\n${o.stack || ''}\n\nSynthesize everything into clean, actionable notes.` }];
    case 'sharp':
      return [{ role: 'user', content: `Request: "${request}"\n\nDirector: ${o.director || ''}\nArchitect: ${o.architect || ''}\nSpark: ${o.spark || ''}\nStack: ${o.stack || ''}\nMemo: ${o.memo || ''}\n\nReview everything. Find the gaps. Elevate quality.` }];
    default:
      return [{ role: 'user', content: request }];
  }
}

// ── POST /api/agents/run ─────────────────────────────────────────────────────
app.post('/api/agents/run', async (req, res) => {
  const { request, customAgents, agencyProfile, followUpContext } = req.body;
  if (!request?.trim())               return res.status(400).json({ error: 'Request is required' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const req$     = request.trim();
  const missionId    = generateMissionId();
  const agentOutputs = {};
  let totalInput = 0, totalOutput = 0;

  const getPrompt = key => injectAgencyProfile(
    customAgents?.[key]?.systemPrompt?.trim() || DEFAULT_AGENTS[key].systemPrompt,
    agencyProfile,
  );

  try {
    for (const key of ['director','architect','spark','stack','memo','sharp']) {
      const messages = buildContextMessages(key, req$, agentOutputs, key === 'director' ? followUpContext : null);
      const { content, usage } = await callAgent(getPrompt(key), messages);
      agentOutputs[key] = content;
      totalInput  += usage.input_tokens;
      totalOutput += usage.output_tokens;
    }

    const summaryMessages = [{
      role: 'user',
      content: `Request: "${req$}"\n\nBoardroom analysis:\n\nARCHITECT:\n${agentOutputs.architect}\n\nSPARK:\n${agentOutputs.spark}\n\nSTACK:\n${agentOutputs.stack}\n\nMEMO:\n${agentOutputs.memo}\n\nSHARP:\n${agentOutputs.sharp}\n\nDeliver your executive verdict and concrete next steps. This is your closing statement to the board.`,
    }];
    const { content: summary, usage: sumUsage } = await callAgent(getPrompt('director'), summaryMessages, 4000);
    totalInput  += sumUsage.input_tokens;
    totalOutput += sumUsage.output_tokens;

    res.json({ missionId, agentOutputs, summary, totalTokens: { input: totalInput, output: totalOutput } });
  } catch (err) {
    console.error('[/api/agents/run]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/agents/single ──────────────────────────────────────────────────
app.post('/api/agents/single', async (req, res) => {
  const { agentKey, request, previousOutputs, customAgents, agencyProfile } = req.body;
  if (!agentKey || !request?.trim())  return res.status(400).json({ error: 'agentKey and request are required' });
  if (!DEFAULT_AGENTS[agentKey])      return res.status(400).json({ error: `Unknown agent: ${agentKey}` });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const getPrompt = key => injectAgencyProfile(
    customAgents?.[key]?.systemPrompt?.trim() || DEFAULT_AGENTS[key].systemPrompt,
    agencyProfile,
  );

  try {
    const messages    = buildContextMessages(agentKey, request.trim(), previousOutputs || {});
    const agentMax    = agentKey === 'director' ? 4000 : 1024;
    const { content, usage } = await callAgent(getPrompt(agentKey), messages, agentMax);
    res.json({ agentKey, content, tokens: usage });
  } catch (err) {
    console.error(`[/api/agents/single/${agentKey}]`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/agents/project-plan ────────────────────────────────────────────
app.post('/api/agents/project-plan', async (req, res) => {
  const { summary, request, agencyProfile } = req.body;
  if (!summary) return res.status(400).json({ error: 'summary is required' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const systemPrompt = injectAgencyProfile(
    `You are a precise project manager. Convert the executive summary into a structured action plan.

Output ONLY valid JSON in this exact format — no markdown, no extra text:
{
  "title": "Project Plan: [brief title]",
  "tasks": [
    {
      "id": "task-1",
      "name": "Task Name",
      "description": "One sentence describing what to do",
      "estimatedTime": "2 hours",
      "deadline": "Day 1",
      "priority": "high"
    }
  ]
}

Generate 5-10 specific, concrete tasks. Priority values: "high", "medium", "low". Deadlines are relative (Day 1, Week 1, etc).`,
    agencyProfile,
  );

  try {
    const { content } = await callAgent(systemPrompt, [{
      role: 'user',
      content: `Request: "${request}"\n\nExecutive Summary:\n${summary}\n\nGenerate the project plan JSON.`,
    }], 2000);

    const clean = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    console.error('[/api/agents/project-plan]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/agents/proposal ────────────────────────────────────────────────
app.post('/api/agents/proposal', async (req, res) => {
  const { summary, request, agencyProfile } = req.body;
  if (!summary) return res.status(400).json({ error: 'summary is required' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const systemPrompt = injectAgencyProfile(
    `You are a senior business consultant writing professional client proposals. Write compelling, concise proposals that close deals.

Format your proposal with these sections using markdown:
# CLIENT PROPOSAL

## Executive Summary
## Scope of Work
## Deliverables
## Timeline
## Investment
## Next Steps

---
*Proposal prepared by [Agency Name] — Confidential*

Be professional, specific, and persuasive. Use realistic agency rates.`,
    agencyProfile,
  );

  try {
    const { content: proposal } = await callAgent(systemPrompt, [{
      role: 'user',
      content: `Project: "${request}"\n\nBoard Analysis:\n${summary}\n\nWrite the client proposal.`,
    }], 3000);
    res.json({ proposal });
  } catch (err) {
    console.error('[/api/agents/proposal]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/morning-briefing ────────────────────────────────────────────────
app.post('/api/morning-briefing', async (req, res) => {
  const { missionHistory, agencyProfile } = req.body;
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const systemPrompt = injectAgencyProfile(
    `You are a sharp executive assistant delivering a focused morning briefing. Be motivating, clear, and action-oriented.

Structure:
## 🌅 Good Morning

## Recent Mission Summary
[Brief recap of recent work based on mission history]

## Today's Top 3 Priorities
1. [Highest leverage action]
2. [Second priority]
3. [Third priority]

## Active Client Snapshot
[Quick status note for each current client]

## Today's Focus
[One powerful sentence: what matters most today]

Under 400 words. Punchy and energizing.`,
    agencyProfile,
  );

  const recentMissions = (missionHistory || []).slice(0, 8)
    .map(m => `- ${m.title || m.request} (${new Date(m.timestamp).toLocaleDateString()})`)
    .join('\n') || 'No recent missions logged yet.';

  try {
    const { content: briefing } = await callAgent(systemPrompt, [{
      role: 'user',
      content: `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.\n\nRecent missions:\n${recentMissions}\n\nDeliver my morning briefing.`,
    }], 1500);
    res.json({ briefing });
  } catch (err) {
    console.error('[/api/morning-briefing]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/notion/export ───────────────────────────────────────────────────
app.post('/api/notion/export', async (req, res) => {
  const { title, content, apiKey, databaseId } = req.body;
  if (!apiKey || !databaseId) return res.status(400).json({ error: 'apiKey and databaseId are required' });

  // Convert content into simple paragraph blocks (Notion API)
  const paragraphs = (content || '').split('\n').filter(l => l.trim()).map(line => ({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: line.slice(0, 2000) } }],
    },
  }));

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          title: { title: [{ text: { content: title || 'JARVIS Board Session' } }] },
        },
        children: paragraphs.slice(0, 100),
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `Notion API error ${response.status}`);
    }
    const page = await response.json();
    res.json({ url: page.url });
  } catch (err) {
    console.error('[/api/notion/export]', err.message);
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
  console.log(`    API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ Configured' : '✗ MISSING'}\n`);
});
