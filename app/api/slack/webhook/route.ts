import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/slack/webhook
 * Handles Slack interactive messages (button clicks)
 */
export async function POST(request: NextRequest) {
  console.log('=== SLACK WEBHOOK RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const body = await request.text();
    console.log('Raw body length:', body.length);

    // Slack sends the payload as URL-encoded form data
    const params = new URLSearchParams(body);
    const payloadStr = params.get('payload');

    if (!payloadStr) {
      console.log('❌ No payload found in request');
      return Response.json({ error: 'No payload found' }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);
    console.log('Payload type:', payload.type);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Verify it's a block action (button click)
    if (payload.type !== 'block_actions') {
      return Response.json({ error: 'Invalid payload type' }, { status: 400 });
    }

    const action = payload.actions[0];
    const approvalId = payload.actions[0].block_id;
    const approved = action.action_id.startsWith('approve_');

    // Get the webhook URL from the button value (we store it there when creating the message)
    const webhookUrl = action.value;

    console.log('Action details:');
    console.log('  Approval ID:', approvalId);
    console.log('  Action ID:', action.action_id);
    console.log('  Approved:', approved);
    console.log('  Webhook URL from button value:', webhookUrl);

    if (!webhookUrl) {
      console.error('❌ No webhook URL found in button value');
      return Response.json({ error: 'Webhook URL not found in button' }, { status: 404 });
    }

    // Call the webhook to resume the workflow
    console.log('🔗 Calling workflow webhook:', webhookUrl);
    console.log('📤 Sending data:', { approved, response: approved ? 'Approved' : 'Denied' });

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          response: approved ? 'Approved' : 'Denied',
        }),
      });

      console.log('📥 Webhook response status:', webhookResponse.status, webhookResponse.statusText);

      if (!webhookResponse.ok) {
        const errorBody = await webhookResponse.text();
        console.error('❌ Webhook call failed:', errorBody);
        throw new Error(`Webhook call failed: ${webhookResponse.status} ${webhookResponse.statusText}. Body: ${errorBody}`);
      }

      const responseBody = await webhookResponse.text();
      console.log('📥 Webhook response body:', responseBody);
      console.log('✅ Workflow resumed successfully');
    } catch (error) {
      console.error('❌ Error calling workflow webhook:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      throw error;
    }

    // Update the Slack message to show the response
    const responseText = approved
      ? '✅ Request approved'
      : '❌ Request denied';

    console.log('Sending response to Slack:', responseText);
    console.log('=== SLACK WEBHOOK END ===');

    return Response.json({
      replace_original: true,
      text: responseText,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${responseText} by <@${payload.user.id}>`,
          },
        },
      ],
    });
  } catch (error) {
    console.error('=== SLACK WEBHOOK ERROR ===');
    console.error('Error handling Slack webhook:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('=== SLACK WEBHOOK ERROR END ===');

    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/slack/webhook
 * Health check endpoint
 */
export async function GET() {
  return Response.json({ status: 'ok', message: 'Slack webhook endpoint is running' });
}
