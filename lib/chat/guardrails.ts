/**
 * AI Safety Guardrails - Input Validation & Prompt Injection Detection
 *
 * This module provides security layers to protect against:
 * - Prompt injection attacks
 * - Jailbreak attempts
 * - Harmful content requests
 * - System prompt extraction attempts
 */

// Note: LLM-based validation moved to research-agent.ts to avoid import issues

export interface GuardrailResult {
  safe: boolean;
  reason?: string;
  category?: 'prompt_injection' | 'jailbreak' | 'harmful_content' | 'system_extraction' | 'off_topic';
  confidence: number;
}

// Patterns that indicate prompt injection attempts
const INJECTION_PATTERNS = [
  // Direct instruction override attempts
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,

  // Role-playing injection
  /you\s+are\s+now\s+(a|an|the)\s+/i,
  /pretend\s+(you('re|are)|to\s+be)\s+/i,
  /act\s+as\s+(if\s+you('re|are)|a|an)\s+/i,
  /roleplay\s+as\s+/i,

  // System prompt extraction
  /what\s+(is|are)\s+your\s+(system\s+)?prompt/i,
  /show\s+me\s+your\s+(system\s+)?prompt/i,
  /reveal\s+your\s+(system\s+)?instructions/i,
  /what\s+were\s+you\s+told/i,
  /repeat\s+(your\s+)?(initial|system)\s+(instructions?|prompt)/i,

  // Delimiter injection
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
  /###\s*(SYSTEM|INSTRUCTION)/i,

  // Jailbreak patterns
  /DAN\s*mode/i,
  /developer\s*mode/i,
  /do\s+anything\s+now/i,
  /jailbreak/i,
  /bypass\s+(your\s+)?(restrictions?|filters?|rules?)/i,
  /unlock\s+(your\s+)?capabilities/i,
];

// Patterns for harmful content requests
const HARMFUL_PATTERNS = [
  /how\s+to\s+(make|create|build)\s+(a\s+)?(bomb|explosive|weapon)/i,
  /how\s+to\s+hack\s+(into|someone)/i,
  /how\s+to\s+(steal|phish)\s+(credentials?|passwords?|identity)/i,
  /generate\s+(malware|virus|ransomware)/i,
];

// Keywords that might indicate off-topic queries (not system design related)
const OFF_TOPIC_INDICATORS = [
  /write\s+(me\s+)?(a\s+)?(poem|story|song|essay)\s+about/i,
  /tell\s+me\s+a\s+joke/i,
  /what('s| is)\s+the\s+weather/i,
  /who\s+won\s+(the|last)\s+(game|match|election)/i,
];

/**
 * Calculate string similarity using Levenshtein distance
 * Used to detect obfuscated injection attempts
 */
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }

  return (longer.length - costs[longer.length]) / longer.length;
}

/**
 * Detect common obfuscation techniques
 */
function deobfuscate(input: string): string {
  return input
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Replace common character substitutions
    .replace(/[0O]/g, 'o')
    .replace(/[1l|]/g, 'i')
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/[3]/g, 'e')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check for suspicious character patterns that might indicate injection
 */
function hasSuspiciousPatterns(input: string): boolean {
  // Check for unusual Unicode characters that might be used for injection
  const suspiciousUnicode = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/;
  if (suspiciousUnicode.test(input)) return true;

  // Check for excessive use of special characters
  const specialCharRatio = (input.match(/[^a-zA-Z0-9\s.,!?-]/g) || []).length / input.length;
  if (specialCharRatio > 0.3) return true;

  // Check for code-like patterns that might be injection attempts
  const codePatterns = /(\{|\}|\[|\]|<|>|\\n|\\r|\\t){3,}/;
  if (codePatterns.test(input)) return true;

  return false;
}

/**
 * Main validation function - checks input against all guardrails
 */
export function validateInput(input: string): GuardrailResult {
  // Normalize input for checking
  const normalizedInput = deobfuscate(input.toLowerCase());

  // Check for prompt injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input) || pattern.test(normalizedInput)) {
      return {
        safe: false,
        reason: 'Detected potential prompt injection attempt',
        category: 'prompt_injection',
        confidence: 0.9,
      };
    }
  }

  // Check for harmful content requests
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(input) || pattern.test(normalizedInput)) {
      return {
        safe: false,
        reason: 'Request for potentially harmful content',
        category: 'harmful_content',
        confidence: 0.95,
      };
    }
  }

  // Check for suspicious patterns
  if (hasSuspiciousPatterns(input)) {
    return {
      safe: false,
      reason: 'Suspicious character patterns detected',
      category: 'prompt_injection',
      confidence: 0.7,
    };
  }

  // Check for off-topic queries (soft warning, still allows through)
  for (const pattern of OFF_TOPIC_INDICATORS) {
    if (pattern.test(input)) {
      // This is a soft check - we return safe but note it's off-topic
      return {
        safe: true,
        reason: 'Query may be off-topic for system design',
        category: 'off_topic',
        confidence: 0.6,
      };
    }
  }

  // Input passed all checks
  return {
    safe: true,
    confidence: 1.0,
  };
}

/**
 * Sanitize input by removing potentially dangerous content
 * while preserving the user's intent for legitimate queries
 */
export function sanitizeInput(input: string): string {
  return input
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Remove control characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a safe rejection message based on the guardrail result
 */
export function getBlockedMessage(result: GuardrailResult): string {
  switch (result.category) {
    case 'prompt_injection':
      return "I noticed your message contains patterns that look like they might be trying to modify my behavior. I'm designed to help with system design questions. Could you rephrase your question?";
    case 'jailbreak':
      return "I'm designed to be a helpful system design assistant. I can't modify my core behavior, but I'm happy to help with any system design questions you have!";
    case 'harmful_content':
      return "I can't help with that request. I'm here to assist with system design topics. Is there a system design question I can help you with?";
    case 'system_extraction':
      return "I'm a system design assistant built to help you learn about distributed systems, databases, and software architecture. What would you like to learn about?";
    case 'off_topic':
      return "That seems a bit outside my specialty! I'm focused on system design topics like distributed systems, databases, caching, load balancing, and software architecture. Feel free to ask about any of those!";
    default:
      return "I couldn't process that request. Could you try asking a system design question?";
  }
}

/**
 * AI-powered relevance check for system design queries
 * Uses LLM to validate if a question is actually about system design
 */
export interface RelevanceCheckResult {
  isRelevant: boolean;
  confidence: number;
  reason: string;
  suggestedTopic?: string;
}

export function checkQueryRelevance(query: string): RelevanceCheckResult {
  // Fast rule-based checks (no LLM call needed)
  const trimmed = query.trim();

  // Too short to be a real question
  if (trimmed.length < 10) {
    return {
      isRelevant: false,
      confidence: 0.95,
      reason: 'Query is too short to be a meaningful system design question',
      suggestedTopic: 'Try asking something like "How would you design a URL shortener?" or "What is database sharding?"',
    };
  }

  // Check if it looks like gibberish (no vowels or too many repeated chars)
  const vowelCount = (trimmed.match(/[aeiou]/gi) || []).length;
  const vowelRatio = vowelCount / trimmed.length;
  if (vowelRatio < 0.1 && trimmed.length > 5) {
    return {
      isRelevant: false,
      confidence: 0.85,
      reason: 'Query appears to be gibberish',
      suggestedTopic: 'Try asking a question about system design, like "How does a load balancer work?"',
    };
  }

  // Check if it contains any system design keywords (using word stems for better matching)
  const systemDesignKeywords = [
    'design', 'system', 'architect', 'scal', 'databas', 'cach', 'load balanc',
    'microservice', 'api', 'distribut', 'shard', 'replica', 'availab',
    'consisten', 'partition', 'queue', 'message', 'notif', 'cdn', 'latenc',
    'throughput', 'redis', 'kafka', 'kubernetes', 'k8s', 'docker', 'aws', 'cloud',
    'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'rest', 'graphql', 'grpc',
    'authenticat', 'authoriz', 'oauth', 'jwt', 'websocket', 'stream',
    'server', 'client', 'http', 'request', 'response', 'backend', 'frontend',
    'storage', 'memory', 'disk', 'network', 'protocol', 'service', 'container',
    'deploy', 'cluster', 'node', 'failover', 'backup', 'recover',
    'rate limit', 'throttl', 'circuit break', 'retry', 'timeout', 'proxy',
    'encrypt', 'hash', 'token', 'session', 'cookie', 'ssl', 'tls', 'https',
    'index', 'query', 'optim', 'performance', 'concurren', 'thread', 'async',
  ];

  const queryLower = query.toLowerCase();
  const hasKeyword = systemDesignKeywords.some(kw => queryLower.includes(kw));

  // Check for question words that indicate a real question
  const questionPatterns = /^(how|what|why|when|where|which|can|could|would|should|is|are|do|does|explain|describe|design)/i;
  const isQuestion = questionPatterns.test(trimmed);

  // If it has keywords and is a question, it's relevant
  if (hasKeyword) {
    return {
      isRelevant: true,
      confidence: 0.9,
      reason: 'Query contains system design keywords',
    };
  }

  // If it's a question but no keywords, check length
  if (isQuestion && trimmed.length > 20) {
    return {
      isRelevant: true,
      confidence: 0.6,
      reason: 'Query is a question, allowing through',
    };
  }

  // Short queries without keywords are likely off-topic
  if (trimmed.length < 25 && !hasKeyword) {
    return {
      isRelevant: false,
      confidence: 0.7,
      reason: 'Query is too short and lacks system design context',
      suggestedTopic: 'Try asking about: "How to design a notification system" or "What is database sharding?"',
    };
  }

  // Default: allow through for longer queries
  return {
    isRelevant: true,
    confidence: 0.5,
    reason: 'Allowing query through',
  };
}

/**
 * Get a friendly message for off-topic queries
 */
export function getOffTopicMessage(result: RelevanceCheckResult): string {
  let message = "That doesn't seem to be a system design question. I'm specialized in helping with software architecture and distributed systems.\n\n";

  if (result.suggestedTopic) {
    message += `💡 **Try asking:** ${result.suggestedTopic}`;
  } else {
    message += "💡 **Try asking about:**\n";
    message += "- How to design a URL shortener\n";
    message += "- What is database sharding?\n";
    message += "- How does a CDN work?\n";
    message += "- Design a notification system";
  }

  return message;
}

/**
 * Rate limiting helper - tracks request frequency
 * In production, this would use Redis or similar
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 20,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetIn: record.resetTime - now
  };
}
