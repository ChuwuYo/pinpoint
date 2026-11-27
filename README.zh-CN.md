<p align="center">
  <img src="docs/assets/logo.svg" alt="Pinpoint logo" width="180">
</p>

<h1 align="center">Pinpoint</h1>

<p align="center">
  <a href="README.md">English</a> | 简体中文
</p>

<p align="center">
  <strong>找到归属层。修在边界上。用证据证明。</strong>
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

Pinpoint 是一套可移植的 Agent Skill 套件，用于以证据为依据、以刻意收敛的影响面来修复和优化软件。它的核心 Skill 会追踪真实的运行时路径，定位哪一层该为故障负责，保护相邻契约，并且只声明现有证据能够证明的结论。

它不强推任何框架，也不取代仓库自身的规则，而是在既有规则之内提供一套严谨的调查、审查与交付流程。

## 快速开始

### 从终端安装

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

去掉 `-g` 即为项目级安装；如果只需要核心工作流，可改为 `--skill pinpoint`。

### 让你的 Agent 安装

把下面这段提示词交给你的编码 Agent：

```text
Install Pinpoint globally from https://github.com/ChuwuYo/pinpoint following INSTALL.md.
```

安装验证、更新、卸载以及可选的 OpenCode 斜杠命令集成，请参阅 [`INSTALL.md`](INSTALL.md)。

## 为什么是 Pinpoint

编码 Agent 很擅长产出看似合理的补丁。真正的难点在于判断补丁是否改在了正确的层、有没有悄无声息地破坏相邻行为，以及是否夸大了已验证的范围。

| 没有 Pinpoint | 有了 Pinpoint |
| --- | --- |
| 修补看得见的表面症状 | 追踪行为从正确首次转为错误的边界 |
| 见到已有辅助函数却另起炉灶 | 复用项目既有的边界与语义 |
| 为假想中的平台加开关 | 先通过运行时可达性证明影响范围 |
| 把无障碍当作收尾清单 | 把交互结构当作设计约束 |
| 轻信简化过的测试夹具 | 验证真实机制与下游消费者产物 |
| 跑过本地 mock 就宣称“已全量验证” | 区分自动化、人工和未验证的证据 |
| 推了当前分支再祈祷 | 核实工作区、远端、基线和授权 |

> [!NOTE]
> Pinpoint 只审计从追踪到的运行时路径可达的契约。单平台项目保持单平台；无关的平台、格式和工具链不会被人为变成要求。

## Skills

| Skill | 用途 | 作用域 |
| --- | --- | --- |
| `pinpoint` | 面向修复与优化的完整调查、实现、验证与审查工作流 | 编辑 + 审查 |
| `pinpoint-review` | 对 diff、分支或 PR 的对抗性审查：并行关注轴、评分重排门、严格噪音预算 | 只读 |
| `pinpoint-commit` | 精确暂存、符合仓库习惯的提交信息，以及经授权后的提交 | 交付 |
| `pinpoint-pr` | 分支与远端检查、有证据支撑的 PR 文案，以及经授权后的发布 | 交付 |
| `pinpoint-help` | 解释整套套件、说明边界并路由请求，不触碰仓库状态 | 只读帮助 |

`pinpoint` 会在审查关口自动调用 `pinpoint-review`，同时将审查、提交、PR 与帮助拆分为独立 Skill，避免对抗性评审规则和 Git 交付规则污染无关回合。两个交付 Skill 均使用用户的语言回复；提交信息和 PR 文案优先遵循显式指定的语言，其次遵循仓库规则与历史记录，最后回退到用户的语言。

Pinpoint 采用开放的 Agent Skills 格式：任何兼容该标准的 Agent 都会根据 Skill 描述自动触发，或在你显式点名 Skill 名称时调用。安装后请新开一个会话，让 Agent 刷新 Skill 列表。

> [!IMPORTANT]
> 安装或调用 Pinpoint 绝不代表授权提交、推送、创建 Pull Request、合并、部署或破坏性清理。每一个交付动作仍需用户显式授权。

## 核心工作流

核心 [`pinpoint`](skills/pinpoint/SKILL.md) Skill 引导 Agent 完成七个决策：

1. **维护证据账本**：严格区分仓库契约、外部契约、请求方要求、观察事实与推断。
2. **应用通用推理**：在真实消费者边界验证、让证据粒度匹配主张、保留上游权威，并通过运行时可达性证明影响面。
3. **追踪具体运行时路径**：找到行为从正确首次变为错误的转折点，判定故障归属层。
4. **修在最小的归属边界上**：优先复用既有设置、流水线和抽象，再考虑新增代码。
5. **审计可达契约**：只检查从追踪路径可达的契约（交互、语言、数据、协议、几何或平台），并如实报告无法检验的部分。
6. **验证真实机制**：在最低的可靠 oracle 上验证真实行为，并分开报告自动化、人工、未验证和无关环境四类证据。
7. **执行独立对抗性审查**：有子 Agent 时委托给 `pinpoint-review` 并核实其发现；只能自审时如实披露。除非被要求，否则在交付前停下。

显式调用示例：

```text
使用 pinpoint 修复侧边栏滚动异常。
使用 pinpoint-review 在合并前审查当前分支。
使用 pinpoint-commit 用中文提交已暂存的修复。
使用 pinpoint-pr 起草 PR 标题和正文。
```

## Pinpoint 保护什么

从追踪到的运行时路径可达的每一个契约——不限领域：

- **上游权威**：浏览器、操作系统、协议或服务方的有意行为
- **交互结构**：DOM 顺序、焦点、键盘操作、选区、屏幕阅读器遍历
- **语言与内容**：Unicode、RTL、CJK、竖排文本、超长译文
- **标识与持久化**：稳定标识符、哈希、排序、同步、回退机制
- **协议有效性**：回调、重定向、状态、PKCE、签名、重放校验
- **渲染行为**：几何布局、重排、视口、缓存、裁剪、点击目标
- **平台现实**：有文档依据的变通方案、原生工具链、真实执行机制
- **生产者-消费者契约**：退出码、产物完整性、下游可读性
- **仓库安全**：用户既有工作、分支历史、fork 拓扑、部署边界

Pinpoint 不承诺“零影响”，而是要求 Agent 证明可达的影响范围并说明剩余的验证缺口。

## 评估

[`evals/scenarios`](evals/scenarios) 中的场景专门检验“严谨修复”与“表面合理补丁”之间的分水岭（应用归属 vs 外部行为、无障碍交互结构、协议等价性、渲染几何、运行时可达性、下游产物可用性、基于基线的优化与审查噪音控制）。

每个场景均将 `prompt.md` 与 `rubric.json` 分开存放。评估场景与具体 Agent 无关，按 [`evals/SCORING.md`](evals/SCORING.md) 打分；目录格式与校验命令见 [`evals/README.md`](evals/README.md)。

## 贡献

保持改动以证据驱动、范围收敛：

1. 在 `evals/scenarios/` 中新增或更新一个能暴露缺失决策的场景。
2. 在对应的 `SKILL.md` 中做最少必要的改动。
3. 在本地运行 `npm test` 校验套件。
4. 在不向被测 Agent 展示 `rubric.json` 的前提下运行受影响场景，并按 [`evals/SCORING.md`](evals/SCORING.md) 打分。
5. 同时报告改进与回退。

除非能解决已被证明的可靠性或分发问题，否则避免新增脚本、参考文档、兼容层或额外打包配置。升级 `bin/pinpoint-install.mjs` 中固定的 `skills` CLI 版本时，需同步更新 `tests/installer-smoke.mjs` 与 CI 配置。

## 许可证

MIT
