# Plaude Engineering Challenge - AI Agent with Human-in-the-Loop

This is a Next.js application demonstrating an AI agent powered by WorkflowDevKit's DurableAgent with Slack-based human-in-the-loop approval workflow.

## Overview

This project implements a customer service AI agent that can autonomously handle user requests while intelligently pausing for human approval when needed. The agent uses Claude 3.5 Sonnet and integrates with Slack for supervisor approval on sensitive operations.

### Key Features

- **DurableAgent Integration**: Uses WorkflowDevKit's DurableAgent for stateful, durable AI workflows
- **Human-in-the-Loop**: Automatically requests human approval via Slack for:
  - Refund requests over $50
  - High-value operations (>$500)
  - Account modifications
  - Ambiguous or unclear requests
  - Policy exceptions
- **Real-time UI**: Beautiful Next.js interface for interacting with the agent
- **Slack Integration**: Interactive approval messages with buttons

## Architecture

### Core Components

1. **Frontend** ([app/page.tsx](app/page.tsx))
   - React-based chat interface
   - Handles user messages and displays agent responses
   - Beautiful gradient design with Tailwind CSS

2. **Agent Workflow** ([lib/agent-workflow.ts](lib/agent-workflow.ts))
   - DurableAgent setup with Claude 3.5 Sonnet
   - Integrates the Slack approval tool
   - Supports both streaming and non-streaming responses

3. **Agent Instructions** ([lib/agent-instructions.ts](lib/agent-instructions.ts))
   - Plain-text instructions defining when to request approval
   - Scenarios: refunds, high-value ops, ambiguous requests, policy exceptions

4. **Slack Approval Tool** ([lib/slack-approval-tool.ts](lib/slack-approval-tool.ts))
   - Sends approval requests to Slack with interactive buttons
   - Pauses workflow execution until human responds
   - Handles approval/denial responses

5. **API Routes**
   - [app/api/agent/route.ts](app/api/agent/route.ts) - Main agent endpoint
   - [app/api/slack/route.ts](app/api/slack/route.ts) - Slack webhook handler

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Anthropic API key
- Slack workspace with a bot token
- Slack channel for approvals

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd plaude-challenge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:
```env
# Anthropic API Key (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Slack Bot Token (get from https://api.slack.com/apps)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token

# Slack Channel ID where approval messages will be sent
SLACK_APPROVAL_CHANNEL_ID=C1234567890

# Workflow API Key (optional, for Workflow cloud features)
WORKFLOW_API_KEY=your_workflow_api_key
```

### Slack Setup

1. Create a Slack app at https://api.slack.com/apps
2. Enable the following OAuth scopes:
   - `chat:write`
   - `chat:write.public`
3. Install the app to your workspace
4. Copy the Bot User OAuth Token to `SLACK_BOT_TOKEN`
5. Get your channel ID (right-click channel → View channel details)
6. Set up Interactive Components:
   - Go to "Interactivity & Shortcuts" in your Slack app settings
   - Enable Interactivity
   - Set Request URL to: `https://your-domain.com/api/slack`

### Running the App

Development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

Production build:
```bash
npm run build
npm start
```

## Usage

### Testing the Agent

Try these example requests to see the human-in-the-loop workflow:

1. **Automatic Approval** (no human needed):
   ```
   "I need help with my order #12345"
   "What's your return policy?"
   ```

2. **Requires Human Approval**:
   ```
   "I want a refund of $100 for order #12345"
   → Triggers approval request in Slack

   "Can you delete my account?"
   → Triggers approval request in Slack

   "I need to change my email to sensitive@email.com"
   → Triggers approval request in Slack
   ```

### How It Works

1. User sends a message through the web interface
2. Frontend calls `/api/agent` with the conversation history
3. DurableAgent processes the request using Claude 3.5 Sonnet
4. If approval needed:
   - Agent calls `request_human_approval` tool
   - Workflow pauses
   - Slack message sent to approval channel
   - Human clicks Approve/Deny button
   - Workflow resumes with decision
   - Agent responds to user based on approval
5. Response displayed in the UI

## Project Structure

```
plaude-challenge/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   └── route.ts          # Main agent endpoint
│   │   └── slack/
│   │       └── route.ts          # Slack webhook handler
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main UI page
├── lib/
│   ├── agent-workflow.ts         # DurableAgent workflow definition
│   ├── agent-instructions.ts     # Plain-text agent instructions
│   └── slack-approval-tool.ts    # Slack integration tool
├── public/
│   └── robot.png                 # Robot image
├── .env.example                  # Environment variable template
├── package.json                  # Dependencies
└── README.md                     # This file
```

## Technologies Used

- **Next.js 16** - React framework
- **WorkflowDevKit** - Durable workflow execution
- **@workflow/ai** - DurableAgent for AI workflows
- **Anthropic Claude 3.5 Sonnet** - Large language model
- **Slack Web API** - Slack integration
- **Tailwind CSS 4** - Styling
- **TypeScript** - Type safety
- **Zod** - Schema validation

## Learn More

- [WorkflowDevKit Documentation](https://workflow.dev)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Slack API Documentation](https://api.slack.com/)
