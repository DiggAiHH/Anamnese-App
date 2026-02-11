/**
 * Anthropic → OpenAI Proxy for GitHub Copilot Bridge
 * ===================================================
 * Translates Anthropic Messages API calls to OpenAI Chat Completions API
 * and forwards them to the GitHub Copilot Bridge (Port 18790).
 * 
 * This allows OpenClaw (configured for Anthropic) to use GitHub Copilot Auth.
 * 
 * Usage:
 *   node scripts/anthropic-to-openai-proxy.cjs
 * 
 * Then set: ANTHROPIC_BASE_URL=http://127.0.0.1:18791
 */

const http = require('http');
const https = require('https');

const PROXY_PORT = 18791;
const COPILOT_BRIDGE_URL = 'http://127.0.0.1:18790/v1/chat/completions';

// Anthropic model name → OpenAI model name mapping
const MODEL_MAP = {
  'claude-opus-4-6': 'claude-sonnet', // Map to Copilot Bridge's claude-sonnet
  'claude-sonnet-4-6': 'claude-sonnet',
  'claude-haiku-3-5': 'claude-haiku',
  'claude-3-5-sonnet': 'claude-sonnet',
  'claude-3-haiku': 'claude-haiku',
  'claude': 'claude-sonnet', // Fallback to sonnet
};

/**
 * Convert Anthropic Messages API request to OpenAI Chat Completions format
 */
function anthropicToOpenAI(anthropicBody) {
  const messages = anthropicBody.messages || [];
  const model = MODEL_MAP[anthropicBody.model] || 'claude-sonnet'; // Default to claude-sonnet
  
  return {
    model: model,
    messages: messages.map(msg => ({
      role: msg.role, // role is directly compatible ( or assistant)
      content: typeof msg.content === 'string' 
        ? msg.content 
        : msg.content.map(c => c.type === 'text' ? c.text : '[media]').join('\n')
    })),
    max_tokens: anthropicBody.max_tokens || 4096,
    temperature: anthropicBody.temperature ?? 1.0,
    stream: anthropicBody.stream || false,
    ...(anthropicBody.system && { system: anthropicBody.system }),
  };
}

/**
 * Convert OpenAI response to Anthropic Messages API format
 */
function openAIToAnthropic(openaiBody, requestId) {
  const choice = openaiBody.choices?.[0];
  if (!choice) {
    return {
      type: 'error',
      error: { type: 'invalid_request_error', message: 'No choices in OpenAI response' }
    };
  }

  return {
    id: requestId,
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: choice.message?.content || choice.text || ''
    }],
    model: openaiBody.model,
    stop_reason: choice.finish_reason === 'stop' ? 'end_turn' : choice.finish_reason,
    usage: {
      input_tokens: openaiBody.usage?.prompt_tokens || 0,
      output_tokens: openaiBody.usage?.completion_tokens || 0
    }
  };
}

/**
 * Forward request to Copilot Bridge and return response
 */
function forwardToBridge(openAIRequest, callback) {
  const postData = JSON.stringify(openAIRequest);
  
  const options = {
    hostname: '127.0.0.1',
    port: 18790,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonResponse = JSON.parse(data);
        callback(null, jsonResponse, res.statusCode);
      } catch (err) {
        callback(new Error(`Failed to parse Copilot Bridge response: ${err.message}`));
      }
    });
  });

  req.on('error', (err) => {
    callback(new Error(`Copilot Bridge request failed: ${err.message}`));
  });

  req.write(postData);
  req.end();
}

/**
 * HTTP Server handling Anthropic API requests
 */
const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Accept both /v1/messages (Anthropic) and /v1/chat/completions (OpenAI passthrough)
  if (!req.url.includes('/v1/messages') && !req.url.includes('/v1/chat/completions')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found. Use /v1/messages or /v1/chat/completions' }));
    return;
  }

  let body = '';
  
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const anthropicRequest = JSON.parse(body);
      const requestId = `msg-proxy-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      console.log(`[${new Date().toISOString()}] Anthropic → OpenAI: ${anthropicRequest.model || 'unknown'}`);

      // Convert Anthropic request to OpenAI format
      const openAIRequest = anthropicToOpenAI(anthropicRequest);

      // Forward to Copilot Bridge
      forwardToBridge(openAIRequest, (err, openAIResponse, statusCode) => {
        if (err) {
          console.error(`[${new Date().toISOString()}] ERROR:`, err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            type: 'error',
            error: { type: 'api_error', message: err.message }
          }));
          return;
        }

        // Convert OpenAI response back to Anthropic format
        const anthropicResponse = openAIToAnthropic(openAIResponse, requestId);

        console.log(`[${new Date().toISOString()}] Response sent (${statusCode})`);
        
        res.writeHead(statusCode || 200, {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01' // Fake Anthropic API version header
        });
        res.end(JSON.stringify(anthropicResponse));
      });
      
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Parse error:`, err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        type: 'error',
        error: { type: 'invalid_request_error', message: err.message }
      }));
    }
  });
});

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
  console.log(`║  Anthropic → OpenAI Proxy for GitHub Copilot Bridge         ║`);
  console.log(`╠═══════════════════════════════════════════════════════════════╣`);
  console.log(`║  Listening on:  http://127.0.0.1:${PROXY_PORT}`);
  console.log(`║  Forwards to:   ${COPILOT_BRIDGE_URL}                    ║`);
  console.log(`╠═══════════════════════════════════════════════════════════════╣`);
  console.log(`║  Usage:                                                       ║`);
  console.log(`║    $env:ANTHROPIC_BASE_URL = "http://127.0.0.1:${PROXY_PORT}"     ║`);
  console.log(`║    $env:ANTHROPIC_API_KEY = "dummy"                           ║`);
  console.log(`║    openclaw gateway run                                       ║`);
  console.log(`╚═══════════════════════════════════════════════════════════════╝\n`);
  console.log(`[${new Date().toISOString()}] Proxy ready. Waiting for requests...\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down proxy...');
  server.close(() => {
    console.log('Proxy stopped.');
    process.exit(0);
  });
});
