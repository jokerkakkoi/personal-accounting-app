# 个人记账应用 — Tauri 2.0 Rust 后端设计规范 (Backend Specification)

> **目标**：基于 Tauri 2.0 框架，构建一个纯本地的高性能 Rust 后端。它将负责管理本地 SQLite 数据库、通过 IPC (进程间通信) 向 React 前端提供 API、与 LLM API 交互进行 AI 智能分类、调度定期交易以及管理数据备份与恢复。

---

## 1. 架构概述与设计原则

### 1.1 核心设计原则
* **目标平台**：本应用当前阶段仅针对 **Android** 移动端进行构建与适配。
* **字段序列化协议**：为了保持与前端 React/TypeScript 现有数据模型和状态管理器（如驼峰命名法 `camelCase`）的一致性，减少前端代码重构量，后端所有的 Rust DTO（Data Transfer Object）、接口入参以及返回结构体均统一声明 `#[serde(rename_all = "camelCase")]`，以实现无缝的 JSON 数据 casing 转换。
* **统一错误处理机制**：后端使用统一的 `AppError` 枚举模型，封装数据库、网络以及安全组件的底层错误，并实现 `serde::Serialize`。当命令执行失败时，统一返回结构化的 JSON 错误给前端。

### 1.2 架构拓扑
本应用采用典型的 **Client-Server (C/S)** 架构的本地变体：
* **前端 (Client)**：React + TypeScript，运行在 WebView 容器中。前端的状态管理器 [app-store.ts](file:///i:/Project/client-project/personal-accounting-app/src/stores/app-store.ts) 不再使用 `localStorage`，而是通过 Tauri IPC `invoke` 调用 Rust 后端。
* **后端 (Server/Rust Core)**：Tauri 2.0 宿主进程。它使用 Rust 编写，负责本地 SQLite 数据库管理、安全凭证存储、本地文件读写与网络请求。

```mermaid
graph TD
    subgraph Frontend ["Frontend (WebView)"]
        UI[React UI] <--> Store[Zustand Store]
    end
    
    subgraph Backend ["Backend (Tauri Rust Core)"]
        IPC[Tauri IPC Handlers / Commands] <--> Services[Business Services]
        Services <--> DB[(SQLite DB via tauri-plugin-sql)]
        Services <--> Stronghold[(tauri-plugin-stronghold)]
        Services <--> AIClient[HTTP LLM Client]
        Services <--> BackupMgr[Backup & Restore Manager]
    end
    
    Store <-->|Tauri IPC invoke| IPC
```

---

## 2. 数据库设计 (SQLite)

本应用的数据完全存储在本地的 SQLite 数据库文件中。为了确保跨平台部署（Android 与 Desktop）的数据一致性与初始化便利性，我们采用 Tauri 官方的数据库插件 `tauri-plugin-sql` (SQLite 驱动)。该插件在 Rust 侧基于 `sqlx` 驱动，支持异步连接池管理、自动运行数据库迁移 (Migrations) 等高级特性。

### 2.1 数据库文件位置
* **Android**：应用私有数据目录 `/data/data/<app-id>/databases/accounting.db`
* **Desktop (开发测试)**：用户文档/配置目录下的应用专用文件夹，例如 Windows 上的 `%APPDATA%\personal-accounting-app\accounting.db`

### 2.2 数据表结构

#### 1. 交易表 `transactions`
存储所有收入和支出流水。

| 字段名 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 格式为 `tx_` + 毫秒时间戳或 UUID |
| `type` | TEXT | NOT NULL | `'income'` (收入) 或 `'expense'` (支出) |
| `amount` | REAL | NOT NULL | 交易金额（双精度浮点数，保留两位小数） |
| `category_id` | TEXT | NOT NULL, REFERENCES `categories(id)` | 关联的分类 ID |
| `note` | TEXT | DEFAULT '' | 交易备注，最大 200 字符 |
| `date` | TEXT | NOT NULL | 交易日期，格式为 `YYYY-MM-DD` |
| `time` | TEXT | NOT NULL | 交易时间，格式为 `HH:mm` |
| `is_recurring` | INTEGER | NOT NULL DEFAULT 0 | 是否为定期交易生成的记录 (0=否, 1=是) |
| `ai_classified`| INTEGER | NOT NULL DEFAULT 0 | 是否由 AI 智能分类得出 (0=否, 1=是) |
| `created_at` | TEXT | NOT NULL | 创建时间，ISO 8601 字符串 |
| `updated_at` | TEXT | NOT NULL | 最后修改时间，ISO 8601 字符串 |

> **索引**：
> * `idx_transactions_date`: 用于历史流水快速按日期范围过滤与分页。
> * `idx_transactions_category`: 用于统计分类账单和级联更新。

#### 2. 分类表 `categories`
存储记账分类，支持预定义和用户自定义分类。

| 字段名 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 预定义 ID (如 `'exp_food'`)，或自定义 `'cat_` + 戳 |
| `name` | TEXT | NOT NULL | 分类名称 |
| `icon` | TEXT | NOT NULL | 分类图标 (Emoji 字符或图标名称) |
| `type` | TEXT | NOT NULL | `'income'` 或 `'expense'` |
| `is_predefined` | INTEGER | NOT NULL DEFAULT 0 | 是否为预置分类 (0=用户自定义, 1=内置) |
| `is_default` | INTEGER | NOT NULL DEFAULT 0 | 是否为该类型的默认分类 (同一类型下仅能有一个 1) |

> **初始预设数据**：
> 在数据库首次创建（Migration 1）时，必须内置以下预设分类：
> * **支出**：餐饮🍔 (`exp_food`)、交通🚗 (`exp_transport`)、购物🛒 (`exp_shopping`)、住房🏠 (`exp_housing`)、娱乐🎮 (`exp_entertainment`)、医疗💊 (`exp_medical`)、教育📚 (`exp_education`)、通讯📱 (`exp_telecom`)、服饰👔 (`exp_clothing`)、运动💪 (`exp_sports`)、日用🧴 (`exp_groceries`)、其他📦 (`exp_other`，默认)
> * **收入**：工资💰 (`inc_salary`)、奖金🎁 (`inc_bonus`)、投资📈 (`inc_investment`)、兼职💼 (`inc_parttime`)、其他📦 (`inc_other`，默认)

#### 3. 月度预算表 `budgets`
管理每月总预算。

| 字段名 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 格式为 `bg_YYYY-MM` |
| `month` | TEXT | UNIQUE NOT NULL | 预算月份，格式为 `YYYY-MM` |
| `total_amount` | REAL | NOT NULL | 月度总预算金额 |

#### 4. 分类预算表 `category_budgets`
针对每个分类单独设置的预算。

| 字段名 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增主键 |
| `budget_id` | TEXT | NOT NULL, REFERENCES `budgets(id)` ON DELETE CASCADE | 关联的月度预算 ID |
| `category_id` | TEXT | NOT NULL, REFERENCES `categories(id)` ON DELETE CASCADE | 关联的分类 ID |
| `amount` | REAL | NOT NULL | 该分类分配的预算金额 |

> **联合唯一约束**：`UNIQUE(budget_id, category_id)`，确保同一个月内一个分类只关联一条预算配置。

#### 5. 定期交易配置表 `recurring_transactions`
用于管理用户设置的重复记账规则（如每月房租、每周会员订阅）。

| 字段名 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | 格式为 `rec_` + 毫秒时间戳 |
| `type` | TEXT | NOT NULL | `'income'` 或 `'expense'` |
| `amount` | REAL | NOT NULL | 单次交易金额 |
| `category_id` | TEXT | NOT NULL, REFERENCES `categories(id)` | 分类 ID |
| `note` | TEXT | DEFAULT '' | 模板备注 |
| `frequency` | TEXT | NOT NULL | 重复周期：`'daily'`, `'weekly'`, `'monthly'`, `'yearly'` |
| `start_date` | TEXT | NOT NULL | 开始重复执行的日期 `YYYY-MM-DD` |
| `end_date` | TEXT | DEFAULT NULL | 结束重复的日期 `YYYY-MM-DD` (可为空，代表无限重复) |
| `last_triggered_date`| TEXT | DEFAULT NULL | 最近一次自动生成流水成功的日期 `YYYY-MM-DD` |
| `created_at` | TEXT | NOT NULL | 创建时间 |

#### 6. 配置表 `settings`
以 Key-Value 形式存储非敏感性的应用状态，如通知开关、是否已看欢迎页等。敏感信息（如 LLM API Key）应当使用系统底层钥匙串存储，但如果存在降级需要，也可设计专门的加密字段。

| 字段名 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `key` | TEXT | PRIMARY KEY | 配置名 (如 `'has_seen_welcome'`, `'budget_notification'`) |
| `value` | TEXT | NOT NULL | 配置值 (存储为 JSON 字符串或简单 String) |


### 2.3 tauri-plugin-sql 初始化与使用

在 Rust 宿主进程中，我们将通过配置插件的 `add_migrations` 方法来进行建表和初始数据录入，并利用该插件自动管理 SQLite 的连接生命周期与路径。

#### 1. 注册插件与数据库迁移 (lib.rs)
```rust
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn run() {
    // 数据库迁移逻辑
    let migration_v1 = Migration {
        version: 1,
        description: "initialize_database",
        sql: "
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
        ",
        kind: MigrationKind::Up,
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        // 注册 SQL 插件，指定连接池，并绑定迁移逻辑
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:accounting.db", vec![migration_v1])
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            // 此处注册后续编写的 Commands...
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 2. 在 Rust Commands 中获取数据库连接
Tauri 官方插件会在应用状态中注入管理连接池的实例。在 Rust command 函数中，可以通过 `tauri::AppHandle` 或注入 `Db` 连接直接执行查询：

```rust
use tauri::AppHandle;
use tauri_plugin_sql::{Db, TauriSql};

#[tauri::command]
async fn get_categories(app: AppHandle) -> Result<Vec<Category>, String> {
    // 获取插件管理的 SQLite 连接池实例
    // 注意：tauri-plugin-sql 提供了便捷的连接池缓存，在 Rust 层可通过如下方式获取
    let db = tauri_plugin_sql::Builder::default()
        .build()
        .get_db("sqlite:accounting.db") 
        .map_err(|e| e.to_string())?;

    // 执行异步 SQL 查询 (tauri-plugin-sql 的 db 支持 select / execute 异步方法)
    let rows = db.select("SELECT id, name, icon, type, is_predefined, is_default FROM categories", vec![])
        .await
        .map_err(|e| e.to_string())?;

    // 解析 rows (JsonValue 数组) 并转换为对应 Category 结构体返回
    // ...
    Ok(categories)
}
```

---

## 3. Tauri IPC 接口规范 (Commands)

前端通过调用 Rust 层的 Command 实现数据交互。数据结构使用 JSON 进行序列化和反序列化，Rust 侧通过 `serde` 转换。

### 3.1 交易接口 (Transactions)

#### 1. 分页检索交易流水
* **Command Name**: `get_transactions`
* **参数 (Arguments)**:
  ```rust
  struct SearchFilters {
      keyword: String,
      type_filter: String, // "income" | "expense" | "all"
      category_ids: Option<Vec<String>>,
      start_date: Option<String>, // "YYYY-MM-DD"
      end_date: Option<String>,
      min_amount: Option<f64>,
      max_amount: Option<f64>,
  }
  // 参数列表
  filters: SearchFilters,
  page: u32,       // 从 1 开始
  page_size: u32,  // 默认 30
  ```
* **返回 (Return Value)**:
  ```rust
  struct PaginatedTransactions {
      items: Vec<Transaction>,
      total_count: u32,
      has_more: bool,
  }
  ```

#### 2. 添加交易流水
* **Command Name**: `add_transaction`
* **参数**:
  ```rust
  struct AddTransactionInput {
      type_: String, // "income" | "expense"
      amount: f64,
      category_id: String,
      note: String,
      date: String, // "YYYY-MM-DD"
      time: String, // "HH:mm"
      is_recurring: bool,
      ai_classified: bool,
  }
  ```
* **返回**: `Result<String, String>` (新交易的 `id`)
* **内部处理**: 
  1. 插入 `transactions` 表。
  2. 触发关联月份的预算 `spent` 属性重新计算（包含总预算和分类预算）。
  3. 如果是支出，检查是否触发超支阈值（80% 或 100%），如超支且开启通知，在返回中携带超支状态，前端或 Rust 触发本地通知。

#### 3. 修改交易流水
* **Command Name**: `update_transaction`
* **参数**: `id: String, fields: PartialTransactionInput`
* **返回**: `Result<(), String>`
* **内部处理**: 更新字段并重算受影响月份的预算 `spent`。

#### 4. 删除交易流水
* **Command Name**: `delete_transaction`
* **参数**: `id: String`
* **返回**: `Result<(), String>`
* **内部处理**: 删除记录并重算受影响月份的预算 `spent`。

---

### 3.2 分类接口 (Categories)

#### 1. 获取所有分类列表
* **Command Name**: `get_categories`
* **参数**: 无
* **返回**: `Result<Vec<Category>, String>`

#### 2. 添加自定义分类
* **Command Name**: `add_category`
* **参数**: `name: String, icon: String, type_: String` (type 为 `"income"` 或 `"expense"`)
* **返回**: `Result<String, String>` (新分类的 `id`)

#### 3. 编辑分类
* **Command Name**: `update_category`
* **参数**: `id: String, name: String, icon: String`
* **返回**: `Result<(), String>`

#### 4. 删除分类
* **Command Name**: `delete_category`
* **参数**: `id: String`
* **返回**: `Result<DeleteCategoryResult, AppError>`
* **返回结构**:
  ```rust
  struct DeleteCategoryResult {
      success: bool,
      migratedCount: u32, // 被迁移的交易记录笔数
  }
  ```
* **内部逻辑（极其重要）**：
  参照前端 [app-store.ts:L146-231](file:///i:/Project/client-project/personal-accounting-app/src/stores/app-store.ts#L146-231) 的业务逻辑，Rust 层在删除分类时必须使用**事务 (Transaction)** 完成以下原子操作：
  1. **拦截验证**：内置的预设分类（`is_predefined = 1`）禁止删除。
  2. **寻找备用分类 (Fallback)**：寻找同类型下已设为默认（`is_default`）的分类，或退而求其次选择 `exp_other` / `inc_other`，或者同类型中的第一个分类。
  3. **迁移交易记录**：将所有原属于该删除分类的 `transactions` 的 `category_id` 改为备用分类的 ID。记录受影响（被修改）的交易行数作为 `migratedCount`。
  4. **预算归并**：在 `category_budgets` 表中，如果该月也对备用分类配置了预算，则把被删除分类的预算金额合并累加到备用分类上，然后删除旧条目；如果没有，直接把被删除分类的 `category_id` 改为备用分类的 ID。
  5. **删除分类表条目**。
  6. **触发重算**：重算受影响的预算已花销额度 (`spent`)。

#### 5. 设置默认分类
* **Command Name**: `set_default_category`
* **参数**: `id: String`
* **返回**: `Result<(), String>`
* **内部处理**: 将同类型下所有其他分类的 `is_default` 置为 0，该分类置为 1。

---

### 3.3 预算接口 (Budgets)

#### 1. 获取指定月份预算与花销情况
* **Command Name**: `get_budget_by_month`
* **参数**: `month: String` (格式 `"YYYY-MM"`)
* **返回**: `Result<Option<BudgetData>, String>`
* **返回结构**:
  ```rust
  struct CategoryBudgetData {
      category_id: String,
      amount: f64,
      spent: f64,
  }
  struct BudgetData {
      id: String,
      month: String,
      total_amount: f64,
      spent: f64,
      category_budgets: Vec<CategoryBudgetData>,
  }
  ```

#### 2. 更新或创建月度总预算
* **Command Name**: `update_total_budget`
* **参数**: `month: String, amount: f64`
* **返回**: `Result<(), String>`

#### 3. 更新或创建分类预算
* **Command Name**: `update_category_budget`
* **参数**: `month: String, category_id: String, amount: f64`
* **返回**: `Result<(), String>`

#### 4. 删除分类预算配置
* **Command Name**: `delete_category_budget`
* **参数**: `month: String, category_id: String`
* **返回**: `Result<(), String>`

#### 5. 获取历史预算分析
* **Command Name**: `get_budget_history`
* **参数**: `limit: u32` (获取最近 N 个月的预算完成情况)
* **返回**: `Result<Vec<BudgetData>, String>`

---

### 3.4 定期交易与系统配置 (Settings & Tasks)

#### 1. 获取和更新基础设置
* **Command Name**: `get_settings` / `update_settings`
* **参数**: 键值对或整体结构体映射。

#### 2. 获取和更新 AI LLM 配置
* **Command Name**: `get_ai_config` / `update_ai_config`
* **特别注意**：
  * API Key 的读写：在 Android 平台上，当调用 `update_ai_config` 时，API Key 应通过 `tauri-plugin-stronghold` 插件安全、加密地存储在本地保险库中。
  * 数据库的 `settings` 表中只记录除 Key 以外 of 普通配置（如模型名称、Endpoint 等），以防 API Key 泄露。
  * `get_ai_config` 返回时，API Key 应该被脱敏（例如显示 `"••••••••••••••••"`），以防止前端展示出明文。

#### 3. 清除所有数据 (重置应用)
* **Command Name**: `reset_all_data`
* **返回**: `Result<(), AppError>`
* **功能**: 清空所有数据库表，并重新初始化默认分类。

---

### 3.5 AI 智能服务接口 (AI Integration)

#### 1. 异步对交易分类
* **Command Name**: `classify_transaction`
* **参数**:
  ```rust
  struct AIClassifyInput {
      description: String,
      amount: f64,
      date: String,
  }
  ```
* **返回**: `Result<String, AppError>` (最匹配的分类 ID)
* **内部处理逻辑**：
  1. 从 Stronghold 安全存储中读取 LLM API Key，从普通配置中读取 Base URL 和模型名称。
  2. 统一使用 **OpenAI 兼容协议**进行通信，构造请求体发送至 `<Base URL>/v1/chat/completions`。
  3. 获取当前系统中所有可用分类的名称和 ID 列表，并将其作为上下文组装到 Prompt 中。
  4. 构建强约束 Prompt（要求模型必须且只能从给定的分类列表中选择一个匹配的名称或 ID，以 JSON 格式输出，不要返回任何额外解释）。
  5. 使用 `reqwest` 发送异步 HTTP 请求到 LLM API。
  6. 设定超时机制（由 `aiConfig.timeout` 指定，默认 10 秒），若超时、离线或大模型返回错误，则抛出 `AppError`，前端自动捕获并降级到默认备用分类。
  7. 匹配模型输出：若输出在分类列表中，返回该分类 ID，并将新记账记录的 `aiClassified` 标记置为 1；若返回无法匹配，则返回错误以让前端回退到备用分类。

#### 2. 测试 LLM API 连接
* **Command Name**: `test_llm_connection`
* **参数**: `config: AIConfig`
* **返回**: `Result<bool, String>` (测试连接是否畅通且能正确应答)

---

### 3.6 数据备份与恢复 (Backup & Restore)

本设计采用 Android 原生无存储权限设计方案，充分利用系统接口。

#### 1. 导出数据为 JSON 密文/明文
* **Command Name**: `export_to_backup`
* **参数**: `start_date: Option<String>, end_date: Option<String>`
* **返回**: `Result<String, String>` (生成的备份 JSON 字符串，或保存后的临时文件路径)
* **后端实现步骤**：
  1. 开启只读事务，查询 `transactions`（按日期过滤）、`categories`、`budgets`、`category_budgets`、`recurring_transactions` 等所有表。
  2. 构建符合 PRD 规范的备份数据结构：
     ```json
     {
       "version": "1.0",
       "exported_at": "2026-06-02T12:00:00Z",
       "data": {
         "transactions": [...],
         "categories": [...],
         "budgets": [...],
         "recurring_transactions": [...]
       }
     }
     ```
  3. 在 Android 端，调用 Tauri 的 Android 原生绑定，将生成的 JSON 数据写入临时文件，并通过 `Share Sheet` (原生分享机制) 传给系统，让用户自主选择微信分享、存入云盘或发送到文件管理器。这样可以完美规避申请存储权限。
  4. 在桌面端，直接弹出 Tauri 保存文件对话框让用户决定保存路径。

#### 2. 导入 JSON 备份数据
* **Command Name**: `import_from_backup`
* **参数**: `backup_json: String` (通过 Android File Picker 读取出来的 JSON 字符串内容)
* **返回**: `Result<(), String>`
* **后端实现步骤**：
  1. 解析并校验 JSON 备份文件结构和版本号。
  2. **开启数据库写事务 (Transaction)**。
  3. 执行全量清空：清除本地的交易、预算、定期交易、自定义分类等数据。
  4. 恢复数据：批量重新插入备份文件中的所有记录。
  5. 若遇到任何异常（如 JSON 数据损坏、缺少约束外键等），**回滚事务**，不影响本地原有数据，并向前端返回友好错误提示。

---

## 4. 后端核心服务设计与三方依赖库

### 4.1 Cargo.toml 依赖规划
修改 [Cargo.toml](file:///i:/Project/client-project/personal-accounting-app/src-tauri/Cargo.toml) 增加核心三方库：

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# === 新增后端核心依赖 ===
# 数据库 (Tauri 官方 SQL 插件)
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
# 敏感信息安全存储 (Tauri Stronghold 保险库插件)
tauri-plugin-stronghold = { version = "2" }
# 异步运行时与网络通信 (调用 LLM)
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
# 日期与时间处理
chrono = { version = "0.4", features = ["serde"] }
```

### 4.2 定期交易调度器 (Recurring Scheduler)
为了在 Android 手机上处理 "每周三扣款"、"每月 1 号交房租" 这样的定期交易，并且避免常驻后台造成不必要的电量损耗，我们采用纯事件驱动的轻量化调度策略：

1. **触发时机**：
   * 应用程序每次**冷启动**完成时。
   * 应用程序从**后台挂起恢复到前台**时 (监听 Tauri 的生命周期事件 `tauri::AppEvent::Resumed`)。
   * 特别注意：**不采用任何常驻后台的定时轮询机制**，以最大化省电并适配 Android 的后台挂起/墓碑机制。
2. **执行算法**：
   * 从 `recurring_transactions` 表中查询出所有当前生效（当前日期 $\ge$ `start_date` 且 `end_date` 未过期）的配置。
   * 对每一条配置，对比当前系统日期和该配置的 `last_triggered_date`：
     * 根据周期 `frequency`（日、周、月、年）计算出期间所有应记账而未记账的日期节点。
     * 在事务中，逐条补录 `transactions` 流水（将 `is_recurring` 置为 1），并同步更新该定期规则的 `last_triggered_date` 为当前计算的最大日期。
   * 补录完成后，批量重算相关月份的预算消费额，如果触发超支且配置了通知，则向系统发送一条聚合的本地通知。

---

## 5. Rust 后端源码目录结构推荐

为了防止所有逻辑堆积在 `lib.rs` 中导致难以维护，建议在 `src-tauri/src/` 下采用如下模块化结构：

```
src-tauri/src/
├── main.rs                  # 纯入口点，直接调用 lib::run()
├── lib.rs                   # 初始化、Command 注册、生命周期事件监听
├── error.rs                 # 统一的错误定义模型 (AppError)
├── db/                      # 数据库模块
│   ├── mod.rs               # 数据库初始化与连接池管理
│   ├── migration.rs         # 数据库版本迁移与建表语句
│   └── models.rs            # 与数据库字段一一对应的 Rust 结构体
├── commands/                # 对应前端 invoke 的所有接口实现
│   ├── mod.rs
│   ├── transaction_cmd.rs   # 交易相关 Command
│   ├── category_cmd.rs      # 分类相关 Command
│   ├── budget_cmd.rs        # 预算相关 Command
│   └── system_cmd.rs        # 配置、备份与测试 API
├── services/                # 核心业务逻辑实现 (被 Command 调用)
│   ├── mod.rs
│   ├── db_service.rs        # 数据库 CRUD 封装与事务
│   ├── ai_service.rs        # LLM 客户端与智能分类 Prompt 逻辑
│   ├── scheduler.rs         # 定期交易检测与自动生成补录
│   └── security.rs          # 敏感密钥加解密存储 (Keyring 封装)
└── utils.rs                 # 辅助工具函数
```

---

## 6. 后续开发计划建议

建议开发阶段分为三步走：

* **第一阶段：跑通数据库基础通路 (DB & CRUD)**
  1. 引入 `tauri-plugin-sql`，配置数据库初始化与 Migration 脚本，写入预设分类数据。
  2. 实现 `categories` 和 `transactions` 的最简 CRUD 命令。
  3. 修改前端 `useAppStore`，用 `tauri::invoke` 替换读写 `localStorage`，确保数据可以在本地 `accounting.db` 中持久化存储。
* **第二阶段：实现本地高级逻辑 (Budget & Recurring Scheduler)**
  1. 编写 Rust 侧预算重算逻辑，实现增删改查流水时的预算联动更新。
  2. 编写定期交易补录算法，并在应用生命周期的 `Resumed` 事件中挂载。
* **第三阶段：完成 AI 及跨平台集成 (AI & Backup & Android Native)**
  1. 集成 `reqwest` 调用大模型，编写严苛的分类 Prompt 与超时降级策略。
  2. 针对 Android 端使用 Tauri 的插件或者原生绑定适配，打通原生 `Share Sheet`（无权限分享文件）与系统通知权限申请流程。
