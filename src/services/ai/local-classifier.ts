import { AIClassifier, ClassificationResult, ConnectionTestResult } from './types';
import { Category, AIConfig } from '../../types';

export class LocalHeuristicClassifier implements AIClassifier {
  async classify(
    note: string,
    type: 'expense' | 'income',
    categories: Category[],
    _config: AIConfig,
    _signal?: AbortSignal
  ): Promise<ClassificationResult> {
    const searchNote = note.toLowerCase();
    let matchedId: string | null = null;

    if (type === 'expense') {
      if (
        searchNote.includes('吃') ||
        searchNote.includes('饭') ||
        searchNote.includes('外卖') ||
        searchNote.includes('麦当劳') ||
        searchNote.includes('星巴克') ||
        searchNote.includes('咖啡') ||
        searchNote.includes('菜') ||
        searchNote.includes('火锅') ||
        searchNote.includes('饮')
      ) {
        matchedId = 'exp_food';
      } else if (
        searchNote.includes('车') ||
        searchNote.includes('地铁') ||
        searchNote.includes('公交') ||
        searchNote.includes('打车') ||
        searchNote.includes('滴滴') ||
        searchNote.includes('机票') ||
        searchNote.includes('火车') ||
        searchNote.includes('加油')
      ) {
        matchedId = 'exp_transport';
      } else if (
        searchNote.includes('猫') ||
        searchNote.includes('狗') ||
        searchNote.includes('宠') ||
        searchNote.includes('兽医') ||
        searchNote.includes('罐头')
      ) {
        matchedId = 'exp_pet';
      } else if (
        searchNote.includes('买') ||
        searchNote.includes('淘宝') ||
        searchNote.includes('数码') ||
        searchNote.includes('配件') ||
        searchNote.includes('日用') ||
        searchNote.includes('超市')
      ) {
        matchedId = 'exp_shopping';
      } else if (
        searchNote.includes('房租') ||
        searchNote.includes('水电') ||
        searchNote.includes('物业') ||
        searchNote.includes('租房')
      ) {
        matchedId = 'exp_housing';
      } else if (
        searchNote.includes('玩') ||
        searchNote.includes('游戏') ||
        searchNote.includes('电影') ||
        searchNote.includes('音乐') ||
        searchNote.includes('会员') ||
        searchNote.includes('娱乐')
      ) {
        matchedId = 'exp_entertainment';
      } else if (
        searchNote.includes('病') ||
        searchNote.includes('药') ||
        searchNote.includes('医院') ||
        searchNote.includes('配方') ||
        searchNote.includes('感冒')
      ) {
        matchedId = 'exp_medical';
      } else {
        matchedId = 'exp_other';
      }
    } else {
      if (
        searchNote.includes('工资') ||
        searchNote.includes('薪水') ||
        searchNote.includes('月薪')
      ) {
        matchedId = 'inc_salary';
      } else if (
        searchNote.includes('奖金') ||
        searchNote.includes('绩效') ||
        searchNote.includes('年终')
      ) {
        matchedId = 'inc_bonus';
      } else if (
        searchNote.includes('兼职') ||
        searchNote.includes('外包') ||
        searchNote.includes('私活')
      ) {
        matchedId = 'inc_parttime';
      } else if (
        searchNote.includes('利息') ||
        searchNote.includes('理财') ||
        searchNote.includes('基金') ||
        searchNote.includes('股票') ||
        searchNote.includes('投资')
      ) {
        matchedId = 'inc_interest';
      } else {
        matchedId = 'inc_other';
      }
    }

    // Verify the category exists in the list of categories
    const exists = categories.some((c) => c.id === matchedId && c.type === type);
    if (!exists) {
      // Fallback: use first category of the matching type, or other
      const fallbackCat =
        categories.find((c) => c.id === `${type === 'expense' ? 'exp' : 'inc'}_other`) ||
        categories.find((c) => c.type === type);
      matchedId = fallbackCat ? fallbackCat.id : null;
    }

    return {
      categoryId: matchedId,
      source: 'heuristic',
    };
  }

  async testConnection(_config: AIConfig, _signal?: AbortSignal): Promise<ConnectionTestResult> {
    return {
      success: true,
      message: '本地启发式测试，无需网络连接。',
    };
  }
}
