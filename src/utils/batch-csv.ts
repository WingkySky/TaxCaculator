/**
 * 批量计算 CSV 导入导出工具
 */

// ============ 类型定义 ============

/** 人员收入数据 */
export interface PersonIncome {
  name: string;
  monthly_incomes: number[];
}

/** 月度计算结果 */
export interface MonthlyResult {
  month: number;
  gross_income: number;
  cumulative_income: number;
  cumulative_fee: number;
  cumulative_deduction: number;
  taxable_income: number;
  tax_rate: number;
  quick_deduction: number;
  cumulative_tax: number;
  monthly_tax: number;
  net_income: number;
}

/** 人员月度计算结果 */
export interface PersonMonthlyResult {
  name: string;
  results: MonthlyResult[];
}

/** 人员汇总结果 */
export interface PersonSummary {
  name: string;
  total_gross_income: number;
  total_tax: number;
  total_net_income: number;
  average_tax_rate: number;
}

// ============ 常量 ============

/** UTF-8 BOM 标记，确保 Excel 正确识别中文编码 */
const BOM = '\uFEFF';

/** CSV 月份表头 */
const MONTH_HEADERS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// ============ CSV 导入 ============

/**
 * 解析批量计算 CSV 文本为 PersonIncome 数组
 * @param csvText CSV 文本内容
 * @returns 人员收入数据数组
 * @throws 校验失败时抛出 Error，包含行号和原因
 */
export function parseBatchCSV(csvText: string): PersonIncome[] {
  // 去除 UTF-8 BOM
  let text = csvText;
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  // 按行拆分，过滤空行
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    throw new Error('CSV 文件至少需要包含表头和一行数据');
  }

  // 校验表头
  const expectedHeader = ['姓名', ...MONTH_HEADERS].join(',');
  const headerLine = lines[0].trim();
  if (headerLine !== expectedHeader) {
    throw new Error(`表头格式不正确，期望: ${expectedHeader}，实际: ${headerLine}`);
  }

  // 解析数据行
  const names: string[] = [];
  const results: PersonIncome[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    const rowNumber = i + 1;
    const columns = parseCSVLine(line);

    if (columns.length < 1) {
      throw new Error(`第 ${rowNumber} 行：数据为空`);
    }

    // 校验姓名不为空
    const name = columns[0].trim();
    if (name === '') {
      throw new Error(`第 ${rowNumber} 行：姓名不能为空`);
    }

    // 校验姓名不重复
    if (names.includes(name)) {
      throw new Error(`第 ${rowNumber} 行：姓名"${name}"重复`);
    }
    names.push(name);

    // 解析月度收入
    const monthly_incomes: number[] = [];
    for (let j = 1; j <= 12; j++) {
      const raw = j < columns.length ? columns[j].trim() : '';
      if (raw === '' || raw === '0') {
        monthly_incomes.push(0);
      } else {
        const value = parseFloat(raw);
        if (isNaN(value)) {
          throw new Error(`第 ${rowNumber} 行：${MONTH_HEADERS[j - 1]}金额"${raw}"不是有效数字`);
        }
        if (value < 0) {
          throw new Error(`第 ${rowNumber} 行：${MONTH_HEADERS[j - 1]}金额不能为负数`);
        }
        monthly_incomes.push(value);
      }
    }

    results.push({ name, monthly_incomes });
  }

  return results;
}

/**
 * 解析单行 CSV，处理引号内的逗号
 * @param line 单行 CSV 文本
 * @returns 字段数组
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

// ============ CSV 导出 ============

/**
 * 导出所有人员的月度明细 CSV
 * @param personResults 人员月度计算结果数组
 */
export function exportBatchDetailCSV(personResults: PersonMonthlyResult[]): void {
  const headers = [
    '姓名', '月份', '税前收入', '累计收入', '累计费用(20%)',
    '累计减除费用', '应纳税所得额', '税率', '速算扣除数',
    '本期税额', '累计税额', '税后收入'
  ];

  const rows: string[][] = [];
  for (const person of personResults) {
    for (const r of person.results) {
      rows.push([
        person.name,
        String(r.month),
        formatNumber(r.gross_income),
        formatNumber(r.cumulative_income),
        formatNumber(r.cumulative_fee),
        formatNumber(r.cumulative_deduction),
        formatNumber(r.taxable_income),
        formatPercent(r.tax_rate),
        formatNumber(r.quick_deduction),
        formatNumber(r.monthly_tax),
        formatNumber(r.cumulative_tax),
        formatNumber(r.net_income)
      ]);
    }
  }

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csvContent, `批量计算明细_${date}.csv`);
}

/**
 * 导出每人一行汇总的 CSV
 * @param summaries 人员汇总结果数组
 */
export function exportBatchSummaryCSV(summaries: PersonSummary[]): void {
  const headers = ['姓名', '总收入', '总税额', '总税后收入', '平均税率'];

  const rows = summaries.map(s => [
    s.name,
    formatNumber(s.total_gross_income),
    formatNumber(s.total_tax),
    formatNumber(s.total_net_income),
    formatPercent(s.average_tax_rate)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csvContent, `批量计算汇总_${date}.csv`);
}

/**
 * 下载 CSV 模板文件供用户参考格式
 */
export function downloadCSVTemplate(): void {
  const headers = ['姓名', ...MONTH_HEADERS].join(',');
  const example1 = ['张三', '10000', '10000', '10000', '', '', '', '', '', '', '', ''].join(',');
  const example2 = ['李四', '', '', '15000', '15000', '15000', '', '', '', '', '', ''].join(',');

  const csvContent = [headers, example1, example2].join('\n');
  downloadCSV(csvContent, '批量导入模板.csv');
}

// ============ 工具函数 ============

/**
 * 格式化数字，保留两位小数
 * @param value 数值
 * @returns 格式化后的字符串
 */
function formatNumber(value: number): string {
  return value.toFixed(2);
}

/**
 * 格式化税率为百分比字符串
 * @param rate 税率小数值
 * @returns 百分比字符串
 */
function formatPercent(rate: number): string {
  return (rate * 100).toFixed(2);
}

/**
 * 使用 Blob + createObjectURL 下载 CSV 文件
 * @param content CSV 文本内容
 * @param filename 文件名
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 释放 URL 对象
  URL.revokeObjectURL(link.href);
}
