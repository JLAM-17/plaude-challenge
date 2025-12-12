import { createWebhook } from 'workflow';
import { sendSlackApprovalMessage, type ApprovalRequest } from './slack-approval-tool';
import { storeApprovalResult } from './approval-results';

/**
 * Background Approval Workflow
 * This workflow runs independently in the background to wait for Slack approval
 * It keeps the webhook alive while the main user-facing workflow completes
 */
export async function backgroundApprovalWorkflow(
  approvalId: string,
  sessionId: string,
  params: ApprovalRequest
) {
  'use workflow';

  console.log('=== BACKGROUND APPROVAL WORKFLOW START ===');
  console.log('Approval ID:', approvalId);
  console.log('Session ID:', sessionId);
  console.log('Params:', JSON.stringify(params, null, 2));

  try {
    // Create webhook at workflow level (must be in workflow context)
    const webhook = createWebhook({ token: approvalId });
    console.log('Webhook created:', webhook.url);

    // Send Slack message with approval buttons (this is a step function)
    await sendSlackApprovalMessage(params, approvalId, webhook.url);
    console.log('✅ Slack message sent');

    // Wait for Slack response (this can take minutes/hours)
    // The workflow will stay alive keeping the webhook endpoint active
    console.log('Waiting for Slack response...');
    const request = await webhook;
    const response = await request.json() as { approved: boolean; response: string };

    console.log('✅ Received approval response:', response);

    // Store the result for the session
    await storeApprovalResult(approvalId, sessionId, {
      approved: response.approved,
      response: response.response,
      requestDetails: params,
    });

    console.log('✅ Result stored for session');
    console.log('=== BACKGROUND APPROVAL WORKFLOW END ===');

    return {
      success: true,
      approved: response.approved,
      response: response.response,
    };
  } catch (error) {
    console.error('=== BACKGROUND APPROVAL WORKFLOW ERROR ===');
    console.error('Error:', error);
    console.error('=== BACKGROUND APPROVAL WORKFLOW ERROR END ===');

    // Store error result
    await storeApprovalResult(approvalId, sessionId, {
      approved: false,
      response: `Error: ${error instanceof Error ? error.message : String(error)}`,
      requestDetails: params,
    });

    throw error;
  }
}
