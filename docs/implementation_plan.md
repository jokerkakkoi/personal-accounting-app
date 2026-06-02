# Tauri 2.0 Rust 后端与 React 前端整合开发计划 (Android 专属)

本项目旨在基于 Tauri 2.0 框架，为个人记账应用构建一个纯本地的高性能 Rust 后端。数据完全存储在本地 SQLite 数据库中，敏感信息（如 AI LLM API Key）存储在 Stronghold 安全保险库中，且通过事件驱动机制调度定期交易。前端 Zustand Store 将全面替换为 Tauri IPC `invoke` 调用。

## User Review Required

> [!IMPORTANT]
> **Android 环境初始化**
> * 需要通过命令 `npx tauri android init` 初始化 Android 项目结构（如果尚未生成）。这将在 `src-tauri` 下生成安卓项目模板。
> * 敏感数据存储：统一使用 `tauri-plugin-stronghold`（其底层是 IOTA Stronghold 加密保险库）。首次初始化 Stronghold 时会需要一个客户端密码（Client Password），我们将会在应用首次冷启动时在 Rust 侧安全自动生成并持久化该密钥，确保对用户无感。

> [!WARNING]
> **Android 文件访问与备份**
> * 为了遵守 Android 系统的无存储权限设计规范，我们将使用 `tauri-plugin-dialog` 插件，它会自动唤起系统的 SAF（Storage Access Framework）文档保存/打开器。这不需要应用在清单中申请 `READ_EXTERNAL_STORAGE` 或 `WRITE_EXTERNAL_STORAGE` 权限。

## Open Questions

无。已在 `/grill-me` 讨论阶段对所有技术路线（序列化、触发策略、错误规范、存储方式）进行了对齐并达成了一致。

---

## Proposed Changes

### 1. 依赖与配置层 (Dependencies & Configuration)

#### [MODIFY] [Cargo.toml](file:///i:/Project/client-project/personal-accounting-app/src-tauri/Cargo.toml)
* 添加核心库依赖：
  ```toml
  [dependencies]
  # 数据库
  tauri-plugin-sql = { version = "2", features = ["sqlite"] }
  # 安全保险库
  tauri-plugin-stronghold = { version = "2" }
  # 异步及网络请求
  tokio = { version = "1", features = ["full"] }
  reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
  # 辅助
  chrono = { version = "0.4", features = ["serde"] }
  thiserror = "1.0"
  ```

#### [MODIFY] [tauri.conf.json](file:///i:/Project/client-project/personal-accounting-app/src-tauri/tauri.conf.json)
* 配置 `plugins` 以及权限字段，确保 Android 端允许使用 `sql`、`stronghold` 和 `dialog`。
* 在 permissions / capabilities 中注入对应的插件访问权限。

---

### 2. Rust 后端核心与命令层 (Rust Core & Tauri Commands)

#### [NEW] [error.rs](file:///i:/Project/client-project/personal-accounting-app/src-tauri/src/error.rs)
* 定义结构化的 `AppError` 枚举，实现 `thiserror::Error` 与 `serde::Serialize`，确保将包含错误码和本地化错误消息的 JSON 数据返回给前端。

#### [NEW] [db/migration.rs](file:///i:/Project/client-project/personal-accounting-app/src-tauri/src/db/migration.rs)
* 编写数据库建表脚本（Migration V1）。包含 `categories`（含预置分类数据初始化）、`transactions`、`budgets`、`category_budgets`、`recurring_transactions` 和 `settings` 等表。

#### [NEW] [db/mod.rs](file:///i:/Project/client-project/personal-accounting-app/src-tauri/src/db/mod.rs) & [db/models.rs](file:///i:/Project/client-project/personal-accounting-app/src-tauri/src/db/models.rs)
* 管理 SQLite 连接池的创建。
* 编写对应的 Rust 结构体，添加 `#[serde(rename_all = "camelCase")]` 保持命名空间在 JSON 化后与前端完全吻合。

#### [NEW] [services/security.rs](file:///i:/Project/client-project/personal-accounting-app/src-tauri/src/services/security.rs)
* 封装 `tauri-plugin-stronghold`。管理 Stronghold 实例的初始化、凭证写入和读取。自动为 API Key 进行加密入库与读取。

#### [NEW] [services/scheduler.rs](file:///i:/Project/client-project/personal-accounting-app/src-tauri/src/services/scheduler.rs)
* 实现定期交易自动生成算法。在触发时在数据库写事务中批量补录，并更新规则的 `last_triggered_date`。

#### [NEW] [services/ai_service.rs](file:///i:/Project/client-project/personal-accounting-app/src-tauri/src/services/ai_service.rs)
* 使用 `reqwest` 构建 OpenAI 兼容的 HTTP 请求发送至 `/v1/chat/completions`。
* 动态构建强约束 Prompt，包含系统已有分类的上下文。设置超时保护，并将 AI 分类成功的交易 `ai_classified` 标记设为 1。

#### [NEW] [commands/](file:///i:/Project/client-project/personal-accounting-app/src-tauri/src/commands/)
* 拆分并实现所有的 Command 接口：
  * [NEW] `transaction_cmd.rs`: 提供流水的分页检索、添加、修改和删除命令，在增删改时自动重算关联预算。
  * [NEW] `category_cmd.rs`: 提供分类 CRUD。其中 `delete_category` 采用事务，原子地迁移交易、预算并返回受影响行数 `{ success: true, migratedCount: X }`。
  * [NEW] `budget_cmd.rs`: 提供月度预算及分类预算的读写、重算。
  * [NEW] `system_cmd.rs`: 提供配置读写、清空重置、JSON 备份导出（SAF 配合）与导入恢复。
  * [NEW] `ai_cmd.rs`: 暴露 `classify_transaction` 和 `test_llm_connection` 接口。

#### [MODIFY] [lib.rs](file:///i:/Project/client-project/personal-accounting-app/src-tauri/src/lib.rs)
* 注册所有后台插件（`Sql`、`Stronghold`、`Dialog`）。
* 在 `tauri::Builder` 的 `setup` 及事件循环中，监听应用的生命周期事件：
  * 应用就绪 (`Ready`) / 冷启动时：自动触发定期交易补录。
  * 应用挂起恢复 (`Resumed`) 时：自动触发定期交易补录。
* 注册全部 Tauri Command 命令处理器。

---

### 3. 前端数据接入层 (Frontend Integration)

#### [MODIFY] [app-store.ts](file:///i:/Project/client-project/personal-accounting-app/src/stores/app-store.ts)
* 全面移除本地 `localStorage` 的逻辑（包括 `loadFromStorage` 和 `saveToStorage`）。
* 将 `useAppStore` 的各种 Actions 重构为调用后端 `invoke` 的异步函数：
  * `addTransaction` -> `invoke("add_transaction", ...)`
  * `deleteCategory` -> `invoke("delete_category", ...)` 并利用返回的 `migratedCount` 弹出 Toast。
  * 等等。
* 在初始化 Store 时，异步调用后台命令拉取初始数据（交易列表、分类列表、配置、预算）。

#### [MODIFY] [main.tsx](file:///i:/Project/client-project/personal-accounting-app/src/main.tsx)
* 在 React App 挂载时，调用一次状态库初始化逻辑，完成从 Rust 后端的冷拉取。

---

## Verification Plan

### Automated Tests
* 执行 E2E 自动化测试用例，确保功能重构后依然可以通过测试：
  ```bash
  pnpm test:e2e
  ```
  *(注：E2E 测试将在桌面仿真模式或前端 Mock 状态下运行)*

### Manual Verification
* **Android 真机 / 模拟器调试**：
  * 启动 Android 模拟器或连接真机。
  * 运行 `pnpm tauri android dev`。
  * **测试 SQLite 存储**：添加几笔流水，完全杀掉 App 后重新冷启动，检查流水是否依然存在（确认持久化）。
  * **测试定期交易**：添加一条“每日定期支出”，手动挂起 App 再返回前台（模拟 Resumed），检查是否自动生成了新的交易流水。
  * **测试 Stronghold 存储**：在设置页配置 AI 大模型 API Key，重启应用，测试连接，确认 API Key 被安全存储且测试成功。
  * **测试备份与恢复**：点击备份导出，确认系统唤起了 SAF 文档保存器；点击恢复导入，选择备份的 JSON，确认数据库重置并成功导入。
