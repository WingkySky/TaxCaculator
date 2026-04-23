use tauri::Manager;
pub mod tax_engine;

use tax_engine::{
    CumulativeResponse, GeneralResponse, AnnualSettlementResult,
    compute_cumulative, compute_general, reverse_compute, compute_annual_settlement,
};

#[tauri::command]
fn calculate_cumulative(monthly_incomes: Vec<f64>) -> Result<CumulativeResponse, String> {
    compute_cumulative(monthly_incomes)
}

#[tauri::command]
fn calculate_general(monthly_incomes: Vec<f64>) -> Result<GeneralResponse, String> {
    compute_general(monthly_incomes)
}

#[tauri::command]
fn reverse_calculate(target_net_incomes: Vec<f64>) -> Result<Vec<f64>, String> {
    reverse_compute(target_net_incomes)
}

#[tauri::command]
fn calculate_annual_settlement(
    total_gross_income: f64,
    special_deductions: f64,
    special_additional_deductions: f64,
    other_deductions: f64,
) -> Result<AnnualSettlementResult, String> {
    compute_annual_settlement(total_gross_income, special_deductions, special_additional_deductions, other_deductions)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            calculate_cumulative,
            calculate_general,
            reverse_calculate,
            calculate_annual_settlement,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
