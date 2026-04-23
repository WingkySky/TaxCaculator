import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import Badge from '../components/ui/Badge';

interface AnnualSettlementResult {
  total_gross_income: number;
  income_amount: number;
  annual_deduction: number;
  special_deductions: number;
  special_additional_deductions: number;
  other_deductions: number;
  taxable_income: number;
  applicable_rate: number;
  quick_deduction: number;
  annual_tax: number;
  withheld_tax: number;
  settlement_amount: number;
}

export default function AnnualPage() {
  const [totalGrossIncome, setTotalGrossIncome] = useState(120000);
  const [specialDeductions, setSpecialDeductions] = useState(0);
  const [childEducation, setChildEducation] = useState(0);
  const [elderlyCare, setElderlyCare] = useState(0);
  const [otherSpecialDeductions, setOtherSpecialDeductions] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnnualSettlementResult | null>(null);

  const totalSpecialAdditional = childEducation + elderlyCare + otherSpecialDeductions;

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await invoke<AnnualSettlementResult>('calculate_annual_settlement', {
        totalGrossIncome,
        specialDeductions,
        specialAdditionalDeductions: totalSpecialAdditional,
        otherDeductions,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getSettlementColor = () => {
    if (!result) return 'var(--color-text)';
    if (result.settlement_amount > 0) return '#f59e0b';
    if (result.settlement_amount < 0) return '#10B981';
    return 'var(--color-text)';
  };

  const getSettlementLabel = () => {
    if (!result) return '';
    if (result.settlement_amount > 0.01) return '应补税';
    if (result.settlement_amount < -0.01) return '应退税';
    return '无需补退';
  };

  return (
    <div className="space-y-6">
      <Card title="年度收入">
        <InputField label="全年劳务报酬总收入 (元)" type="number" value={totalGrossIncome} onChange={(e) => setTotalGrossIncome(parseFloat(e.target.value) || 0)} min={0} step={10000} />
      </Card>

      <Card title="专项扣除">
        <InputField label="三险一金等 (元/年)" type="number" value={specialDeductions} onChange={(e) => setSpecialDeductions(parseFloat(e.target.value) || 0)} min={0} step={1000} />
      </Card>

      <Card title="专项附加扣除">
        <div className="space-y-4">
          <InputField label="子女教育 (元/年)" type="number" value={childEducation} onChange={(e) => setChildEducation(parseFloat(e.target.value) || 0)} min={0} step={1200} placeholder="如: 12000 (1000元/月×12)" />
          <InputField label="赡养老人 (元/年)" type="number" value={elderlyCare} onChange={(e) => setElderlyCare(parseFloat(e.target.value) || 0)} min={0} step={2400} placeholder="如: 24000 (2000元/月×12)" />
          <InputField label="其他专项附加扣除 (元/年)" type="number" value={otherSpecialDeductions} onChange={(e) => setOtherSpecialDeductions(parseFloat(e.target.value) || 0)} min={0} step={1000} placeholder="住房、继续教育等" />
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
            专项附加扣除合计: ¥{totalSpecialAdditional.toLocaleString()}
          </div>
        </div>
      </Card>

      <Card title="其他法定扣除">
        <InputField label="其他扣除 (元/年)" type="number" value={otherDeductions} onChange={(e) => setOtherDeductions(parseFloat(e.target.value) || 0)} min={0} step={1000} />
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleCalculate} loading={loading} disabled={loading}>计算年度汇算</Button>
      </div>

      {error && (
        <Card><div className="p-4 rounded-lg" style={{ backgroundColor: '#ef4444', color: '#ffffff' }}><p className="font-medium">计算错误</p><p className="text-sm mt-1">{error}</p></div></Card>
      )}

      {result && (
        <>
          <Card title="计算过程">
            <div className="space-y-3">
              {[
                { label: '全年收入额 (收入×80%)', value: result.income_amount, highlight: false },
                { label: '全年减除费用', value: result.annual_deduction, highlight: false, negative: true },
                { label: '专项扣除', value: result.special_deductions, highlight: false, negative: true },
                { label: '专项附加扣除', value: result.special_additional_deductions, highlight: false, negative: true },
                { label: '其他扣除', value: result.other_deductions, highlight: false, negative: true },
                { label: '全年应纳税所得额', value: result.taxable_income, highlight: true },
                { label: `适用税率 ${(result.applicable_rate * 100).toFixed(0)}%`, value: null, highlight: false },
                { label: '速算扣除数', value: result.quick_deduction, highlight: false },
                { label: '全年应纳税额', value: result.annual_tax, highlight: true },
              ].map((step, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className={step.highlight ? 'font-bold' : ''} style={{ color: step.highlight ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {step.label}
                  </span>
                  {step.value !== null && (
                    <span className={step.highlight ? 'font-bold text-lg' : ''} style={{ color: step.highlight ? 'var(--color-primary)' : step.negative ? '#ef4444' : 'var(--color-text)' }}>
                      {step.negative ? '-' : ''}¥{formatCurrency(step.value)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="年度汇算结果" className="border-2" style={{ borderColor: getSettlementColor() }}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>累计预扣税额</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>¥{formatCurrency(result.withheld_tax)}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>年度应纳税额</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>¥{formatCurrency(result.annual_tax)}</p>
                </div>
              </div>

              <div className="text-center py-6">
                <div className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>{getSettlementLabel()}</div>
                <div className="text-4xl font-bold" style={{ color: getSettlementColor() }}>
                  ¥{formatCurrency(Math.abs(result.settlement_amount))}
                </div>
                <div className="mt-2">
                  <Badge color={result.settlement_amount > 0 ? 'warning' : result.settlement_amount < 0 ? 'success' : 'primary'}>
                    {getSettlementLabel()}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                以上为模拟计算，实际年度汇算请以税务部门计算为准。
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                年收入12万元以下的平台上各类人员，基本无需缴纳个税。
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
