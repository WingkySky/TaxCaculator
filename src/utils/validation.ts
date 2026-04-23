/**
 * Validation Utilities
 * 输入验证工具函数
 */

/**
 * 验证收入金额
 * @param value 输入值
 * @returns 错误信息，如果没有错误则返回null
 */
export function validateIncome(value: number): string | null {
  if (isNaN(value)) {
    return '请输入有效数字';
  }
  if (value < 0) {
    return '金额不能为负数';
  }
  return null;
}

/**
 * 验证月份
 * @param month 月份值
 * @returns 错误信息，如果没有错误则返回null
 */
export function validateMonth(month: number): string | null {
  if (isNaN(month)) {
    return '请输入有效月份';
  }
  if (month < 1 || month > 12) {
    return '月份必须在1-12之间';
  }
  return null;
}

/**
 * 检查月份数组是否有重复
 * @param months 月份数组
 * @returns 如果有重复返回true，否则返回false
 */
export function hasDuplicateMonths(months: number[]): boolean {
  const uniqueMonths = new Set(months);
  return uniqueMonths.size !== months.length;
}

/**
 * 验证收入输入并返回错误状态
 * @param value 输入值
 * @returns 错误状态对象
 */
export function getIncomeError(value: string | number): string | null {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return validateIncome(numValue);
}

/**
 * 验证月份输入并返回错误状态
 * @param value 输入值
 * @returns 错误状态对象
 */
export function getMonthError(value: string | number): string | null {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  return validateMonth(numValue);
}

/**
 * 批量验证月份数组
 * @param months 月份数组
 * @returns 错误信息，如果没有错误则返回null
 */
export function validateMonthArray(months: number[]): string | null {
  // 检查每个月份是否有效
  for (const month of months) {
    const error = validateMonth(month);
    if (error) return error;
  }

  // 检查是否有重复
  if (hasDuplicateMonths(months)) {
    return '月份不能重复';
  }

  return null;
}

/**
 * 验证所有收入项
 * @param incomes 收入数组
 * @returns 错误信息，如果没有错误则返回null
 */
export function validateIncomes(incomes: { month: number; income: number }[]): string | null {
  // 检查收入是否为负数
  for (const item of incomes) {
    const incomeError = validateIncome(item.income);
    if (incomeError) return incomeError;
  }

  // 检查月份
  return validateMonthArray(incomes.map(i => i.month));
}
