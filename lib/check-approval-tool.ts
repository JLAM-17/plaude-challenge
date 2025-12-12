import { z } from 'zod';
import { getApprovalResultsForSession } from './approval-results';

/**
 * Check Approval Status Tool
 * Allows the agent to check if any approval results are available for the session
 */

// Schema for checking approval status
export const checkApprovalSchema = z.object({
  // No parameters needed - uses session ID from context
});

export type CheckApprovalParams = z.infer<typeof checkApprovalSchema>;

/**
 * Check approval status for the current session
 * @param sessionId - The current session ID
 */
export async function checkApprovalStatus(sessionId: string): Promise<{
  hasResults: boolean;
  results: Array<{
    approved: boolean;
    response: string;
    situation: string;
    requestedAction: string;
  }>;
}> {
  console.log(`🔍 Checking approval status for session: ${sessionId}`);

  const results = await getApprovalResultsForSession(sessionId);

  if (results.length === 0) {
    console.log('No approval results found');
    return {
      hasResults: false,
      results: [],
    };
  }

  console.log(`Found ${results.length} approval result(s)`);

  return {
    hasResults: true,
    results: results.map((result) => ({
      approved: result.approved,
      response: result.response,
      situation: result.requestDetails.situation,
      requestedAction: result.requestDetails.requestedAction,
    })),
  };
}

// Export the tool definition for the AI agent
export const checkApprovalTool = {
  description: `Check if Santa has responded to any pending gift requests in this conversation.
Use this tool when the user asks about their request status (e.g., "Did Santa respond?", "What did Santa say?", "Has my request been approved?").
Returns any approval results (approved/denied) that are available for this session.`,
  inputSchema: checkApprovalSchema,
  execute: checkApprovalStatus,
};
