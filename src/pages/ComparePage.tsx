import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table, { TableRow, TableCell } from '../components/ui/Table';
import InputField from '../components/ui/InputField';
import Badge from '../components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyIncome {
  month: number;
  income: number;
}

interface CumulativeResult {
  month: number;
  gross_income: number;
  monthly_tax: number;
  net_income: number;
}

interface GeneralResult {
  month: number;
  gross_income: number;
  tax_amount: number;
  net_income: number;
}

interface ComparisonRow {
  month: number;
  preTaxIncome: number;
  cumulativeTax: number;
  generalTax: number;
  savings: number;
}

const initialIncomes: MonthlyIncome[] = [
  { month: 7, income: 7200 },
  { month: 8, income: 6000 },
  { month: 9, income: 8000 },
];

export default function ComparePage() {
  const [incomes, setIncomes] = useState<MonthlyIncome[]>(initialIncomes);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ComparisonRow[] | null>(null);

  const handleIncomeChange = (index: number, field: 'month' | 'income', value: string) => {
    const newIncomes = [...incomes];
    if (field === 'month') {
      newIncomes[index].month = parseInt(value) || 0;
    } else {
      newIncomes[index].income = parseFloat(value) || 0;
    }
    setIncomes(newIncomes);
  };

  const addIncomeRow = () => {
    setIncomes([...incomes, { month: 0, income: 0 }]);
  };

  const removeIncomeRow = (index: number) => {
    if (incomes.length > 1) setIncomes(incomes.filter((_, i) => i !== index));
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const monthlyIncomes = incomes.map(item => item.income);

      const [cumulativeResp, generalResp] = await Promise.all([
        invoke<{ monthly_results: CumulativeResult[] }>('calculate_cumulative', { monthlyIncomes }),
        invoke<{ monthly_results: GeneralResult[] }>('calculate_general', { monthlyIncomes }),
      ]);

      const comparison: ComparisonRow[] = cumulativeResp.monthly_results.map((c, index) => ({
        month: incomes[index]?.month || index + 1,
        preTaxIncome: c.gross_income,
        cumulativeTax: c.monthly_tax,
        generalTax: generalResp.monthly_results[index].tax_amount,
        savings: generalResp.monthly_results[index].tax_amount - c.monthly_tax,
      }));

      setResults(comparison);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSavings = results ? results.reduce((sum, row) => sum + row.savings, 0) : 0;
  const totalGeneralTax = results ? results.reduce((sum, row) => sum + row.generalTax, 0) : 0;
  const savingsPercentage = totalGeneralTax > 0 ? ((totalSavings / totalGeneralTax) * 100).toFixed(1) : '0.0';

  const chartData = results ? results.map(row => ({ month: `${row.month}月`, cumulativeTax: row.cumulativeTax, generalTax: row.generalTax })) : [];

  const handleExport = () => {
    if (!results) return;
    const headers = ['月份', '税前收入', '累计预扣法税额', '一般预扣法税额', '节税金额'];
    const rows = results.map(r => [r.month, r.preTaxIncome, r.cumulativeTax, r.generalTax, r.savings].join(','));
    const csv = '\ufeff' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `对比分析结果_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card title="收入输入">
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>输入各月劳务报酬收入进行对比分析。</p>
        <div className="space-y-3">
          {incomes.map((item, index) => (
            <div key={index} className="flex gap-3 items-end">
              <div className="w-24">
                <InputField label="月份" type="number" min={1} max={12} value={item.month || ''} onChange={(e) => handleIncomeChange(index, 'month', e.target.value)} />
              </div>
              <div className="w-40">
                <InputField label="税前收入" type="number" min={0} step={100} value={item.income || ''} onChange={(e) => handleIncomeChange(index, 'income', e.target.value)} />
              </div>
              {incomes.length > 1 && <Button variant="secondary" onClick={() => removeIncomeRow(index)} className="mb-0.5">删除</Button>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={handleCalculate} loading={loading}>对比计算</Button>
          <Button variant="secondary" onClick={addIncomeRow}>添加月份</Button>
        </div>
      </Card>

      {results && results.length > 0 && (
        <>
          <Card title="对比结果">
            <Table headers={['月份', '税前收入', '累计预扣法税额', '一般预扣法税额', '差额(节税)']}>
              {results.map((row, index) => (
                <TableRow key={index} index={index}>
                  <TableCell>{row.month}月</TableCell>
                  <TableCell>¥{row.preTaxIncome.toLocaleString()}</TableCell>
                  <TableCell>¥{row.cumulativeTax.toLocaleString()}</TableCell>
                  <TableCell>¥{row.generalTax.toLocaleString()}</TableCell>
                  <TableCell>
                    <span style={{ color: row.savings > 0 ? '#10B981' : row.savings < 0 ? '#f59e0b' : 'var(--color-text)' }}>
                      {row.savings > 0 ? '-' : row.savings < 0 ? '+' : ''}¥{Math.abs(row.savings).toLocaleString()}
                    </span>
                    {row.savings > 0 && <Badge color="success" className="ml-2">累计法更优</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>

          <Card title="可视化对比">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-text)' }} />
                  <YAxis tick={{ fill: 'var(--color-text)' }} tickFormatter={(value) => `¥${value}`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} formatter={(value: number) => [`¥${value.toLocaleString()}`, '']} />
                  <Legend wrapperStyle={{ color: 'var(--color-text)' }} />
                  <Bar dataKey="cumulativeTax" name="累计预扣法" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="generalTax" name="一般预扣法" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-2" style={{ borderColor: '#10B981' }}>
            <div className="text-center py-4">
              <div className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>累计预扣法共节税</div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#10B981' }}>¥{Math.abs(totalSavings).toLocaleString()}</div>
              <div className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>使用累计预扣法 vs 一般预扣法</div>
              <Badge color={totalSavings >= 0 ? 'success' : 'warning'} className="text-base px-4 py-2">节省 {savingsPercentage}%</Badge>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleExport} className="flex items-center gap-2"><Download size={18} /> 导出CSV</Button>
          </div>
        </>
      )}
    </div>
  );
}
