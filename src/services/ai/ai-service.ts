import { AIClassifier, ClassificationResult, ConnectionTestResult } from './types';
import { LLMClassifier } from './llm-classifier';
import { LocalHeuristicClassifier } from './local-classifier';
import { Category, AIConfig } from '../../types';

export class AIService implements AIClassifier {
  private llmAdapter: AIClassifier;
  private localAdapter: AIClassifier;

  constructor() {
    this.llmAdapter = new LLMClassifier();
    this.localAdapter = new LocalHeuristicClassifier();
  }

  async classify(
    note: string,
    type: 'expense' | 'income',
    categories: Category[],
    config: AIConfig,
    signal?: AbortSignal
  ): Promise<ClassificationResult> {
    // If AI classification is disabled or key is empty, fall back directly to local heuristics
    if (!config.enabled || !config.apiKey?.trim()) {
      return this.localAdapter.classify(note, type, categories, config, signal);
    }

    try {
      return await this.llmAdapter.classify(note, type, categories, config, signal);
    } catch (error) {
      console.warn('AI LLM classification failed, falling back to local heuristics:', error);
      // Failover safely to local keyword heuristics
      return this.localAdapter.classify(note, type, categories, config, signal);
    }
  }

  async testConnection(config: AIConfig, signal?: AbortSignal): Promise<ConnectionTestResult> {
    return this.llmAdapter.testConnection(config, signal);
  }
}

export const aiService = new AIService();
