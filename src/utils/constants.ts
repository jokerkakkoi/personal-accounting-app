import { Category } from '../types';

export const PREDEFINED_CATEGORIES: { expense: Category[]; income: Category[] } = {
  expense: [
    { id: 'exp_food', name: '餐饮', icon: '🍔', type: 'expense', isPredefined: true },
    { id: 'exp_transport', name: '交通', icon: '🚗', type: 'expense', isPredefined: true },
    { id: 'exp_shopping', name: '购物', icon: '🛒', type: 'expense', isPredefined: true },
    { id: 'exp_housing', name: '住房', icon: '🏠', type: 'expense', isPredefined: true },
    { id: 'exp_entertainment', name: '娱乐', icon: '🎮', type: 'expense', isPredefined: true },
    { id: 'exp_medical', name: '医疗', icon: '💊', type: 'expense', isPredefined: true },
    { id: 'exp_education', name: '教育', icon: '📚', type: 'expense', isPredefined: true },
    { id: 'exp_communication', name: '通讯', icon: '📱', type: 'expense', isPredefined: true },
    { id: 'exp_clothing', name: '服饰', icon: '👔', type: 'expense', isPredefined: true },
    { id: 'exp_sports', name: '运动', icon: '💪', type: 'expense', isPredefined: true },
    { id: 'exp_daily', name: '日用', icon: '🧴', type: 'expense', isPredefined: true },
    { id: 'exp_other', name: '其他', icon: '📦', type: 'expense', isPredefined: true, isDefault: true },
  ],
  income: [
    { id: 'inc_salary', name: '工资', icon: '💰', type: 'income', isPredefined: true, isDefault: true },
    { id: 'inc_bonus', name: '奖金', icon: '🎁', type: 'income', isPredefined: true },
    { id: 'inc_investment', name: '投资', icon: '📈', type: 'income', isPredefined: true },
    { id: 'inc_parttime', name: '兼职', icon: '💼', type: 'income', isPredefined: true },
    { id: 'inc_other', name: '其他', icon: '📦', type: 'income', isPredefined: true },
  ],
};

export const ICON_PALETTE = [
  // Food & Drinks
  '🍔', '🍕', '🍜', '☕', '🍦', '🍎', '🍺', '🍿',
  // Transport
  '🚗', '🚌', '🚇', '🚲', '✈️', '🚕', '⛽', '🚀',
  // Life & Shopping
  '🛒', '👔', '👠', '🧴', '💄', '🎁', '🎈', '🔑',
  // Home & Utilities
  '🏠', '🛋️', '🔌', '📶', '💧', '🧹', '📦', '📪',
  // Fun & Entertainment
  '🎮', '📺', '🎤', '🎬', '🎨', '🎯', '🎟️', '🎰',
  // Health & Sports
  '💊', '🏥', '🦷', '💪', '🏃', '🚴', '⚽', '🏊',
  // Education & Finance
  '📚', '🎓', '💰', '💳', '📈', '💼', '📅', '✉️',
];

export const DEFAULT_AI_PROMPT_TEMPLATE = `你是一个智能记账助手。请分析用户输入的记账文本，并输出相应的交易分类。
可用的分类列表（包含ID、名称、类型）：
[CATEGORIES_LIST]

请仅返回符合以下JSON格式的数据，不要包含任何多余的解释或Markdown标记：
{
  "categoryId": "分类ID",
  "confidence": 0.95,
  "reason": "分类的理由"
}

用户输入的记账文本：
"[USER_INPUT]"`;
