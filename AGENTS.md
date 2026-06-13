# AGENTS.md

AI Agent 在本仓库工作的入口地图。详细约定见 `docs/`。

## 项目概览

青松简历（easy-resume）：Next.js 14 + React + TypeScript + MobX + Ant Design 的在线简历编辑器。

## 目录结构

| 路径 | 职责 |
|------|------|
| `src/modules/` | 简历**预览渲染**（canvas 上看到的模块） |
| `src/views/edit/components/panel/` | 右侧**编辑面板**（表单控件） |
| `src/components/moduleOperation/` | 预览点击 → 面板聚焦 |
| `src/components/` | 跨模块 UI（infoLayout、SafeText 等） |
| `tests/` | Vitest 单元/组件测试 |

改可点击字段时，**预览与面板必须同步**。见 [docs/selectable-fields.md](./docs/selectable-fields.md)。

## 常用命令

```bash
npm run dev          # 本地开发
npm run lint         # ESLint
npm run test         # Vitest 全量
npm run test:watch   # 监听模式
npm run build        # 生产构建
```

提交前至少跑 `lint` + `test`。Agent 改完代码应自行执行。

## 编码原则

- **最小 diff**：只改任务相关文件，不顺手重构
- **匹配现有风格**：命名、import、组件结构跟周边代码一致
- **不主动 commit/push**：除非用户明确要求
- **中文回复**（对用户），commit message 用英文或中文均可，禁止 AI 工具署名

## 模块与 Agent 分工

`.github/agents/` 定义可选角色：

- `coder.agent.md` — 业务代码
- `tester.agent.md` — 测试
- `codereview.agent.md` — 审查

Cursor 规则在 `.cursor/rules/`，按文件类型自动生效。

## 文档索引

- [架构与分层](./docs/architecture.md)
- [可点击字段 id 规范](./docs/selectable-fields.md)
- [测试约定](./docs/testing.md)

## Harness 维护

Agent 重复犯错时，优先更新 **规则 / 文档 / 测试**，而不是只 patch 一次代码。

典型需同步的三处：

1. `src/modules/**` 的 `data-item-id`
2. `src/views/edit/components/panel/**` 的 `data-panel-item-id`
3. `tests/modules/selectable-fields.test.tsx`
