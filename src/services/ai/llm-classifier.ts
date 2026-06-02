import { AIClassifier, ClassificationResult, ConnectionTestResult } from './types';
import { Category, AIConfig } from '../../types';
import { DEFAULT_AI_PROMPT_TEMPLATE } from '../../utils/constants';

export class LLMClassifier implements AIClassifier {
  private cleanUrl(baseUrl: string): string {
    return baseUrl.trim().replace(/\/+$/, '');
  }

  async classify(
    note: string,
    type: 'expense' | 'income',
    categories: Category[],
    config: AIConfig,
    signal?: AbortSignal
  ): Promise<ClassificationResult> {
    const categoriesList = categories
      .map((c) => `- ID: "${c.id}", 名称: "${c.name}", 类型: "${c.type === 'expense' ? '支出' : '收入'}"`)
      .join('\n');

    const promptTemplate = config.promptTemplate || DEFAULT_AI_PROMPT_TEMPLATE;
    const prompt = promptTemplate
      .replace('[CATEGORIES_LIST]', categoriesList)
      .replace('[USER_INPUT]', note);

    let timedOut = false;
    const controller = new AbortController();
    const timeoutVal = config.timeout || 10;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutVal * 1000);

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeoutId);
        throw new DOMException('Aborted', 'AbortError');
      }
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort();
      });
    }

    try {
      const url = `${this.cleanUrl(config.baseUrl)}/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 100)}`);
      }

      const responseData = await response.json();
      const rawContent = responseData?.choices?.[0]?.message?.content || '';
      
      const parsedResult = this.parseJsonContent(rawContent, categories, type);
      if (parsedResult) {
        return {
          categoryId: parsedResult.categoryId,
          source: 'llm',
          confidence: parsedResult.confidence,
        };
      }

      throw new Error('无法解析 LLM 的响应分类内容');
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e?.name === 'AbortError') {
        if (timedOut) {
          throw new Error(`AI 请求超时（超时限制 ${timeoutVal} 秒）`);
        }
        throw e;
      }
      throw e;
    }
  }

  async testConnection(config: AIConfig, signal?: AbortSignal): Promise<ConnectionTestResult> {
    let timedOut = false;
    const controller = new AbortController();
    const timeoutVal = config.timeout || 10;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutVal * 1000);

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeoutId);
        return { success: false, message: '测试已被取消' };
      }
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort();
      });
    }

    const startTime = performance.now();

    try {
      // Use standard models endpoint as connectivity check
      const url = `${this.cleanUrl(config.baseUrl)}/models`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        signal: controller.signal,
      });

      const elapsed = Math.round(performance.now() - startTime);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        return {
          success: false,
          message: `连接失败：状态码 ${response.status} (${errorText.slice(0, 80)})`,
        };
      }

      return {
        success: true,
        latencyMs: elapsed,
        message: `连接成功！响应延迟 ${elapsed}ms。`,
      };
    } catch (e: any) {
      clearTimeout(timeoutId);
      const isAbort = e?.name === 'AbortError';
      if (isAbort) {
        if (timedOut) {
          return {
            success: false,
            message: `连接失败：超时限制 ${timeoutVal} 秒。请检查您的网络连接。`,
          };
        }
        return {
          success: false,
          message: '测试已被取消',
        };
      }
      return {
        success: false,
        message: `连接失败：${e?.message || '网络连接错误，请检查 URL。'}`,
      };
    }
  }

  /**
   * Cleans markdown JSON brackets and extracts category details
   */
  private parseJsonContent(
    content: string,
    categories: Category[],
    type: 'expense' | 'income'
  ): { categoryId: string | null; confidence?: number } | null {
    let cleanText = content.trim();
    
    // Strip markdown code block wrappers if present
    if (cleanText.includes('```')) {
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1];
      }
    }

    // Locate the JSON bracket borders
    const firstBracket = cleanText.indexOf('{');
    const lastBracket = cleanText.lastIndexOf('}');
    if (firstBracket !== -1 && lastBracket !== -1) {
      cleanText = cleanText.slice(firstBracket, lastBracket + 1);
    }

    try {
      const parsed = JSON.parse(cleanText);
      const categoryId = parsed.categoryId || parsed.category_id || null;
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : undefined;

      // Verify the parsed category ID matches one in the system list
      if (categoryId && categories.some((c) => c.id === categoryId && c.type === type)) {
        return { categoryId, confidence };
      }

      // If ID not found, attempt fuzzy matching on name
      const categoryName = parsed.categoryName || parsed.category_name || parsed.category || '';
      if (categoryName) {
        const matchedByName = categories.find(
          (c) => c.type === type && (c.name === categoryName || categoryName.includes(c.name))
        );
        if (matchedByName) {
          return { categoryId: matchedByName.id, confidence };
        }
      }
    } catch (e) {
      // Fallback: search for ID or name substrings inside raw text
      for (const c of categories) {
        if (c.type === type && (cleanText.includes(c.id) || cleanText.includes(c.name))) {
          return { categoryId: c.id };
        }
      }
    }

    return null;
  }
}
