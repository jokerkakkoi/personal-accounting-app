use serde::{Deserialize, Deserializer, Serialize};

pub fn deserialize_bool_from_int<'de, D>(deserializer: D) -> Result<bool, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::Error;
    let v = serde_json::Value::deserialize(deserializer)?;
    match v {
        serde_json::Value::Bool(b) => Ok(b),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(i != 0)
            } else {
                Err(D::Error::custom("expected integer for boolean"))
            }
        }
        _ => Err(D::Error::custom("expected boolean or integer")),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
pub struct Category {
    pub id: String,
    pub name: String,
    pub icon: String,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub type_: String,
    #[serde(deserialize_with = "deserialize_bool_from_int")]
    pub is_predefined: bool,
    #[serde(deserialize_with = "deserialize_bool_from_int")]
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
pub struct Transaction {
    pub id: String,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub type_: String,
    pub amount: f64,
    pub category_id: String,
    pub note: String,
    pub date: String,
    pub time: String,
    #[serde(deserialize_with = "deserialize_bool_from_int")]
    pub is_recurring: bool,
    #[serde(deserialize_with = "deserialize_bool_from_int")]
    pub ai_classified: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
pub struct Budget {
    pub id: String,
    pub month: String,
    pub total_amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
pub struct CategoryBudget {
    pub id: i64,
    pub budget_id: String,
    pub category_id: String,
    pub amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
pub struct RecurringTransaction {
    pub id: String,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub type_: String,
    pub amount: f64,
    pub category_id: String,
    pub note: String,
    pub frequency: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub last_triggered_date: Option<String>,
    pub created_at: String,
}


#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SearchFilters {
    pub keyword: Option<String>,
    pub type_filter: Option<String>, // "income" | "expense" | "all"
    pub category_ids: Option<Vec<String>>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub min_amount: Option<f64>,
    pub max_amount: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedTransactions {
    pub items: Vec<Transaction>,
    pub total_count: u32,
    pub has_more: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddTransactionInput {
    #[serde(rename = "type")]
    pub type_: String,
    pub amount: f64,
    pub category_id: String,
    pub note: String,
    pub date: String,
    pub time: String,
    pub is_recurring: bool,
    pub ai_classified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTransactionInput {
    pub amount: Option<f64>,
    pub category_id: Option<String>,
    pub note: Option<String>,
    pub date: Option<String>,
    pub time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteCategoryResult {
    pub success: bool,
    pub migrated_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct CategoryBudgetData {
    pub category_id: String,
    pub amount: f64,
    pub spent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BudgetData {
    pub id: String,
    pub month: String,
    pub total_amount: f64,
    pub spent: f64,
    pub category_budgets: Vec<CategoryBudgetData>,
}
