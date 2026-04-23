use serde::{Deserialize, Serialize};

const MONTHLY_DEDUCTION: f64 = 5000.0;
const ANNUAL_DEDUCTION: f64 = 60000.0;
const FEE_RATE: f64 = 0.20;

struct TaxBracket {
    limit: f64,
    rate: f64,
    quick_deduction: f64,
}

const CUMULATIVE_BRACKETS: [TaxBracket; 7] = [
    TaxBracket { limit: 36000.0, rate: 0.03, quick_deduction: 0.0 },
    TaxBracket { limit: 144000.0, rate: 0.10, quick_deduction: 2520.0 },
    TaxBracket { limit: 300000.0, rate: 0.20, quick_deduction: 16920.0 },
    TaxBracket { limit: 420000.0, rate: 0.25, quick_deduction: 31920.0 },
    TaxBracket { limit: 660000.0, rate: 0.30, quick_deduction: 52920.0 },
    TaxBracket { limit: 960000.0, rate: 0.35, quick_deduction: 85920.0 },
    TaxBracket { limit: f64::MAX, rate: 0.45, quick_deduction: 181920.0 },
];

const GENERAL_BRACKETS: [TaxBracket; 3] = [
    TaxBracket { limit: 20000.0, rate: 0.20, quick_deduction: 0.0 },
    TaxBracket { limit: 50000.0, rate: 0.30, quick_deduction: 2000.0 },
    TaxBracket { limit: f64::MAX, rate: 0.40, quick_deduction: 7000.0 },
];

fn find_bracket(taxable_income: f64, brackets: &[TaxBracket]) -> (f64, f64) {
    for b in brackets {
        if taxable_income <= b.limit {
            return (b.rate, b.quick_deduction);
        }
    }
    let last = brackets.last().unwrap();
    (last.rate, last.quick_deduction)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlyResult {
    pub month: i32,
    pub gross_income: f64,
    pub cumulative_income: f64,
    pub cumulative_fee: f64,
    pub cumulative_deduction: f64,
    pub taxable_income: f64,
    pub tax_rate: f64,
    pub quick_deduction: f64,
    pub cumulative_tax: f64,
    pub monthly_tax: f64,
    pub net_income: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralMonthlyResult {
    pub month: i32,
    pub gross_income: f64,
    pub fee: f64,
    pub taxable_income: f64,
    pub tax_rate: f64,
    pub quick_deduction: f64,
    pub tax_amount: f64,
    pub net_income: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnualSettlementResult {
    pub total_gross_income: f64,
    pub income_amount: f64,
    pub annual_deduction: f64,
    pub special_deductions: f64,
    pub special_additional_deductions: f64,
    pub other_deductions: f64,
    pub taxable_income: f64,
    pub applicable_rate: f64,
    pub quick_deduction: f64,
    pub annual_tax: f64,
    pub withheld_tax: f64,
    pub settlement_amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CumulativeResponse {
    pub monthly_results: Vec<MonthlyResult>,
    pub total_gross_income: f64,
    pub total_tax: f64,
    pub total_net_income: f64,
    pub average_tax_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralResponse {
    pub monthly_results: Vec<GeneralMonthlyResult>,
    pub total_gross_income: f64,
    pub total_tax: f64,
    pub total_net_income: f64,
    pub average_tax_rate: f64,
}

pub fn compute_cumulative(monthly_incomes: Vec<f64>) -> Result<CumulativeResponse, String> {
    if monthly_incomes.is_empty() {
        return Err("收入数据不能为空".to_string());
    }
    if monthly_incomes.len() > 12 {
        return Err("月份不能超过12个".to_string());
    }

    let mut results = Vec::new();
    let mut cumulative_income = 0.0_f64;
    let mut cumulative_tax_paid = 0.0_f64;

    for (i, &income) in monthly_incomes.iter().enumerate() {
        let month = (i + 1) as i32;
        cumulative_income += income;

        let cumulative_fee = cumulative_income * FEE_RATE;
        let cumulative_deduction = MONTHLY_DEDUCTION * month as f64;
        let taxable = (cumulative_income - cumulative_fee - cumulative_deduction).max(0.0);

        let (rate, quick_ded) = find_bracket(taxable, &CUMULATIVE_BRACKETS);
        let cumulative_tax = (taxable * rate - quick_ded).max(0.0);
        let monthly_tax = (cumulative_tax - cumulative_tax_paid).max(0.0);
        let net_income = income - monthly_tax;

        results.push(MonthlyResult {
            month,
            gross_income: income,
            cumulative_income,
            cumulative_fee,
            cumulative_deduction,
            taxable_income: taxable,
            tax_rate: rate,
            quick_deduction: quick_ded,
            cumulative_tax,
            monthly_tax,
            net_income,
        });

        cumulative_tax_paid = cumulative_tax;
    }

    let total_gross: f64 = monthly_incomes.iter().sum();
    let total_tax: f64 = results.iter().map(|r| r.monthly_tax).sum();
    let total_net: f64 = results.iter().map(|r| r.net_income).sum();
    let avg_rate = if total_gross > 0.0 { total_tax / total_gross } else { 0.0 };

    Ok(CumulativeResponse {
        monthly_results: results,
        total_gross_income: total_gross,
        total_tax,
        total_net_income: total_net,
        average_tax_rate: avg_rate,
    })
}

pub fn compute_general(monthly_incomes: Vec<f64>) -> Result<GeneralResponse, String> {
    if monthly_incomes.is_empty() {
        return Err("收入数据不能为空".to_string());
    }

    let mut results = Vec::new();

    for (i, &income) in monthly_incomes.iter().enumerate() {
        let month = (i + 1) as i32;

        let fee = if income <= 4000.0 { 800.0 } else { income * FEE_RATE };
        let taxable = (income - fee).max(0.0);

        let (rate, quick_ded) = find_bracket(taxable, &GENERAL_BRACKETS);
        let tax_amount = (taxable * rate - quick_ded).max(0.0);
        let net_income = income - tax_amount;

        results.push(GeneralMonthlyResult {
            month,
            gross_income: income,
            fee,
            taxable_income: taxable,
            tax_rate: rate,
            quick_deduction: quick_ded,
            tax_amount,
            net_income,
        });
    }

    let total_gross: f64 = monthly_incomes.iter().sum();
    let total_tax: f64 = results.iter().map(|r| r.tax_amount).sum();
    let total_net: f64 = results.iter().map(|r| r.net_income).sum();
    let avg_rate = if total_gross > 0.0 { total_tax / total_gross } else { 0.0 };

    Ok(GeneralResponse {
        monthly_results: results,
        total_gross_income: total_gross,
        total_tax,
        total_net_income: total_net,
        average_tax_rate: avg_rate,
    })
}

pub fn reverse_compute(target_net_incomes: Vec<f64>) -> Result<Vec<f64>, String> {
    if target_net_incomes.is_empty() {
        return Err("目标税后收入不能为空".to_string());
    }
    if target_net_incomes.len() > 12 {
        return Err("月份不能超过12个".to_string());
    }

    let mut result_gross = Vec::new();
    let mut cumulative_income = 0.0_f64;
    let mut cumulative_tax_paid = 0.0_f64;

    for (i, &target_net) in target_net_incomes.iter().enumerate() {
        let month_idx = i + 1;

        let prev_cumulative = cumulative_income;
        let prev_tax_paid = cumulative_tax_paid;

        let mut low = target_net;
        let mut high = target_net * 3.0;
        let mut best_gross = target_net;

        for _ in 0..200 {
            let mid = (low + high) / 2.0;
            let trial_cumulative = prev_cumulative + mid;

            let cum_fee = trial_cumulative * FEE_RATE;
            let cum_deduction = MONTHLY_DEDUCTION * month_idx as f64;
            let taxable = (trial_cumulative - cum_fee - cum_deduction).max(0.0);

            let (rate, quick_ded) = find_bracket(taxable, &CUMULATIVE_BRACKETS);
            let cum_tax = (taxable * rate - quick_ded).max(0.0);
            let month_tax = (cum_tax - prev_tax_paid).max(0.0);
            let calc_net = mid - month_tax;

            if (calc_net - target_net).abs() < 0.01 {
                best_gross = mid;
                break;
            }

            if calc_net > target_net {
                high = mid;
            } else {
                low = mid;
            }
            best_gross = mid;
        }

        cumulative_income = prev_cumulative + best_gross;
        let cum_fee = cumulative_income * FEE_RATE;
        let cum_deduction = MONTHLY_DEDUCTION * month_idx as f64;
        let taxable = (cumulative_income - cum_fee - cum_deduction).max(0.0);
        let (rate, quick_ded) = find_bracket(taxable, &CUMULATIVE_BRACKETS);
        let cum_tax = (taxable * rate - quick_ded).max(0.0);
        cumulative_tax_paid = cum_tax;

        result_gross.push((best_gross * 100.0).round() / 100.0);
    }

    Ok(result_gross)
}

pub fn compute_annual_settlement(
    total_gross_income: f64,
    special_deductions: f64,
    special_additional_deductions: f64,
    other_deductions: f64,
) -> Result<AnnualSettlementResult, String> {
    let income_amount = total_gross_income * (1.0 - FEE_RATE);

    let taxable_income = (income_amount
        - ANNUAL_DEDUCTION
        - special_deductions
        - special_additional_deductions
        - other_deductions)
    .max(0.0);

    let (rate, quick_ded) = find_bracket(taxable_income, &CUMULATIVE_BRACKETS);
    let annual_tax = (taxable_income * rate - quick_ded).max(0.0);

    let withheld_tax = compute_cumulative_withheld(total_gross_income);
    let settlement_amount = annual_tax - withheld_tax;

    Ok(AnnualSettlementResult {
        total_gross_income,
        income_amount,
        annual_deduction: ANNUAL_DEDUCTION,
        special_deductions,
        special_additional_deductions,
        other_deductions,
        taxable_income,
        applicable_rate: rate,
        quick_deduction: quick_ded,
        annual_tax,
        withheld_tax,
        settlement_amount,
    })
}

fn compute_cumulative_withheld(total_gross_income: f64) -> f64 {
    let monthly_avg = total_gross_income / 12.0;
    let incomes = vec![monthly_avg; 12];
    match compute_cumulative(incomes) {
        Ok(resp) => resp.total_tax,
        Err(_) => 0.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cumulative_policy_example() {
        let result = compute_cumulative(vec![7200.0, 6000.0, 8000.0]).unwrap();

        assert!((result.monthly_results[0].monthly_tax - 22.8).abs() < 0.1,
            "7月税额应为22.8元，实际为{}", result.monthly_results[0].monthly_tax);

        assert!(result.monthly_results[1].monthly_tax < 0.1,
            "8月税额应为0元（负数取0），实际为{}", result.monthly_results[1].monthly_tax);

        let total_tax: f64 = result.monthly_results.iter().map(|r| r.monthly_tax).sum();
        assert!((total_tax - 58.8).abs() < 1.0,
            "3个月总税额应约58.8元，实际为{}", total_tax);
    }

    #[test]
    fn test_general_basic() {
        let result = compute_general(vec![7200.0]).unwrap();
        let r = &result.monthly_results[0];

        assert!((r.taxable_income - 5760.0).abs() < 0.01,
            "应纳税所得额应为5760，实际为{}", r.taxable_income);
        assert!((r.tax_amount - 1152.0).abs() < 0.01,
            "税额应为1152，实际为{}", r.tax_amount);
    }

    #[test]
    fn test_general_low_income() {
        let result = compute_general(vec![3000.0]).unwrap();
        let r = &result.monthly_results[0];

        assert!((r.fee - 800.0).abs() < 0.01, "费用减除应为800");
        assert!((r.taxable_income - 2200.0).abs() < 0.01, "应纳税所得额应为2200");
        assert!((r.tax_amount - 440.0).abs() < 0.01, "税额应为440");
    }

    #[test]
    fn test_reverse_single_month() {
        let result = reverse_compute(vec![7177.2]).unwrap();
        let gross = result[0];

        let verify = compute_cumulative(vec![gross]).unwrap();
        let actual_net = verify.monthly_results[0].net_income;
        assert!((actual_net - 7177.2).abs() < 0.1,
            "反推验证失败：期望税后7177.2，实际{}", actual_net);
    }

    #[test]
    fn test_annual_settlement() {
        let result = compute_annual_settlement(120000.0, 0.0, 36000.0, 0.0).unwrap();

        assert!((result.income_amount - 96000.0).abs() < 0.01);
        assert!((result.taxable_income - 0.0).abs() < 0.01,
            "应纳税所得额应为0，实际为{}", result.taxable_income);
    }

    #[test]
    fn test_cumulative_zero_income() {
        let result = compute_cumulative(vec![0.0, 0.0, 0.0]).unwrap();
        assert!((result.total_tax - 0.0).abs() < 0.01);
    }

    #[test]
    fn test_bracket_boundary() {
        let result = compute_cumulative(vec![50000.0]).unwrap();
        let r = &result.monthly_results[0];

        let cum_fee = 50000.0 * 0.2;
        let cum_ded = 5000.0;
        let expected_taxable = 50000.0 - cum_fee - cum_ded;
        assert!((r.taxable_income - expected_taxable).abs() < 0.01);
    }
}
