import { NextRequest } from 'next/server';
import { listWebhooks, getWebhook } from '@/lib/webhook-registry';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

/**
 * GET /api/debug/webhooks
 * Debug endpoint to inspect webhook storage
 */
export async function GET(request: NextRequest) {
  try {
    const storageDir = process.env.VERCEL
      ? '/tmp/webhooks'
      : path.join(process.cwd(), '.webhook-cache');

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV,
        processId: process.pid,
        cwd: process.cwd(),
      },
      storage: {
        directory: storageDir,
        exists: fs.existsSync(storageDir),
        files: [] as string[],
        webhooks: [] as any[],
      },
    };

    if (fs.existsSync(storageDir)) {
      const files = fs.readdirSync(storageDir);
      diagnostics.storage.files = files;

      // Read each webhook
      const webhookIds = await listWebhooks();
      for (const id of webhookIds) {
        const url = await getWebhook(id);
        const filePath = path.join(storageDir, `${id}.json`);
        const content = fs.readFileSync(filePath, 'utf-8');
        diagnostics.storage.webhooks.push({
          id,
          url,
          file: filePath,
          content: JSON.parse(content),
        });
      }
    }

    return Response.json(diagnostics, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to get diagnostics',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/debug/webhooks?id=xxx
 * Delete a specific webhook or all webhooks
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const approvalId = searchParams.get('id');

    if (!approvalId) {
      // Delete all webhooks
      const storageDir = process.env.VERCEL
        ? '/tmp/webhooks'
        : path.join(process.cwd(), '.webhook-cache');

      if (fs.existsSync(storageDir)) {
        const files = fs.readdirSync(storageDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(storageDir, file));
          }
        }
        return Response.json({ message: `Deleted ${files.length} webhooks` });
      }
      return Response.json({ message: 'No webhooks to delete' });
    } else {
      // Delete specific webhook
      const { deleteWebhook } = await import('@/lib/webhook-registry');
      await deleteWebhook(approvalId);
      return Response.json({ message: `Deleted webhook ${approvalId}` });
    }
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to delete webhooks',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
