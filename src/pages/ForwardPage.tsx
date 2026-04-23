import { useState, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Plus, Calculator, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import Table, { TableRow, TableCell } from '../components/ui/Table';
import Toggle from '../components/ui/Toggle';
import { useTheme } from '../context/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyIncome {
  month: number;
  income: number;
}

interface MonthlyResult {
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

interface CumulativeResponse {
  monthly_results: MonthlyResult[];
  total_gross_income: number;
  total_tax: number;
  total_net_income: number;
  average_tax_rate: number;
}

const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatInteger = (num: number): string => {
  return Math.round(num).toLocaleString('zh-CN');
};

export default function ForwardPage() {
  const { theme } = useTheme();
  const [monthlyIncomes, setMonthlyIncomes] = useState<MonthlyIncome[]>([
    { month: 1, income: 0 },
    { month: 2, income: 0 },
    { month: 3, income: 0 },
  ]);
  const [sameIncomeMode, setSameIncomeMode] = useState(false);
  const [globalIncome, setGlobalIncome] = useState(0);
  const [results, setResults] = useState<MonthlyResult[] | null>(null);
  const [summary, setSummary] = useState<{ totalGross: number; totalTax: number; avgRate: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const addMonth = () => {
    if (monthlyIncomes.length >= 12) return;
    const nextMonth = monthlyIncomes.length + 1;
    setMonthlyIncomes([...monthlyIncomes, { month: nextMonth, income: 0 }]);
  };

  const removeMonth = (index: number) => {
    if (monthlyIncomes.length <= 1) return;
    const newIncomes = monthlyIncomes.filter((_, i) => i !== index);
    const renumbered = newIncomes.map((item, i) => ({ ...item, month: i + 1 }));
    setMonthlyIncomes(renumbered);
  };

  const updateMonthIncome = (index: number, income: number) => {
    if (income < 0) {
      setErrors(prev => ({ ...prev, [index]: '金额不能为负数' }));
      return;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
    const newIncomes = [...monthlyIncomes];
    newIncomes[index].income = income;
    setMonthlyIncomes(newIncomes);
  };

  const updateGlobalIncome = (income: number) => {
    if (income < 0) {
      setError('收入不能为负数');
      return;
    }
    setError(null);
    setGlobalIncome(income);
    setMonthlyIncomes(monthlyIncomes.map(item => ({ ...item, income })));
  };

  const calculate = async () => {
    setLoading(true);
    setError(null);

    const incomes = monthlyIncomes.map(item => item.income);
    if (incomes.some(i => i < 0)) {
      setError('收入不能为负数');
      setLoading(false);
      return;
    }

    try {
      const response = await invoke<CumulativeResponse>('calculate_cumulative', { monthlyIncomes: incomes });
      setResults(response.monthly_results);
      setSummary({
        totalGross: response.total_gross_income,
        totalTax: response.total_tax,
        avgRate: response.average_tax_rate,
      });
    } catch (err) {
      setError(`计算失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results) return;
    const headers = ['月份', '税前收入', '累计收入', '累计费用(20%)', '累计减除费用', '应纳税所得额', '税率', '速算扣除数', '本期税额', '累计税额', '税后收入'];
    const rows = results.map(r =>
      [r.month, r.gross_income, r.cumulative_income, r.cumulative_fee, r.cumulative_deduction, r.taxable_income, (r.tax_rate * 100).toFixed(0) + '%', r.quick_deduction, r.monthly_tax, r.cumulative_tax, r.net_income].join(',')
    );
    const csv = '\ufeff' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `正向测算结果_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const chartData = useMemo(() => {
    if (!results) return [];
    return results.map(r => ({
      month: `第${r.month}月`,
      本期税额: r.monthly_tax,
      累计税额: r.cumulative_tax,
    }));
  }, [results]);

  const chartColors = useMemo(() => {
    return theme === 'dark' ? {
      grid: '#374151', text: '#9CA3AF', area1: '#10B981', area2: '#3B82F6',
    } : {
      grid: '#E5E7EB', text: '#6B7280', area1: '#10B981', area2: '#3B82F6',
    };
  }, [theme]);

  return (
    <div className="space-y-6">
      <Card title="月份收入输入">
        <div className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <Toggle checked={sameIncomeMode} onChange={setSameIncomeMode} label="每月相同收入" />
            {sameIncomeMode && (
              <div className="w-48">
                <InputField type="number" min="0" value={globalIncome || ''} onChange={(e) => updateGlobalIncome(Number(e.target.value))} placeholder="输入金额" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              <div className="col-span-1">月份</div>
              <div className="col-span-9">收入金额</div>
              <div className="col-span-2">操作</div>
            </div>
            {monthlyIncomes.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>第{item.month}月</div>
                <div className="col-span-9">
                  <InputField type="number" min="0" value={item.income || ''} onChange={(e) => updateMonthIncome(index, Number(e.target.value))} placeholder="输入税前收入" error={errors[index]} />
                </div>
                <div className="col-span-2 flex justify-start">
                  <button onClick={() => removeMonth(index)} className="p-2 rounded-lg transition-colors hover:opacity-70" style={{ color: '#ef4444' }} disabled={monthlyIncomes.length <= 1}>
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {monthlyIncomes.length < 12 && !sameIncomeMode && (
            <Button variant="secondary" onClick={addMonth} className="flex items-center gap-2">
              <Plus size={18} /> 添加月份
            </Button>
          )}

          <div className="pt-4">
            <Button onClick={calculate} loading={loading} disabled={loading} className="flex items-center gap-2">
              <Calculator size={18} /> 计算
            </Button>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#ef4444', color: 'white' }}>{error}</div>
          )}
        </div>
      </Card>

      {results && summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center">
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>年度总收入</div>
              <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>¥{formatInteger(summary.totalGross)}</div>
            </Card>
            <Card className="text-center">
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>年度总税额</div>
              <div className="text-2xl font-bold mt-1" style={{ color: '#ef4444' }}>¥{formatInteger(summary.totalTax)}</div>
            </Card>
            <Card className="text-center">
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>平均税率</div>
              <div className="text-2xl font-bold mt-1" style={{ color: '#10B981' }}>{(summary.avgRate * 100).toFixed(2)}%</div>
            </Card>
          </div>

          <Card title="税费趋势">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="month" tick={{ fill: chartColors.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }} formatter={(value: number) => [`¥${formatNumber(value)}`, '']} />
                  <Area type="monotone" dataKey="累计税额" stroke={chartColors.area2} fill={chartColors.area2} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="本期税额" stroke={chartColors.area1} fill={chartColors.area1} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: chartColors.area1 }}></div><span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>本期税额</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: chartColors.area2 }}></div><span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>累计税额</span></div>
            </div>
          </Card>

          <Card title="月度税费明细">
            <Table headers={['月份', '税前收入', '累计收入', '累计费用(20%)', '累计减除费用', '应纳税所得额', '税率', '速算扣除数', '本期税额', '累计税额', '税后收入']}>
              {results.map((row, index) => (
                <TableRow key={row.month} index={index}>
                  <TableCell className="font-medium">第{row.month}月</TableCell>
                  <TableCell>¥{formatInteger(row.gross_income)}</TableCell>
                  <TableCell>¥{formatInteger(row.cumulative_income)}</TableCell>
                  <TableCell>¥{formatInteger(row.cumulative_fee)}</TableCell>
                  <TableCell>¥{formatInteger(row.cumulative_deduction)}</TableCell>
                  <TableCell>¥{formatInteger(row.taxable_income)}</TableCell>
                  <TableCell>{(row.tax_rate * 100).toFixed(0)}%</TableCell>
                  <TableCell>¥{formatInteger(row.quick_deduction)}</TableCell>
                  <TableCell style={{ color: '#10B981' }}>¥{formatNumber(row.monthly_tax)}</TableCell>
                  <TableCell style={{ color: 'var(--color-primary)' }}>¥{formatNumber(row.cumulative_tax)}</TableCell>
                  <TableCell style={{ color: '#10B981' }}>¥{formatInteger(row.net_income)}</TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={exportCSV} className="flex items-center gap-2">
              <Download size={18} /> 导出CSV
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
