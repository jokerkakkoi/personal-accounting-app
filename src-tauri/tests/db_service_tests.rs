use personal_accounting_app_lib::db::models::{
    AddTransactionInput, SearchFilters, UpdateTransactionInput,
};
use personal_accounting_app_lib::services::db_service;

pub struct TestDb {
    pool: sqlx::SqlitePool,
}

impl TestDb {
    pub async fn new() -> Self {
        let pool = sqlx::sqlite::SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        // Run migration using sqlx::migrate!
        sqlx::migrate!()
            .run(&pool)
            .await
            .unwrap();
        Self { pool }
    }
}

#[tokio::test]
async fn test_migrations_and_presets() {
    let db = TestDb::new().await;
    let mut conn = db.pool.acquire().await.unwrap();
    let categories = db_service::get_categories(&mut conn).await.unwrap();

    // Verify preset categories are loaded
    assert!(categories.len() >= 17);
    let food_cat = categories.iter().find(|c| c.id == "exp_food").unwrap();
    assert_eq!(food_cat.name, "餐饮");
    assert_eq!(food_cat.type_, "expense");
    assert_eq!(food_cat.is_predefined, true);
    assert_eq!(food_cat.is_default, false);

    let other_cat = categories.iter().find(|c| c.id == "exp_other").unwrap();
    assert_eq!(other_cat.name, "其他");
    assert_eq!(other_cat.is_default, true);
}

#[tokio::test]
async fn test_category_crud_and_atomic_delete() {
    let db = TestDb::new().await;
    let mut tx = db.pool.begin().await.unwrap();

    // 1. Add Category
    let custom_id = db_service::add_category(&mut *tx, "自定义分类".to_string(), "🎨".to_string(), "expense".to_string())
        .await
        .unwrap();
    assert!(custom_id.starts_with("cat_"));

    // Verify added
    let categories = db_service::get_categories(&mut *tx).await.unwrap();
    let custom_cat = categories.iter().find(|c| c.id == custom_id).unwrap();
    assert_eq!(custom_cat.name, "自定义分类");
    assert_eq!(custom_cat.icon, "🎨");
    assert_eq!(custom_cat.type_, "expense");
    assert_eq!(custom_cat.is_predefined, false);
    assert_eq!(custom_cat.is_default, false);

    // 2. Update Category
    db_service::update_category(&mut *tx, custom_id.clone(), "更新后分类".to_string(), "🍟".to_string())
        .await
        .unwrap();
    let categories = db_service::get_categories(&mut *tx).await.unwrap();
    let custom_cat = categories.iter().find(|c| c.id == custom_id).unwrap();
    assert_eq!(custom_cat.name, "更新后分类");
    assert_eq!(custom_cat.icon, "🍟");

    // 3. Set Default Category
    db_service::set_default_category(&mut *tx, custom_id.clone()).await.unwrap();
    let categories = db_service::get_categories(&mut *tx).await.unwrap();
    let custom_cat = categories.iter().find(|c| c.id == custom_id).unwrap();
    assert_eq!(custom_cat.is_default, true);
    // exp_other should no longer be default
    let other_cat = categories.iter().find(|c| c.id == "exp_other").unwrap();
    assert_eq!(other_cat.is_default, false);

    // Revert default to exp_other for other tests
    db_service::set_default_category(&mut *tx, "exp_other".to_string()).await.unwrap();

    // 4. Try to delete predefined category (should error)
    let err = db_service::delete_category(&mut *tx, "exp_food".to_string()).await;
    assert!(err.is_err());

    // 5. Setup data to test atomic delete and migration
    // Create budget for custom category and fallback category (exp_other)
    db_service::update_total_budget(&mut *tx, "2026-06".to_string(), 1000.0).await.unwrap();
    db_service::update_category_budget(&mut *tx, "2026-06".to_string(), custom_id.clone(), 100.0).await.unwrap();
    db_service::update_category_budget(&mut *tx, "2026-06".to_string(), "exp_other".to_string(), 50.0).await.unwrap();

    // Add a transaction to the custom category
    let tx_id = db_service::add_transaction(&mut *tx, AddTransactionInput {
        type_: "expense".to_string(),
        amount: 30.0,
        category_id: custom_id.clone(),
        note: "测试迁移".to_string(),
        date: "2026-06-02".to_string(),
        time: "12:00".to_string(),
        is_recurring: false,
        ai_classified: false,
    }).await.unwrap();

    // Setup a recurring transaction for custom category to test migration
    sqlx::query("INSERT INTO recurring_transactions (id, type, amount, category_id, note, frequency, start_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind("rec_1")
        .bind("expense")
        .bind(100.0)
        .bind(&custom_id)
        .bind("定期支出测试")
        .bind("daily")
        .bind("2026-06-01")
        .bind("2026-06-01")
        .execute(&mut *tx)
        .await
        .unwrap();

    // Delete custom category
    let del_res = db_service::delete_category(&mut *tx, custom_id.clone()).await.unwrap();
    assert_eq!(del_res.success, true);
    assert_eq!(del_res.migrated_count, 1);

    // Verify transaction migrated to exp_other
    let search = db_service::get_transactions(&mut *tx, SearchFilters::default(), 1, 10).await.unwrap();
    let tx_item = search.items.iter().find(|t| t.id == tx_id).unwrap();
    assert_eq!(tx_item.category_id, "exp_other");

    // Verify recurring transaction migrated to exp_other
    let rec_cat_id: (String,) = sqlx::query_as::<_, (String,)>("SELECT category_id FROM recurring_transactions WHERE id = ?")
        .bind("rec_1")
        .fetch_one(&mut *tx)
        .await
        .unwrap();
    assert_eq!(rec_cat_id.0, "exp_other");

    // Verify budget merged (100.0 custom + 50.0 exp_other = 150.0 exp_other)
    let budget = db_service::get_budget_by_month(&mut *tx, "2026-06".to_string()).await.unwrap().unwrap();
    let fallback_cb = budget.category_budgets.iter().find(|cb| cb.category_id == "exp_other").unwrap();
    assert_eq!(fallback_cb.amount, 150.0);

    tx.commit().await.unwrap();
}

#[tokio::test]
async fn test_transaction_crud_with_filters() {
    let db = TestDb::new().await;
    let mut conn = db.pool.acquire().await.unwrap();

    // Add some test transactions
    let tx1 = db_service::add_transaction(&mut conn, AddTransactionInput {
        type_: "expense".to_string(),
        amount: 50.0,
        category_id: "exp_food".to_string(),
        note: "午餐吃面条".to_string(),
        date: "2026-06-01".to_string(),
        time: "12:30".to_string(),
        is_recurring: false,
        ai_classified: false,
    }).await.unwrap();

    let tx2 = db_service::add_transaction(&mut conn, AddTransactionInput {
        type_: "income".to_string(),
        amount: 5000.0,
        category_id: "inc_salary".to_string(),
        note: "月度工资发放".to_string(),
        date: "2026-06-02".to_string(),
        time: "09:00".to_string(),
        is_recurring: false,
        ai_classified: false,
    }).await.unwrap();

    let tx3 = db_service::add_transaction(&mut conn, AddTransactionInput {
        type_: "expense".to_string(),
        amount: 15.0,
        category_id: "exp_transport".to_string(),
        note: "地铁出行".to_string(),
        date: "2026-06-03".to_string(),
        time: "18:00".to_string(),
        is_recurring: false,
        ai_classified: false,
    }).await.unwrap();

    // 1. Get transactions (pagination & total)
    let list = db_service::get_transactions(&mut conn, SearchFilters::default(), 1, 10).await.unwrap();
    assert_eq!(list.total_count, 3);
    assert_eq!(list.items.len(), 3);
    assert_eq!(list.has_more, false);

    // 2. Keyword Filter
    let mut filter = SearchFilters::default();
    filter.keyword = Some("工资".to_string());
    let list = db_service::get_transactions(&mut conn, filter, 1, 10).await.unwrap();
    assert_eq!(list.total_count, 1);
    assert_eq!(list.items[0].id, tx2);

    // 3. Type Filter
    let mut filter = SearchFilters::default();
    filter.type_filter = Some("expense".to_string());
    let list = db_service::get_transactions(&mut conn, filter, 1, 10).await.unwrap();
    assert_eq!(list.total_count, 2);

    // 4. Date Filter
    let mut filter = SearchFilters::default();
    filter.start_date = Some("2026-06-02".to_string());
    filter.end_date = Some("2026-06-03".to_string());
    let list = db_service::get_transactions(&mut conn, filter, 1, 10).await.unwrap();
    assert_eq!(list.total_count, 2);

    // 5. Update transaction
    db_service::update_transaction(&mut conn, tx1.clone(), UpdateTransactionInput {
        amount: Some(55.5),
        category_id: None,
        note: Some("午餐吃拉面".to_string()),
        date: None,
        time: None,
    }).await.unwrap();

    let list = db_service::get_transactions(&mut conn, SearchFilters::default(), 1, 10).await.unwrap();
    let updated = list.items.iter().find(|t| t.id == tx1).unwrap();
    assert_eq!(updated.amount, 55.5);
    assert_eq!(updated.note, "午餐吃拉面");

    // 6. Delete transaction
    db_service::delete_transaction(&mut conn, tx3).await.unwrap();
    let list = db_service::get_transactions(&mut conn, SearchFilters::default(), 1, 10).await.unwrap();
    assert_eq!(list.total_count, 2);
}

#[tokio::test]
async fn test_budget_dynamic_spent_calculations() {
    let db = TestDb::new().await;
    let mut conn = db.pool.acquire().await.unwrap();

    // 1. Create budgets
    db_service::update_total_budget(&mut conn, "2026-06".to_string(), 2000.0).await.unwrap();
    db_service::update_category_budget(&mut conn, "2026-06".to_string(), "exp_food".to_string(), 400.0).await.unwrap();
    db_service::update_category_budget(&mut conn, "2026-06".to_string(), "exp_transport".to_string(), 100.0).await.unwrap();

    // 2. Add transactions in June
    db_service::add_transaction(&mut conn, AddTransactionInput {
        type_: "expense".to_string(),
        amount: 80.0,
        category_id: "exp_food".to_string(),
        note: "超市采购".to_string(),
        date: "2026-06-01".to_string(),
        time: "10:00".to_string(),
        is_recurring: false,
        ai_classified: false,
    }).await.unwrap();

    db_service::add_transaction(&mut conn, AddTransactionInput {
        type_: "expense".to_string(),
        amount: 20.0,
        category_id: "exp_transport".to_string(),
        note: "加油".to_string(),
        date: "2026-06-02".to_string(),
        time: "11:00".to_string(),
        is_recurring: false,
        ai_classified: false,
    }).await.unwrap();

    // Add an income (should NOT affect spent)
    db_service::add_transaction(&mut conn, AddTransactionInput {
        type_: "income".to_string(),
        amount: 1000.0,
        category_id: "inc_salary".to_string(),
        note: "发工资".to_string(),
        date: "2026-06-05".to_string(),
        time: "09:00".to_string(),
        is_recurring: false,
        ai_classified: false,
    }).await.unwrap();

    // Add a transaction in July (should NOT affect June spent)
    db_service::add_transaction(&mut conn, AddTransactionInput {
        type_: "expense".to_string(),
        amount: 150.0,
        category_id: "exp_food".to_string(),
        note: "下餐馆".to_string(),
        date: "2026-07-01".to_string(),
        time: "19:00".to_string(),
        is_recurring: false,
        ai_classified: false,
    }).await.unwrap();

    // 3. Get June budget data
    let budget = db_service::get_budget_by_month(&mut conn, "2026-06".to_string()).await.unwrap().unwrap();
    assert_eq!(budget.total_amount, 2000.0);
    assert_eq!(budget.spent, 100.0); // 80 (food) + 20 (transport) = 100

    let food_cb = budget.category_budgets.iter().find(|cb| cb.category_id == "exp_food").unwrap();
    assert_eq!(food_cb.amount, 400.0);
    assert_eq!(food_cb.spent, 80.0);

    let trans_cb = budget.category_budgets.iter().find(|cb| cb.category_id == "exp_transport").unwrap();
    assert_eq!(trans_cb.amount, 100.0);
    assert_eq!(trans_cb.spent, 20.0);

    // 4. Delete a category budget
    db_service::delete_category_budget(&mut conn, "2026-06".to_string(), "exp_transport".to_string()).await.unwrap();
    let budget = db_service::get_budget_by_month(&mut conn, "2026-06".to_string()).await.unwrap().unwrap();
    assert_eq!(budget.category_budgets.len(), 1);
    assert_eq!(budget.category_budgets[0].category_id, "exp_food");
}
