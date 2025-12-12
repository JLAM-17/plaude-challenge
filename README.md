# 🤖 Plaude Challenge: When AI Needs Adult Supervision

> An AI agent that knows when to ask for help. Like a teenager with a credit card, but actually responsible.

## What's This?

An AI customer service agent that's smart enough to know when it's in over its head. Built with Next.js, Claude, and a healthy dose of "maybe I should ask a human first."

**The Magic**: The agent handles routine stuff on its own, but when things get spicy (refunds over $50, account deletions, suspicious requests), it taps a human on the shoulder via Slack. Think of it as AI with training wheels, except the training wheels are actually good judgment.

## Stack (The Fancy Stuff)

- **Next.js** - Because create-react-app is so 2022
- **WorkflowDevKit** - Makes the agent durable (won't ghost you mid-conversation)
- **Claude 3.5 Sonnet** - The brains of the operation
- **Slack** - Where humans get bothered for approvals
- **Tailwind** - Making it pretty since we can't all be designers

## Quick Start (The Speedrun)

1. **Clone it**
   ```bash
   git clone <repo-url>
   cd plaude-challenge
   npm install
   ```

2. **Get your keys** (the boring but necessary part)
   - Anthropic API key → [console.anthropic.com](https://console.anthropic.com)
   - Slack bot token → [api.slack.com/apps](https://api.slack.com/apps)
   - Create `.env.local` and drop them in (check `.env.example`)

3. **Run it**
   ```bash
   npm run dev
   ```
   Hit [localhost:3000](http://localhost:3000) and start chatting!

## Try These (Fun Examples)

**Won't bother a human:**
- "What's your return policy?"
- "Help with order #12345"

**Definitely bothers a human (via Slack):**
- "Refund me $200" → Too much money, needs approval
- "Delete my account" → Destructive action, human time!
- "Can I return this after 90 days?" → Policy exception alert

## How It Works (The Nerdy Bit)

1. User types something in the UI
2. Claude reads it and decides: "Can I handle this or do I need backup?"
3. If backup needed → Slack notification → Human clicks approve/deny
4. Agent continues based on human's decision
5. User gets response, none the wiser about the approval dance

The agent uses **plain-text instructions** to know when to pause. No hardcoded rules, just vibes... and carefully written prompts.

## Why This Matters

Because fully autonomous AI is scary, and fully manual support is expensive. This is the sweet spot: AI handles the easy stuff, humans handle the judgment calls. Like a really smart intern who knows when to escalate.

---

**Built for the Plaude Engineering Challenge** | Questions? Bugs? Feature ideas? Open an issue or hire me!
