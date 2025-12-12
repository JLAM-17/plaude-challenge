import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Webhook Registry using file-based storage for persistence
 * Works in both development and production environments
 * In production (Vercel), consider using Vercel KV for better performance
 */

// Use /tmp in serverless, .webhook-cache locally
const STORAGE_DIR = process.env.VERCEL ? '/tmp/webhooks' : path.join(process.cwd(), '.webhook-cache');
const WEBHOOK_TTL = 3600000; // 1 hour in milliseconds

// Ensure storage directory exists
async function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

interface WebhookData {
  url: string;
  timestamp: number;
}

/**
 * Store a webhook URL for an approval ID
 */
export async function setWebhook(approvalId: string, webhookUrl: string): Promise<void> {
  console.log(`📝 Attempting to store webhook for ${approvalId}`);
  console.log(`   Storage directory: ${STORAGE_DIR}`);
  console.log(`   Process CWD: ${process.cwd()}`);
  console.log(`   VERCEL env: ${process.env.VERCEL}`);

  await ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, `${approvalId}.json`);
  const data: WebhookData = {
    url: webhookUrl,
    timestamp: Date.now(),
  };

  console.log(`   Writing to file: ${filePath}`);
  await fs.writeFile(filePath, JSON.stringify(data));

  // Verify the file was written
  const exists = existsSync(filePath);
  console.log(`   File exists after write: ${exists}`);

  if (exists) {
    const content = await fs.readFile(filePath, 'utf-8');
    console.log(`   File content: ${content}`);
  }

  console.log(`✅ Stored webhook for ${approvalId} in file storage`);
}

/**
 * Retrieve a webhook URL for an approval ID
 */
export async function getWebhook(approvalId: string): Promise<string | null> {
  try {
    const filePath = path.join(STORAGE_DIR, `${approvalId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data: WebhookData = JSON.parse(fileContent);

    // Check if expired
    if (Date.now() - data.timestamp > WEBHOOK_TTL) {
      console.log(`⏰ Webhook expired for ${approvalId}`);
      await deleteWebhook(approvalId);
      return null;
    }

    console.log(`🔍 Retrieved webhook for ${approvalId}: Found`);
    return data.url;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`🔍 Retrieved webhook for ${approvalId}: Not found`);
      return null;
    }
    throw error;
  }
}

/**
 * Delete a webhook URL after it's been used
 */
export async function deleteWebhook(approvalId: string): Promise<void> {
  try {
    const filePath = path.join(STORAGE_DIR, `${approvalId}.json`);
    await fs.unlink(filePath);
    console.log(`🗑️  Deleted webhook for ${approvalId} from file storage`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * List all approval IDs (for debugging)
 */
export async function listWebhooks(): Promise<string[]> {
  try {
    await ensureStorageDir();
    const files = await fs.readdir(STORAGE_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (error) {
    return [];
  }
}
