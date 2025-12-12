# Debugging Slack Approval Flow

This guide helps you test and debug the Slack approval workflow.

## The Problem

Your agent sends approval requests to Slack successfully, but when you click the buttons in Slack, the agent doesn't receive the response. Here's why:

### Root Cause: In-Memory Storage

The current implementation uses an in-memory `Map` to store pending approvals:

```typescript
// lib/slack-approval-tool.ts:15-18
const pendingApprovals = new Map<string, {
  resolve: (value: { approved: boolean; response: string }) => void;
  reject: (reason: Error) => void;
}>();
```

**The issue:** When Slack sends the button click back to your webhook, it might hit a different process or the Map might have been cleared, so the promise is never resolved.

## How to Test

### Step 1: Check if Messages Reach Slack

```bash
npm run test:slack
```

This verifies your Slack credentials work and messages can be sent.

### Step 2: Test the Full Approval Flow

```bash
npm run test:slack-flow
```

This sends an approval request and gives you instructions for testing the webhook.

### Step 3: Test Webhook Locally

You have two options:

#### Option A: Click Button in Slack (Requires ngrok)

1. Install ngrok: `npm install -g ngrok`
2. Start your dev server: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Go to [Slack API Apps](https://api.slack.com/apps)
6. Select your app → **Interactivity & Shortcuts**
7. Update Request URL to: `https://abc123.ngrok.io/api/slack/webhook`
8. Click the approval button in Slack
9. Check your dev server logs

#### Option B: Simulate Button Click with curl

1. Run the flow test: `npm run test:slack-flow`
2. Copy the approval ID from the output
3. In a new terminal, run:

```bash
# For approve:
curl -X POST http://localhost:3000/api/slack/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode 'payload={"type":"block_actions","user":{"id":"U12345"},"actions":[{"block_id":"APPROVAL_ID_HERE","action_id":"approve_APPROVAL_ID_HERE","value":"approve"}],"message":{"blocks":[]}}'

# For deny:
curl -X POST http://localhost:3000/api/slack/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode 'payload={"type":"block_actions","user":{"id":"U12345"},"actions":[{"block_id":"APPROVAL_ID_HERE","action_id":"deny_APPROVAL_ID_HERE","value":"deny"}],"message":{"blocks":[]}}'
```

Replace `APPROVAL_ID_HERE` with the actual approval ID.

### Step 4: Check Server Logs

When the webhook is called, you should see:

```
POST /api/slack/webhook 200
```

If you see errors, check the error message for clues.

## Debugging Checklist

- [ ] **Slack credentials are set** in `.env.local`
  - `SLACK_BOT_TOKEN=xoxb-...`
  - `SLACK_APPROVAL_CHANNEL_ID=C...`

- [ ] **Bot is invited to the channel**
  - In Slack: `/invite @YourBotName`

- [ ] **Messages reach Slack** (`npm run test:slack`)

- [ ] **Webhook endpoint is accessible**
  - GET `http://localhost:3000/api/slack/webhook` → should return `{"status":"ok"}`

- [ ] **Interactive messages are configured in Slack app**
  - Go to [Slack API Apps](https://api.slack.com/apps)
  - Select your app → **Interactivity & Shortcuts**
  - Request URL should be set to your webhook endpoint

- [ ] **Dev server is running** (`npm run dev`)

- [ ] **No firewall blocking requests** (if using ngrok)

## Common Issues

### "not_in_channel" Error

**Solution:** Invite your bot to the channel:
```
/invite @YourBotName
```

Or add `chat:write.public` scope to post without joining channels.

### "invalid_auth" Error

**Solution:**
1. Go to [Slack API Apps](https://api.slack.com/apps)
2. OAuth & Permissions → Reinstall to Workspace
3. Copy new Bot User OAuth Token
4. Update `SLACK_BOT_TOKEN` in `.env.local`

### Webhook Not Receiving Requests

**Causes:**
- Slack app's Interactivity URL is wrong or not set
- ngrok tunnel expired (regenerate with `ngrok http 3000`)
- Dev server not running
- Firewall blocking requests

**Solution:** Use curl to test locally first (Option B above)

### Promise Never Resolves

**Cause:** The in-memory `Map` loses the approval when:
- Server restarts
- Different process handles the webhook
- Hot module reload in development

**Solution for Development:** Use the Workflow AI durable execution features properly with `'use step'` directive.

**Solution for Production:** You'll need to use a proper queue/database system or rely on Workflow's built-in durability.

## Understanding Workflow AI Durability

The `'use step'` directive in [lib/slack-approval-tool.ts:25](lib/slack-approval-tool.ts#L25) makes the function **durable**. This means Workflow AI should handle the pause/resume automatically.

However, the in-memory `Map` approach won't work across restarts. Workflow AI's durability should handle this, but you might need to:

1. Check Workflow AI logs for the approval state
2. Ensure the webhook response properly triggers Workflow's resume mechanism
3. Consider using Workflow's built-in pause/resume patterns

## Next Steps

If webhook testing works but approvals still don't resolve:

1. Add more logging to [lib/slack-approval-tool.ts:169](lib/slack-approval-tool.ts#L169)
2. Check if `pendingApprovals.has(approvalId)` is true when webhook is called
3. Verify Workflow AI is properly handling the `'use step'` directive
4. Consult [Workflow AI docs](https://useworkflow.dev/docs/ai) for human-in-the-loop patterns

## Testing in Production (Vercel)

When deployed to Vercel:

1. Get your deployment URL (e.g., `https://your-app.vercel.app`)
2. Update Slack app's Interactivity URL:
   - `https://your-app.vercel.app/api/slack/webhook`
3. Test by triggering an approval through your UI
4. Click the button in Slack
5. Check Vercel logs for webhook activity

Remember: Vercel's serverless functions are stateless, so the in-memory Map won't work. You'll need to rely entirely on Workflow AI's durability or implement a proper database solution.
