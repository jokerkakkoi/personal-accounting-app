# 后续开发建议与步骤 (Next Steps)

当前，记账应用的 **本地 SQLite 数据库与数据访问服务层 (DB Service)** 已经按照最高标准完成重构与优化。所有的建表迁移、CRUD 接口、关联数据级联迁移、事务保障和数据库索引均已就绪并通过单元测试验证。

根据原定的 [开发计划 (docs/implementation_plan.md)](file:///i:/Project/client-project/personal-accounting-app/docs/implementation_plan.md)，下一步的核心任务是构建**安全层、定时器层、AI 服务层**，以及将它们暴露给前端 React 的 **Tauri Commands 命令处理器**。

以下是具体的后续开发步骤建议：

---

## 步骤一：敏感数据安全层开发 (`services/security.rs`)

### 目标
使用 IOTA Stronghold 加密保险库管理敏感数据（如 AI LLM API Key），确保敏感信息不在本地明文存储。

### 详细操作建议
1. **启用依赖**：
   在 [Cargo.toml](file:///i:/Project/client-project/personal-accounting-app/src-tauri/Cargo.toml) 中取消注释并启用 `tauri-plugin-stronghold`：
   ```toml
   tauri-plugin-stronghold = "2"
   ```
2. **初始化插件**：
   在 [lib.rs](file:///i:/Project/client-project/personal-accounting-app/src-tauri/src/lib.rs) 中使用 `.plugin(tauri_plugin_stronghold::Builder::new(|_app| { ... }).build())` 初始化 Stronghold 插件。需要在应用首次启动时，在 Rust 侧安全地自动生成一个客户端密码（Client Password）并安全存储。
3. **封装安全服务**：
   新建 `src-tauri/src/services/security.rs`，提供如下接口：
   - `save_api_key(key: &str) -> Result<(), AppError>`
   - `get_api_key() -> Result<Option<String>, AppError>`

---

## 步骤二：自动记账调度层开发 (`services/scheduler.rs`)

### 目标
实现定期交易流水（如每月房租、每日订奶）的自动补录。

### 详细操作建议
1. **设计自动生成算法**：
   在应用冷启动（`Ready` 生命周期）或从后台挂起恢复（`Resumed` 生命周期）时，触发调度器扫描 `recurring_transactions` 表。
2. **编写计算逻辑**：
   新建 `src-tauri/src/services/scheduler.rs`，实现 `process_recurring_transactions(conn: &mut SqliteConnection) -> Result<u32, AppError>`：
   - 比较当前日期与 `last_triggered_date` / `start_date` 以及 `frequency`（daily, weekly, monthly, yearly），计算出需要补录的日期区间。
   - 在**数据库事务**中，批量向 `transactions` 插入生成的交易流水。
   - 批量更新 `recurring_transactions` 的 `last_triggered_date` 为当前日期。

---

## 步骤三：AI 智能分类服务层开发 (`services/ai_service.rs`)

### 目标
使用 `reqwest` 发送 OpenAI 兼容请求，根据用户输入的交易备注、金额和当前已有的分类列表，自动推荐最匹配的分类。

### 详细操作建议
1. **实现大模型网络客户端**：
   使用 `reqwest` 构建 HTTP POST 请求发送至指定的 LLM `/v1/chat/completions`。
2. **注入上下文 Prompt**：
   - 动态获取当前数据库中存在的所有支出/收入分类的 `id` 与 `name`。
   - 强约束 Prompt 让大模型只返回 JSON 格式的分类结果，例如：`{"categoryId": "exp_food", "reason": "匹配备注'午餐'"}`。
   - 设置网络超时保护，并对 AI 分类成功的交易流水将 `ai_classified` 标记置为 1。

---

## 步骤四：Tauri Command 命令控制层开发 (`commands/`)

### 目标
将 `db_service` 等核心逻辑包装成 Tauri 2.0 Command 接口，接收前端 React 的 `invoke` 调用，并处理并发。

### 详细操作建议
1. **创建命令模块**：
   新建目录 `src-tauri/src/commands/`，并声明以下子模块：
   - `category_cmd.rs`：封装分类的 CRUD（调用 `db_service`）。
   - `transaction_cmd.rs`：封装流水的增删改查。
   - `budget_cmd.rs`：封装月度总预算和分类预算的管理。
   - `system_cmd.rs`：封装备份导出（使用系统 SAF 唤起 `dialog` 插件）、配置管理等。
2. **注册命令处理器**：
   在 `lib.rs` 的 `invoke_handler(tauri::generate_handler![...])` 中注册所有编写好的命令。

---

## 步骤五：前端 React 整合对接 (`app-store.ts`)

### 目标
修改 React 前端 Zustand 状态库中的 Actions，完全用后端 `invoke` 代替目前的 LocalStorage Mock。

### 详细操作建议
1. **替换 Actions 逻辑**：
   重构 `src/stores/app-store.ts`。例如：
   ```typescript
   // 重构前
   addTransaction: (tx) => { ... saveToStorage(); }
   // 重构后
   addTransaction: async (tx) => {
     const id = await invoke<string>("add_transaction", { input: tx });
     // 更新本地 state 并提示成功
   }
   ```
2. **冷拉取初始化**：
   在 React 的 `main.tsx` 挂载时，调用一次拉取接口（`invoke("get_initial_data")`），从后端把分类、最近流水、当前预算等数据一次性拉取并填充至 Zustand 中。
