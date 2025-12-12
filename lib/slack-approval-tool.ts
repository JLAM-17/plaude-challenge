import { WebClient } from '@slack/web-api';
import { z } from 'zod';

// Schema for the approval request
export const approvalRequestSchema = z.object({
  situation: z.string().describe('Description of the situation requiring approval'),
  context: z.string().describe('Relevant context (order numbers, amounts, customer info, etc.)'),
  reason: z.string().describe('Why human approval is needed'),
  requestedAction: z.string().describe('The action you want to take if approved'),
});

export type ApprovalRequest = z.infer<typeof approvalRequestSchema>;

/**
 * Send approval message to Slack (step function)
 */
async function sendSlackApprovalMessage(
  params: ApprovalRequest,
  approvalId: string,
  webhookUrl: string
): Promise<void> {
  'use step';

  console.log('=== SENDING SLACK MESSAGE ===');
  console.log('Approval ID:', approvalId);
  console.log('Webhook URL:', webhookUrl);

  // Validate environment variables
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  const slackChannelId = process.env.SLACK_APPROVAL_CHANNEL_ID;

  if (!slackBotToken) {
    throw new Error('SLACK_BOT_TOKEN is not set in environment variables');
  }

  if (!slackChannelId) {
    throw new Error('SLACK_APPROVAL_CHANNEL_ID is not set in environment variables');
  }

  // Initialize Slack client
  const slack = new WebClient(slackBotToken);

  // Send message to Slack with approval buttons
  // Store the webhook URL in the button value so we can retrieve it when clicked
  const result = await slack.chat.postMessage({
    channel: slackChannelId,
    text: `🔔 Approval Request`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔔 Approval Request',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Situation:*\n${params.situation}`,
          },
          {
            type: 'mrkdwn',
            text: `*Reason for Approval:*\n${params.reason}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Context:*\n${params.context}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Requested Action:*\n${params.requestedAction}`,
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
            value: webhookUrl, // Store webhook URL in button value
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
            value: webhookUrl, // Store webhook URL in button value
            action_id: `deny_${approvalId}`,
          },
        ],
      },
    ],
  });

  console.log('✅ Message sent to Slack!');
  console.log('Message timestamp:', result.ts);
  console.log('Channel:', result.channel);
}

/**
 * Request human approval via Slack (non-blocking version)
 * This function sends the approval request and returns immediately
 * The workflow can continue and handle the response asynchronously
 *
 * @param params - The approval request parameters
 * @param approvalId - Pre-generated approval ID (from workflow level)
 * @param webhookUrl - Pre-created webhook URL (from workflow level)
 * @param webhook - The webhook object (not awaited in non-blocking mode)
 */
export async function requestHumanApproval(
  params: ApprovalRequest,
  approvalId: string,
  webhookUrl: string,
  webhook: any
): Promise<{ approved: boolean; response: string; pending: boolean }> {
  console.log('=== SLACK APPROVAL START (NON-BLOCKING) ===');
  console.log('Approval ID:', approvalId);
  console.log('Webhook URL:', webhookUrl);
  console.log('Params:', JSON.stringify(params, null, 2));

  try {
    // Send the Slack message with the webhook URL embedded in buttons
    // This is a step function so it can make external API calls
    await sendSlackApprovalMessage(params, approvalId, webhookUrl);

    console.log('✅ Slack message sent! Not waiting for response.');
    console.log('When user clicks approve/deny in Slack, response will be sent to:', webhookUrl);

    // Return immediately without waiting for the webhook
    // The agent can now continue and inform the user that approval is pending
    return {
      approved: false,
      response: 'pending',
      pending: true
    };
  } catch (error) {
    console.error('=== SLACK APPROVAL ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);

    // Log specific Slack API errors
    if (error && typeof error === 'object' && 'data' in error) {
      console.error('Slack API error data:', JSON.stringify((error as any).data, null, 2));
    }

    console.error('=== SLACK APPROVAL ERROR END ===');
    throw new Error(`Failed to send approval request: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Export the tool definition for the AI agent
export const slackApprovalTool = {
  description: `Request approval from a human supervisor via Slack. Use this when you encounter situations that require human judgment.
This tool sends the approval request and returns immediately with a "pending" status. The agent should inform the user that their request has been forwarded to Santa for approval and they will be notified once a decision is made.
The tool returns: { approved: boolean, response: string, pending: boolean }
When pending is true, it means the approval request has been sent but not yet decided.`,
  inputSchema: approvalRequestSchema,
  execute: requestHumanApproval,
};
