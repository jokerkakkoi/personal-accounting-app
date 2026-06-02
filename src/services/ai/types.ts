import { Category, AIConfig } from '../../types';

export interface ClassificationResult {
  categoryId: string | null;
  source: 'llm' | 'heuristic' | 'none';
  confidence?: number;
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs?: number;
  message: string;
}

export interface AIClassifier {
  classify(
    note: string,
    type: 'expense' | 'income',
    categories: Category[],
    config: AIConfig,
    signal?: AbortSignal
  ): Promise<ClassificationResult>;

  testConnection(
    config: AIConfig,
    signal?: AbortSignal
  ): Promise<ConnectionTestResult>;
}
