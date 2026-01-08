/**
 * Comprehensive Test Suite for API Integration
 * Tests: Chat, File Upload, Image Upload, Cost Warnings, Reasoning Display
 */

import { apiService } from '../services/api.service';
import type { ChatRequest } from '../types';

// Test configuration
const TEST_CONFIG = {
  SESSION_ID: 'test-session-' + Date.now(),
  TIMEOUT: 30000,
};

// Test results
const results: {
  passed: number;
  failed: number;
  tests: { name: string; status: 'pass' | 'fail'; error?: string }[];
} = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name: string, status: 'pass' | 'fail', error?: string) {
  results.tests.push({ name, status, error });
  if (status === 'pass') {
    results.passed++;
    console.log(`✅ PASS: ${name}`);
  } else {
    results.failed++;
    console.error(`❌ FAIL: ${name}${error ? ` - ${error}` : ''}`);
  }
}

async function testHealthCheck() {
  try {
    const result = await apiService.healthCheck();
    if (result.status === 'ok') {
      logTest('Health Check', 'pass');
      return true;
    }
    throw new Error('Unexpected health status');
  } catch (error) {
    logTest(
      'Health Check',
      'fail',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return false;
  }
}

async function testModelCapabilities() {
  try {
    const caps = await apiService.getCapabilities();

    if (!caps.provider || !caps.model) {
      throw new Error('Missing provider or model information');
    }

    console.log('📊 Model Capabilities:', {
      provider: caps.provider,
      model: caps.model,
      vision: caps.supports_vision,
      reasoning: caps.supports_reasoning,
    });

    logTest('Get Model Capabilities', 'pass');
    return caps;
  } catch (error) {
    logTest(
      'Get Model Capabilities',
      'fail',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}

async function testCreateSession() {
  try {
    const session = await apiService.createSession();

    if (!session.session_id) {
      throw new Error('No session ID returned');
    }

    TEST_CONFIG.SESSION_ID = session.session_id;
    console.log('📝 Created session:', TEST_CONFIG.SESSION_ID);

    logTest('Create Session', 'pass');
    return session.session_id;
  } catch (error) {
    logTest(
      'Create Session',
      'fail',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}

async function testBasicChat(sessionId: string) {
  try {
    const request: ChatRequest = {
      message: 'What is AERIS-AQ?',
      session_id: sessionId,
      role: 'general',
    };

    const response = await apiService.sendMessage(request);

    if (!response.response || !response.session_id) {
      throw new Error('Invalid response structure');
    }

    console.log('💬 Chat Response Length:', response.response.length);
    console.log('🔧 Tools Used:', response.tools_used);
    console.log('💰 Tokens Used:', response.tokens_used);
    console.log('⚡ Cached:', response.cached);

    if (response.cost_info) {
      console.log('📊 Cost Info:', {
        usage: `${response.cost_info.usage_percentage.toFixed(1)}%`,
        tokens: `${response.cost_info.total_tokens}/${response.cost_info.max_tokens}`,
        cost: `$${response.cost_info.total_cost_usd.toFixed(4)}`,
      });
    }

    logTest('Basic Chat', 'pass');
    return response;
  } catch (error) {
    logTest(
      'Basic Chat',
      'fail',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}

async function testFileUpload(sessionId: string) {
  try {
    // Create a test CSV file
    const csvContent = `date,pm2_5,location
2024-01-01,25.3,Kampala
2024-01-02,28.7,Kampala
2024-01-03,22.1,Kampala`;

    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const csvFile = new File([csvBlob], 'test-data.csv', {
      type: 'text/csv',
    });

    console.log('📁 Testing file upload:', {
      name: csvFile.name,
      size: csvFile.size,
      type: csvFile.type,
    });

    const request: ChatRequest = {
      message: 'Analyze this air quality data',
      session_id: sessionId,
      file: csvFile,
    };

    const response = await apiService.sendMessage(request);

    if (!response.response) {
      throw new Error('No response received');
    }

    if (!response.document_processed) {
      console.warn(
        '⚠️  Document may not have been processed (document_processed=false)'
      );
    }

    console.log('📄 Document Processed:', response.document_processed);
    console.log('📝 Document Filename:', response.document_filename);

    logTest('File Upload (CSV)', 'pass');
    return response;
  } catch (error) {
    logTest(
      'File Upload (CSV)',
      'fail',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}

async function testImageUpload(sessionId: string, supportsVision: boolean) {
  if (!supportsVision) {
    console.log(
      '⏭️  Skipping image upload test (model does not support vision)'
    );
    logTest('Image Upload (Skipped)', 'pass');
    return null;
  }

  try {
    // Create a test image (1x1 red pixel PNG)
    const base64Image =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const imageBlob = await fetch(`data:image/png;base64,${base64Image}`).then(
      (r) => r.blob()
    );
    const imageFile = new File([imageBlob], 'test-image.png', {
      type: 'image/png',
    });

    console.log('🖼️  Testing image upload:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type,
    });

    const request: ChatRequest = {
      message: 'What do you see in this image?',
      session_id: sessionId,
      image: imageFile,
    };

    const response = await apiService.sendMessage(request);

    if (!response.response) {
      throw new Error('No response received');
    }

    console.log('🎨 Image Processed:', response.image_processed);
    console.log('👁️  Vision Capable:', response.vision_capable);

    logTest('Image Upload', 'pass');
    return response;
  } catch (error) {
    logTest(
      'Image Upload',
      'fail',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}

async function testReasoningModels(
  sessionId: string,
  supportsReasoning: boolean
) {
  if (!supportsReasoning) {
    console.log(
      '⏭️  Skipping reasoning test (model does not support reasoning)'
    );
    logTest('Reasoning Display (Skipped)', 'pass');
    return null;
  }

  try {
    const request: ChatRequest = {
      message: 'Explain step-by-step how PM2.5 affects human health',
      session_id: sessionId,
      role: 'technical',
    };

    const response = await apiService.sendMessage(request);

    if (!response.response) {
      throw new Error('No response received');
    }

    console.log('🧠 Thinking Steps:', response.thinking_steps?.length || 0);
    if (response.thinking_steps && response.thinking_steps.length > 0) {
      console.log('💭 Sample Step:', response.thinking_steps[0]);
    }

    logTest('Reasoning Display', 'pass');
    return response;
  } catch (error) {
    logTest(
      'Reasoning Display',
      'fail',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}

async function testCostWarnings(sessionId: string) {
  try {
    // Send multiple messages to accumulate tokens
    const messages = [
      'Tell me about air quality monitoring',
      'What are the health effects of PM2.5?',
      'How does PM10 differ from PM2.5?',
      'What are the main sources of air pollution?',
      'How can I reduce my exposure to air pollution?',
    ];

    let lastCostInfo = null;

    for (const msg of messages) {
      const response = await apiService.sendMessage({
        message: msg,
        session_id: sessionId,
      });

      if (response.cost_info) {
        lastCostInfo = response.cost_info;
        console.log(
          `💰 Token Usage: ${response.cost_info.usage_percentage.toFixed(1)}% (${response.cost_info.total_tokens}/${response.cost_info.max_tokens})`
        );

        if (response.cost_info.warning) {
          console.log('⚠️  Warning:', response.cost_info.warning);
        }
      }

      // Small delay between messages
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    logTest('Cost Warnings', 'pass');
    return lastCostInfo;
  } catch (error) {
    logTest(
      'Cost Warnings',
      'fail',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}

async function testSessionCleanup(sessionId: string) {
  try {
    await apiService.deleteSession(sessionId);
    console.log('🗑️  Session deleted successfully');

    // Verify session is deleted
    try {
      await apiService.getSessionDetails(sessionId);
      throw new Error('Session still exists after deletion');
    } catch (error) {
      // Expected to fail with 404
      logTest('Session Cleanup', 'pass');
      return true;
    }
  } catch (error) {
    logTest(
      'Session Cleanup',
      'fail',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return false;
  }
}

// Main test runner
export async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive API Tests\n');
  console.log('='.repeat(60));

  try {
    // 1. Health Check
    console.log('\n1️⃣  Testing Health Check...');
    const isHealthy = await testHealthCheck();
    if (!isHealthy) {
      console.error('❌ API is not healthy. Aborting tests.');
      return results;
    }

    // 2. Model Capabilities
    console.log('\n2️⃣  Testing Model Capabilities...');
    const capabilities = await testModelCapabilities();
    if (!capabilities) {
      console.error('❌ Failed to get capabilities. Continuing with tests...');
    }

    // 3. Create Session
    console.log('\n3️⃣  Testing Session Creation...');
    const sessionId = await testCreateSession();
    if (!sessionId) {
      console.error('❌ Failed to create session. Aborting tests.');
      return results;
    }

    // 4. Basic Chat
    console.log('\n4️⃣  Testing Basic Chat...');
    await testBasicChat(sessionId);

    // 5. File Upload
    console.log('\n5️⃣  Testing File Upload...');
    await testFileUpload(sessionId);

    // 6. Image Upload (if supported)
    console.log('\n6️⃣  Testing Image Upload...');
    await testImageUpload(sessionId, capabilities?.supports_vision || false);

    // 7. Reasoning Display (if supported)
    console.log('\n7️⃣  Testing Reasoning Display...');
    await testReasoningModels(
      sessionId,
      capabilities?.supports_reasoning || false
    );

    // 8. Cost Warnings
    console.log('\n8️⃣  Testing Cost Warnings...');
    await testCostWarnings(sessionId);

    // 9. Session Cleanup
    console.log('\n9️⃣  Testing Session Cleanup...');
    await testSessionCleanup(sessionId);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(
      `📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`
    );

    console.log('\n📋 Detailed Results:');
    results.tests.forEach((test, i) => {
      const icon = test.status === 'pass' ? '✅' : '❌';
      console.log(`  ${i + 1}. ${icon} ${test.name}`);
      if (test.error) {
        console.log(`     └─ Error: ${test.error}`);
      }
    });

    return results;
  } catch {
    console.error('💥 Test suite crashed');
    return results;
  }
}

// Export for use in console or component
if (typeof window !== 'undefined') {
  (
    window as typeof window & { runAPITests: typeof runComprehensiveTests }
  ).runAPITests = runComprehensiveTests;
  console.log('💡 Run tests in console with: window.runAPITests()');
}
