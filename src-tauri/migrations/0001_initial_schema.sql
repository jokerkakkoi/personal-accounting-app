CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    type TEXT NOT NULL,
    is_predefined INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id),
    note TEXT DEFAULT '',
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    ai_classified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    month TEXT UNIQUE NOT NULL,
    total_amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS category_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    UNIQUE(budget_id, category_id)
);

CREATE TABLE IF NOT EXISTS recurring_transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id),
    note TEXT DEFAULT '',
    frequency TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT DEFAULT NULL,
    last_triggered_date TEXT DEFAULT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_category_budgets_budget ON category_budgets(budget_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_category ON recurring_transactions(category_id);

-- Insert predefined categories
INSERT OR IGNORE INTO categories (id, name, icon, type, is_predefined, is_default) VALUES
('exp_food', '餐饮', '🍔', 'expense', 1, 0),
('exp_transport', '交通', '🚗', 'expense', 1, 0),
('exp_shopping', '购物', '🛒', 'expense', 1, 0),
('exp_housing', '住房', '🏠', 'expense', 1, 0),
('exp_entertainment', '娱乐', '🎮', 'expense', 1, 0),
('exp_medical', '医疗', '💊', 'expense', 1, 0),
('exp_education', '教育', '📚', 'expense', 1, 0),
('exp_telecom', '通讯', '📱', 'expense', 1, 0),
('exp_clothing', '服饰', '👔', 'expense', 1, 0),
('exp_sports', '运动', '💪', 'expense', 1, 0),
('exp_groceries', '日用', '🧴', 'expense', 1, 0),
('exp_other', '其他', '📦', 'expense', 1, 1),
('inc_salary', '工资', '💰', 'income', 1, 0),
('inc_bonus', '奖金', '🎁', 'income', 1, 0),
('inc_investment', '投资', '📈', 'income', 1, 0),
('inc_parttime', '兼职', '💼', 'income', 1, 0),
('inc_other', '其他', '📦', 'income', 1, 1);
