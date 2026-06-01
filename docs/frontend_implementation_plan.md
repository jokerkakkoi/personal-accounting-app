# Personal Accounting App — Frontend Pages Implementation Plan

> **Scope**: Frontend-only (no backend integration). All data uses mock data. 14 pages for a mobile (Android) Tauri app.
>
> **Design system**: [CLAUDE-DESIGN.md](file:///i:/Project/client-project/personal-accounting-app/CLAUDE-DESIGN.md) — warm cream canvas + coral accent + dark navy
>
> **Execution**: Subagent-driven development — sequential tasks with spec + code quality review per task

---

## User Review Required

> [!IMPORTANT]
> **Font choice**: Copernicus/Tiempos Headline (serif) are licensed fonts. Plan uses **Cormorant Garamond** (free Google Font) as the serif display substitute, and **Inter** (already installed) for body. Is this acceptable?

> [!IMPORTANT]
> **Charting library**: PRD specifies ECharts for trend charts (P-10) and pie charts (P-11). Plan uses **echarts-for-react** wrapper. Alternatively, could use **recharts** (more React-native). Which do you prefer?

> [!WARNING]
> **No tests in scope**: Since this is frontend-only with mock data, the plan focuses on UI implementation without unit tests. Review cycle uses spec compliance + code quality reviews only. Let me know if you want tests added.

---

## Open Questions

> [!IMPORTANT]
> **Navigation pattern**: The PRD specifies `react-router-dom` is NOT installed. Plan defaults to **react-router-dom v7** (standard) .

> [!IMPORTANT]
> **State management**: No state lib installed. Plan uses **zustand** (lightweight, popular).

---

## Architecture Overview

### Directory Structure (Vue → React mapping)

```
src/
├── assets/                  # Static assets (SVG icons, images)
├── components/              # Shared components
│   ├── ui/                  # shadcn/ui components (auto-generated)
│   ├── PageHeader.tsx       # Reusable top app bar
│   ├── EmptyState.tsx       # Empty state with illustration
│   ├── TransactionItem.tsx  # Transaction list item (shared by P-02, P-05)
│   ├── CategoryIcon.tsx     # Category icon with circular background
│   ├── AmountDisplay.tsx    # Formatted amount with color
│   └── SegmentControl.tsx   # 支出/收入 toggle (reused across pages)
├── config/
│   └── routes.tsx           # Route definitions
├── features/                # Feature-specific components (not shared)
│   ├── welcome/
│   ├── home/
│   ├── transaction/
│   ├── search/
│   ├── categories/
│   ├── budgets/
│   ├── reports/
│   ├── ai-settings/
│   ├── backup/
│   └── settings/
├── hooks/                   # Custom hooks (was composables/)
│   ├── useAppStore.ts       # Zustand store selector hooks
│   └── useFormatters.ts     # Formatting hooks (currency, date)
├── layouts/
│   └── AppLayout.tsx        # Bottom tab bar + FAB layout
├── lib/
│   └── utils.ts             # cn() utility (exists)
├── pages/                   # Page-level components (route targets)
│   ├── WelcomePage.tsx      # P-01
│   ├── HomePage.tsx         # P-02
│   ├── TransactionFormPage.tsx  # P-03
│   ├── TransactionDetailPage.tsx # P-04
│   ├── SearchPage.tsx       # P-05
│   ├── CategoriesPage.tsx   # P-06
│   ├── BudgetsPage.tsx      # P-07
│   ├── BudgetHistoryPage.tsx # P-08
│   ├── ReportsPage.tsx      # P-09
│   ├── TrendsPage.tsx       # P-10
│   ├── CategoryBreakdownPage.tsx # P-11
│   ├── AISettingsPage.tsx   # P-12
│   ├── BackupRestorePage.tsx # P-13
│   └── SettingsPage.tsx     # P-14
├── services/
│   └── mock-data.ts         # All mock data
├── stores/
│   └── app-store.ts         # Zustand store
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   ├── format.ts            # Currency, date, number formatters
│   └── constants.ts         # App constants (categories, icons)
├── App.css                  # Global styles + design tokens
├── App.tsx                  # Router setup
└── main.tsx                 # Entry point
```

### Design System Token Mapping

CLAUDE-DESIGN.md tokens → CSS custom properties in `App.css`:

| Design Token | CSS Variable | Value |
|---|---|---|
| `colors.primary` | `--color-primary` | `#cc785c` |
| `colors.primary-active` | `--color-primary-active` | `#a9583e` |
| `colors.canvas` | `--color-canvas` | `#faf9f5` |
| `colors.ink` | `--color-ink` | `#141413` |
| `colors.body` | `--color-body` | `#3d3d3a` |
| `colors.muted` | `--color-muted` | `#6c6a64` |
| `colors.surface-card` | `--color-surface-card` | `#efe9de` |
| `colors.surface-dark` | `--color-surface-dark` | `#181715` |
| `colors.hairline` | `--color-hairline` | `#e6dfd8` |
| `colors.success` | `--color-success` | `#5db872` |
| `colors.warning` | `--color-warning` | `#d4a017` |
| `colors.error` | `--color-error` | `#c64545` |

### Mobile-First Patterns

- **Drawer (vaul)** replaces Dialog everywhere (confirmation dialogs, edit forms, filter panels)
- **No hover events** — all interactions via tap/press
- **Touch targets** ≥ 44px for all interactive elements
- **Bottom tab bar** fixed at bottom with 4 tabs + centered FAB
- **Safe area insets** respected via CSS `env(safe-area-inset-*)`
- **Viewport** set to `width=device-width, initial-scale=1, viewport-fit=cover`

### shadcn Components Needed

```
button (exists), card, input, badge, separator, tabs, drawer, switch,
progress, avatar, dropdown-menu, select, toggle-group, alert, skeleton,
scroll-area, sheet, label, textarea, slider, checkbox, toggle, sonner
```

### NPM Dependencies to Install

```
react-router-dom          # Routing
zustand                   # State management
echarts                   # Charts engine
echarts-for-react         # React wrapper
dayjs                     # Date manipulation
vaul                      # Drawer component (shadcn drawer depends on it)
```

### Google Fonts to Import

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap');
```

---

## Proposed Changes

### Task 0a: Dependencies & Design System

**Goal**: Install all dependencies, shadcn components, and set up the CLAUDE-DESIGN.md design tokens in CSS.

#### [MODIFY] [package.json](file:///i:/Project/client-project/personal-accounting-app/package.json)
- Add `react-router-dom`, `zustand`, `echarts`, `echarts-for-react`, `dayjs` to dependencies

#### [MODIFY] [App.css](file:///i:/Project/client-project/personal-accounting-app/src/App.css)
- Replace default shadcn CSS variables with CLAUDE-DESIGN.md color tokens
- Import Cormorant Garamond from Google Fonts
- Define custom Tailwind theme tokens for the design system
- Add mobile app global styles (safe area, touch-action, overflow behavior)
- Remove old Tauri template styles

#### shadcn components to install via CLI:
```bash
npx shadcn@latest add card input badge separator tabs drawer switch progress avatar dropdown-menu select toggle-group alert skeleton scroll-area sheet label textarea slider checkbox toggle sonner
```

---

### Task 0b: Types, Constants & Mock Data

**Goal**: Create all TypeScript interfaces, app constants, and comprehensive mock data.

#### [NEW] [index.ts](file:///i:/Project/client-project/personal-accounting-app/src/types/index.ts)
- `Transaction` — id, type (income/expense), amount, categoryId, note, date, time, isRecurring, recurringConfig, aiClassified, createdAt, updatedAt
- `Category` — id, name, icon, type (income/expense), isPredefined, isDefault
- `Budget` — id, month, totalAmount, spent, categoryBudgets[]
- `CategoryBudget` — categoryId, amount, spent
- `RecurringConfig` — frequency (daily/weekly/monthly/yearly), endDate?
- `AIConfig` — enabled, baseUrl, apiKey, model, timeout, promptTemplate
- `BackupMetadata` — version, exportDate, transactionCount, categoryCount, budgetCount
- `AppSettings` — budgetNotification, recurringNotification, hasSeenWelcome
- `DateRange`, `AmountRange`, `SearchFilters`

#### [NEW] [constants.ts](file:///i:/Project/client-project/personal-accounting-app/src/utils/constants.ts)
- Predefined expense categories: 餐饮🍔, 交通🚗, 购物🛒, 住房🏠, 娱乐🎮, 医疗💊, 教育📚, 通讯📱, 服饰👔, 运动💪, 日用🧴, 其他📦
- Predefined income categories: 工资💰, 奖金🎁, 投资📈, 兼职💼, 其他📦
- Category icon palette (24-32 icons)
- Default AI prompt template

#### [NEW] [format.ts](file:///i:/Project/client-project/personal-accounting-app/src/utils/format.ts)
- `formatCurrency(amount: number)` → `¥ 1,234.56`
- `formatDate(date: string)` → `2026-06-01` or `今天`/`昨天`
- `formatTime(time: string)` → `12:34`
- `formatMonth(month: string)` → `2026 年 6 月`
- `formatPercent(value: number)` → `85.2%`
- `groupTransactionsByDate(transactions: Transaction[])` → grouped map

#### [NEW] [mock-data.ts](file:///i:/Project/client-project/personal-accounting-app/src/services/mock-data.ts)
- 50+ mock transactions spanning 3 months (with varied categories, amounts, notes)
- 12 expense categories + 5 income categories (predefined)
- 2 custom categories
- Current month budget (total ¥5,000 + 4 category budgets)
- 3 months of budget history
- Mock AI config (disabled by default)
- Mock app settings

---

### Task 0c: Router, Store, Layout & Shared Components

**Goal**: Set up routing, state management, app layout (bottom tabs + FAB), and all shared components.

#### [NEW] [routes.tsx](file:///i:/Project/client-project/personal-accounting-app/src/config/routes.tsx)
- Route definitions for all 14 pages
- `WelcomePage` at `/welcome`
- `HomePage` at `/` (default)
- `TransactionFormPage` at `/transaction/new` and `/transaction/edit/:id`
- `TransactionDetailPage` at `/transaction/:id`
- `SearchPage` at `/search`
- `CategoriesPage` at `/categories`
- `BudgetsPage` at `/budgets`
- `BudgetHistoryPage` at `/budgets/history`
- `ReportsPage` at `/reports`
- `TrendsPage` at `/reports/trends`
- `CategoryBreakdownPage` at `/reports/categories`
- `AISettingsPage` at `/settings/ai`
- `BackupRestorePage` at `/settings/backup`
- `SettingsPage` at `/settings`

#### [NEW] [app-store.ts](file:///i:/Project/client-project/personal-accounting-app/src/stores/app-store.ts)
- Zustand store with slices:
  - `transactions` — CRUD operations on mock data
  - `categories` — category management
  - `budgets` — budget management
  - `settings` — app settings (welcome shown, notifications)
  - `aiConfig` — AI configuration

#### [NEW] [AppLayout.tsx](file:///i:/Project/client-project/personal-accounting-app/src/layouts/AppLayout.tsx)
- Fixed bottom tab bar with 4 tabs: 首页, 预算, 报表, 我的
- Each tab: HugeIcon + label, active state with coral color
- Centered FAB (+ button) in coral, triggers navigation to `/transaction/new`
- Content area with safe-area padding
- Tab bar uses `surface-card` background with `hairline` top border
- Only shown on tab-level pages (not sub-pages like detail/form)

#### [NEW] [PageHeader.tsx](file:///i:/Project/client-project/personal-accounting-app/src/components/PageHeader.tsx)
- Reusable top app bar
- Props: title, leftAction (back arrow), rightAction (button/text)
- Canvas background, ink text
- Left/right slots for icons or text buttons

#### [NEW] [EmptyState.tsx](file:///i:/Project/client-project/personal-accounting-app/src/components/EmptyState.tsx)
- SVG illustration placeholder
- Title + description text
- Optional action button
- Centered vertically in container

#### [NEW] [TransactionItem.tsx](file:///i:/Project/client-project/personal-accounting-app/src/components/TransactionItem.tsx)
- Shared by P-02 (home) and P-05 (search)
- Left: CategoryIcon (circular bg + emoji/icon)
- Center: category name + note (truncated)
- Right: amount (coral for expense, green for income)
- Tap handler → navigate to detail page
- Minimum 48px height for touch targets

#### [NEW] [CategoryIcon.tsx](file:///i:/Project/client-project/personal-accounting-app/src/components/CategoryIcon.tsx)
- Circular background (surface-card)
- Centered icon/emoji
- Props: icon, size (sm/md/lg), selected state

#### [NEW] [AmountDisplay.tsx](file:///i:/Project/client-project/personal-accounting-app/src/components/AmountDisplay.tsx)
- Formatted currency display
- Color: coral for expense, green for income, ink for neutral
- Props: amount, type, size (sm/md/lg/xl)

#### [NEW] [SegmentControl.tsx](file:///i:/Project/client-project/personal-accounting-app/src/components/SegmentControl.tsx)
- 支出/收入 toggle used by P-03, P-06, P-09
- Based on shadcn ToggleGroup
- Active segment: coral background, white text
- Inactive: surface-card background, muted text

#### [MODIFY] [App.tsx](file:///i:/Project/client-project/personal-accounting-app/src/App.tsx)
- Replace Tauri template with React Router setup
- BrowserRouter → Routes → Route definitions
- Wrap with Toaster (sonner) provider

#### [MODIFY] [main.tsx](file:///i:/Project/client-project/personal-accounting-app/src/main.tsx)
- Keep React.StrictMode
- No changes needed unless adding providers

---

### Task 1: Welcome Page (P-01)

**Goal**: 2-screen onboarding flow with warm cream + coral design.

#### [NEW] [WelcomePage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/WelcomePage.tsx)
- Screen 1: App logo + name + headline `简单、智能、本地化` + subtitle + progress dots + 下一步/跳过
- Screen 2: 3 feature highlight cards (📒 轻松记账, 🤖 AI 智能分类, 📊 预算与报表) + 开始使用/跳过
- Swipe gesture support between screens
- Mark `hasSeenWelcome` in store on completion/skip
- Full-screen layout (no tab bar, no header)
- Animated transitions between screens

#### [NEW] [features/welcome/](file:///i:/Project/client-project/personal-accounting-app/src/features/welcome/)
- `FeatureCard.tsx` — highlight card with emoji, title, description
- `ProgressDots.tsx` — 2-dot indicator showing current screen

---

### Task 2: Home Page (P-02)

**Goal**: Transaction list with month summary, budget banner, FAB.

#### [NEW] [HomePage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/HomePage.tsx)
- Top app bar: current month (2026 年 6 月) + category management icon + search icon
- Monthly summary card: income (green), expense (coral), balance (ink)
- Budget overspend banner (conditional, yellow/red)
- Transaction list grouped by date (今天, 昨天, 6 月 1 日, etc.)
- Empty state when no transactions
- FAB provided by AppLayout

#### [NEW] [features/home/](file:///i:/Project/client-project/personal-accounting-app/src/features/home/)
- `MonthlySummaryCard.tsx` — income/expense/balance card
- `BudgetBanner.tsx` — overspend warning banner (yellow/red)
- `DateGroupHeader.tsx` — date section header (今天, 昨天, etc.)

---

### Task 3: Transaction Form (P-03)

**Goal**: Add/edit transaction with custom numpad, category grid, date/time picker.

#### [NEW] [TransactionFormPage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/TransactionFormPage.tsx)
- PageHeader: 记一笔 / 编辑交易 + back arrow + 保存 button
- SegmentControl: 支出/收入
- Large amount display (48px coral)
- Custom numpad (0-9 + . + ⌫)
- Category grid (4 columns, with AI recommended badge)
- Date/time selectors
- Note input (max 200 chars)
- Recurring transaction toggle + config section
- Edit mode: pre-fill from route params

#### [NEW] [features/transaction/](file:///i:/Project/client-project/personal-accounting-app/src/features/transaction/)
- `NumPad.tsx` — custom 0-9 number pad with decimal + delete
- `CategoryGrid.tsx` — 4-column grid of category icons with selection
- `RecurringConfig.tsx` — recurring transaction settings (collapsible)

---

### Task 4: Transaction Detail (P-04)

**Goal**: View transaction details with edit/delete actions.

#### [NEW] [TransactionDetailPage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/TransactionDetailPage.tsx)
- PageHeader: 支出详情/收入详情 + back + 编辑 button
- Large amount display (colored by type)
- Category icon + name
- Date/time display
- Detail info list (type, category, amount, date, time, note, created, modified)
- AI classification badge if applicable
- Bottom fixed: 删除交易 button (red, with Drawer confirmation)

---

### Task 5: Search Page (P-05)

**Goal**: Transaction search with keyword + filters (Drawer-based filter panel).

#### [NEW] [SearchPage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/SearchPage.tsx)
- Top: search input + back arrow + filter icon
- Filter Drawer: date range, amount range, type, category multi-select
- Results list (same TransactionItem component as home)
- Result count header
- Empty search state

#### [NEW] [features/search/](file:///i:/Project/client-project/personal-accounting-app/src/features/search/)
- `FilterDrawer.tsx` — Drawer with filter sections (date, amount, type, category)
- `FilterChip.tsx` — active filter indicator chips

---

### Task 6: Categories Page (P-06)

**Goal**: Category management with add/edit Drawer and context menu.

#### [NEW] [CategoriesPage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/CategoriesPage.tsx)
- PageHeader: 分类管理 + back + `+` add button
- SegmentControl: 支出/收入
- Category list grouped by 预定义/自定义
- Each item: icon + name + 默认 badge
- Tap → edit Drawer
- Long press → context menu (set default, edit, delete)

#### [NEW] [features/categories/](file:///i:/Project/client-project/personal-accounting-app/src/features/categories/)
- `CategoryEditDrawer.tsx` — Drawer with icon grid picker + name input
- `IconPicker.tsx` — grid of 24-32 selectable icons/emojis

---

### Task 7: Budgets Page (P-07)

**Goal**: Budget management with progress visualization and warnings.

#### [NEW] [BudgetsPage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/BudgetsPage.tsx)
- Top: month display + left/right arrows + 历史 button
- Total budget card with progress bar (green/yellow/red)
- Amount info: used/total/remaining
- Category budget list with individual progress bars
- Warning card (yellow) when overspending detected
- Edit budget Drawer
- Add category budget Drawer

#### [NEW] [features/budgets/](file:///i:/Project/client-project/personal-accounting-app/src/features/budgets/)
- `BudgetProgressCard.tsx` — total budget with circular/bar progress
- `CategoryBudgetItem.tsx` — category budget list item with progress
- `BudgetEditDrawer.tsx` — edit budget amount Drawer

---

### Task 8: Budget History (P-08)

**Goal**: Historical budget review with expandable month cards.

#### [NEW] [BudgetHistoryPage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/BudgetHistoryPage.tsx)
- PageHeader: 预算历史 + back
- Time range filter: 最近3/6/12个月 / 全部
- Monthly budget cards (expandable):
  - Month title + total progress bar
  - Top 3 category budgets preview
  - Overspend badge (red)
  - Expand to full category budget list
- Empty state

---

### Task 9: Reports Summary (P-09)

**Goal**: Reports overview with summary stats and entry cards to trends/breakdown.

#### [NEW] [ReportsPage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/ReportsPage.tsx)
- Top: 报表 title
- SegmentControl: 日/周/月/年
- Time selector with left/right arrows
- Summary card: income (green), expense (coral), balance (ink) + comparison percentages
- Trends entry card (mini line chart preview)
- Category breakdown entry card (mini pie chart preview)
- Optional: TOP 5 expense categories ranking

#### [NEW] [features/reports/](file:///i:/Project/client-project/personal-accounting-app/src/features/reports/)
- `SummaryCard.tsx` — income/expense/balance with comparison
- `TrendPreviewCard.tsx` — mini line chart + "收支趋势" title
- `BreakdownPreviewCard.tsx` — mini pie chart + "分类支出占比" title
- `TopCategoriesRank.tsx` — TOP 5 expense categories

---

### Task 10: Trends Chart (P-10)

**Goal**: Full ECharts line chart with dual lines (income/expense).

#### [NEW] [TrendsPage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/TrendsPage.tsx)
- PageHeader: 收支趋势 + back
- SegmentControl: 近6个月 / 近12个月 / 近5年 / 自定义
- ECharts line chart:
  - X axis: time
  - Y axis: amount
  - Income line (green #5db872)
  - Expense line (coral #cc785c)
  - Clickable data points
  - Legend toggle
- Summary stats: total income, total expense, average, max
- Data point detail Drawer (tap data point)

---

### Task 11: Category Breakdown (P-11)

**Goal**: ECharts donut pie chart + category detail list.

#### [NEW] [CategoryBreakdownPage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/CategoryBreakdownPage.tsx)
- PageHeader: 分类支出明细 + back
- SegmentControl: 本月 / 上月 / 近3个月 / 近12个月 / 自定义
- ECharts donut chart:
  - Center: total expense amount
  - Segments per category with themed colors
  - Tap segment → highlight list item
- Category list (sorted by amount desc):
  - Icon + name + amount + percentage + count + average
  - Tap → navigate to search with category filter
- Summary row: total amount + total count

---

### Task 12: AI Settings (P-12)

**Goal**: AI/LLM API configuration form.

#### [NEW] [AISettingsPage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/AISettingsPage.tsx)
- PageHeader: AI 智能分类 + back
- Enable toggle switch
- API config section (shown when enabled):
  - API Base URL input
  - API Key input (password + eye toggle)
  - Model select (dropdown with presets + custom)
  - Timeout slider (1-30s, default 10)
- Advanced: Prompt template textarea
- Buttons: 测试连接, 保存, 清除配置
- Status indicators: 未配置 / 已配置（加密保存）
- Test result display (success/failure)

---

### Task 13: Backup & Restore (P-13)

**Goal**: Data export/import UI with statistics and file operations.

#### [NEW] [BackupRestorePage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/BackupRestorePage.tsx)
- PageHeader: 备份与恢复 + back
- Data overview card: transaction count, category count, budget count, estimated size
- Export section:
  - Date range selector
  - 导出为JSON button (primary)
  - Mock progress indicator
- Import section:
  - Warning banner (red/destructive)
  - File selector (mock)
  - File preview card (metadata)
  - 导入此备份 button (destructive)
  - Confirmation Drawer with strong warnings

---

### Task 14: Settings Page (P-14)

**Goal**: Settings hub with grouped menu items.

#### [NEW] [SettingsPage.tsx](file:///i:/Project/client-project/personal-accounting-app/src/pages/SettingsPage.tsx)
- App info header card: logo + name + version
- Settings groups:
  - 通用:
    - 通知设置 (预算超支提醒 switch, 定期交易提醒 switch)
    - 分类管理 → P-06
  - 智能与数据:
    - AI 智能分类 → P-12
    - 数据备份与恢复 → P-13
  - 数据管理:
    - 清除数据 (destructive, Drawer confirmation)
  - 关于:
    - 应用版本, 隐私政策, 用户协议, 开源许可, 意见反馈

---

## Task Execution Order

| # | Task | Dependency | Complexity |
|---|---|---|---|
| 0a | Dependencies & Design System | None | Medium |
| 0b | Types, Constants & Mock Data | 0a | Medium |
| 0c | Router, Store, Layout & Shared Components | 0a, 0b | High |
| 1 | Welcome Page (P-01) | 0c | Low |
| 2 | Home Page (P-02) | 0c | High |
| 3 | Transaction Form (P-03) | 0c | High |
| 4 | Transaction Detail (P-04) | 0c | Low |
| 5 | Search Page (P-05) | 0c | Medium |
| 6 | Categories Page (P-06) | 0c | Medium |
| 7 | Budgets Page (P-07) | 0c | High |
| 8 | Budget History (P-08) | 0c | Low |
| 9 | Reports Summary (P-09) | 0c | Medium |
| 10 | Trends Chart (P-10) | 0c | Medium |
| 11 | Category Breakdown (P-11) | 0c | Medium |
| 12 | AI Settings (P-12) | 0c | Low |
| 13 | Backup & Restore (P-13) | 0c | Low |
| 14 | Settings Page (P-14) | 0c | Low |

> Tasks 1–14 are independent of each other (all depend only on 0c) and can be executed in any order after foundation tasks complete.

---

## Verification Plan

### Automated (per task)
- `npm run build` — TypeScript compilation check after each task
- `npm run dev` — Visual verification in browser (mobile viewport 390×844)

### Manual
- After all tasks: full navigation flow test through all 14 pages
- Verify design system consistency (cream canvas, coral CTAs, serif display headlines)
- Verify mobile touch targets (≥ 44px)
- Verify Drawer-based interactions (no Dialog/hover patterns)
- Verify empty states on all list pages
