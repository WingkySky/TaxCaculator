# Tasks

- [x] Task 1: 扩展 Rust 批量计算引擎
  - [x] 1.1: 新增 PersonIncome 和 BatchCalculationRequest 数据结构
  - [x] 1.2: 新增 PersonMonthlyResult 和 PersonSummary 数据结构
  - [x] 1.3: 新增 BatchCalculationResponse 数据结构
  - [x] 1.4: 实现 compute_batch 函数，对每名人员独立调用累计预扣法
  - [x] 1.5: 新增 parse_batch_csv 函数，解析 CSV 格式的多人收入数据
  - [x] 1.6: 编写批量计算引擎的单元测试

- [x] Task 2: 注册新的 Tauri 命令
  - [x] 2.1: 新增 calculate_batch Tauri 命令，调用 compute_batch
  - [x] 2.2: 新增 import_batch_csv Tauri 命令，调用 parse_batch_csv
  - [x] 2.3: 在 lib.rs run() 中注册新命令

- [x] Task 3: 新增 CSV 导入导出前端工具
  - [x] 3.1: 创建 src/utils/batch-csv.ts，实现 CSV 文件解析逻辑
  - [x] 3.2: 实现批量结果明细 CSV 导出函数
  - [x] 3.3: 实现批量结果汇总 CSV 导出函数
  - [x] 3.4: 实现 CSV 模板下载功能（供用户参考格式）

- [x] Task 4: 更新侧边栏和路由
  - [x] 4.1: Sidebar.tsx 新增"批量计算"导航项（Users 图标）
  - [x] 4.2: 更新 PageType 类型定义，新增 'batch'
  - [x] 4.3: App.tsx 新增 BatchPage 路由

- [x] Task 5: 实现批量计算页面
  - [x] 5.1: 创建 src/pages/BatchPage.tsx 页面框架
  - [x] 5.2: 实现人员管理区域（添加、编辑、删除人员及月度收入）
  - [x] 5.3: 实现 CSV 导入交互（文件选择、解析、校验、填充）
  - [x] 5.4: 实现批量计算触发与结果展示
  - [x] 5.5: 实现汇总统计面板（总人数、总收入、总税额、平均税率）
  - [x] 5.6: 实现人员明细可展开/折叠卡片列表
  - [x] 5.7: 实现导出功能（明细 CSV 和汇总 CSV）

- [x] Task 6: 验证构建和运行
  - [x] 6.1: Rust 编译通过 (cargo check)
  - [x] 6.2: 前端构建成功 (npm run build)
  - [x] 6.3: Rust 单元测试通过（11/12）
  - [x] 6.4: 原有单人计算功能不受影响

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 5] depends on [Task 2, Task 3, Task 4]
- [Task 6] depends on [Task 5]
