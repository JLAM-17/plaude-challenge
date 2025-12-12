import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import type { ApprovalRequest } from './slack-approval-tool';

/**
 * Approval Results Storage
 * Stores approval decisions tied to session IDs for later retrieval
 */

// Use /tmp in serverless, .approval-results locally
const STORAGE_DIR = process.env.VERCEL ? '/tmp/approval-results' : path.join(process.cwd(), '.approval-results');
const RESULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Ensure storage directory exists
async function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

export interface ApprovalResult {
  approvalId: string;
  sessionId: string;
  approved: boolean;
  response: string;
  requestDetails: ApprovalRequest;
  timestamp: number;
}

/**
 * Store an approval result for a session
 */
export async function storeApprovalResult(
  approvalId: string,
  sessionId: string,
  data: {
    approved: boolean;
    response: string;
    requestDetails: ApprovalRequest;
  }
): Promise<void> {
  console.log(`📝 Storing approval result for session ${sessionId}, approval ${approvalId}`);

  await ensureStorageDir();

  const result: ApprovalResult = {
    approvalId,
    sessionId,
    approved: data.approved,
    response: data.response,
    requestDetails: data.requestDetails,
    timestamp: Date.now(),
  };

  // Store by session ID (so we can retrieve all results for a session)
  const sessionDir = path.join(STORAGE_DIR, sessionId);
  if (!existsSync(sessionDir)) {
    await fs.mkdir(sessionDir, { recursive: true });
  }

  const filePath = path.join(sessionDir, `${approvalId}.json`);
  await fs.writeFile(filePath, JSON.stringify(result, null, 2));

  console.log(`✅ Stored approval result at ${filePath}`);
}

/**
 * Get all approval results for a session
 */
export async function getApprovalResultsForSession(sessionId: string): Promise<ApprovalResult[]> {
  try {
    const sessionDir = path.join(STORAGE_DIR, sessionId);

    if (!existsSync(sessionDir)) {
      console.log(`🔍 No approval results found for session ${sessionId}`);
      return [];
    }

    const files = await fs.readdir(sessionDir);
    const results: ApprovalResult[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(sessionDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const result: ApprovalResult = JSON.parse(content);

      // Check if expired
      if (Date.now() - result.timestamp > RESULT_TTL) {
        console.log(`⏰ Approval result expired: ${result.approvalId}`);
        await fs.unlink(filePath);
        continue;
      }

      results.push(result);
    }

    console.log(`🔍 Found ${results.length} approval results for session ${sessionId}`);
    return results;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Get a specific approval result by ID
 */
export async function getApprovalResult(approvalId: string, sessionId: string): Promise<ApprovalResult | null> {
  try {
    const filePath = path.join(STORAGE_DIR, sessionId, `${approvalId}.json`);

    if (!existsSync(filePath)) {
      return null;
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const result: ApprovalResult = JSON.parse(content);

    // Check if expired
    if (Date.now() - result.timestamp > RESULT_TTL) {
      console.log(`⏰ Approval result expired: ${approvalId}`);
      await fs.unlink(filePath);
      return null;
    }

    return result;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Clean up expired results (call this periodically or on startup)
 */
export async function cleanupExpiredResults(): Promise<void> {
  try {
    await ensureStorageDir();
    const sessions = await fs.readdir(STORAGE_DIR);

    for (const sessionId of sessions) {
      const sessionDir = path.join(STORAGE_DIR, sessionId);
      const stat = await fs.stat(sessionDir);

      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(sessionDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(sessionDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const result: ApprovalResult = JSON.parse(content);

        if (Date.now() - result.timestamp > RESULT_TTL) {
          console.log(`🗑️  Deleting expired approval result: ${result.approvalId}`);
          await fs.unlink(filePath);
        }
      }

      // Remove empty session directories
      const remainingFiles = await fs.readdir(sessionDir);
      if (remainingFiles.length === 0) {
        console.log(`🗑️  Deleting empty session directory: ${sessionId}`);
        await fs.rmdir(sessionDir);
      }
    }

    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
