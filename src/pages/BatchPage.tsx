import { useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, X, Upload, Download, ChevronDown, ChevronRight, Calculator, FileDown } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table, { TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import {
  parseBatchCSV,
  exportBatchDetailCSV,
  exportBatchSummaryCSV,
  downloadCSVTemplate,
} from '../utils/batch-csv';
import type { PersonIncome, PersonMonthlyResult, PersonSummary, MonthlyResult } from '../utils/batch-csv';

// ============ 类型定义 ============

/** 批量计算后端响应 */
interface BatchCalculationResponse {
  person_results: PersonMonthlyResult[];
  person_summaries: PersonSummary[];
  total_persons: number;
  total_gross_income: number;
  total_tax: number;
  total_net_income: number;
  average_tax_rate: number;
}

// ============ 格式化工具 ============

/** 金额格式化：保留两位小数 */
const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** 整数格式化 */
const formatInteger = (num: number): string => {
  return Math.round(num).toLocaleString('zh-CN');
};

// ============ 默认数据 ============

/** 创建空人员行 */
const createEmptyPerson = (): PersonIncome => ({
  name: '',
  monthly_incomes: Array(12).fill(0),
});

/** 月份标签 */
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// ============ 主组件 ============

export default function BatchPage() {
  // 人员数据
  const [persons, setPersons] = useState<PersonIncome[]>([createEmptyPerson()]);
  // 计算结果
  const [calcResponse, setCalcResponse] = useState<BatchCalculationResponse | null>(null);
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 错误信息
  const [error, setError] = useState<string | null>(null);
  // 展开的人员索引集合
  const [expandedPersons, setExpandedPersons] = useState<Set<number>>(new Set());
  // CSV 文件输入引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============ 人员管理操作 ============

  /** 添加人员 */
  const addPerson = () => {
    setPersons([...persons, createEmptyPerson()]);
  };

  /** 删除人员（至少保留1行） */
  const removePerson = (index: number) => {
    if (persons.length <= 1) return;
    setPersons(persons.filter((_, i) => i !== index));
  };

  /** 更新人员姓名 */
  const updatePersonName = (index: number, name: string) => {
    const newPersons = [...persons];
    newPersons[index] = { ...newPersons[index], name };
    setPersons(newPersons);
  };

  /** 更新人员月度收入 */
  const updatePersonIncome = (personIndex: number, monthIndex: number, value: number) => {
    const newPersons = [...persons];
    const newIncomes = [...newPersons[personIndex].monthly_incomes];
    newIncomes[monthIndex] = value;
    newPersons[personIndex] = { ...newPersons[personIndex], monthly_incomes: newIncomes };
    setPersons(newPersons);
  };

  // ============ CSV 导入 ============

  /** 触发文件选择 */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /** 处理文件选择后的解析 */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      try {
        const parsed = parseBatchCSV(csvText);
        setPersons(parsed);
        setError(null);
        setCalcResponse(null);
      } catch (err) {
        setError(`CSV 导入失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsText(file);

    // 重置 input 以允许重复选择同一文件
    e.target.value = '';
  };

  // ============ 批量计算 ============

  /** 执行批量计算 */
  const handleCalculate = async () => {
    // 校验：至少1名人员有姓名
    const hasName = persons.some(p => p.name.trim() !== '');
    if (!hasName) {
      setError('至少需要1名人员填写姓名');
      return;
    }

    // 校验：至少1条非零收入
    const hasIncome = persons.some(p => p.monthly_incomes.some(v => v > 0));
    if (!hasIncome) {
      setError('至少需要1条非零收入');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await invoke<BatchCalculationResponse>('calculate_batch', { persons });
      setCalcResponse(response);
      // 计算完成后重置展开状态
      setExpandedPersons(new Set());
    } catch (err) {
      setError(`计算失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // ============ 展开/折叠控制 ============

  /** 切换人员明细展开状态 */
  const toggleExpand = (index: number) => {
    setExpandedPersons(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // ============ 导出功能 ============

  /** 导出明细 CSV */
  const handleExportDetail = () => {
    if (!calcResponse) return;
    exportBatchDetailCSV(calcResponse.person_results);
  };

  /** 导出汇总 CSV */
  const handleExportSummary = () => {
    if (!calcResponse) return;
    exportBatchSummaryCSV(calcResponse.person_summaries);
  };

  // ============ 渲染 ============

  return (
    <div className="space-y-6">
      {/* 人员管理区域 */}
      <Card title="人员收入管理">
        <div className="space-y-4">
          {/* CSV 导入与模板下载 */}
          <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="secondary" onClick={handleImportClick} className="flex items-center gap-2">
              <Upload size={16} /> 导入CSV
            </Button>
            <Button variant="secondary" onClick={downloadCSVTemplate} className="flex items-center gap-2">
              <Download size={16} /> 下载模板
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* 人员收入表格 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ backgroundColor: 'var(--color-bg-card)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}>
                  <th className="px-3 py-2 text-left text-sm font-medium whitespace-nowrap">姓名</th>
                  {MONTH_LABELS.map(label => (
                    <th key={label} className="px-2 py-2 text-left text-sm font-medium whitespace-nowrap">{label}</th>
                  ))}
                  <th className="px-3 py-2 text-left text-sm font-medium whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {persons.map((person, pIndex) => (
                  <tr
                    key={pIndex}
                    className="transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: pIndex % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => updatePersonName(pIndex, e.target.value)}
                        placeholder="姓名"
                        className="w-28 px-2 py-1 rounded border text-sm focus:outline-none focus:ring-1"
                        style={{
                          backgroundColor: 'var(--color-bg)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      />
                    </td>
                    {person.monthly_incomes.map((income, mIndex) => (
                      <td key={mIndex} className="px-1 py-2">
                        <input
                          type="number"
                          min="0"
                          value={income || ''}
                          onChange={(e) => updatePersonIncome(pIndex, mIndex, Number(e.target.value))}
                          placeholder="0"
                          className="w-20 px-2 py-1 rounded border text-sm focus:outline-none focus:ring-1"
                          style={{
                            backgroundColor: 'var(--color-bg)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text)',
                          }}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removePerson(pIndex)}
                        className="p-1 rounded transition-colors hover:opacity-70"
                        style={{ color: '#ef4444' }}
                        disabled={persons.length <= 1}
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 添加人员按钮 */}
          <Button variant="secondary" onClick={addPerson} className="flex items-center gap-2">
            <Plus size={16} /> 添加人员
          </Button>

          {/* 批量计算按钮 */}
          <div className="pt-4">
            <Button onClick={handleCalculate} loading={loading} disabled={loading} className="flex items-center gap-2">
              <Calculator size={18} /> 批量计算
            </Button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#ef4444', color: 'white' }}>
              {error}
            </div>
          )}
        </div>
      </Card>

      {/* 计算结果区域 */}
      {calcResponse && (
        <>
          {/* 汇总统计面板 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>总人数</div>
              <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                {calcResponse.total_persons}
              </div>
            </Card>
            <Card className="text-center">
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>总税前收入</div>
              <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                ¥{formatInteger(calcResponse.total_gross_income)}
              </div>
            </Card>
            <Card className="text-center">
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>总税额</div>
              <div className="text-2xl font-bold mt-1" style={{ color: '#ef4444' }}>
                ¥{formatInteger(calcResponse.total_tax)}
              </div>
            </Card>
            <Card className="text-center">
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>平均税率</div>
              <div className="text-2xl font-bold mt-1" style={{ color: '#10B981' }}>
                {(calcResponse.average_tax_rate * 100).toFixed(2)}%
              </div>
            </Card>
          </div>

          {/* 人员明细可展开卡片列表 */}
          {calcResponse.person_results.map((personResult, index) => {
            const summary = calcResponse.person_summaries[index];
            const isExpanded = expandedPersons.has(index);

            return (
              <Card key={index}>
                {/* 折叠状态：概要信息 */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(index)}
                >
                  <div className="flex items-center gap-4">
                    <span style={{ color: 'var(--color-accent)' }}>
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </span>
                    <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                      {personResult.name}
                    </span>
                    {summary && (
                      <>
                        <Badge color="primary">总收入 ¥{formatInteger(summary.total_gross_income)}</Badge>
                        <Badge color="danger">总税额 ¥{formatInteger(summary.total_tax)}</Badge>
                        <Badge color="success">税后 ¥{formatInteger(summary.total_net_income)}</Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* 展开状态：月度明细表格 */}
                {isExpanded && (
                  <div className="mt-4">
                    <Table headers={['月份', '税前收入', '累计收入', '累计费用(20%)', '累计减除费用', '应纳税所得额', '税率', '速算扣除数', '本期税额', '累计税额', '税后收入']}>
                      {personResult.results.map((row: MonthlyResult, rIndex: number) => (
                        <TableRow key={rIndex} index={rIndex}>
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
                  </div>
                )}
              </Card>
            );
          })}

          {/* 导出功能 */}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleExportDetail} className="flex items-center gap-2">
              <FileDown size={18} /> 导出明细
            </Button>
            <Button variant="secondary" onClick={handleExportSummary} className="flex items-center gap-2">
              <FileDown size={18} /> 导出汇总
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
