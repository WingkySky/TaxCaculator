/**
 * CSV Export Utility
 * 导出CSV工具函数
 */

export interface CSVRow {
  [key: string]: any;
}

/**
 * 将数据数组转换为CSV字符串
 * @param data 数据数组
 * @param headers CSV表头
 * @returns CSV格式字符串
 */
export function arrayToCSV(data: CSVRow[], headers: string[]): string {
  const headerRow = headers.join(',');

  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // 如果值包含逗号、引号或换行符，需要用引号包裹
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',');
  });

  return [headerRow, ...rows].join('\n');
}

/**
 * 导出数据为CSV文件（使用浏览器原生下载）
 * @param data 数据数组
 * @param filename 文件名
 * @param headers CSV表头
 */
export function exportToCSV(data: CSVRow[], filename: string, headers: string[]): void {
  const csvContent = arrayToCSV(data, headers);

  // 添加UTF-8 BOM以支持Excel正确显示中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 释放URL对象
  URL.revokeObjectURL(link.href);
}

/**
 * 正向测算页面CSV导出
 */
export function exportForwardResults(data: any[]): void {
  const headers = [
    '月份',
    '税前收入',
    '累计收入',
    '累计费用(20%)',
    '累计减除费用',
    '应纳税所得额',
    '税率(%)',
    '速算扣除数',
    '本期税额',
    '累计税额',
    '税后收入'
  ];

  const exportData = data.map(r => ({
    '月份': r.month,
    '税前收入': r.gross_income,
    '累计收入': r.cumulative_income,
    '累计费用(20%)': r.cumulative_expense_20,
    '累计减除费用': r.cumulative_deduction,
    '应纳税所得额': r.taxable_income,
    '税率(%)': (r.tax_rate * 100).toFixed(2),
    '速算扣除数': r.quick_deduction,
    '本期税额': r.tax_amount,
    '累计税额': r.cumulative_tax,
    '税后收入': r.net_income
  }));

  const date = new Date().toISOString().split('T')[0];
  exportToCSV(exportData, `正向测算结果_${date}.csv`, headers);
}

/**
 * 对比页面CSV导出
 */
export function exportCompareResults(data: any[]): void {
  const headers = [
    '月份',
    '税前收入',
    '累计预扣法税额',
    '一般预扣法税额',
    '节税金额'
  ];

  const exportData = data.map(r => ({
    '月份': r.month,
    '税前收入': r.preTaxIncome,
    '累计预扣法税额': r.cumulativeTax,
    '一般预扣法税额': r.generalTax,
    '节税金额': r.savings
  }));

  const date = new Date().toISOString().split('T')[0];
  exportToCSV(exportData, `对比测算结果_${date}.csv`, headers);
}

/**
 * 年度汇算页面CSV导出
 */
export function exportAnnualResults(data: {
  total_gross_income: number;
  total_deduction: number;
  special_deductions: number;
  special_additional_deductions: number;
  other_deductions: number;
  taxable_income: number;
  applicable_rate: number;
  quick_deduction: number;
  tax_amount: number;
  预扣税额: number;
  additional_tax: number;
}): void {
  const headers = ['项目', '金额'];

  const rows: { '项目': string; '金额': string | number }[] = [
    { '项目': '全年收入', '金额': data.total_gross_income },
    { '项目': '收入额(80%)', '金额': data.total_gross_income * 0.8 },
    { '项目': '减除费用(60000)', '金额': 60000 },
    { '项目': '专项扣除', '金额': data.special_deductions },
    { '项目': '专项附加扣除', '金额': data.special_additional_deductions },
    { '项目': '其他扣除', '金额': data.other_deductions },
    { '项目': '应纳税所得额', '金额': data.taxable_income },
    { '项目': '税率', '金额': `${(data.applicable_rate * 100).toFixed(1)}%` },
    { '项目': '速算扣除数', '金额': data.quick_deduction },
    { '项目': '应纳税额', '金额': data.tax_amount },
    { '项目': '累计预扣税额', '金额': data.预扣税额 },
    { '项目': '应补/退税额', '金额': data.additional_tax }
  ];

  const date = new Date().toISOString().split('T')[0];
  exportToCSV(rows, `年度汇算结果_${date}.csv`, headers);
}
