# Debugging Slack Approval Messages

This guide will help you debug why Slack approval messages aren't arriving in your channel.

## Step 1: Check Server Logs

When you trigger an approval request, look for these debug logs in your terminal:

```
=== SLACK APPROVAL DEBUG START ===
Approval ID: approval_...
Params: {...}
SLACK_BOT_TOKEN exists: true/false
SLACK_BOT_TOKEN prefix: xoxb-...
SLACK_APPROVAL_CHANNEL_ID: C...
Slack WebClient initialized
Attempting to send message to Slack...
✅ SUCCESS: Message sent to Slack!
=== SLACK APPROVAL DEBUG END ===
```

## Step 2: Environment Variables Checklist

### Check your `.env.local` file:

```bash
# View your environment variables (without showing tokens)
cat .env.local
```

Required variables:
- `SLACK_BOT_TOKEN` - Should start with `xoxb-`
- `SLACK_APPROVAL_CHANNEL_ID` - Should start with `C` (e.g., `C12345ABCDE`)

### Get your Slack Channel ID:

1. Open Slack in browser or desktop app
2. Navigate to your target channel
3. Click the channel name at the top
4. Scroll down in the "About" tab
5. Copy the Channel ID (starts with `C`)

**Important:** Use the Channel ID, NOT the channel name!

## Step 3: Verify Slack Bot Permissions

Your Slack bot needs these OAuth scopes:

1. Go to https://api.slack.com/apps
2. Select your app
3. Go to "OAuth & Permissions"
4. Under "Bot Token Scopes", ensure you have:
   - `chat:write` - Post messages
   - `chat:write.public` - Post to public channels without joining
   - `channels:read` - View basic channel info
   - `groups:read` - View private channel info (if using private channels)

If you added scopes, **reinstall the app** to your workspace!

## Step 4: Test Slack Token Manually

Create a test file to verify your Slack credentials:

```typescript
// test-slack.ts
import { WebClient } from '@slack/web-api';

const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.SLACK_APPROVAL_CHANNEL_ID;

console.log('Token exists:', !!token);
console.log('Channel ID:', channel);

const slack = new WebClient(token);

slack.chat.postMessage({
  channel: channel!,
  text: 'Test message from Plaude Challenge bot!'
})
  .then(result => {
    console.log('✅ Success!', result);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
```

Run it:
```bash
npx tsx test-slack.ts
```

## Step 5: Common Error Messages

### Error: `not_in_channel`
**Solution:** Add the bot to your channel:
1. In Slack, go to your target channel
2. Type `/invite @YourBotName`
3. Or add `chat:write.public` scope to post without joining

### Error: `invalid_auth`
**Solution:** Your token is invalid or expired
1. Go to https://api.slack.com/apps
2. Select your app → "OAuth & Permissions"
3. Reinstall to Workspace
4. Copy the new Bot User OAuth Token
5. Update `.env.local`

### Error: `channel_not_found`
**Solution:** Wrong channel ID
1. Verify you're using the Channel ID (starts with `C`), not the name
2. Make sure the bot has access to the channel
3. For private channels, invite the bot first

### Error: `SLACK_BOT_TOKEN is not set`
**Solution:** Environment variable not loaded
1. Verify `.env.local` exists in project root
2. Restart your dev server: `npm run dev`
3. Check for typos in variable names

## Step 6: Watch the Agent Workflow Logs

Enable detailed logging in your agent:

```bash
# In terminal running your dev server, look for:
agentWorkflow called with messages: [...]
Initializing DurableAgent...
DurableAgent initialized successfully
Calling agent.stream with formatted messages: [...]
```

If you see the tool being called:
```
Tool: request_human_approval
Arguments: { situation: "...", context: "...", ... }
```

Then check if the Slack approval debug logs appear right after.

## Step 7: Check Network Issues

If logs show success but no message appears:

1. **Check Slack API Status:** https://status.slack.com/
2. **Test your internet connection**
3. **Check firewall settings** (especially in corporate networks)
4. **Try posting to a different channel**

## Step 8: Verify the Agent Actually Calls the Tool

Check your agent instructions in [agent-instructions.ts](lib/agent-instructions.ts).

The agent should know WHEN to request approval. Example triggers:
- Refund amounts over $50
- Account deletions
- Policy exceptions
- Ambiguous requests

Test with a clear trigger:
```
User: "I need a refund of $100 for order #12345"
```

## Step 9: Enable Workflow Logging

Add logging to see if the workflow is even running:

In [agent-workflow.ts](lib/agent-workflow.ts), check for:
```
agentWorkflow called with messages: [...]
Initializing DurableAgent...
DurableAgent initialized successfully
Calling agent.stream with formatted messages: [...]
```

## Step 10: Test End-to-End

1. **Start fresh:**
   ```bash
   npm run dev
   ```

2. **Send a test message that requires approval:**
   ```
   "I need to delete my account permanently"
   ```

3. **Watch the terminal for:**
   - `=== SLACK APPROVAL DEBUG START ===`
   - Environment variable checks
   - `✅ SUCCESS: Message sent to Slack!`

4. **Check Slack immediately after seeing success**

## Still Not Working?

If you see `✅ SUCCESS` in logs but no Slack message:

1. **Check if you're looking at the right channel** - Verify the Channel ID matches
2. **Check Slack notification settings** - Messages might be muted
3. **Try posting as the bot directly** using the test script above
4. **Look for the message in your bot's DM** - Sometimes messages go there if channel access fails
5. **Check Slack workspace permissions** - Some workspaces restrict bot posting

## Debug Output Example

**Success case:**
```
=== SLACK APPROVAL DEBUG START ===
Approval ID: approval_1234567890_abc123
Params: {
  "situation": "Customer requesting refund",
  "context": "Order #12345, Amount: $100",
  "reason": "Amount exceeds $50 threshold",
  "requestedAction": "Process $100 refund to customer"
}
SLACK_BOT_TOKEN exists: true
SLACK_BOT_TOKEN prefix: xoxb-12345...
SLACK_APPROVAL_CHANNEL_ID: C12345ABCDE
Slack WebClient initialized
Attempting to send message to Slack...
✅ SUCCESS: Message sent to Slack!
Message timestamp: 1234567890.123456
Channel: C12345ABCDE
=== SLACK APPROVAL DEBUG END ===
```

**Failure case:**
```
=== SLACK APPROVAL DEBUG START ===
Approval ID: approval_1234567890_abc123
SLACK_BOT_TOKEN exists: false
ERROR: SLACK_BOT_TOKEN is not set in environment variables
=== SLACK APPROVAL ERROR ===
Error type: Error
Error message: SLACK_BOT_TOKEN is not set in environment variables
```

## Quick Checklist

- [ ] `.env.local` file exists with all required variables
- [ ] Dev server restarted after adding `.env.local`
- [ ] Slack bot has correct OAuth scopes
- [ ] Channel ID is correct (starts with `C`)
- [ ] Bot is invited to the channel (or has `chat:write.public` scope)
- [ ] Terminal shows `✅ SUCCESS: Message sent to Slack!`
- [ ] Looking at the correct Slack channel
- [ ] Agent instructions trigger the approval tool

## Need More Help?

1. Share the full debug output from terminal
2. Verify your Slack app configuration at https://api.slack.com/apps
3. Test with the manual script in Step 4
