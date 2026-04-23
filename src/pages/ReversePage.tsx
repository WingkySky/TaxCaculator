import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import Badge from '../components/ui/Badge';
import Table, { TableRow, TableCell } from '../components/ui/Table';

interface CumulativeResult {
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

export default function ReversePage() {
  const [monthCount, setMonthCount] = useState(1);
  const [targetIncomes, setTargetIncomes] = useState<number[]>([7000]);
  const [sameForAll, setSameForAll] = useState(true);
  const [commonIncome, setCommonIncome] = useState(7000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grossResults, setGrossResults] = useState<number[] | null>(null);
  const [verifyResults, setVerifyResults] = useState<CumulativeResult[] | null>(null);

  const handleMonthCountChange = (count: number) => {
    const validCount = Math.max(1, Math.min(12, count));
    setMonthCount(validCount);
    if (sameForAll) {
      setTargetIncomes(Array(validCount).fill(commonIncome));
    } else {
      const newIncomes = [...targetIncomes];
      while (newIncomes.length < validCount) newIncomes.push(0);
      setTargetIncomes(newIncomes.slice(0, validCount));
    }
  };

  const handleIncomeChange = (index: number, value: number) => {
    const newIncomes = [...targetIncomes];
    newIncomes[index] = value;
    setTargetIncomes(newIncomes);
    if (sameForAll) setCommonIncome(value);
  };

  const handleSameForAllToggle = (checked: boolean) => {
    setSameForAll(checked);
    if (checked) setTargetIncomes(Array(monthCount).fill(commonIncome));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setGrossResults(null);
    setVerifyResults(null);

    try {
      const grossIncomes = await invoke<number[]>('reverse_calculate', { targetNetIncomes: targetIncomes });
      setGrossResults(grossIncomes);

      const verifyResp = await invoke<{ monthly_results: CumulativeResult[] }>('calculate_cumulative', { monthlyIncomes: grossIncomes });
      setVerifyResults(verifyResp.monthly_results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getTaxRateBadgeColor = (rate: number): 'primary' | 'warning' | 'danger' => {
    if (rate <= 0.03) return 'primary';
    if (rate <= 0.10) return 'warning';
    return 'danger';
  };

  const allVerified = verifyResults && targetIncomes.every((target, i) =>
    verifyResults[i] && Math.abs(verifyResults[i].net_income - target) < 0.1
  );

  const totalGross = grossResults ? grossResults.reduce((s, g) => s + g, 0) : 0;
  const totalTax = verifyResults ? verifyResults.reduce((s, r) => s + r.monthly_tax, 0) : 0;

  return (
    <div className="space-y-6">
      <Card title="目标税后收入">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>月份数量:</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => handleMonthCountChange(monthCount - 1)} disabled={monthCount <= 1 || loading} className="px-3 py-1">-</Button>
              <span className="w-12 text-center font-medium" style={{ color: 'var(--color-text)' }}>{monthCount}</span>
              <Button variant="secondary" onClick={() => handleMonthCountChange(monthCount + 1)} disabled={monthCount >= 12 || loading} className="px-3 py-1">+</Button>
            </div>
            <label className="flex items-center gap-2 ml-4">
              <input type="checkbox" checked={sameForAll} onChange={(e) => handleSameForAllToggle(e.target.checked)} className="rounded" disabled={loading} />
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>所有月份相同</span>
            </label>
          </div>

          {sameForAll ? (
            <InputField label="目标税后收入 (元)" type="number" value={commonIncome} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setCommonIncome(v); setTargetIncomes(Array(monthCount).fill(v)); }} disabled={loading} min={0} step={100} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {targetIncomes.map((income, index) => (
                <InputField key={index} label={`月份 ${index + 1} (元)`} type="number" value={income} onChange={(e) => handleIncomeChange(index, parseFloat(e.target.value) || 0)} disabled={loading} min={0} step={100} />
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleCalculate} loading={loading} disabled={loading}>反向推算</Button>
      </div>

      {error && (
        <Card><div className="p-4 rounded-lg" style={{ backgroundColor: '#ef4444', color: '#ffffff' }}><p className="font-medium">计算错误</p><p className="text-sm mt-1">{error}</p></div></Card>
      )}

      {grossResults && verifyResults && (
        <>
          <Card title="推算结果">
            <Table headers={['月份', '目标税后收入', '反推税前收入', '对应税率档次', '税额', '税后收入（验证）']}>
              {grossResults.map((gross, index) => {
                const v = verifyResults[index];
                return (
                  <TableRow key={index} index={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formatCurrency(targetIncomes[index])} 元</TableCell>
                    <TableCell className="font-medium">{formatCurrency(gross)} 元</TableCell>
                    <TableCell><Badge color={getTaxRateBadgeColor(v.tax_rate)}>{(v.tax_rate * 100).toFixed(0)}%</Badge></TableCell>
                    <TableCell>{formatCurrency(v.monthly_tax)} 元</TableCell>
                    <TableCell>{formatCurrency(v.net_income)} 元</TableCell>
                  </TableRow>
                );
              })}
            </Table>
          </Card>

          <Card title="正向验证">
            <div className="space-y-4">
              <p style={{ color: 'var(--color-text-muted)' }}>将反推结果代入正向计算，验证反推的税前收入能产生目标税后收入</p>
              <div className="flex items-center gap-2">
                {allVerified ? (
                  <><Badge color="success">验证通过</Badge><span style={{ color: '#10B981' }}>✓</span></>
                ) : (
                  <><Badge color="danger">验证失败</Badge><span style={{ color: '#ef4444' }}>✗</span></>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
                <div className="text-center">
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>所需税前总收入</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{formatCurrency(totalGross)} 元</p>
                </div>
                <div className="text-center">
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>需缴纳总税额</p>
                  <p className="text-xl font-bold" style={{ color: '#ef4444' }}>{formatCurrency(totalTax)} 元</p>
                </div>
                <div className="text-center">
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>实际税负率</p>
                  <p className="text-xl font-bold" style={{ color: '#f59e0b' }}>{totalGross > 0 ? ((totalTax / totalGross) * 100).toFixed(2) : '0.00'}%</p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
