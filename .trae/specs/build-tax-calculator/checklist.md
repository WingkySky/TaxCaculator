# Checklist

## Rust 核心计算引擎
- [ ] 累计预扣法正向计算：累计费用=累计收入×20%，累计减除费用=5000×月数
- [ ] 累计预扣法计算结果与政策案例一致（7200/6000/8000三月案例，合计预缴58.8元）
- [ ] 一般劳务报酬使用预扣率表二（20%-40%三级），减除费用规则正确
- [ ] 反向推算结果经正向计算验证，误差不超过0.01元
- [ ] 年度汇算清缴：收入额=收入×80%，减除60000元
- [ ] MonthlyResult 包含前端所需的全部字段

## Tauri 命令桥接
- [ ] lib.rs run() 正确注册所有 Tauri 命令
- [ ] main.rs 正确启动 Tauri 应用
- [ ] 前后端接口类型对齐

## 前端页面
- [ ] ForwardPage 与后端 MonthlyResult 接口对齐
- [ ] ComparePage 与后端接口对齐
- [ ] ReversePage 验证逻辑正确
- [ ] AnnualPage 与后端接口对齐

## 构建验证
- [ ] 前端构建成功 (npm run build)
- [ ] Tauri 应用可启动 (npm run tauri dev)
