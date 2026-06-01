import { create } from 'zustand';
import { Transaction, Category, Budget, AIConfig, AppSettings, CategoryBudget } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_CATEGORIES, INITIAL_BUDGETS, MOCK_AI_CONFIG, MOCK_SETTINGS } from '../services/mock-data';

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  settings: AppSettings;
  aiConfig: AIConfig;
  
  // Transaction Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Category Actions
  addCategory: (cat: Omit<Category, 'id' | 'isPredefined'>) => string;
  updateCategory: (id: string, name: string, icon: string) => void;
  deleteCategory: (id: string) => void;
  setDefaultCategory: (id: string) => void;
  
  // Budget Actions
  updateTotalBudget: (month: string, amount: number) => void;
  updateCategoryBudget: (month: string, categoryId: string, amount: number) => void;
  deleteCategoryBudget: (month: string, categoryId: string) => void;
  
  // Settings & Config
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateAIConfig: (config: Partial<AIConfig>) => void;
  resetAllData: () => void;
  importData: (data: { transactions: Transaction[]; categories: Category[]; budgets: Budget[]; settings: AppSettings; aiConfig: AIConfig }) => void;
}

// Helper to load from localStorage or fallback
const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(`accounting_${key}`);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
    return fallback;
  }
};

// Helper to save to localStorage
const saveToStorage = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(`accounting_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
};

export const useAppStore = create<AppState>((set) => ({
  transactions: loadFromStorage<Transaction[]>('transactions', INITIAL_TRANSACTIONS),
  categories: loadFromStorage<Category[]>('categories', INITIAL_CATEGORIES),
  budgets: loadFromStorage<Budget[]>('budgets', INITIAL_BUDGETS),
  settings: loadFromStorage<AppSettings>('settings', MOCK_SETTINGS),
  aiConfig: loadFromStorage<AIConfig>('aiConfig', MOCK_AI_CONFIG),

  // Transaction Actions
  addTransaction: (txData) => {
    const id = `tx_${Date.now()}`;
    const nowStr = new Date().toISOString();
    const newTx: Transaction = {
      ...txData,
      id,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    
    set((state) => {
      const updatedTxs = [newTx, ...state.transactions];
      saveToStorage('transactions', updatedTxs);
      
      // Also update budget spent values when transaction is added
      const updatedBudgets = recalculateBudgetsSpent(updatedTxs, state.budgets);
      saveToStorage('budgets', updatedBudgets);
      
      return { transactions: updatedTxs, budgets: updatedBudgets };
    });
    return id;
  },

  updateTransaction: (id, updatedFields) => {
    set((state) => {
      const updatedTxs = state.transactions.map((tx) => {
        if (tx.id === id) {
          return {
            ...tx,
            ...updatedFields,
            updatedAt: new Date().toISOString(),
          };
        }
        return tx;
      });
      saveToStorage('transactions', updatedTxs);
      
      // Recalculate budgets spent
      const updatedBudgets = recalculateBudgetsSpent(updatedTxs, state.budgets);
      saveToStorage('budgets', updatedBudgets);
      
      return { transactions: updatedTxs, budgets: updatedBudgets };
    });
  },

  deleteTransaction: (id) => {
    set((state) => {
      const updatedTxs = state.transactions.filter((tx) => tx.id !== id);
      saveToStorage('transactions', updatedTxs);
      
      // Recalculate budgets spent
      const updatedBudgets = recalculateBudgetsSpent(updatedTxs, state.budgets);
      saveToStorage('budgets', updatedBudgets);
      
      return { transactions: updatedTxs, budgets: updatedBudgets };
    });
  },

  // Category Actions
  addCategory: (catData) => {
    const id = `cat_${Date.now()}`;
    const newCat: Category = {
      ...catData,
      id,
      isPredefined: false,
    };
    set((state) => {
      const updatedCats = [...state.categories, newCat];
      saveToStorage('categories', updatedCats);
      return { categories: updatedCats };
    });
    return id;
  },

  updateCategory: (id, name, icon) => {
    set((state) => {
      const updatedCats = state.categories.map((cat) => 
        cat.id === id ? { ...cat, name, icon } : cat
      );
      saveToStorage('categories', updatedCats);
      return { categories: updatedCats };
    });
  },

  deleteCategory: (id) => {
    set((state) => {
      // Find default category of the same type to map existing transactions to
      const categoryToDelete = state.categories.find(c => c.id === id);
      if (!categoryToDelete) return {};
      
      const defaultCategory = state.categories.find(c => c.type === categoryToDelete.type && c.isDefault) 
        || state.categories.find(c => c.type === categoryToDelete.type);
        
      const fallbackId = defaultCategory ? defaultCategory.id : 'exp_other';

      // Update transactions belonging to deleted category to fallback category
      const updatedTxs = state.transactions.map((tx) => 
        tx.categoryId === id ? { ...tx, categoryId: fallbackId, updatedAt: new Date().toISOString() } : tx
      );
      
      const updatedCats = state.categories.filter((cat) => cat.id !== id);
      
      saveToStorage('categories', updatedCats);
      saveToStorage('transactions', updatedTxs);
      
      const updatedBudgets = recalculateBudgetsSpent(updatedTxs, state.budgets);
      saveToStorage('budgets', updatedBudgets);

      return { categories: updatedCats, transactions: updatedTxs, budgets: updatedBudgets };
    });
  },

  setDefaultCategory: (id) => {
    set((state) => {
      const targetCat = state.categories.find(c => c.id === id);
      if (!targetCat) return {};

      const updatedCats = state.categories.map((cat) => {
        if (cat.type === targetCat.type) {
          return {
            ...cat,
            isDefault: cat.id === id,
          };
        }
        return cat;
      });

      saveToStorage('categories', updatedCats);
      return { categories: updatedCats };
    });
  },

  // Budget Actions
  updateTotalBudget: (month, amount) => {
    set((state) => {
      let budgetExists = false;
      const updatedBudgets = state.budgets.map((b) => {
        if (b.month === month) {
          budgetExists = true;
          return { ...b, totalAmount: amount };
        }
        return b;
      });

      if (!budgetExists) {
        // Create new budget for this month
        const newBudget: Budget = {
          id: `bg_${month}`,
          month,
          totalAmount: amount,
          spent: 0,
          categoryBudgets: [],
        };
        updatedBudgets.push(newBudget);
      }

      // Recalculate
      const finalBudgets = recalculateBudgetsSpent(state.transactions, updatedBudgets);
      saveToStorage('budgets', finalBudgets);
      return { budgets: finalBudgets };
    });
  },

  updateCategoryBudget: (month, categoryId, amount) => {
    set((state) => {
      const updatedBudgets = state.budgets.map((b) => {
        if (b.month === month) {
          const cbExists = b.categoryBudgets.some(cb => cb.categoryId === categoryId);
          let newCategoryBudgets: CategoryBudget[] = [];
          
          if (cbExists) {
            newCategoryBudgets = b.categoryBudgets.map(cb => 
              cb.categoryId === categoryId ? { ...cb, amount } : cb
            );
          } else {
            newCategoryBudgets = [...b.categoryBudgets, { categoryId, amount, spent: 0 }];
          }
          
          return { ...b, categoryBudgets: newCategoryBudgets };
        }
        return b;
      });

      const finalBudgets = recalculateBudgetsSpent(state.transactions, updatedBudgets);
      saveToStorage('budgets', finalBudgets);
      return { budgets: finalBudgets };
    });
  },

  deleteCategoryBudget: (month, categoryId) => {
    set((state) => {
      const updatedBudgets = state.budgets.map((b) => {
        if (b.month === month) {
          return {
            ...b,
            categoryBudgets: b.categoryBudgets.filter(cb => cb.categoryId !== categoryId),
          };
        }
        return b;
      });
      
      const finalBudgets = recalculateBudgetsSpent(state.transactions, updatedBudgets);
      saveToStorage('budgets', finalBudgets);
      return { budgets: finalBudgets };
    });
  },

  // Settings & Config
  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      saveToStorage('settings', updated);
      return { settings: updated };
    });
  },

  updateAIConfig: (newConfig) => {
    set((state) => {
      const updated = { ...state.aiConfig, ...newConfig };
      saveToStorage('aiConfig', updated);
      return { aiConfig: updated };
    });
  },

  resetAllData: () => {
    localStorage.removeItem('accounting_transactions');
    localStorage.removeItem('accounting_categories');
    localStorage.removeItem('accounting_budgets');
    localStorage.removeItem('accounting_settings');
    localStorage.removeItem('accounting_aiConfig');
    
    set({
      transactions: INITIAL_TRANSACTIONS,
      categories: INITIAL_CATEGORIES,
      budgets: INITIAL_BUDGETS,
      settings: MOCK_SETTINGS,
      aiConfig: MOCK_AI_CONFIG,
    });
  },

  importData: (data) => {
    saveToStorage('transactions', data.transactions);
    saveToStorage('categories', data.categories);
    saveToStorage('budgets', data.budgets);
    saveToStorage('settings', data.settings);
    saveToStorage('aiConfig', data.aiConfig);
    
    set({
      transactions: data.transactions,
      categories: data.categories,
      budgets: data.budgets,
      settings: data.settings,
      aiConfig: data.aiConfig,
    });
  },
}));

// Helper to recalculate spent amounts across all budgets
function recalculateBudgetsSpent(transactions: Transaction[], budgets: Budget[]): Budget[] {
  return budgets.map((b) => {
    const monthStr = b.month; // YYYY-MM
    
    // Filter expenses for this month
    const monthExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(monthStr));
    const spentSum = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    const categoryBudgets = b.categoryBudgets.map((cb) => {
      const cbSpent = monthExpenses
        .filter(t => t.categoryId === cb.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...cb,
        spent: parseFloat(cbSpent.toFixed(2)),
      };
    });

    return {
      ...b,
      spent: parseFloat(spentSum.toFixed(2)),
      categoryBudgets,
    };
  });
}
