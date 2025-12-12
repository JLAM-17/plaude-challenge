/**
 * Test script to verify webhook storage is working
 * Run with: npx tsx test-webhook-storage.ts
 */

import { setWebhook, getWebhook, listWebhooks, deleteWebhook } from './lib/webhook-registry';

async function testWebhookStorage() {
  console.log('🧪 Testing Webhook Storage\n');

  // Test 1: Store a webhook
  console.log('Test 1: Storing a webhook...');
  const testApprovalId = 'test_approval_123';
  const testWebhookUrl = 'https://example.com/webhook/test';

  await setWebhook(testApprovalId, testWebhookUrl);
  console.log('✅ Stored webhook\n');

  // Test 2: Retrieve the webhook
  console.log('Test 2: Retrieving the webhook...');
  const retrievedUrl = await getWebhook(testApprovalId);

  if (retrievedUrl === testWebhookUrl) {
    console.log('✅ Retrieved correct webhook URL:', retrievedUrl);
  } else {
    console.log('❌ Retrieved wrong URL. Expected:', testWebhookUrl, 'Got:', retrievedUrl);
  }
  console.log('');

  // Test 3: List all webhooks
  console.log('Test 3: Listing all webhooks...');
  const allWebhooks = await listWebhooks();
  console.log('Available webhooks:', allWebhooks);
  console.log('');

  // Test 4: Delete the webhook
  console.log('Test 4: Deleting the webhook...');
  await deleteWebhook(testApprovalId);
  console.log('✅ Deleted webhook\n');

  // Test 5: Verify deletion
  console.log('Test 5: Verifying deletion...');
  const deletedUrl = await getWebhook(testApprovalId);

  if (deletedUrl === null) {
    console.log('✅ Webhook successfully deleted');
  } else {
    console.log('❌ Webhook still exists:', deletedUrl);
  }
  console.log('');

  // Test 6: Simulate rapid storage and retrieval (like in production)
  console.log('Test 6: Rapid storage and retrieval (production simulation)...');
  const rapidTestId = `approval_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const rapidTestUrl = 'https://example.com/webhook/rapid-test';

  console.log('Approval ID:', rapidTestId);

  // Store
  const startStore = Date.now();
  await setWebhook(rapidTestId, rapidTestUrl);
  const storeTime = Date.now() - startStore;
  console.log(`Storage time: ${storeTime}ms`);

  // Immediate retrieval (like Slack webhook would do)
  const startRetrieve = Date.now();
  const rapidRetrievedUrl = await getWebhook(rapidTestId);
  const retrieveTime = Date.now() - startRetrieve;
  console.log(`Retrieval time: ${retrieveTime}ms`);

  if (rapidRetrievedUrl === rapidTestUrl) {
    console.log('✅ Rapid storage and retrieval works!');
  } else {
    console.log('❌ Rapid retrieval failed. Expected:', rapidTestUrl, 'Got:', rapidRetrievedUrl);
  }

  // Clean up
  await deleteWebhook(rapidTestId);
  console.log('');

  // Test 7: Check storage directory
  console.log('Test 7: Checking storage directory...');
  const storageDir = process.env.VERCEL ? '/tmp/webhooks' : '.webhook-cache';
  console.log('Storage directory:', storageDir);

  try {
    const fs = require('fs');
    if (fs.existsSync(storageDir)) {
      console.log('✅ Storage directory exists');
      const files = fs.readdirSync(storageDir);
      console.log('Files in storage:', files.length);
      console.log('Files:', files);
    } else {
      console.log('❌ Storage directory does not exist');
    }
  } catch (error) {
    console.log('❌ Error checking storage directory:', error);
  }

  console.log('\n🏁 Tests complete!');
}

testWebhookStorage().catch(console.error);
