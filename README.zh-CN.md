<p align="center">
  <img src="docs/assets/logo.svg" alt="Pinpoint logo" width="180">
</p>

<h1 align="center">Pinpoint</h1>

<p align="center">
  <a href="README.md">English</a> | 简体中文
</p>

<p align="center">
  <strong>找准归属层，修在边界上，用证据说话。</strong>
</p>

<p align="center">
  <a href="https://github.com/ChuwuYo/pinpoint/actions/workflows/validate.yml"><img src="https://github.com/ChuwuYo/pinpoint/actions/workflows/validate.yml/badge.svg" alt="Validate Pinpoint"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="#快速开始">安装</a> ·
  <a href="#为什么是-pinpoint">为什么是 Pinpoint</a> ·
  <a href="#skills">Skills</a> ·
  <a href="#核心工作流">工作流</a> ·
  <a href="#评估">评估</a>
</p>

---

Pinpoint 是一套可移植的 Agent Skill 套件，旨在让编码 Agent 以最小的影响面和确凿的证据完成软件排查、修复、优化与审查。它会顺着真实执行路径定位问题归属层，直接验证核心机制而非替代品，并如实报告未覆盖的验证缺口。

Pinpoint 不绑定特定语言或框架，也不覆盖仓库自身的规则，而是在既有规则之内提供一套严谨的工程闭环。

## 快速开始

### 命令行安装

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

去掉 `-g` 可安装到当前项目；若仅需核心修复流程，可改为 `--skill pinpoint`。

### 让 Agent 自动安装

直接把下面这句话发给你的编码 Agent：

```text
Install Pinpoint globally from https://github.com/ChuwuYo/pinpoint following INSTALL.md.
```

验证、更新、卸载以及可选的 OpenCode 斜杠命令集成，请参阅 [`INSTALL.md`](INSTALL.md)。

## 为什么是 Pinpoint

编码 Agent 很擅长写出“看起来能跑”的补丁，但真正困难的是：**改在正确的归属层上、不悄悄破坏相邻契约、也不夸大已验证的范围**。

| 没有 Pinpoint | 使用 Pinpoint |
| --- | --- |
| 哪报错改哪，掩盖表层症状 | 追踪行为从正确首次转为异常的归属边界 |
| 随手新增开关、兼容层或重复函数 | 复用项目既有通道，先证明运行时可达性再动手 |
| 只测正向入口能渲染就算完 | 兼顾退出、逆操作、重入与并发交错窗口 |
| 轻信简化过的 Mock 或退出码 | 在最贴近真实机制的下游消费者边界验证 |
| 局部跑通就宣称“全量验证通过” | 明确区分自动化验证、人工观察与未验证范围 |
| 直接提交并推送当前工作区 | 先核对基线、工作区状态、远端与显式授权 |

> [!NOTE]
> Pinpoint 只审计从实际运行时路径可达的领域契约：**交互与无障碍**、**语言与内容**、**数据与持久化**、**外部协议与安全**、**UI 与几何布局**、**平台与工具链**。路径不可达的平台或格式不会被强行纳入范围。

## Skills

| Skill | 职责 | 权限边界 |
| --- | --- | --- |
| `pinpoint` | 覆盖问题排查、最小修复/优化、机制验证与对抗性审查的完整主流程 | 编辑 + 审查 |
| `pinpoint-review` | 对 diff、分支或 PR 执行只读对抗性审查：按关注轴并行质询、评分重排与噪音预算控制 | 只读 |
| `pinpoint-deliver` | 两阶段严格授权的 Git 交付：检查暂存/分支拓扑，起草提交信息与 PR 说明，并在明确授权后提交、推送或创建 PR | 交付 |
| `pinpoint-help` | 解释套件分工、安装方式与权限边界，并路由用户请求 | 只读帮助 |

当安装了 `pinpoint-review` 时，`pinpoint` 会在审查关口自动加载它（根据风险等级与当前环境支持情况，自动在并行多轴子 Agent 与单审查者模式间切换）。将审查、交付与帮助拆分为独立 Skill，可以避免无关规则污染日常上下文。

### 三层渐进式披露架构

套件严格遵循开放 Agent Skills 规范，避免上下文膨胀：

1. **元数据（`SKILL.md` frontmatter）：** 常驻上下文，仅用于精准触发与路由。
2. **核心指令（`SKILL.md` 正文）：** 保持精炼、语言无关的第一性原理与止损规则，仅在触发后加载。
3. **随附资源（`references/` 与 `scripts/`）：** 领域检查清单、正反例与确定性只读探测脚本，按需读取或执行。

> [!IMPORTANT]
> 安装或调用 Pinpoint **不代表授权**执行 `commit`、`push`、创建 PR、`merge`、部署或清理无关改动。每一项交付动作都必须由用户在当轮对话中明确授权。

## 核心工作流

核心 [`pinpoint`](skills/pinpoint/SKILL.md) Skill 将一次修复或优化拆解为六个阶段：

1. **维护证据账本：** 严格区分仓库契约、外部协议、用户要求、观察事实与待验证推断，并将关键断言沿 5 级证据阶梯向下推实（`口头断言 → 代码行/提交记录 → 可达性推演 → 实跑探针/测试 → 真实环境复现`）。
2. **先追踪归属，再设计方案：** 从触发入口顺着真实链路追踪状态流转、共享通道、既有守卫的提交历史、符号搜索盲区、退出/重入路径及挂起并发窗口，定位首个异常转折点。
3. **修在最小的归属边界上：** 优先修正既有谓词或复用既有流水线与单一数据源；若多次尝试在同一关口失败，停手攻击共同前提并回滚被证伪假设催生的试探代码。
4. **仅审计可达契约：** 按实际触达的领域按需读取 `references/domain-checklists.md` 对应章节，无法测试的可达项如实记为未验证。
5. **验证真实机制，而非补丁形状：** 在最贴近真实故障的可靠验证边界构造测试（性能优化必须有同条件前/后基线对比），并分类报告四类证据状态。
6. **独立对抗性审查并止步交付：** 组装中立审查包交由 `pinpoint-review` 质询并核实每条结论；除非用户明确要求，否则在提交/PR 前停下并交接。

显式调用示例：

```text
使用 pinpoint 修复侧边栏滚动异常。
使用 pinpoint-review 在合并前审查当前分支。
使用 pinpoint-deliver 用中文提交已暂存的修复。
使用 pinpoint-deliver 起草 PR 标题和正文。
```

## 评估

[`evals/scenarios`](evals/scenarios) 中的评估场景专门检验“严谨工程修复”与“表面合理补丁”的本质差异（所有权与外部行为区分、无障碍交互结构、协议等价性、渲染几何、运行时可达性、下游产物可用性、基于基线的优化与审查噪音控制）。

每个场景均将 `prompt.md` 与 `rubric.json` 隔离存放，按 [`evals/SCORING.md`](evals/SCORING.md) 评分；目录规范与校验命令见 [`evals/README.md`](evals/README.md)。

## 贡献指南

保持所有改动以证据驱动、范围收敛：

1. 在 `evals/scenarios/` 中新增或更新一个能暴露缺失决策点的评估场景。
2. 将跨语言通用原则写入 `SKILL.md`，领域细节与案例放入 `references/`，确定性只读探测封装进 `scripts/`。
3. 在本地运行 `npm test` 通过基础校验。
4. 在不向被测 Agent 泄露 `rubric.json` 的前提下运行相关场景，并按 [`evals/SCORING.md`](evals/SCORING.md) 评分。
5. 同时汇报正向提升与潜在回退。

保持 `SKILL.md` 简练且与具体语言/框架无关，避免把单栈特例硬编码进核心规则。更新 `bin/pinpoint-install.mjs` 中固定的 `skills` CLI 版本时，请同步更新 `tests/installer-smoke.mjs` 与 CI 配置。

## 许可证

MIT
