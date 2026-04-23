# Tasks

- [x] Task 1: 初始化 Tauri 2 + React + TypeScript 项目
- [ ] Task 2: 重写 Rust 核心计算引擎（修复累计预扣法、一般劳务报酬、反向推算）
  - [ ] 修复累计预扣法：加入20%费用减除和5000×月数减除费用
  - [ ] 修复一般劳务报酬：使用预扣率表二（20%-40%三级）
  - [ ] 修复反向推算：基于累计预扣法正确反推
  - [ ] 修复年度汇算：正确计算收入额（收入×80%）
  - [ ] 扩展 MonthlyResult 结构体，包含前端所需的全部字段
- [ ] Task 3: 修复 Tauri 命令桥接层
  - [ ] 修复 lib.rs run() 函数：注册所有 Tauri 命令
  - [ ] 修复 main.rs：正确启动 Tauri 应用
  - [ ] 对齐前后端接口类型
- [ ] Task 4: 修复前端页面与后端接口对齐
  - [ ] ForwardPage：对齐 MonthlyResult 接口
  - [ ] ComparePage：对齐 MonthlyResult 接口
  - [ ] ReversePage：修复前端验证逻辑
  - [ ] AnnualPage：对齐 AnnualSettlementResult 接口
- [ ] Task 5: 验证构建和运行

# Task Dependencies
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 4]
