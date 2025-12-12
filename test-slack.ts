/**
 * Quick test script to verify Slack credentials
 *
 * Usage:
 *   npx tsx test-slack.ts
 *
 * This will send a test message to your configured Slack channel
 */

import { WebClient } from '@slack/web-api';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function testSlack() {
  console.log('\n🧪 Testing Slack Integration...\n');

  // Check environment variables
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_APPROVAL_CHANNEL_ID;

  console.log('✓ Checking environment variables:');
  console.log('  SLACK_BOT_TOKEN exists:', !!token);
  if (token) {
    console.log('  SLACK_BOT_TOKEN prefix:', token.substring(0, 10) + '...');
    console.log('  SLACK_BOT_TOKEN length:', token.length);
  }
  console.log('  SLACK_APPROVAL_CHANNEL_ID:', channel || 'NOT SET');
  console.log();

  if (!token) {
    console.error('❌ ERROR: SLACK_BOT_TOKEN is not set in .env.local');
    console.log('\nTo fix this:');
    console.log('1. Go to https://api.slack.com/apps');
    console.log('2. Select your app → OAuth & Permissions');
    console.log('3. Copy the "Bot User OAuth Token"');
    console.log('4. Add to .env.local: SLACK_BOT_TOKEN=xoxb-your-token-here');
    process.exit(1);
  }

  if (!channel) {
    console.error('❌ ERROR: SLACK_APPROVAL_CHANNEL_ID is not set in .env.local');
    console.log('\nTo fix this:');
    console.log('1. Open Slack and go to your target channel');
    console.log('2. Click the channel name at the top');
    console.log('3. Scroll down and copy the Channel ID (starts with C)');
    console.log('4. Add to .env.local: SLACK_APPROVAL_CHANNEL_ID=C12345ABCDE');
    process.exit(1);
  }

  // Initialize Slack client
  const slack = new WebClient(token);

  try {
    console.log('📤 Attempting to send test message to Slack...\n');

    const result = await slack.chat.postMessage({
      channel: channel,
      text: '🧪 Test message from Plaude Challenge bot!',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🧪 Slack Integration Test',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `This is a test message to verify your Slack bot is working correctly.\n\n*Timestamp:* ${new Date().toISOString()}\n*Channel ID:* ${channel}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '✅ If you see this message, your Slack integration is working!',
          },
        },
      ],
    });

    console.log('✅ SUCCESS! Message sent to Slack!\n');
    console.log('Response details:');
    console.log('  Channel:', result.channel);
    console.log('  Message timestamp:', result.ts);
    console.log('  Message permalink:', `https://slack.com/app_redirect?channel=${result.channel}&message_ts=${result.ts}`);
    console.log('\n📱 Check your Slack channel now!');
  } catch (error: any) {
    console.error('❌ FAILED to send message to Slack\n');
    console.error('Error details:');
    console.error('  Type:', error?.constructor?.name);
    console.error('  Message:', error?.message);

    if (error?.data) {
      console.error('  Slack API Error:', error.data.error);
      console.error('  Full error data:', JSON.stringify(error.data, null, 2));
    }

    console.log('\n🔧 Common fixes:');

    if (error?.data?.error === 'not_in_channel') {
      console.log('  → Add the bot to your channel:');
      console.log('    1. In Slack, type: /invite @YourBotName');
      console.log('    2. Or add "chat:write.public" scope to post without joining');
    } else if (error?.data?.error === 'invalid_auth') {
      console.log('  → Your token is invalid:');
      console.log('    1. Go to https://api.slack.com/apps');
      console.log('    2. Select app → OAuth & Permissions → Reinstall to Workspace');
      console.log('    3. Update SLACK_BOT_TOKEN in .env.local');
    } else if (error?.data?.error === 'channel_not_found') {
      console.log('  → Wrong channel ID:');
      console.log('    1. Use Channel ID (starts with C), not channel name');
      console.log('    2. Invite bot to private channels first');
    } else {
      console.log('  → Check the error message above for details');
      console.log('  → See DEBUGGING_SLACK.md for full troubleshooting guide');
    }

    process.exit(1);
  }
}

// Run the test
testSlack().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
