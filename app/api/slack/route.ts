import { NextRequest, NextResponse } from 'next/server';
import { getWebhook } from '@/lib/webhook-registry';

/**
 * POST /api/slack
 * Webhook endpoint for Slack interactions (button clicks, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      // Handle JSON payload (verification challenge)
      const body = await request.json();

      // Respond to Slack's URL verification challenge
      if (body.type === 'url_verification') {
        return NextResponse.json({ challenge: body.challenge });
      }

      return NextResponse.json({ status: 'ok' });
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Handle form-encoded payload (interactive messages)
      const formData = await request.formData();
      const payload = formData.get('payload');

      if (!payload) {
        return NextResponse.json(
          { error: 'Missing payload' },
          { status: 400 }
        );
      }

      const data = JSON.parse(payload.toString());

      // Handle button click interactions
      if (data.type === 'block_actions') {
        const action = data.actions?.[0];
        const approvalId = data.actions?.[0]?.block_id;

        if (action && approvalId) {
          const approved = action.value === 'approve';
          const response = approved ? 'Approved by user' : 'Denied by user';

          // Get the webhook URL for this approval
          const webhookUrl = await getWebhook(approvalId);
          if (!webhookUrl) {
            console.error('❌ No webhook found for approval ID:', approvalId);
            return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
          }

          // Call the webhook to resume the workflow
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved, response }),
          });

          // Update the Slack message to show the decision
          return NextResponse.json({
            replace_original: true,
            blocks: [
              ...data.message.blocks.slice(0, -1), // Keep all blocks except the actions
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Decision:* ${approved ? ' *APPROVED*' : 'L *DENIED*'}\nBy: <@${data.user.id}>`,
                },
              },
            ],
          });
        }
      }

      return NextResponse.json({ status: 'ok' });
    }

    return NextResponse.json(
      { error: 'Unsupported content type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling Slack webhook:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
