# Pinpoint

[English](README.md) | 简体中文

**找到归属层。修在边界上。用证据证明。**

[![Validate Pinpoint](https://github.com/ChuwuYo/pinpoint/actions/workflows/validate.yml/badge.svg)](https://github.com/ChuwuYo/pinpoint/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[安装](#快速安装) · [为什么是 Pinpoint](#为什么是-pinpoint) · [Skills](#skills) · [命令](#命令) · [工作流](#核心工作流) · [评估](#评估)

---

Pinpoint 是一套可移植的 Agent Skill 套件，用于以证据为依据、以刻意缩小的影响面来修复和优化软件。它的核心 Skill 会追踪真实的运行时路径，定位是哪一层该为故障负责，保护相邻的契约，并且只报告现有证据能够证明的结论。配套的专用 Skills 分别处理提交和 Pull Request，避免把交付规则塞进每一次调查。

它不强推任何框架，也不取代仓库自身的规则。它提供的是一种在这些规则之内进行调查和交付的严谨方法。

## 快速安装

### 让你的 Agent 安装

把下面这段提示词交给你的编码 Agent：

```text
Install Pinpoint globally for the current coding harness from
https://github.com/ChuwuYo/pinpoint. Read and follow INSTALL.md. Install all four
Skills and any matching user commands supported by this harness, then verify
explicit invocation in a new session. Do not install hooks or modify project
files.
```

### 从终端安装

用你正在使用的 harness 运行套件安装器：

```bash
npx -y github:ChuwuYo/pinpoint --agent opencode
```

`npx -y github:ChuwuYo/pinpoint` 会拉取本仓库并运行 Pinpoint 套件安装器。`--agent opencode` 用于选择目标 harness 的 Skill 目录以及所需的命令集成。

套件安装器明确验证过以下取值：

```text
codex
claude-code
cursor
opencode
```

`--agent` 的值不是任意 harness 标识符。对于其他兼容 Agent Skills 的 harness，请改用标准安装器并传入其标识符：

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g -a <harness-id>
```

套件安装器会全局安装全部四个 Skills，并且仅当所选 harness 需要时才额外安装独立的命令文件。使用 `--project` 可改为仅对当前项目生效。

> [!TIP]
> 把仓库 URL 连同上面的提示词交给你的编码 Agent，它就能自己完成安装和验证，无需手动下载或复制文件。

Codex、Claude Code、Cursor、OpenCode 以及其他受支持的 harness 的安装方式，项目级安装、验证、更新和移除，请参阅 [`INSTALL.md`](INSTALL.md)。

## 为什么是 Pinpoint

编码 Agent 很擅长产出看似合理的补丁。更难的问题是：如何判断这个补丁改的是正确的层，且没有破坏其他地方的行为。

Pinpoint 让 Agent 聚焦于决定修复是否真正成立的问题：

- 这个行为是应用缺陷，还是浏览器、操作系统、框架、服务方或输入本身的有意行为？
- 正确的状态是在哪里第一次变错的？
- 哪个已有的边界、设置或流水线本来就拥有这个行为？
- 这次改动会触及哪些无障碍、语言、平台、数据、安全和持久化契约？
- 测试复现的是真实机制，还是只是一个方便的仿制品？
- 哪些结论已被验证，哪些仍需要真机、服务方、产物或人工检查？

> [!NOTE]
> Pinpoint 只审计从追踪到的运行时路径可达的契约。单平台项目仍然是单平台；不相关的平台、格式和工具链不会被人为变成要求。

## 带来的改变

| 没有 Pinpoint | 有了 Pinpoint |
| --- | --- |
| 修补看得见的症状 | 追踪第一个出错的边界 |
| 因为有更新的工具就替换架构 | 复用项目已确立的语义 |
| 为假想中的平台加开关 | 先证明运行时可达性 |
| 把无障碍当作收尾清单 | 把交互结构当作设计约束 |
| 轻信简化过的测试夹具 | 对齐真实产物和真实机制 |
| 本地测过就说"全平台" | 区分自动化、人工和未验证的证据 |
| 推了当前分支再祈祷 | 核实工作区、远端、基线和授权 |

## Skills

| Skill | 用途 |
| --- | --- |
| `pinpoint` | 修复与优化的完整调查、实现、验证和审查工作流 |
| `pinpoint-commit` | 精确的暂存、符合仓库习惯的提交信息，以及经授权的提交 |
| `pinpoint-pr` | 分支与远端检查、有证据支撑的 PR 文案，以及经授权的发布 |
| `pinpoint-help` | 解释这套套件并路由请求，不改变仓库状态 |

`pinpoint` 保持为一个完整的"从根因到审查"工作流。提交和 PR 交付之所以独立，是因为它们是可选动作，各自有不同的授权和语言规则。Help 则保持为轻量路由器，而不是又一个工作流。

两个交付 Skill 都用用户的语言回复。提交信息和 PR 文案优先遵循显式指定的语言；否则先遵循仓库规则和既有历史，最后才回退到用户的语言。

## 命令

| 工作流 | Claude Code、Cursor、OpenCode | Codex |
| --- | --- | --- |
| 修复与优化工作流 | `/pinpoint <请求>` | `$pinpoint` 或 `/skills` |
| 提交工作流 | `/pinpoint-commit <请求>` | `$pinpoint-commit` 或 `/skills` |
| PR 工作流 | `/pinpoint-pr <请求>` | `$pinpoint-pr` 或 `/skills` |
| 帮助与路由 | `/pinpoint-help` | `$pinpoint-help` 或 `/skills` |

> [!NOTE]
> Agent Skills 是可移植的；命令注册由 harness 自己负责。Skills 和命令在 harness 启动会话时被发现，所以安装后请开启新会话——对于桌面端或长时间运行的 harness，请彻底退出并重启应用，因为在运行中的应用里新建对话可能不会重新扫描命令菜单。Codex 通过 `$` 提及和 `/skills` 暴露第三方 Skills；它不会注册第三方的裸 `/pinpoint` 命令。

## 核心工作流

核心 `pinpoint` Skill 引导 Agent 完成七个决策：

1. 维护证据账本：区分仓库契约、外部契约、审查者要求、观察事实和推断。
2. 应用通用推理：在真实消费者边界验证、让证据粒度匹配主张、保留上游权威、通过运行时可达性证明影响面。
3. 追踪具体运行时路径，找到行为从正确首次变为错误的转折点，并判定归属层。
4. 修在最小的归属边界上，优先复用已有的设置、流水线和抽象，再考虑新增。
5. 只审计从追踪路径可达的契约——交互、语言、数据、协议、几何或平台——并报告无法检验的部分。
6. 在最低的可靠 oracle 上验证真实机制，然后分开报告自动化、人工、未验证和无关环境四类证据。
7. 有条件时使用独立的对抗性子 Agent 审查并核实其发现；只能自审时如实披露。除非被要求，否则在交付前停下。

完整工作流见 [`skills/pinpoint/SKILL.md`](skills/pinpoint/SKILL.md)。

## 作用域与调用

当不需要命令集成，或所用 harness 不在上面列表中时，只安装标准 Skills：

```bash
npx skills add ChuwuYo/pinpoint --skill '*' -g
```

当不需要提交和 PR 辅助时，只全局安装核心工作流：

```bash
npx skills add ChuwuYo/pinpoint --skill pinpoint -g
```

去掉 `-g` 即为项目级安装。无人值守安装请使用显式的 `-a` 目标；[`INSTALL.md`](INSTALL.md) 里有各主要 harness 的现成示例和命令行为说明。

> [!IMPORTANT]
> 安装或调用 Pinpoint 并不授权提交、推送、创建 Pull Request、合并、部署或破坏性清理。每一个交付动作仍需用户显式授权。

套件通过每个 Skill 的描述被激活。`pinpoint` 负责修 bug、优化和完整审查；`pinpoint-commit` 负责暂存和提交；`pinpoint-pr` 负责 PR 准备和发布；`pinpoint-help` 负责告诉你该用哪个。你也可以显式指定：

```text
Use Pinpoint to investigate and fix this issue with the smallest proven impact.
```

```text
Use Pinpoint to review this branch for incorrect ownership, hidden regressions,
weak test models, and claims the evidence does not support.
```

```text
Use Pinpoint Commit to commit only the staged fix and write the message in Chinese.
```

```text
Use Pinpoint PR to prepare the English PR title and body, but do not push.
```

## Pinpoint 保护什么

从追踪到的运行时路径可达的每一个契约——不限领域。常见的例子：

- 上游权威：浏览器、操作系统、协议或服务方的有意行为
- 交互结构：DOM 顺序、焦点、键盘操作、选区、屏幕阅读器遍历
- 语言与内容：Unicode、RTL、CJK、竖排文本、超长译文
- 标识与持久化：稳定标识符、哈希、排序、同步、回退
- 协议有效性：回调、重定向、状态、PKCE、签名、重放校验
- 渲染行为：几何、重排、视口、缓存、裁剪、点击目标
- 平台现实：特定变通方案、原生工具链、真实机制
- 生产者-消费者契约：退出码、产物完整性、下游可读性
- 用户的既有工作、分支历史、fork 拓扑和部署边界

Pinpoint 不承诺零影响。它要求 Agent 论证清楚可达的影响范围，并说明剩余的验证缺口。

## 评估

[`evals/scenarios`](evals/scenarios) 中的场景，专门检验那些最能区分"严谨贡献"和"貌似合理的补丁"的决策：

- 外部行为与应用归属；
- 视觉正确与无障碍交互结构；
- 不削弱安全性的协议等价实现；
- 渲染几何与重排标识；
- 共享接口与运行时真正可达的消费者；
- 生产者的成功信号与下游可消费的产物；
- 用户语言与仓库提交、PR 惯例；
- 在脏 fork 中安全地贡献。

每个场景都把用户提示词和评估 rubric 分开。只把提示词给被评估的 Agent，rubric 留到事后使用。这些场景与 harness 无关，可用于不同的 Agent 和模型。按 [`evals/SCORING.md`](evals/SCORING.md) 给运行打分，让结果在不同版本和模型之间保持可比。

## 贡献

保持改动以证据驱动、范围收敛。对于行为变更：

1. 新增或更新一个能暴露缺失决策的场景。
2. 在负有责任的 `SKILL.md` 中改动最少必要的指令。
3. 对照开放规范验证每个 Skill。
4. 运行受影响的场景，且不把 rubric 展示给被评估的 Agent，按 [`evals/SCORING.md`](evals/SCORING.md) 打分。
5. 同时报告改进和回退。

在解决已被证明的分发或可靠性需求之前，避免添加脚本、参考资料、兼容层或插件打包。

## 许可证

MIT
