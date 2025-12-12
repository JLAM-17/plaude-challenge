import { WebClient } from '@slack/web-api';
import { z } from 'zod';
import { start } from 'workflow/api';
import { backgroundApprovalWorkflow } from './background-approval-workflow';

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
 * Exported for use by background-approval-workflow
 */
export async function sendSlackApprovalMessage(
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
 * Launches a background workflow and returns immediately with pending status
 * This is a step function to allow calling start()
 *
 * @param params - The approval request parameters
 * @param sessionId - The current session ID
 */
export async function requestHumanApproval(
  params: ApprovalRequest,
  sessionId: string
): Promise<{ approved: boolean; response: string; pending: boolean }> {
  'use step';

  console.log('=== SLACK APPROVAL START (NON-BLOCKING) ===');
  console.log('Session ID:', sessionId);
  console.log('Params:', JSON.stringify(params, null, 2));

  try {
    // Generate unique approval ID
    const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log('Approval ID:', approvalId);

    // Launch background workflow to handle the approval
    // This workflow will stay alive waiting for Slack response
    console.log('🚀 Launching background approval workflow...');
    const run = await start(backgroundApprovalWorkflow, [approvalId, sessionId, params]);
    console.log('✅ Background workflow started:', run.runId);

    // Return immediately - the user doesn't have to wait
    console.log('Returning immediately with pending status');
    console.log('=== SLACK APPROVAL END (NON-BLOCKING) ===');

    return {
      approved: false,
      response: 'pending',
      pending: true,
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
  description: `Request approval from Santa via Slack for a gift request. Use this when the user makes a gift request.
This tool sends the approval request to Santa and returns immediately with a "pending" status.
IMPORTANT: After calling this tool, tell the user: "Great! I've forwarded your request to Santa for approval! He'll review your creative idea and get back to you soon. Keep an eye out for his decision!"
The tool returns: { approved: boolean, response: string, pending: boolean }
When pending is true, it means the approval request has been sent to Santa but not yet decided.
Users can later ask "Did Santa respond?" and you should use the check_approval_status tool to check.`,
  inputSchema: approvalRequestSchema,
  execute: requestHumanApproval,
};
