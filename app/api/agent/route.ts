import { NextRequest } from 'next/server';
import { start } from 'workflow/api';
import { agentWorkflow, type Message } from '@/lib/agent-workflow';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

/**
 * POST /api/agent
 * Main endpoint for interacting with the AI agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }

    // Ensure messages are serializable (plain objects only)
    const serializedMessages: Message[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Start the workflow using the workflow API
    // The workflow will create its own writable stream using getWritable()
    console.log('Starting workflow with messages:', serializedMessages);
    const run = await start(agentWorkflow, [serializedMessages]);
    console.log('Workflow run started:', run.runId);

    // Wait for the workflow to complete and get the return value
    const result = await run.returnValue;
    console.log('Workflow result:', JSON.stringify(result, null, 2));

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error in agent route:', error);
    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
