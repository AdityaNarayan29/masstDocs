/**
 * RAG Evaluation Pipeline
 *
 * Tests the RAG pipeline's accuracy against known Q&A pairs.
 * Measures: retrieval precision, answer relevance, response quality.
 *
 * Usage:
 *   pnpm run evaluate-rag
 *   pnpm run evaluate-rag --verbose
 *   pnpm run evaluate-rag --output results.json
 */

import { config } from 'dotenv';
config();

import { retrieveContext } from '../lib/chat/context';
import { getGroqClient, GROQ_MODEL } from '../lib/chat/groq';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface TestCase {
  id: string;
  question: string;
  expectedKeywords: string[];
  expectedTopics: string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface RetrievalResult {
  testId: string;
  question: string;
  retrievedDocs: number;
  keywordHits: number;
  keywordTotal: number;
  keywordPrecision: number;
  topicCoverage: number;
  avgScore: number;
  latencyMs: number;
}

interface AnswerEvaluation {
  testId: string;
  question: string;
  relevanceScore: number;
  coherenceScore: number;
  completenessScore: number;
  overallScore: number;
  latencyMs: number;
}

interface EvaluationReport {
  timestamp: string;
  totalTests: number;
  retrieval: {
    avgPrecision: number;
    avgTopicCoverage: number;
    avgLatencyMs: number;
    byCategory: Record<string, { precision: number; coverage: number }>;
    byDifficulty: Record<string, { precision: number; coverage: number }>;
  };
  answers: {
    avgRelevance: number;
    avgCoherence: number;
    avgCompleteness: number;
    avgOverall: number;
    avgLatencyMs: number;
  };
  details: {
    retrieval: RetrievalResult[];
    answers: AnswerEvaluation[];
  };
}

// Test cases for system design RAG evaluation
const TEST_CASES: TestCase[] = [
  // Easy - Direct lookups
  {
    id: 'easy-1',
    question: 'What is load balancing?',
    expectedKeywords: ['load', 'balancer', 'traffic', 'distribute', 'server'],
    expectedTopics: ['load balancing', 'scalability'],
    category: 'fundamentals',
    difficulty: 'easy',
  },
  {
    id: 'easy-2',
    question: 'What is caching?',
    expectedKeywords: ['cache', 'memory', 'fast', 'store', 'data'],
    expectedTopics: ['caching', 'performance'],
    category: 'fundamentals',
    difficulty: 'easy',
  },
  {
    id: 'easy-3',
    question: 'What is a CDN?',
    expectedKeywords: ['content', 'delivery', 'network', 'edge', 'latency'],
    expectedTopics: ['CDN', 'content delivery'],
    category: 'fundamentals',
    difficulty: 'easy',
  },
  {
    id: 'easy-4',
    question: 'What is database sharding?',
    expectedKeywords: ['shard', 'partition', 'database', 'horizontal', 'scale'],
    expectedTopics: ['sharding', 'database'],
    category: 'databases',
    difficulty: 'easy',
  },
  {
    id: 'easy-5',
    question: 'What is a message queue?',
    expectedKeywords: ['queue', 'message', 'async', 'producer', 'consumer'],
    expectedTopics: ['message queue', 'async'],
    category: 'fundamentals',
    difficulty: 'easy',
  },

  // Medium - Conceptual understanding
  {
    id: 'med-1',
    question: 'How does consistent hashing work?',
    expectedKeywords: ['consistent', 'hash', 'ring', 'node', 'virtual'],
    expectedTopics: ['consistent hashing', 'distributed systems'],
    category: 'distributed-systems',
    difficulty: 'medium',
  },
  {
    id: 'med-2',
    question: 'What is the CAP theorem?',
    expectedKeywords: ['CAP', 'consistency', 'availability', 'partition', 'tolerance'],
    expectedTopics: ['CAP theorem', 'distributed systems'],
    category: 'distributed-systems',
    difficulty: 'medium',
  },
  {
    id: 'med-3',
    question: 'How do you handle database replication?',
    expectedKeywords: ['replication', 'master', 'slave', 'replica', 'sync'],
    expectedTopics: ['replication', 'database'],
    category: 'databases',
    difficulty: 'medium',
  },
  {
    id: 'med-4',
    question: 'What are microservices?',
    expectedKeywords: ['microservice', 'service', 'independent', 'deploy', 'API'],
    expectedTopics: ['microservices', 'architecture'],
    category: 'architecture',
    difficulty: 'medium',
  },
  {
    id: 'med-5',
    question: 'How does rate limiting work?',
    expectedKeywords: ['rate', 'limit', 'throttle', 'request', 'bucket'],
    expectedTopics: ['rate limiting', 'API'],
    category: 'fundamentals',
    difficulty: 'medium',
  },

  // Hard - System design questions
  {
    id: 'hard-1',
    question: 'How would you design a URL shortener?',
    expectedKeywords: ['URL', 'short', 'hash', 'redirect', 'database'],
    expectedTopics: ['URL shortener', 'system design'],
    category: 'system-design',
    difficulty: 'hard',
  },
  {
    id: 'hard-2',
    question: 'How would you design a chat application?',
    expectedKeywords: ['chat', 'message', 'websocket', 'real-time', 'user'],
    expectedTopics: ['chat', 'real-time', 'messaging'],
    category: 'system-design',
    difficulty: 'hard',
  },
  {
    id: 'hard-3',
    question: 'How would you design a notification system?',
    expectedKeywords: ['notification', 'push', 'queue', 'delivery', 'user'],
    expectedTopics: ['notification', 'push', 'system design'],
    category: 'system-design',
    difficulty: 'hard',
  },
  {
    id: 'hard-4',
    question: 'How do you handle high availability?',
    expectedKeywords: ['availability', 'redundancy', 'failover', 'replica', 'uptime'],
    expectedTopics: ['high availability', 'reliability'],
    category: 'distributed-systems',
    difficulty: 'hard',
  },
  {
    id: 'hard-5',
    question: 'How would you design a distributed cache?',
    expectedKeywords: ['cache', 'distributed', 'consistent', 'hash', 'eviction'],
    expectedTopics: ['caching', 'distributed systems'],
    category: 'distributed-systems',
    difficulty: 'hard',
  },

  // Additional test cases
  {
    id: 'med-6',
    question: 'What is eventual consistency?',
    expectedKeywords: ['eventual', 'consistency', 'distributed', 'sync', 'conflict'],
    expectedTopics: ['consistency', 'distributed systems'],
    category: 'distributed-systems',
    difficulty: 'medium',
  },
  {
    id: 'med-7',
    question: 'How do API gateways work?',
    expectedKeywords: ['API', 'gateway', 'route', 'authentication', 'proxy'],
    expectedTopics: ['API gateway', 'microservices'],
    category: 'architecture',
    difficulty: 'medium',
  },
  {
    id: 'hard-6',
    question: 'How would you design Netflix?',
    expectedKeywords: ['video', 'streaming', 'CDN', 'encoding', 'recommendation'],
    expectedTopics: ['video streaming', 'CDN', 'recommendation'],
    category: 'system-design',
    difficulty: 'hard',
  },
  {
    id: 'easy-6',
    question: 'What is horizontal scaling?',
    expectedKeywords: ['horizontal', 'scale', 'server', 'add', 'load'],
    expectedTopics: ['scaling', 'horizontal'],
    category: 'fundamentals',
    difficulty: 'easy',
  },
  {
    id: 'easy-7',
    question: 'What is vertical scaling?',
    expectedKeywords: ['vertical', 'scale', 'CPU', 'memory', 'upgrade'],
    expectedTopics: ['scaling', 'vertical'],
    category: 'fundamentals',
    difficulty: 'easy',
  },
];

// Utility functions
function calculateKeywordPrecision(
  content: string,
  keywords: string[]
): { hits: number; total: number; precision: number } {
  const contentLower = content.toLowerCase();
  let hits = 0;

  for (const keyword of keywords) {
    if (contentLower.includes(keyword.toLowerCase())) {
      hits++;
    }
  }

  return {
    hits,
    total: keywords.length,
    precision: keywords.length > 0 ? hits / keywords.length : 0,
  };
}

function calculateTopicCoverage(content: string, topics: string[]): number {
  const contentLower = content.toLowerCase();
  let covered = 0;

  for (const topic of topics) {
    // Check for topic or its individual words
    if (contentLower.includes(topic.toLowerCase())) {
      covered++;
    } else {
      // Check individual words
      const words = topic.toLowerCase().split(' ');
      if (words.some((word) => contentLower.includes(word))) {
        covered += 0.5; // Partial credit
      }
    }
  }

  return topics.length > 0 ? Math.min(covered / topics.length, 1) : 0;
}

async function evaluateRetrieval(testCase: TestCase): Promise<RetrievalResult> {
  const startTime = Date.now();

  try {
    const contexts = await retrieveContext(testCase.question, 5);
    const latencyMs = Date.now() - startTime;

    // Combine all retrieved content
    const combinedContent = contexts.map((c) => c.content).join(' ');

    const keywordResult = calculateKeywordPrecision(
      combinedContent,
      testCase.expectedKeywords
    );
    const topicCoverage = calculateTopicCoverage(
      combinedContent,
      testCase.expectedTopics
    );
    const avgScore =
      contexts.length > 0
        ? contexts.reduce((sum, c) => sum + c.score, 0) / contexts.length
        : 0;

    return {
      testId: testCase.id,
      question: testCase.question,
      retrievedDocs: contexts.length,
      keywordHits: keywordResult.hits,
      keywordTotal: keywordResult.total,
      keywordPrecision: keywordResult.precision,
      topicCoverage,
      avgScore,
      latencyMs,
    };
  } catch (error) {
    console.error(`Retrieval failed for ${testCase.id}:`, error);
    return {
      testId: testCase.id,
      question: testCase.question,
      retrievedDocs: 0,
      keywordHits: 0,
      keywordTotal: testCase.expectedKeywords.length,
      keywordPrecision: 0,
      topicCoverage: 0,
      avgScore: 0,
      latencyMs: Date.now() - startTime,
    };
  }
}

async function evaluateAnswer(
  testCase: TestCase,
  retrievedContent: string
): Promise<AnswerEvaluation> {
  const startTime = Date.now();
  const groq = getGroqClient();

  const evaluationPrompt = `You are an expert evaluator for a system design RAG system.
Evaluate the following answer based on the question asked.

Question: "${testCase.question}"

Retrieved Context:
${retrievedContent.substring(0, 2000)}

Rate the retrieved content on these criteria (1-10 scale):
1. RELEVANCE: How relevant is the content to the question? (1=completely irrelevant, 10=perfectly relevant)
2. COHERENCE: Is the information well-organized and clear? (1=confusing, 10=crystal clear)
3. COMPLETENESS: Does it cover the key aspects needed to answer? (1=missing everything, 10=comprehensive)

Respond ONLY with a JSON object in this exact format:
{"relevance": X, "coherence": Y, "completeness": Z}

Where X, Y, Z are integers from 1-10.`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 100,
      temperature: 0,
      messages: [{ role: 'user', content: evaluationPrompt }],
    });

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '';

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const scores = JSON.parse(jsonMatch[0]);
      const relevance = Math.min(10, Math.max(1, scores.relevance || 5)) / 10;
      const coherence = Math.min(10, Math.max(1, scores.coherence || 5)) / 10;
      const completeness = Math.min(10, Math.max(1, scores.completeness || 5)) / 10;

      return {
        testId: testCase.id,
        question: testCase.question,
        relevanceScore: relevance,
        coherenceScore: coherence,
        completenessScore: completeness,
        overallScore: (relevance + coherence + completeness) / 3,
        latencyMs,
      };
    }
  } catch (error) {
    console.error(`Answer evaluation failed for ${testCase.id}:`, error);
  }

  return {
    testId: testCase.id,
    question: testCase.question,
    relevanceScore: 0.5,
    coherenceScore: 0.5,
    completenessScore: 0.5,
    overallScore: 0.5,
    latencyMs: Date.now() - startTime,
  };
}

function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

function calculateGroupMetrics(
  results: RetrievalResult[]
): { precision: number; coverage: number } {
  if (results.length === 0) return { precision: 0, coverage: 0 };

  const avgPrecision =
    results.reduce((sum, r) => sum + r.keywordPrecision, 0) / results.length;
  const avgCoverage =
    results.reduce((sum, r) => sum + r.topicCoverage, 0) / results.length;

  return { precision: avgPrecision, coverage: avgCoverage };
}

async function runEvaluation(
  verbose: boolean = false
): Promise<EvaluationReport> {
  console.log('\n🔬 RAG Evaluation Pipeline');
  console.log('='.repeat(50));
  console.log(`Running ${TEST_CASES.length} test cases...\n`);

  const retrievalResults: RetrievalResult[] = [];
  const answerResults: AnswerEvaluation[] = [];

  // Run evaluations
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    process.stdout.write(`[${i + 1}/${TEST_CASES.length}] ${testCase.id}... `);

    // Evaluate retrieval
    const retrievalResult = await evaluateRetrieval(testCase);
    retrievalResults.push(retrievalResult);

    // Get content for answer evaluation
    const contexts = await retrieveContext(testCase.question, 5);
    const content = contexts.map((c) => c.content).join('\n\n');

    // Evaluate answer quality
    const answerResult = await evaluateAnswer(testCase, content);
    answerResults.push(answerResult);

    if (verbose) {
      console.log(
        `Precision: ${(retrievalResult.keywordPrecision * 100).toFixed(0)}%, ` +
          `Coverage: ${(retrievalResult.topicCoverage * 100).toFixed(0)}%, ` +
          `Quality: ${(answerResult.overallScore * 100).toFixed(0)}%`
      );
    } else {
      console.log('✓');
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Calculate aggregate metrics
  const avgPrecision =
    retrievalResults.reduce((sum, r) => sum + r.keywordPrecision, 0) /
    retrievalResults.length;
  const avgCoverage =
    retrievalResults.reduce((sum, r) => sum + r.topicCoverage, 0) /
    retrievalResults.length;
  const avgRetrievalLatency =
    retrievalResults.reduce((sum, r) => sum + r.latencyMs, 0) /
    retrievalResults.length;

  const avgRelevance =
    answerResults.reduce((sum, r) => sum + r.relevanceScore, 0) /
    answerResults.length;
  const avgCoherence =
    answerResults.reduce((sum, r) => sum + r.coherenceScore, 0) /
    answerResults.length;
  const avgCompleteness =
    answerResults.reduce((sum, r) => sum + r.completenessScore, 0) /
    answerResults.length;
  const avgOverall =
    answerResults.reduce((sum, r) => sum + r.overallScore, 0) /
    answerResults.length;
  const avgAnswerLatency =
    answerResults.reduce((sum, r) => sum + r.latencyMs, 0) /
    answerResults.length;

  // Group by category and difficulty
  const byCategory = groupBy(
    retrievalResults,
    (r) => TEST_CASES.find((t) => t.id === r.testId)?.category || 'unknown'
  );
  const byDifficulty = groupBy(
    retrievalResults,
    (r) => TEST_CASES.find((t) => t.id === r.testId)?.difficulty || 'unknown'
  );

  const report: EvaluationReport = {
    timestamp: new Date().toISOString(),
    totalTests: TEST_CASES.length,
    retrieval: {
      avgPrecision,
      avgTopicCoverage: avgCoverage,
      avgLatencyMs: avgRetrievalLatency,
      byCategory: Object.fromEntries(
        Object.entries(byCategory).map(([cat, results]) => [
          cat,
          calculateGroupMetrics(results),
        ])
      ),
      byDifficulty: Object.fromEntries(
        Object.entries(byDifficulty).map(([diff, results]) => [
          diff,
          calculateGroupMetrics(results),
        ])
      ),
    },
    answers: {
      avgRelevance,
      avgCoherence,
      avgCompleteness,
      avgOverall,
      avgLatencyMs: avgAnswerLatency,
    },
    details: {
      retrieval: retrievalResults,
      answers: answerResults,
    },
  };

  return report;
}

function printReport(report: EvaluationReport): void {
  console.log('\n' + '='.repeat(50));
  console.log('📊 EVALUATION RESULTS');
  console.log('='.repeat(50));

  console.log('\n📥 RETRIEVAL METRICS');
  console.log('-'.repeat(30));
  console.log(
    `  Keyword Precision: ${(report.retrieval.avgPrecision * 100).toFixed(1)}%`
  );
  console.log(
    `  Topic Coverage:    ${(report.retrieval.avgTopicCoverage * 100).toFixed(1)}%`
  );
  console.log(
    `  Avg Latency:       ${report.retrieval.avgLatencyMs.toFixed(0)}ms`
  );

  console.log('\n  By Difficulty:');
  for (const [diff, metrics] of Object.entries(report.retrieval.byDifficulty)) {
    console.log(
      `    ${diff.padEnd(8)} - Precision: ${(metrics.precision * 100).toFixed(0)}%, Coverage: ${(metrics.coverage * 100).toFixed(0)}%`
    );
  }

  console.log('\n  By Category:');
  for (const [cat, metrics] of Object.entries(report.retrieval.byCategory)) {
    console.log(
      `    ${cat.padEnd(20)} - Precision: ${(metrics.precision * 100).toFixed(0)}%, Coverage: ${(metrics.coverage * 100).toFixed(0)}%`
    );
  }

  console.log('\n📝 ANSWER QUALITY METRICS');
  console.log('-'.repeat(30));
  console.log(
    `  Relevance:     ${(report.answers.avgRelevance * 100).toFixed(1)}%`
  );
  console.log(
    `  Coherence:     ${(report.answers.avgCoherence * 100).toFixed(1)}%`
  );
  console.log(
    `  Completeness:  ${(report.answers.avgCompleteness * 100).toFixed(1)}%`
  );
  console.log(
    `  Overall Score: ${(report.answers.avgOverall * 100).toFixed(1)}%`
  );
  console.log(`  Avg Latency:   ${report.answers.avgLatencyMs.toFixed(0)}ms`);

  console.log('\n' + '='.repeat(50));

  // Summary grade
  const overallGrade =
    (report.retrieval.avgPrecision +
      report.retrieval.avgTopicCoverage +
      report.answers.avgOverall) /
    3;

  let grade = 'F';
  if (overallGrade >= 0.9) grade = 'A+';
  else if (overallGrade >= 0.85) grade = 'A';
  else if (overallGrade >= 0.8) grade = 'B+';
  else if (overallGrade >= 0.75) grade = 'B';
  else if (overallGrade >= 0.7) grade = 'C+';
  else if (overallGrade >= 0.65) grade = 'C';
  else if (overallGrade >= 0.6) grade = 'D';

  console.log(`\n🎯 OVERALL GRADE: ${grade} (${(overallGrade * 100).toFixed(1)}%)`);
  console.log('='.repeat(50) + '\n');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const outputIndex = args.findIndex((a) => a === '--output' || a === '-o');
  const outputFile = outputIndex >= 0 ? args[outputIndex + 1] : null;

  try {
    const report = await runEvaluation(verbose);
    printReport(report);

    if (outputFile) {
      const outputPath = path.resolve(outputFile);
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      console.log(`📁 Full report saved to: ${outputPath}\n`);
    }

    // Exit with error code if below threshold
    const overallScore =
      (report.retrieval.avgPrecision +
        report.retrieval.avgTopicCoverage +
        report.answers.avgOverall) /
      3;

    if (overallScore < 0.5) {
      console.log('⚠️  Warning: Overall score below 50% threshold\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('Evaluation failed:', error);
    process.exit(1);
  }
}

main();
