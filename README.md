# 🎅 Plaude Challenge: Santa's HR Department

> An AI agent that makes kids pitch their Christmas wishes to Santa like they're on Shark Tank.

## What's This?

Santa got tired of boring gift requests, so he hired an AI assistant to filter out the uncreative stuff. Built with Next.js, Claude, and the crushing realization that even magical elves need approval workflows.

**The Magic**: You tell the agent what you want for Christmas. The agent forwards it to Santa via Slack. Santa judges your creativity like Gordon Ramsay judges a soggy Wellington. If you're creative enough, you get your gift (when Juan Luis gets hired). If not, back to the drawing board, kid.

Think of it as: *Your Letter to Santa, Now With More Bureaucracy™*

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

**Won't bother Santa (policy exceptions):**
- "I want a rocket launcher" → Even Santa draws the line somewhere
- "Bring me a pet dragon" → Living beings are a hard no
- "Change the past so I got an A+ last year" → Not even magic works that way

**WILL bother Santa (gets sent to Slack for judgment):**
- "I want a self-playing guitar that teaches me jazz" → Creative! Santa might approve
- "A rocket ship" → Not creative enough, try harder kid
- "The complete works of Shakespeare but every character is a dinosaur" → Now we're talking!

## How It Works (The Nerdy Bit)

1. You tell Santa's AI assistant what you want
2. Agent asks clarifying questions (because details matter)
3. Your request gets Slack'd to the real Santa (Juan Luis in disguise)
4. Santa judges your creativity like Simon Cowell
5. Approve = You get your gift when Juan gets hired! 🎉
6. Deny = Try again with more imagination, kiddo

The agent uses **plain-text instructions** to know when you're being creative enough. No hardcoded rules, just Santa's vibes... and carefully written prompts.

## Why This Matters

Because Santa needs a human-in-the-loop workflow to separate the "I want socks" peasants from the "I want a time-traveling library card" visionaries. Also, it's a demo for Plaude showing that AI agents can pause, ask humans for approval via Slack, and resume based on that feedback.

---

**Built for the Plaude Engineering Challenge** | Questions? Bugs? Feature ideas? Open an issue or hire me!
