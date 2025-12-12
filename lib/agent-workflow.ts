import { DurableAgent } from '@workflow/ai/agent';
import { getWritable } from 'workflow';
import { agentInstructions } from './agent-instructions';
import { slackApprovalTool, type ApprovalRequest } from './slack-approval-tool';
import { checkApprovalTool } from './check-approval-tool';
import type { UIMessageChunk } from 'ai';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Workflow-level wrapper for Slack approval
 * Launches background workflow and returns immediately
 *
 * @param sessionId - Current session ID (from workflow context)
 */
function createApprovalWrapper(sessionId: string) {
  return async (params: ApprovalRequest): Promise<{ approved: boolean; response: string; pending: boolean }> {
    console.log('=== WORKFLOW APPROVAL WRAPPER ===');
    console.log('Session ID:', sessionId);

    // Call the approval tool with session ID
    const result = await slackApprovalTool.execute(params, sessionId);

    return result;
  };
}

/**
 * Workflow-level wrapper for checking approval status
 *
 * @param sessionId - Current session ID (from workflow context)
 */
function createCheckApprovalWrapper(sessionId: string) {
  return async (): Promise<any> => {
    console.log('=== CHECK APPROVAL WRAPPER ===');
    console.log('Session ID:', sessionId);

    // Call the check approval tool with session ID
    const result = await checkApprovalTool.execute(sessionId);

    return result;
  };
}

/**
 * Main agent workflow that handles customer service requests
 * with human-in-the-loop approval via Slack
 *
 * @param messages - Conversation messages
 * @param sessionId - Session ID for tracking approvals
 *
 * Note: This is a workflow function that must be called via start() from workflow/api
 */
export async function agentWorkflow(messages: Message[], sessionId: string) {
  'use workflow';

  console.log('agentWorkflow called with messages:', messages);
  console.log('Session ID:', sessionId);

  // Initialize the DurableAgent with Anthropic's Claude model via AI Gateway
  console.log('Initializing DurableAgent...');
  const agent = new DurableAgent({
    model: 'anthropic/claude-3-5-sonnet-20241022',
    system: agentInstructions,
    tools: {
      request_human_approval: {
        description: slackApprovalTool.description,
        inputSchema: slackApprovalTool.inputSchema,
        // Use session-aware wrapper
        execute: createApprovalWrapper(sessionId),
      },
      check_approval_status: {
        description: checkApprovalTool.description,
        inputSchema: checkApprovalTool.inputSchema,
        // Use session-aware wrapper
        execute: createCheckApprovalWrapper(sessionId),
      },
    },
  });
  console.log('DurableAgent initialized successfully');

  // Convert messages to the format expected by DurableAgent
  const formattedMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  // Get writable stream from workflow context - must be called inside workflow
  const writable = getWritable<UIMessageChunk>();

  // Execute the agent with the messages
  // The DurableAgent will handle state persistence automatically
  console.log('Calling agent.stream with formatted messages:', formattedMessages);
  const result = await agent.stream({
    messages: formattedMessages,
    writable,
  });
  console.log('Agent stream result:', JSON.stringify(result, null, 2));

  return result;
}

/**
 * Streaming version of the agent workflow
 * Use this for real-time responses in the UI
 * Note: Don't pass WritableStream as parameter - it's not serializable
 */
export async function agentWorkflowStream(messages: Message[], sessionId: string) {
  'use workflow';

  const agent = new DurableAgent({
    model: 'anthropic/claude-3-5-sonnet-20241022',
    system: agentInstructions,
    tools: {
      request_human_approval: {
        description: slackApprovalTool.description,
        inputSchema: slackApprovalTool.inputSchema,
        // Use session-aware wrapper
        execute: createApprovalWrapper(sessionId),
      },
      check_approval_status: {
        description: checkApprovalTool.description,
        inputSchema: checkApprovalTool.inputSchema,
        // Use session-aware wrapper
        execute: createCheckApprovalWrapper(sessionId),
      },
    },
  });

  // Get writable stream from workflow context
  const writable = getWritable<UIMessageChunk>();

  // Stream the response to the provided writable stream
  const result = await agent.stream({
    messages,
    writable,
  });

  return result;
}
