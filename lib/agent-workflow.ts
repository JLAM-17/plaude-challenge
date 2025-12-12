import { DurableAgent } from '@workflow/ai/agent';
import { getWritable, createWebhook } from 'workflow';
import { agentInstructions } from './agent-instructions';
import { slackApprovalTool, type ApprovalRequest } from './slack-approval-tool';
import type { UIMessageChunk } from 'ai';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Workflow-level wrapper for Slack approval
 * This ensures createWebhook() is called at workflow level, not step level
 */
async function workflowApprovalWrapper(params: ApprovalRequest): Promise<{ approved: boolean; response: string }> {
  // We're already inside 'use workflow' context from agentWorkflow
  // So we can call createWebhook() here

  const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log('=== WORKFLOW APPROVAL WRAPPER ===');
  console.log('Creating webhook at workflow level...');

  // Create webhook at workflow level
  const webhook = createWebhook({ token: approvalId });
  console.log('Webhook created:', webhook.url);

  // Now call the original tool function with the webhook
  const result = await slackApprovalTool.execute(params, approvalId, webhook.url, webhook);

  return result;
}

/**
 * Main agent workflow that handles customer service requests
 * with human-in-the-loop approval via Slack
 *
 * Note: This is a workflow function that must be called via start() from workflow/api
 */
export async function agentWorkflow(messages: Message[]) {
  'use workflow';

  console.log('agentWorkflow called with messages:', messages);

  // Initialize the DurableAgent with Anthropic's Claude model via AI Gateway
  console.log('Initializing DurableAgent...');
  const agent = new DurableAgent({
    model: 'anthropic/claude-3-5-sonnet-20241022',
    system: agentInstructions,
    tools: {
      request_human_approval: {
        description: slackApprovalTool.description,
        inputSchema: slackApprovalTool.inputSchema,
        // Use the workflow-level wrapper instead of direct execute
        execute: workflowApprovalWrapper,
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
export async function agentWorkflowStream(messages: Message[]) {
  'use workflow';

  const agent = new DurableAgent({
    model: 'anthropic/claude-3-5-sonnet-20241022',
    system: agentInstructions,
    tools: {
      request_human_approval: {
        description: slackApprovalTool.description,
        inputSchema: slackApprovalTool.inputSchema,
        // Use the workflow-level wrapper instead of direct execute
        execute: workflowApprovalWrapper,
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
