use crate::db::models::{
    AddTransactionInput, BudgetData, Category, CategoryBudgetData,
    DeleteCategoryResult, PaginatedTransactions, SearchFilters, Transaction,
    UpdateTransactionInput,
};
use crate::error::AppError;
use chrono::Utc;
use std::sync::atomic::{AtomicU64, Ordering};

static CAT_COUNTER: AtomicU64 = AtomicU64::new(0);
static TX_COUNTER: AtomicU64 = AtomicU64::new(0);

pub async fn get_categories(conn: &mut sqlx::SqliteConnection) -> Result<Vec<Category>, AppError> {
    sqlx::query_as::<_, Category>("SELECT id, name, icon, type, is_predefined, is_default FROM categories ORDER BY id ASC")
        .fetch_all(conn)
        .await
        .map_err(AppError::from)
}

pub async fn add_category(
    conn: &mut sqlx::SqliteConnection,
    name: String,
    icon: String,
    type_: String,
) -> Result<String, AppError> {
    let count = CAT_COUNTER.fetch_add(1, Ordering::Relaxed);
    let id = format!("cat_{}_{}", Utc::now().timestamp_micros(), count);
    sqlx::query("INSERT INTO categories (id, name, icon, type, is_predefined, is_default) VALUES (?, ?, ?, ?, 0, 0)")
        .bind(&id)
        .bind(&name)
        .bind(&icon)
        .bind(&type_)
        .execute(conn)
        .await?;
    Ok(id)
}

pub async fn update_category(
    conn: &mut sqlx::SqliteConnection,
    id: String,
    name: String,
    icon: String,
) -> Result<(), AppError> {
    sqlx::query("UPDATE categories SET name = ?, icon = ? WHERE id = ?")
        .bind(&name)
        .bind(&icon)
        .bind(&id)
        .execute(conn)
        .await?;
    Ok(())
}

pub async fn set_default_category(
    conn: &mut sqlx::SqliteConnection,
    id: String,
) -> Result<(), AppError> {
    let category: Option<Category> = sqlx::query_as::<_, Category>(
        "SELECT id, name, icon, type, is_predefined, is_default FROM categories WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&mut *conn)
    .await?;

    let category = category.ok_or_else(|| AppError::NotFound(format!("Category {} not found", id)))?;
    
    sqlx::query("UPDATE categories SET is_default = 0 WHERE type = ?")
        .bind(&category.type_)
        .execute(&mut *conn)
        .await?;

    sqlx::query("UPDATE categories SET is_default = 1 WHERE id = ?")
        .bind(&id)
        .execute(&mut *conn)
        .await?;

    Ok(())
}

pub async fn delete_category(
    conn: &mut sqlx::SqliteConnection,
    id: String,
) -> Result<DeleteCategoryResult, AppError> {
    let category: Option<Category> = sqlx::query_as::<_, Category>(
        "SELECT id, name, icon, type, is_predefined, is_default FROM categories WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&mut *conn)
    .await?;

    let category = category.ok_or_else(|| AppError::NotFound(format!("Category {} not found", id)))?;
    if category.is_predefined {
        return Err(AppError::Validation("Predefined categories cannot be deleted".to_string()));
    }

    let fallback: Option<Category> = sqlx::query_as::<_, Category>(
        "SELECT id, name, icon, type, is_predefined, is_default FROM categories WHERE type = ? AND id != ? ORDER BY is_default DESC, (id = 'exp_other' OR id = 'inc_other') DESC, id ASC LIMIT 1"
    )
    .bind(&category.type_)
    .bind(&id)
    .fetch_optional(&mut *conn)
    .await?;

    let fallback = fallback.ok_or_else(|| AppError::Validation("No fallback category found for migration".to_string()))?;
    let fallback_id = &fallback.id;

    // 1. Migrate recurring transactions
    sqlx::query("UPDATE recurring_transactions SET category_id = ? WHERE category_id = ?")
        .bind(fallback_id)
        .bind(&id)
        .execute(&mut *conn)
        .await?;

    // 2. Migrate standard transactions
    let migrated_count = sqlx::query("UPDATE transactions SET category_id = ?, updated_at = ? WHERE category_id = ?")
        .bind(fallback_id)
        .bind(Utc::now().to_rfc3339())
        .bind(&id)
        .execute(&mut *conn)
        .await?
        .rows_affected();

    // 3. Update category_budgets amount where fallback budget exists by adding the deleted budget amount
    sqlx::query(
        "UPDATE category_budgets SET amount = amount + (SELECT amount FROM category_budgets AS cb2 WHERE cb2.budget_id = category_budgets.budget_id AND cb2.category_id = ?) WHERE category_id = ? AND EXISTS (SELECT 1 FROM category_budgets AS cb3 WHERE cb3.budget_id = category_budgets.budget_id AND cb3.category_id = ?)"
    )
    .bind(&id)
    .bind(fallback_id)
    .bind(&id)
    .execute(&mut *conn)
    .await?;

    // 4. Move deleted budgets to fallback category where fallback budget does NOT exist
    sqlx::query(
        "UPDATE category_budgets SET category_id = ? WHERE category_id = ? AND NOT EXISTS (SELECT 1 FROM category_budgets AS cb2 WHERE cb2.budget_id = category_budgets.budget_id AND cb2.category_id = ?)"
    )
    .bind(fallback_id)
    .bind(&id)
    .bind(fallback_id)
    .execute(&mut *conn)
    .await?;

    // 5. Delete the remaining budget entries of the deleted category (which were merged/added to fallback)
    sqlx::query("DELETE FROM category_budgets WHERE category_id = ?")
        .bind(&id)
        .execute(&mut *conn)
        .await?;

    // 6. Finally, delete the category itself
    sqlx::query("DELETE FROM categories WHERE id = ?")
        .bind(&id)
        .execute(&mut *conn)
        .await?;

    Ok(DeleteCategoryResult {
        success: true,
        migrated_count: migrated_count as u32,
    })
}

pub async fn add_transaction(
    conn: &mut sqlx::SqliteConnection,
    input: AddTransactionInput,
) -> Result<String, AppError> {
    let count = TX_COUNTER.fetch_add(1, Ordering::Relaxed);
    let id = format!("tx_{}_{}", Utc::now().timestamp_micros(), count);
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO transactions (id, type, amount, category_id, note, date, time, is_recurring, ai_classified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&input.type_)
    .bind(input.amount)
    .bind(&input.category_id)
    .bind(&input.note)
    .bind(&input.date)
    .bind(&input.time)
    .bind(if input.is_recurring { 1 } else { 0 })
    .bind(if input.ai_classified { 1 } else { 0 })
    .bind(&now)
    .bind(&now)
    .execute(conn)
    .await?;
    Ok(id)
}

pub async fn update_transaction(
    conn: &mut sqlx::SqliteConnection,
    id: String,
    input: UpdateTransactionInput,
) -> Result<(), AppError> {
    let mut query_string = String::from("UPDATE transactions SET ");
    let mut sets = Vec::new();
    let mut amount_val = None;
    let mut category_id_val = None;
    let mut note_val = None;
    let mut date_val = None;
    let mut time_val = None;

    if let Some(amount) = input.amount {
        sets.push("amount = ?");
        amount_val = Some(amount);
    }
    if let Some(category_id) = input.category_id {
        sets.push("category_id = ?");
        category_id_val = Some(category_id);
    }
    if let Some(note) = input.note {
        sets.push("note = ?");
        note_val = Some(note);
    }
    if let Some(date) = input.date {
        sets.push("date = ?");
        date_val = Some(date);
    }
    if let Some(time) = input.time {
        sets.push("time = ?");
        time_val = Some(time);
    }

    if sets.is_empty() {
        return Ok(());
    }

    sets.push("updated_at = ?");
    query_string.push_str(&sets.join(", "));
    query_string.push_str(" WHERE id = ?");

    let mut q = sqlx::query(&query_string);
    if let Some(amount) = amount_val {
        q = q.bind(amount);
    }
    if let Some(ref category_id) = category_id_val {
        q = q.bind(category_id);
    }
    if let Some(ref note) = note_val {
        q = q.bind(note);
    }
    if let Some(ref date) = date_val {
        q = q.bind(date);
    }
    if let Some(ref time) = time_val {
        q = q.bind(time);
    }
    
    let now = Utc::now().to_rfc3339();
    q = q.bind(now);
    q = q.bind(&id);

    let affected = q.execute(conn).await?.rows_affected();
    if affected == 0 {
        return Err(AppError::NotFound(format!("Transaction {} not found", id)));
    }
    Ok(())
}

pub async fn delete_transaction(
    conn: &mut sqlx::SqliteConnection,
    id: String,
) -> Result<(), AppError> {
    let affected = sqlx::query("DELETE FROM transactions WHERE id = ?")
        .bind(&id)
        .execute(conn)
        .await?
        .rows_affected();
    if affected == 0 {
        return Err(AppError::NotFound(format!("Transaction {} not found", id)));
    }
    Ok(())
}

pub async fn get_transactions(
    conn: &mut sqlx::SqliteConnection,
    filters: SearchFilters,
    page: u32,
    page_size: u32,
) -> Result<PaginatedTransactions, AppError> {
    let mut query_clauses: Vec<String> = Vec::new();
    let mut keyword_val = None;
    let mut type_val = None;
    let mut category_ids_val = None;
    let mut start_date_val = None;
    let mut end_date_val = None;
    let mut min_amount_val = None;
    let mut max_amount_val = None;

    if let Some(ref keyword) = filters.keyword {
        if !keyword.is_empty() {
            query_clauses.push("note LIKE ?".to_string());
            keyword_val = Some(format!("%{}%", keyword));
        }
    }

    if let Some(ref tf) = filters.type_filter {
        if tf != "all" {
            query_clauses.push("type = ?".to_string());
            type_val = Some(tf.clone());
        }
    }

    if let Some(ref cat_ids) = filters.category_ids {
        if !cat_ids.is_empty() {
            let placeholders: Vec<&str> = cat_ids.iter().map(|_| "?").collect();
            query_clauses.push(format!("category_id IN ({})", placeholders.join(", ")));
            category_ids_val = Some(cat_ids.clone());
        }
    }

    if let Some(ref sd) = filters.start_date {
        if !sd.is_empty() {
            query_clauses.push("date >= ?".to_string());
            start_date_val = Some(sd.clone());
        }
    }

    if let Some(ref ed) = filters.end_date {
        if !ed.is_empty() {
            query_clauses.push("date <= ?".to_string());
            end_date_val = Some(ed.clone());
        }
    }

    if let Some(min_amt) = filters.min_amount {
        query_clauses.push("amount >= ?".to_string());
        min_amount_val = Some(min_amt);
    }

    if let Some(max_amt) = filters.max_amount {
        query_clauses.push("amount <= ?".to_string());
        max_amount_val = Some(max_amt);
    }

    let base_where = if query_clauses.is_empty() {
        "".to_string()
    } else {
        format!("WHERE {}", query_clauses.join(" AND "))
    };

    // 1. Get total count
    let count_query = format!("SELECT COUNT(*) FROM transactions {}", base_where);
    let mut q_count = sqlx::query_as::<_, (i64,)>(&count_query);
    
    // Bind parameters for count query
    if let Some(ref kw) = keyword_val { q_count = q_count.bind(kw); }
    if let Some(ref tf) = type_val { q_count = q_count.bind(tf); }
    if let Some(ref cids) = category_ids_val {
        for cid in cids { q_count = q_count.bind(cid); }
    }
    if let Some(ref sd) = start_date_val { q_count = q_count.bind(sd); }
    if let Some(ref ed) = end_date_val { q_count = q_count.bind(ed); }
    if let Some(min_amt) = min_amount_val { q_count = q_count.bind(min_amt); }
    if let Some(max_amt) = max_amount_val { q_count = q_count.bind(max_amt); }

    let total_count: (i64,) = q_count.fetch_one(&mut *conn).await?;
    let total_count = total_count.0 as u32;

    // 2. Fetch items
    let offset = (page.max(1) - 1) * page_size;
    let items_query = format!(
        "SELECT id, type, amount, category_id, note, date, time, is_recurring, ai_classified, created_at, updated_at FROM transactions {} ORDER BY date DESC, time DESC LIMIT ? OFFSET ?",
        base_where
    );
    let mut q_items = sqlx::query_as::<_, Transaction>(&items_query);

    // Bind parameters for items query
    if let Some(ref kw) = keyword_val { q_items = q_items.bind(kw); }
    if let Some(ref tf) = type_val { q_items = q_items.bind(tf); }
    if let Some(ref cids) = category_ids_val {
        for cid in cids { q_items = q_items.bind(cid); }
    }
    if let Some(ref sd) = start_date_val { q_items = q_items.bind(sd); }
    if let Some(ref ed) = end_date_val { q_items = q_items.bind(ed); }
    if let Some(min_amt) = min_amount_val { q_items = q_items.bind(min_amt); }
    if let Some(max_amt) = max_amount_val { q_items = q_items.bind(max_amt); }
    
    q_items = q_items.bind(page_size).bind(offset);

    let items = q_items.fetch_all(&mut *conn).await?;
    let has_more = (offset + items.len() as u32) < total_count;

    Ok(PaginatedTransactions {
        items,
        total_count,
        has_more,
    })
}

pub async fn get_budget_by_month(
    conn: &mut sqlx::SqliteConnection,
    month: String,
) -> Result<Option<BudgetData>, AppError> {
    let budget: Option<crate::db::models::Budget> = sqlx::query_as::<_, crate::db::models::Budget>(
        "SELECT id, month, total_amount FROM budgets WHERE month = ?"
    )
    .bind(&month)
    .fetch_optional(&mut *conn)
    .await?;

    let budget = match budget {
        Some(b) => b,
        None => return Ok(None),
    };

    // Calculate total spent in month
    let spent_sum: (Option<f64>,) = sqlx::query_as::<_, (Option<f64>,)>(
        "SELECT SUM(amount) FROM transactions WHERE type = 'expense' AND substr(date, 1, 7) = ?"
    )
    .bind(&month)
    .fetch_one(&mut *conn)
    .await?;
    let spent = spent_sum.0.unwrap_or(0.0);

    // Get all category budgets with spent calculation in one single query
    let category_budgets = sqlx::query_as::<_, CategoryBudgetData>(
        "SELECT cb.category_id, cb.amount, \
         COALESCE(\
             (SELECT SUM(t.amount) \
              FROM transactions t \
              WHERE t.category_id = cb.category_id \
                AND t.type = 'expense' \
                AND substr(t.date, 1, 7) = ?), \
             0.0\
         ) as spent \
         FROM category_budgets cb \
         WHERE cb.budget_id = ?"
    )
    .bind(&month)
    .bind(&budget.id)
    .fetch_all(&mut *conn)
    .await?;

    Ok(Some(BudgetData {
        id: budget.id,
        month: budget.month,
        total_amount: budget.total_amount,
        spent,
        category_budgets,
    }))
}

pub async fn update_total_budget(
    conn: &mut sqlx::SqliteConnection,
    month: String,
    amount: f64,
) -> Result<(), AppError> {
    let budget_id = format!("bg_{}", month);
    sqlx::query(
        "INSERT INTO budgets (id, month, total_amount) VALUES (?, ?, ?) \
         ON CONFLICT(month) DO UPDATE SET total_amount = excluded.total_amount"
    )
    .bind(&budget_id)
    .bind(&month)
    .bind(amount)
    .execute(conn)
    .await?;
    Ok(())
}

pub async fn update_category_budget(
    conn: &mut sqlx::SqliteConnection,
    month: String,
    category_id: String,
    amount: f64,
) -> Result<(), AppError> {
    let budget_id = format!("bg_{}", month);

    sqlx::query(
        "INSERT OR IGNORE INTO budgets (id, month, total_amount) VALUES (?, ?, 0.0)"
    )
    .bind(&budget_id)
    .bind(&month)
    .execute(&mut *conn)
    .await?;

    sqlx::query(
        "INSERT INTO category_budgets (budget_id, category_id, amount) VALUES (?, ?, ?) \
         ON CONFLICT(budget_id, category_id) DO UPDATE SET amount = excluded.amount"
    )
    .bind(&budget_id)
    .bind(&category_id)
    .bind(amount)
    .execute(&mut *conn)
    .await?;

    Ok(())
}

pub async fn delete_category_budget(
    conn: &mut sqlx::SqliteConnection,
    month: String,
    category_id: String,
) -> Result<(), AppError> {
    let budget_id = format!("bg_{}", month);
    sqlx::query("DELETE FROM category_budgets WHERE budget_id = ? AND category_id = ?")
        .bind(&budget_id)
        .bind(&category_id)
        .execute(conn)
        .await?;
    Ok(())
}
