import dayjs from 'dayjs';
import { Transaction, Category, Budget, AIConfig, AppSettings } from '../types';
import { PREDEFINED_CATEGORIES } from '../utils/constants';

// Predefined categories
export const MOCK_CATEGORIES: Category[] = [
  ...PREDEFINED_CATEGORIES.expense,
  ...PREDEFINED_CATEGORIES.income,
  // Add 2 custom categories
  { id: 'exp_pet', name: '宠物', icon: '🐱', type: 'expense' as const, isPredefined: false },
  { id: 'inc_interest', name: '理财收益', icon: '💵', type: 'income' as const, isPredefined: false },
];

export const MOCK_AI_CONFIG: AIConfig = {
  enabled: false,
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  timeout: 10,
  promptTemplate: '',
};

export const MOCK_SETTINGS: AppSettings = {
  budgetNotification: true,
  recurringNotification: true,
  hasSeenWelcome: false,
};

// Generate 50+ mock transactions dynamically spanning the last 3 months
export const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = dayjs();
  
  // Helpers to generate random amounts & times
  const randomAmount = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
  const randomTime = () => {
    const hr = String(Math.floor(Math.random() * 12) + 8).padStart(2, '0');
    const min = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    return `${hr}:${min}`;
  };

  // Define some templates for transaction items
  const expenseTemplates = [
    { categoryId: 'exp_food', name: '午餐外卖', min: 15, max: 45 },
    { categoryId: 'exp_food', name: '星巴克咖啡', min: 28, max: 35 },
    { categoryId: 'exp_food', name: '超市买菜', min: 50, max: 120 },
    { categoryId: 'exp_food', name: '周末火锅聚餐', min: 150, max: 350 },
    
    { categoryId: 'exp_transport', name: '地铁乘车', min: 3, max: 7 },
    { categoryId: 'exp_transport', name: '滴滴打车', min: 18, max: 65 },
    { categoryId: 'exp_transport', name: '共享单车月卡', min: 15, max: 15 },
    
    { categoryId: 'exp_shopping', name: '淘宝日用品', min: 25, max: 99 },
    { categoryId: 'exp_shopping', name: '数码配件', min: 39, max: 199 },
    { categoryId: 'exp_shopping', name: '天猫服饰', min: 100, max: 499 },
    
    { categoryId: 'exp_housing', name: '房租月付', min: 2800, max: 2800 },
    { categoryId: 'exp_housing', name: '水费电费', min: 80, max: 150 },
    
    { categoryId: 'exp_entertainment', name: '电影票两张', min: 70, max: 90 },
    { categoryId: 'exp_entertainment', name: 'Steam 游戏', min: 58, max: 248 },
    { categoryId: 'exp_entertainment', name: '网易云音乐会员', min: 15, max: 15 },
    
    { categoryId: 'exp_medical', name: '感冒药配方', min: 24, max: 80 },
    
    { categoryId: 'exp_daily', name: '洗发水沐浴露', min: 45, max: 90 },
    
    { categoryId: 'exp_pet', name: '猫粮猫罐头', min: 80, max: 260 },
    { categoryId: 'exp_pet', name: '宠物玩具', min: 15, max: 50 },
    
    { categoryId: 'exp_other', name: '快递寄件费', min: 12, max: 23 },
  ];

  const incomeTemplates = [
    { categoryId: 'inc_salary', name: '月度基本工资', amount: 8500 },
    { categoryId: 'inc_bonus', name: '季度绩效奖金', amount: 3000 },
    { categoryId: 'inc_parttime', name: '兼职外包开发', min: 800, max: 2500 },
    { categoryId: 'inc_interest', name: '理财通利息收益', min: 12, max: 45 },
    { categoryId: 'inc_other', name: '闲鱼二手变现', min: 50, max: 300 },
  ];

  let idCounter = 1;

  // Spans current month, last month, and month before last
  for (let m = 0; m < 3; m++) {
    const monthDate = now.subtract(m, 'month');
    const daysInMonth = monthDate.daysInMonth();
    
    // Day 5: Payday (Salary)
    const payday = monthDate.date(5).format('YYYY-MM-DD');
    transactions.push({
      id: `tx_${idCounter++}`,
      type: 'income',
      amount: 8500,
      categoryId: 'inc_salary',
      note: '月度工资发放',
      date: payday,
      time: '09:30',
      isRecurring: true,
      recurringConfig: { frequency: 'monthly' },
      aiClassified: false,
      createdAt: `${payday}T09:30:00.000Z`,
      updatedAt: `${payday}T09:30:00.000Z`,
    });

    // Day 1: House Rent (Housing Expense)
    const rentday = monthDate.date(1).format('YYYY-MM-DD');
    transactions.push({
      id: `tx_${idCounter++}`,
      type: 'expense',
      amount: 2800,
      categoryId: 'exp_housing',
      note: '房租月付房东',
      date: rentday,
      time: '10:00',
      isRecurring: true,
      recurringConfig: { frequency: 'monthly' },
      aiClassified: false,
      createdAt: `${rentday}T10:00:00.000Z`,
      updatedAt: `${rentday}T10:00:00.000Z`,
    });

    // Day 15: Halfway Bonus / Part-time (Interest/Parttime/Bonus)
    const midMonthDay = monthDate.date(15).format('YYYY-MM-DD');
    if (m === 1) { // last month bonus
      transactions.push({
        id: `tx_${idCounter++}`,
        type: 'income',
        amount: 3000,
        categoryId: 'inc_bonus',
        note: '第一季度绩效奖金',
        date: midMonthDay,
        time: '14:00',
        isRecurring: false,
        aiClassified: false,
        createdAt: `${midMonthDay}T14:00:00.000Z`,
        updatedAt: `${midMonthDay}T14:00:00.000Z`,
      });
    } else if (m === 0 || m === 2) {
      const parttimeAmount = randomAmount(800, 1800);
      transactions.push({
        id: `tx_${idCounter++}`,
        type: 'income',
        amount: parttimeAmount,
        categoryId: 'inc_parttime',
        note: 'UI界面设计兼职款',
        date: midMonthDay,
        time: '18:30',
        isRecurring: false,
        aiClassified: true,
        createdAt: `${midMonthDay}T18:30:00.000Z`,
        updatedAt: `${midMonthDay}T18:30:00.000Z`,
      });
    }

    // Generate daily/weekly random expenses
    for (let d = 1; d <= daysInMonth; d++) {
      // Skip salary & rent days for heavy generation to keep balances clean
      if (d === 1 || d === 5) continue;
      
      const dateStr = monthDate.date(d).format('YYYY-MM-DD');
      
      // If date is in the future, don't generate mock transactions
      if (monthDate.date(d).isAfter(now)) {
        continue;
      }

      // Daily transactions chance
      const rand = Math.random();
      
      // 70% chance of eating out/coffee
      if (rand < 0.7) {
        const item = expenseTemplates.find(x => x.categoryId === 'exp_food' && (x.name.includes('外卖') || x.name.includes('咖啡'))) || expenseTemplates[0];
        transactions.push({
          id: `tx_${idCounter++}`,
          type: 'expense',
          amount: randomAmount(item.min || 15, item.max || 45),
          categoryId: item.categoryId,
          note: item.name,
          date: dateStr,
          time: randomTime(),
          isRecurring: false,
          aiClassified: Math.random() > 0.5,
          createdAt: `${dateStr}T12:00:00.000Z`,
          updatedAt: `${dateStr}T12:00:00.000Z`,
        });
      }

      // 40% chance of transport
      if (rand < 0.4) {
        const item = expenseTemplates.find(x => x.categoryId === 'exp_transport') || expenseTemplates[4];
        transactions.push({
          id: `tx_${idCounter++}`,
          type: 'expense',
          amount: randomAmount(item.min || 3, item.max || 20),
          categoryId: item.categoryId,
          note: item.name,
          date: dateStr,
          time: randomTime(),
          isRecurring: false,
          aiClassified: false,
          createdAt: `${dateStr}T08:30:00.000Z`,
          updatedAt: `${dateStr}T08:30:00.000Z`,
        });
      }

      // Weekends: entertainment / dining / shopping
      const dayOfWeek = monthDate.date(d).day(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        if (Math.random() < 0.6) {
          const item = expenseTemplates.find(x => x.categoryId === 'exp_entertainment') || expenseTemplates[12];
          transactions.push({
            id: `tx_${idCounter++}`,
            type: 'expense',
            amount: randomAmount(item.min || 50, item.max || 150),
            categoryId: item.categoryId,
            note: item.name,
            date: dateStr,
            time: randomTime(),
            isRecurring: false,
            aiClassified: false,
            createdAt: `${dateStr}T20:00:00.000Z`,
            updatedAt: `${dateStr}T20:00:00.000Z`,
          });
        }
        
        if (Math.random() < 0.5) {
          const item = expenseTemplates.find(x => x.categoryId === 'exp_pet') || expenseTemplates[17];
          transactions.push({
            id: `tx_${idCounter++}`,
            type: 'expense',
            amount: randomAmount(item.min || 15, item.max || 80),
            categoryId: item.categoryId,
            note: item.name,
            date: dateStr,
            time: randomTime(),
            isRecurring: false,
            aiClassified: true,
            createdAt: `${dateStr}T15:00:00.000Z`,
            updatedAt: `${dateStr}T15:00:00.000Z`,
          });
        }
      }

      // Occasional income: interest/refunds
      if (d === 28 && Math.random() < 0.8) {
        const item = incomeTemplates.find(x => x.categoryId === 'inc_interest') || incomeTemplates[3];
        transactions.push({
          id: `tx_${idCounter++}`,
          type: 'income',
          amount: randomAmount(15, 38),
          categoryId: item.categoryId,
          note: item.name,
          date: dateStr,
          time: '23:55',
          isRecurring: true,
          recurringConfig: { frequency: 'monthly' },
          aiClassified: false,
          createdAt: `${dateStr}T23:55:00.000Z`,
          updatedAt: `${dateStr}T23:55:00.000Z`,
        });
      }
    }
  }

  return transactions;
};

// Calculate spent for categories in mock budgets based on generated transactions
export const getMockBudgets = (transactions: Transaction[]): Budget[] => {
  const now = dayjs();
  const budgets: Budget[] = [];

  for (let m = 0; m < 3; m++) {
    const monthStr = now.subtract(m, 'month').format('YYYY-MM');
    
    // We set a total budget of 5000
    const totalAmount = 5000;
    
    // Filter transactions for this month
    const monthTxs = transactions.filter(t => t.date.startsWith(monthStr) && t.type === 'expense');
    
    // Calculate total spent
    const totalSpent = monthTxs.reduce((sum, t) => sum + t.amount, 0);

    // Categories we set specific budgets for: Food (1500), Transport (500), Shopping (1000), Entertainment (600)
    const categoryBudgetsData = [
      { categoryId: 'exp_food', amount: 1500 },
      { categoryId: 'exp_transport', amount: 500 },
      { categoryId: 'exp_shopping', amount: 1000 },
      { categoryId: 'exp_entertainment', amount: 600 },
    ];

    const categoryBudgets = categoryBudgetsData.map(cb => {
      const spent = monthTxs
        .filter(t => t.categoryId === cb.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        categoryId: cb.categoryId,
        amount: cb.amount,
        spent: parseFloat(spent.toFixed(2)),
      };
    });

    budgets.push({
      id: `bg_${monthStr}`,
      month: monthStr,
      totalAmount,
      spent: parseFloat(totalSpent.toFixed(2)),
      categoryBudgets,
    });
  }

  return budgets;
};
export const INITIAL_TRANSACTIONS = generateMockTransactions();
export const INITIAL_BUDGETS = getMockBudgets(INITIAL_TRANSACTIONS);
export const INITIAL_CATEGORIES = MOCK_CATEGORIES;
