/**
 * Test script for Slack approval flow
 *
 * This simulates the entire approval flow:
 * 1. Sends an approval request to Slack
 * 2. Shows you the approval ID
 * 3. Provides a curl command to simulate clicking the button
 *
 * Usage:
 *   npx tsx test-slack-flow.ts
 */

import { WebClient } from '@slack/web-api';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function testSlackApprovalFlow() {
  console.log('\n🧪 Testing Slack Approval Flow...\n');

  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_APPROVAL_CHANNEL_ID;

  if (!token || !channel) {
    console.error('❌ Missing environment variables');
    console.log('Required: SLACK_BOT_TOKEN, SLACK_APPROVAL_CHANNEL_ID');
    process.exit(1);
  }

  const slack = new WebClient(token);
  const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log('📋 Approval ID:', approvalId);
  console.log();

  try {
    // Send approval request
    console.log('📤 Sending approval request to Slack...');
    const result = await slack.chat.postMessage({
      channel: channel,
      text: '🔔 Test Approval Request',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔔 Test Approval Request',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '*Situation:*\nTest refund request',
            },
            {
              type: 'mrkdwn',
              text: '*Reason for Approval:*\nAmount exceeds $50',
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Context:*\nOrder #12345, Customer: John Doe, Amount: $75.00',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Requested Action:*\nIssue full refund of $75.00',
          },
        },
        {
          type: 'actions',
          block_id: approvalId,
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✅ Approve',
                emoji: true,
              },
              style: 'primary',
              value: 'approve',
              action_id: `approve_${approvalId}`,
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '❌ Deny',
                emoji: true,
              },
              style: 'danger',
              value: 'deny',
              action_id: `deny_${approvalId}`,
            },
          ],
        },
      ],
    });

    console.log('✅ Message sent successfully!');
    console.log('   Channel:', result.channel);
    console.log('   Timestamp:', result.ts);
    console.log();

    // Show webhook test instructions
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 CHECK YOUR SLACK CHANNEL NOW!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log();
    console.log('You should see an approval request with two buttons.');
    console.log();
    console.log('To verify the webhook is working, you can either:');
    console.log();
    console.log('1️⃣  Click the button in Slack (requires proper webhook URL in Slack app settings)');
    console.log('2️⃣  Simulate a button click locally (useful for testing):');
    console.log();
    console.log('   Open a new terminal and run:');
    console.log();
    console.log('   # Approve:');
    console.log(`   curl -X POST http://localhost:3000/api/slack/webhook \\`);
    console.log(`     -H "Content-Type: application/x-www-form-urlencoded" \\`);
    console.log(`     --data-urlencode 'payload={"type":"block_actions","user":{"id":"U12345"},"actions":[{"block_id":"${approvalId}","action_id":"approve_${approvalId}","value":"approve"}],"message":{"blocks":[]}}'`);
    console.log();
    console.log('   # Deny:');
    console.log(`   curl -X POST http://localhost:3000/api/slack/webhook \\`);
    console.log(`     -H "Content-Type: application/x-www-form-urlencoded" \\`);
    console.log(`     --data-urlencode 'payload={"type":"block_actions","user":{"id":"U12345"},"actions":[{"block_id":"${approvalId}","action_id":"deny_${approvalId}","value":"deny"}],"message":{"blocks":[]}}'`);
    console.log();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log();
    console.log('🔍 DEBUGGING TIPS:');
    console.log();
    console.log('   • Check your dev server logs for webhook activity');
    console.log('   • Verify your Slack app "Interactivity" settings point to:');
    console.log('     https://your-domain.vercel.app/api/slack/webhook');
    console.log('   • For local testing, use ngrok:');
    console.log('     ngrok http 3000');
    console.log('     Then update Slack app settings with the ngrok URL');
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('   Slack API Error:', error.data);
    }
    process.exit(1);
  }
}

testSlackApprovalFlow().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
