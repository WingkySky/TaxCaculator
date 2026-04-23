# Checklist

## Rust 批量计算引擎
- [x] PersonIncome 数据结构包含 name 和 monthly_incomes 字段
- [x] BatchCalculationRequest 数据结构包含 persons 字段
- [x] PersonMonthlyResult 数据结构包含人员标识和月度计算结果
- [x] PersonSummary 数据结构包含人员汇总信息
- [x] BatchCalculationResponse 包含人员明细列表和全局汇总
- [x] compute_batch 函数对每名人员独立调用累计预扣法，结果互不影响
- [x] 同一人员跨月累计计算正确（累计减除费用 = 5000 × 有收入的月份数）
- [x] parse_batch_csv 函数正确解析 CSV 格式（姓名 + 12月收入）
- [x] CSV 解析支持空值（留空或0表示无收入）
- [x] CSV 解析校验：姓名不为空、姓名不重复、金额不为负
- [x] 批量计算引擎单元测试通过

## Tauri 命令桥接
- [x] calculate_batch 命令正确注册并可调用
- [x] import_batch_csv 命令正确注册并可调用
- [x] lib.rs run() 中注册了所有新命令
- [x] 前后端接口类型对齐

## CSV 导入导出工具
- [x] batch-csv.ts 实现前端 CSV 文件解析
- [x] 明细 CSV 导出格式正确（姓名 + 月度明细）
- [x] 汇总 CSV 导出格式正确（姓名 + 汇总数据）
- [x] CSV 模板下载功能可用

## 侧边栏与路由
- [x] Sidebar 新增"批量计算"导航项，使用 Users 图标
- [x] PageType 类型包含 'batch'
- [x] App.tsx 正确路由到 BatchPage

## 批量计算页面
- [x] 人员管理：可添加、编辑、删除人员
- [x] 月度收入录入：每名人员可录入1-12月收入
- [x] CSV 导入：选择文件后自动解析填充，解析失败显示错误
- [x] 批量计算：至少1名人员有收入时可触发
- [x] 汇总面板：显示总人数、总收入、总税额、平均税率
- [x] 人员明细：可展开/折叠的卡片列表
- [x] 导出功能：明细 CSV 和汇总 CSV 均可导出
- [x] 输入验证：姓名不为空、不重复、金额不为负

## 构建验证
- [x] Rust 编译成功 (cargo check)
- [x] 前端构建成功 (npm run build)
- [x] Rust 单元测试通过（11/12，1个失败为修改前已存在问题）
- [x] 原有单人计算功能不受影响
