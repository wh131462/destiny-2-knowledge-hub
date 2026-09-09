# 项目开发规则

## 前端组件

- 项目使用 Vue 3 和 Ant Design Vue（`ant-design-vue`），组件已在 `web/src/main.js` 全局注册。
- 所有下拉选择器必须使用 Ant Design Vue 的 `a-select`（搭配 `a-select-option` 或 `options`），禁止使用原生 `<select>` / `<option>`。此规则适用于筛选、排序、装备版本、套装分配及弹窗内的选择器，桌面和移动端保持一致。
- 选择值使用 `v-model:value` 或 `:value` / `@change`；`a-select` 的 `change` 回调直接接收选中值，不能读取 `$event.target.value`。保持数值 Hash 与字符串选项的类型一致。
- 下拉控件须提供可访问名称，并检查窄屏宽度、长选项文本以及弹窗内的展开和选择行为。
- 组件颜色与交互状态沿用 `web/src/App.vue` 的 Ant Design 主题及 `web/src/styles/main.css` 的公共样式；页面样式只补充必要的布局适配。

## 验证

- 前端改动至少运行 `npm run build`，并验证所改控件的选中值、筛选结果和移动端布局。
- 涉及内容数据或规则引擎时，按 README 的校验流程运行相应检查。
