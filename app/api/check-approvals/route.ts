import { NextRequest } from 'next/server';
import { getApprovalResultsForSession } from '@/lib/approval-results';

export const runtime = 'nodejs';

/**
 * GET /api/check-approvals?sessionId=xxx
 * Lightweight endpoint to check for approval results without invoking the agent
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return Response.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const results = await getApprovalResultsForSession(sessionId);

    return Response.json({
      success: true,
      hasResults: results.length > 0,
      results: results.map(result => ({
        approvalId: result.approvalId,
        approved: result.approved,
        response: result.response,
        situation: result.requestDetails.situation,
        requestedAction: result.requestDetails.requestedAction,
        timestamp: result.timestamp,
      })),
    });
  } catch (error) {
    console.error('Error checking approvals:', error);
    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}