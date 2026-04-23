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

// ===== 多人批量计算数据结构 =====

/// 单人收入信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonIncome {
    pub name: String,
    pub monthly_incomes: Vec<f64>,
}

/// 批量计算请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchCalculationRequest {
    pub persons: Vec<PersonIncome>,
}

/// 单人月度计算结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonMonthlyResult {
    pub name: String,
    pub results: Vec<MonthlyResult>,
}

/// 单人汇总信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonSummary {
    pub name: String,
    pub total_gross_income: f64,
    pub total_tax: f64,
    pub total_net_income: f64,
    pub average_tax_rate: f64,
}

/// 批量计算响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchCalculationResponse {
    pub person_results: Vec<PersonMonthlyResult>,
    pub person_summaries: Vec<PersonSummary>,
    pub total_persons: i32,
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

// ===== 多人批量计算功能 =====

/// 多人批量计算：对每名人员独立调用累计预扣法，汇总全局结果
pub fn compute_batch(persons: Vec<PersonIncome>) -> Result<BatchCalculationResponse, String> {
    // 校验：人员列表不能为空
    if persons.is_empty() {
        return Err("人员列表不能为空".to_string());
    }

    // 校验：姓名不能为空
    for (i, p) in persons.iter().enumerate() {
        if p.name.trim().is_empty() {
            return Err(format!("第{}位人员姓名不能为空", i + 1));
        }
    }

    // 校验：姓名不能重复
    let mut names = std::collections::HashSet::new();
    for (i, p) in persons.iter().enumerate() {
        if !names.insert(p.name.clone()) {
            return Err(format!("第{}位人员姓名\"{}\"重复", i + 1, p.name));
        }
    }

    let mut person_results = Vec::new();
    let mut person_summaries = Vec::new();

    // 逐人计算
    for person in &persons {
        let resp = compute_cumulative(person.monthly_incomes.clone())?;

        person_results.push(PersonMonthlyResult {
            name: person.name.clone(),
            results: resp.monthly_results.clone(),
        });

        person_summaries.push(PersonSummary {
            name: person.name.clone(),
            total_gross_income: resp.total_gross_income,
            total_tax: resp.total_tax,
            total_net_income: resp.total_net_income,
            average_tax_rate: resp.average_tax_rate,
        });
    }

    // 全局汇总
    let total_persons = person_summaries.len() as i32;
    let total_gross_income: f64 = person_summaries.iter().map(|s| s.total_gross_income).sum();
    let total_tax: f64 = person_summaries.iter().map(|s| s.total_tax).sum();
    let total_net_income: f64 = person_summaries.iter().map(|s| s.total_net_income).sum();
    let average_tax_rate = if total_gross_income > 0.0 {
        total_tax / total_gross_income
    } else {
        0.0
    };

    Ok(BatchCalculationResponse {
        person_results,
        person_summaries,
        total_persons,
        total_gross_income,
        total_tax,
        total_net_income,
        average_tax_rate,
    })
}

/// 解析批量CSV：格式为"姓名,1月,2月,...,12月"，每行一名人员
pub fn parse_batch_csv(csv_content: &str) -> Result<Vec<PersonIncome>, String> {
    // 去除 UTF-8 BOM
    let content = csv_content.strip_suffix("\u{FEFF}").unwrap_or(csv_content);
    let content = content.strip_prefix("\u{FEFF}").unwrap_or(content);

    let lines: Vec<&str> = content.lines().collect();
    if lines.is_empty() {
        return Err("CSV内容不能为空".to_string());
    }

    // 跳过表头行
    let data_lines = &lines[1..];
    if data_lines.is_empty() {
        return Err("CSV没有数据行".to_string());
    }

    let mut persons = Vec::new();
    let mut names = std::collections::HashSet::new();

    for (idx, line) in data_lines.iter().enumerate() {
        let line_num = idx + 2; // 行号从2开始（1为表头）
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        let fields: Vec<&str> = line.split(',').collect();
        if fields.is_empty() {
            return Err(format!("第{}行：数据格式错误", line_num));
        }

        // 校验：姓名不为空
        let name = fields[0].trim().to_string();
        if name.is_empty() {
            return Err(format!("第{}行：姓名不能为空", line_num));
        }

        // 校验：姓名不重复
        if !names.insert(name.clone()) {
            return Err(format!("第{}行：姓名\"{}\"重复", line_num, name));
        }

        // 解析各月份收入
        let mut monthly_incomes = Vec::new();
        for (m, field) in fields[1..].iter().enumerate() {
            let trimmed = field.trim();
            if trimmed.is_empty() || trimmed == "0" {
                monthly_incomes.push(0.0);
            } else {
                match trimmed.parse::<f64>() {
                    Ok(val) => {
                        // 校验：金额不为负数
                        if val < 0.0 {
                            return Err(format!("第{}行：第{}月金额不能为负数", line_num, m + 1));
                        }
                        monthly_incomes.push(val);
                    }
                    Err(_) => {
                        return Err(format!("第{}行：第{}月金额格式错误\"{}\"", line_num, m + 1, trimmed));
                    }
                }
            }
        }

        persons.push(PersonIncome { name, monthly_incomes });
    }

    if persons.is_empty() {
        return Err("CSV没有有效数据行".to_string());
    }

    Ok(persons)
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

    // ===== 多人批量计算测试 =====

    #[test]
    fn test_batch_basic() {
        // 基本多人计算测试（2人，每人2-3月收入）
        let persons = vec![
            PersonIncome { name: "张三".to_string(), monthly_incomes: vec![10000.0, 10000.0] },
            PersonIncome { name: "李四".to_string(), monthly_incomes: vec![8000.0, 8000.0, 8000.0] },
        ];
        let result = compute_batch(persons).unwrap();

        // 验证总人数
        assert_eq!(result.total_persons, 2);
        // 验证每人都有结果
        assert_eq!(result.person_results.len(), 2);
        assert_eq!(result.person_summaries.len(), 2);

        // 验证张三2个月、李四3个月
        assert_eq!(result.person_results[0].results.len(), 2);
        assert_eq!(result.person_results[1].results.len(), 3);

        // 验证全局汇总：总收入 = 20000 + 24000 = 44000
        assert!((result.total_gross_income - 44000.0).abs() < 0.01);
        // 验证全局总税额 > 0
        assert!(result.total_tax > 0.0);
        // 验证全局总税后收入 = 总收入 - 总税额
        assert!((result.total_net_income - (result.total_gross_income - result.total_tax)).abs() < 0.01);
        // 验证平均税率
        let expected_avg_rate = result.total_tax / result.total_gross_income;
        assert!((result.average_tax_rate - expected_avg_rate).abs() < 0.0001);
    }

    #[test]
    fn test_batch_independent() {
        // 验证不同人员计算结果互不影响
        let persons = vec![
            PersonIncome { name: "甲".to_string(), monthly_incomes: vec![50000.0] },
            PersonIncome { name: "乙".to_string(), monthly_incomes: vec![10000.0] },
        ];
        let result = compute_batch(persons).unwrap();

        // 甲单独计算
        let a_single = compute_cumulative(vec![50000.0]).unwrap();
        // 乙单独计算
        let b_single = compute_cumulative(vec![10000.0]).unwrap();

        // 验证甲的月度结果与单独计算一致
        let a_result = &result.person_results[0];
        assert!((a_result.results[0].monthly_tax - a_single.monthly_results[0].monthly_tax).abs() < 0.01);
        assert!((a_result.results[0].net_income - a_single.monthly_results[0].net_income).abs() < 0.01);

        // 验证乙的月度结果与单独计算一致
        let b_result = &result.person_results[1];
        assert!((b_result.results[0].monthly_tax - b_single.monthly_results[0].monthly_tax).abs() < 0.01);
        assert!((b_result.results[0].net_income - b_single.monthly_results[0].net_income).abs() < 0.01);

        // 验证甲乙税额不同（高收入者税额更高）
        assert!(a_result.results[0].monthly_tax > b_result.results[0].monthly_tax);
    }

    #[test]
    fn test_batch_cross_month() {
        // 验证跨月累计正确性
        let persons = vec![
            PersonIncome { name: "王五".to_string(), monthly_incomes: vec![10000.0, 20000.0, 30000.0] },
        ];
        let result = compute_batch(persons).unwrap();

        // 与单独调用 compute_cumulative 结果一致
        let single = compute_cumulative(vec![10000.0, 20000.0, 30000.0]).unwrap();

        for (i, r) in result.person_results[0].results.iter().enumerate() {
            assert!((r.monthly_tax - single.monthly_results[i].monthly_tax).abs() < 0.01,
                "第{}月税额不一致", i + 1);
            assert!((r.cumulative_income - single.monthly_results[i].cumulative_income).abs() < 0.01,
                "第{}月累计收入不一致", i + 1);
        }

        // 验证汇总一致
        let summary = &result.person_summaries[0];
        assert!((summary.total_gross_income - single.total_gross_income).abs() < 0.01);
        assert!((summary.total_tax - single.total_tax).abs() < 0.01);
    }

    #[test]
    fn test_parse_csv_basic() {
        // 基本 CSV 解析测试
        let csv = "姓名,1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月\n\
                   张三,10000,10000,10000,,,,,,,\n\
                   李四,8000,8000,8000,8000,,,,,,,\n";
        let persons = parse_batch_csv(csv).unwrap();

        assert_eq!(persons.len(), 2);
        assert_eq!(persons[0].name, "张三");
        assert_eq!(persons[0].monthly_incomes.len(), 10); // 3个有值 + 7个空值=0
        assert!((persons[0].monthly_incomes[0] - 10000.0).abs() < 0.01);
        assert!((persons[0].monthly_incomes[3] - 0.0).abs() < 0.01);

        assert_eq!(persons[1].name, "李四");
        assert!((persons[1].monthly_incomes[0] - 8000.0).abs() < 0.01);
    }

    #[test]
    fn test_parse_csv_validation() {
        // 校验：空姓名
        let csv = "姓名,1月,2月\n,10000,10000\n";
        let result = parse_batch_csv(csv);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("姓名不能为空"));

        // 校验：重复姓名
        let csv = "姓名,1月,2月\n张三,10000,10000\n张三,8000,8000\n";
        let result = parse_batch_csv(csv);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("重复"));

        // 校验：负数金额
        let csv = "姓名,1月,2月\n张三,-1000,10000\n";
        let result = parse_batch_csv(csv);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("负数"));

        // 校验：空人员列表
        let result = compute_batch(vec![]);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("人员列表不能为空"));

        // 校验：空姓名（compute_batch层面）
        let persons = vec![PersonIncome { name: "  ".to_string(), monthly_incomes: vec![10000.0] }];
        let result = compute_batch(persons);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("姓名不能为空"));

        // 校验：重复姓名（compute_batch层面）
        let persons = vec![
            PersonIncome { name: "张三".to_string(), monthly_incomes: vec![10000.0] },
            PersonIncome { name: "张三".to_string(), monthly_incomes: vec![8000.0] },
        ];
        let result = compute_batch(persons);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("重复"));
    }
}
