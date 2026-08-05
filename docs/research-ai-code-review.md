# Research: How AI Code Review Products Surface Real Issues

Research notes for strengthening the `pinpoint` skill's adversarial review stage.
Primary sources only (official docs, engineering blogs, source code, papers). Every
claim carries its source URL. Compiled 2026-08-06.

## TL;DR — transferable techniques

- **Never trust a single generate pass.** Every serious product filters or re-ranks
  raw LLM findings before showing them: PR-Agent scores each suggestion 0–10 in a
  follow-up call and drops zero-scored ones (https://docs.pr-agent.ai/core-abilities/self_reflection/);
  Atlassian's RovoDev gates comments through an LLM-as-judge factual check and a
  trained actionability classifier (https://arxiv.org/abs/2601.01129). Pinpoint's
  "verify every finding independently" should become a formal scored gate.
- **Parallelize review by concern axis, aggregate deterministically.** Greptile runs
  a swarm of agents over a codebase graph (https://www.greptile.com/agent.md); the
  review-swarm and mattpocock skills split review into 4 and 2 concern-axes run as
  parallel read-only sub-agents, then the orchestrator dedupes and orders findings
  (https://github.com/Dimillian/Skills/tree/main/review-swarm,
  https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md).
  Axes must not be merged or cross-ranked, or one axis masks the other (mattpocock).
- **Context beyond the diff is the differentiator.** Cubic attributes its #1 benchmark
  rank to full-codebase context rather than diff-only review
  (https://www.cubic.dev/blog/cubic-is-the-best-ai-code-reviewer-on-martian-s-benchmark);
  Greptile builds a repo graph of files/functions/dependencies
  (https://www.greptile.com/docs/introduction). Pinpoint's reachability tracing is
  the same idea done manually — keep it and make it explicit in the review brief.
- **Budget the noise.** PR-Agent caps findings (`num_max_findings` default 3)
  (https://docs.pr-agent.ai/tools/review/); review-swarm prefers missing a nit over
  burying the user and reports "no material issues" rather than manufacturing
  feedback (https://github.com/Dimillian/Skills/tree/main/review-swarm); Sourcery
  suppresses comment classes that get consistent thumbs-down
  (https://docs.sourcery.ai/reviews/anatomy-of-a-review/).
- **Let deterministic tools own what they own.** CodeRabbit runs 50+ OSS linters and
  security scanners alongside the LLM (https://docs.coderabbit.ai/tools); reviewdog's
  whole purpose is posting linter findings only when they fall inside the diff
  (https://github.com/reviewdog/reviewdog); mattpocock's baseline says skip anything
  tooling already enforces. LLM findings should be the residue static analysis
  cannot decide.
- **Anchor the review to intent.** CodeRabbit assesses whether the PR addresses its
  linked issue (https://docs.coderabbit.ai/pr-reviews/walkthroughs); mattpocock
  dedicates a whole sub-agent to spec-vs-diff including scope creep; RovoDev's
  ablation shows review *guidelines* are the single most valuable prompt component
  (+5pp localization) while persona/CoT/ticket context add only 1–3%
  (https://arxiv.org/abs/2601.01129).
- **Severity gates close the loop.** CodeRabbit pre-merge checks, Sourcery's required
  status check, and PR-Agent's label-based merge blocking all convert findings into
  an enforceable verdict — pinpoint's BLOCK / FIX-THEN-COMMIT / CLEAR is the same
  pattern (https://docs.sourcery.ai/reviews/anatomy-of-a-review/,
  https://docs.pr-agent.ai/tools/review/).
- **Learn from reactions.** CodeRabbit Learnings, Greptile's 👍/👎 + merged-PR
  signals, and cubic's "reads your senior developers' comments" all suppress
  previously-rejected suggestion classes
  (https://docs.coderabbit.ai/knowledge-base/learnings,
  https://www.greptile.com/learning.md, https://www.cubic.dev/).

## Per-product findings

### CodeRabbit

Sources: https://docs.coderabbit.ai/guides/code-review-overview,
https://docs.coderabbit.ai/tools,
https://docs.coderabbit.ai/pr-reviews/walkthroughs,
https://docs.coderabbit.ai/knowledge-base,
https://docs.coderabbit.ai/knowledge-base/learnings

- **Pipeline:** on PR open, analysis runs "multiple AI models and static analysis
  tools"; within minutes it posts summaries, security findings, suggestions, and
  one-click fixes. Subsequent commits get **incremental reviews** focused only on
  the new changes.
- **Static-analysis fleet:** 50+ third-party linters and security scanners (ESLint,
  Ruff, Gitleaks, …) run automatically in sandboxed environments. CodeRabbit
  auto-detects which tools are relevant per repo; each tool uses the repo's own
  config file when present, else a profile-based default. Tool output appears under
  a "Review details" comment with file/line and often a 1-click fix. Two review
  profiles — `chill` (critical issues only, less noise) and `assertive` — act as a
  global noise dial.
- **Taxonomy:** every comment carries a content category (Security & Privacy,
  Stability & Availability, Data Integrity & Integration, Functional Correctness,
  Performance & Scalability, Maintainability) and a severity (Critical / Major /
  Minor / Trivial / Info).
- **Walkthrough (comprehension layer):** changed-files summary that consolidates
  related files into one row (e.g. "1 source file + 27 localization files" → 2
  rows), Mermaid sequence diagrams for PRs affecting component interactions,
  estimated review effort (1–5), related issues/PRs, suggested labels and
  reviewers, and a **linked-issue assessment** — it reads the linked issue and
  highlights gaps between what was requested and what the PR delivers. That
  assessment feeds pre-merge checks, i.e. it can be a merge requirement.
- **Knowledge base (context beyond the diff):** learnings, auto-detected code
  guidelines (`.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`),
  multi-repo analysis for cross-repo breaking changes, MCP servers, web search for
  library/API context, and issue-tracker context (GitHub/GitLab/Jira/Linear).
  Learnings, code guidelines, web search, and PR context are on by default.
- **Learnings (feedback loop):** teams teach preferences in natural-language chat;
  CodeRabbit stores them with metadata (PR number, filename, user), embeds them for
  vector-similarity retrieval, applies them by configurable scope
  (auto/global/local), tracks usage counts and last-used dates, and redacts
  credentials at write time. Docs explicitly coach "explain the why, not just the
  what" so learnings generalize, and warn against contradictory accumulated
  learnings. Optional approval delay before chat-sourced learnings apply.
- **Benchmark caveat:** on Martian's independent Code Review Bench, CodeRabbit ranks
  #17 at 30.3% F1 (24.7% precision / 39.4% recall) — i.e., high recall, low
  precision, per cubic's citation of the leaderboard
  (https://www.cubic.dev/blog/cubic-is-the-best-ai-code-reviewer-on-martian-s-benchmark,
  methodology at https://codereview.withmartian.com/?mode=offline).

### cubic

Sources: https://docs.cubic.dev/ai-review/introduction,
https://docs.cubic.dev/ai-review/key-features,
https://www.cubic.dev/,
https://www.cubic.dev/blog/cubic-is-the-best-ai-code-reviewer-on-martian-s-benchmark

- **Positioning:** "#1 on Code Review Bench" at 61.8% F1 (56.3% precision / 68.6%
  recall) on Martian's independent benchmark of real-world PRs; next well-known
  tool listed is Cursor Bugbot at 45.5% F1.
- **How they claim to find issues** (their own blog): "Most AI code review tools run
  a single LLM pass over the git diff. That approach hits a ceiling quickly." Their
  three levers: (1) **continuous A/B testing and model routing** — different parts
  of the review pipeline go to the best model for that situation; (2) **full
  codebase context, not just diffs** — cross-file dependencies and systemic rules;
  (3) **adaptive learning** — accepted/dismissed suggestions adapt an internal
  rules engine.
- **Seniority mimicry:** homepage claims cubic "identifies senior engineers, learns
  from their activity" and "onboards by reading your senior developers' PR comment
  history."
- **Noise control:** "Only surfaces issues worth your attention, with minimal
  verbosity, and auto-resolves addressed issues. No poems or pointless noise."
  Incremental review posts comments only when *new* issues are discovered — no
  repeated feedback on previously reviewed code.
- **Escalation:** *Ultrareview* runs a longer review with their most capable models
  for risky migrations, security-sensitive changes, or complex refactors — an
  explicit depth-per-risk dial. PRs over 200 eligible files are reduced to the
  highest-priority 200.
- **Custom agents:** plain-English or code-pattern rules for team standards
  (internal API usage, architectural decisions, deprecated functions); context
  pulled from Linear/Jira/Notion/Confluence; cross-repo reviews for
  frontend/backend or shared-schema changes; auto-approval of clean PRs after a
  shadow-mode trial; up-to-date library documentation so suggestions don't cite
  stale APIs.

### Greptile

Sources: https://www.greptile.com/agent.md,
https://www.greptile.com/docs/introduction,
https://www.greptile.com/learning.md

- **Pipeline:** (1) build a **graph index** of the repo — files, functions,
  dependencies; (2) a **swarm of parallel agents** reviews the PR, assessing impact
  "beyond the diff"; (3) learn coding standards from other engineers' PR comments.
  Docs claim findings posted in ~3 minutes.
- **Review anatomy:** 0–5 **confidence score** for merge safety, sequence diagrams
  and flowcharts per PR, PR summary, suggested fixes, one-click hand-off to coding
  agents (Claude Code, Codex, Cursor, Devin), and TREX, an agent that writes and
  runs tests for every PR in a sandbox.
- **Noise controls (user-facing):** configurable **severity threshold** so only
  high-impact issues surface; sections collapsible by default; review triggers
  controllable (every push, on request, or by file paths/labels).
- **Personalization:** custom rules in plain English; `./greptile/rules` scoped to
  file patterns; automatic indexing of `CLAUDE.md`, `AGENTS.md`, `.cursorrules`;
  learning from 👍/👎 reactions, tags, and what actually gets merged ("after 2–3
  weeks it stops commenting on things you don't care about").
- **Claimed scale:** "100K+ bugs caught in production every month," 9,000+ teams —
  marketing numbers, treat as claims not measurements
  (https://www.greptile.com/docs/introduction).

### PR-Agent / Qodo Merge (open source)

Sources: https://github.com/The-PR-Agent/pr-agent,
https://docs.pr-agent.ai/tools/review/,
https://docs.pr-agent.ai/tools/improve/,
https://docs.pr-agent.ai/core-abilities/self_reflection/,
https://docs.pr-agent.ai/core-abilities/compression_strategy/

(Note: Qodo donated PR-Agent to the community; it now lives at
github.com/The-PR-Agent/pr-agent. Qodo Merge evolved into the hosted Qodo platform.)

- **Command model:** `/review` (feedback aimed at the human reviewer: security
  section, tests-present check, review-effort estimate 1–5, ticket-compliance
  check, TODO scan), `/improve` (actionable code suggestions for the author),
  `/describe`, `/ask`. Each tool is deliberately **one LLM call (~30s)** for cost
  and latency.
- **PR compression (large-PR handling):** exclude binaries/non-code; prioritize the
  repo's dominant languages; prioritize additions over deletions (deletion-only
  hunks dropped, deleted files listed by name); token-aware patch fitting with
  tiktoken, overflowing patches degraded to an "other modified files" list.
  `/improve` chunks large PRs at ~32k tokens and generates up to 3 suggestions per
  chunk, so suggestion count scales with PR size; stated rationale: "larger
  contexts tend to decrease AI performance."
- **Self-reflection (their flagship noise filter):** models "struggle to
  simultaneously generate high-quality code suggestions and rank them well in a
  single pass," so a follow-up call presents *all* generated suggestions to the
  model at once; the model scores each 0–10 with a rationale; suggestions scored 0
  are eliminated, the rest re-ranked, and a user threshold
  (`suggestions_score_threshold`) can filter further. Presenting all suggestions
  together gives comparative context that beats per-item evaluation.
- **Deliberate caps:** `/review`'s `num_max_findings` defaults to **3**; table-mode
  suggestions default over inline comments to reduce PR footprint; a "dual
  publishing" mode only escalates suggestions above a score threshold to
  committable comments.
- **Dedup across runs:** persistent inline comments embed a hidden HTML-comment
  fingerprint (one over normalized text, one over the proposed code block,
  OR-matched) so re-runs skip already-posted findings even when the model rephrases
  them.
- **Custom context:** repo `best_practices.md` yields "Organization best practice"
  labeled suggestions; guidance: keep files <800 lines, pattern-based with
  before/after code examples (generic guidelines "already known to AI" are waste).
  Since v0.39, `AGENTS.md` is fed to `/review`, `/describe`, `/improve` by default.
- **Severity gates:** auto-labels (`possible security issue`, `review effort x/5`,
  ticket-compliance levels); docs describe wiring those labels to a merge-blocking
  CI action, with an explicit caution that AI may lack full context and overrides
  must be possible and documented.
- **Human-acknowledgment loop:** optional author self-review checkbox; when
  clicked, suggestions fold and (optionally) an approval is added — forcing an
  explicit "I read the bot's findings" act.

### Sourcery

Sources: https://docs.sourcery.ai/, https://docs.sourcery.ai/reviews/anatomy-of-a-review/

- **Review anatomy:** summary written into the PR description itself (survives
  comment growth); a "reviewer's guide" comment with a file-level changes table
  and sequence diagram for non-trivial control flow; inline comments **prefixed
  with type and area** (`issue (bug_risk):`, `suggestion (performance):`,
  `issue (security):` with 🚨); GitHub suggestion blocks where a fix is concrete.
- **Re-review mechanics:** re-checks each existing comment against the new code and
  resolves addressed threads; re-runs security scans; does not regenerate the rest.
  Automatic re-reviews capped at five per PR.
- **Reaction learning:** 👍/👎 per comment; where many similar past comments were
  downvoted, Sourcery suppresses similar new ones — explicitly a *gradual* signal
  (one downvote won't silence a topic), and an **outdated comment counts as
  positive** (the code it flagged got changed, so it did its job). When the same
  request recurs, they tell you to write an explicit review rule instead of waiting
  for reactions to accumulate.
- **Merge gate:** a single `Sourcery review` status check on the head commit that
  branch protection can require; failure state reserved for blocking security
  findings.

### Graphite ("AI reviews", formerly Diamond)

Source: https://graphite.dev/docs/diamond

- Claims: focuses on real bugs rather than style; analyzes the entire codebase for
  context; shows how to fix, not just what's wrong; learns from how the team
  interacts with comments; a dashboard tracks **comment acceptance rates** and
  rule effectiveness so teams can tune the reviewer against measured acceptance.

## Open-source review infrastructure and agent-skill patterns

### Deterministic plumbing (finding engines and diff filtering)

- **reviewdog** (https://github.com/reviewdog/reviewdog): takes *any* linter
  output (errorformat strings, checkstyle XML, SARIF, its own RDFormat, or raw
  diffs from formatters) and posts findings as PR comments **only if they fall in
  the diff under review** — the canonical "new findings only" filter. Reporters
  exist for GitHub Checks/PR-review, GitLab MR discussions, Gerrit, Bitbucket; a
  `-fail-level` turns findings into CI failure. Lesson: diff-scoped reporting is
  the first noise filter, before any model runs.
- **Danger** (https://danger.systems/): programmable PR automation — scripts run in
  CI that enforce review chores (missing tests, missing CHANGELOG, PR body
  conventions) and comment automatically. Lesson: codify recurring human review
  comments as rules instead of re-typing them (same advice Sourcery gives).
- **Semgrep** (https://semgrep.dev/docs/): deterministic pattern-based SAST plus
  SCA and secrets scanning; custom YAML rules enforce org-specific standards.
  Lesson: high-precision pattern rules are cheap seeds an LLM reviewer can then
  triage for reachability instead of rediscovering them probabilistically.
- **CodeQL**
  (https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql):
  "treat code like data" — build a database of the codebase, run open-source
  query packs over it; GitHub notes the default queries are "regularly updated to
  improve analysis and reduce any false positive results." Lesson: even
  deterministic engines are tuned for false-positive suppression as a first-class
  goal.

### Agent-skill / prompt patterns

- **mattpocock/skills `code-review`**
  (https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md):
  two-axis review — **Standards** (repo's documented standards + a fixed Fowler
  smell baseline: Mysterious Name, Feature Envy, Shotgun Surgery, Speculative
  Generality, …) and **Spec** (does the diff implement the originating issue;
  flags missing requirements, scope creep, and wrong-looking implementations,
  quoting the spec line per finding). Both axes run as **parallel sub-agents "so
  they don't pollute each other's context"**; findings are deliberately *not*
  merged or cross-ranked so one axis can't mask the other. Two binding rules:
  repo standards override the smell baseline; smells are labelled judgement
  calls, never hard violations; skip anything tooling already enforces.
- **obra/superpowers `requesting-code-review`**
  (https://raw.githubusercontent.com/obra/superpowers/main/skills/requesting-code-review/SKILL.md
  and template
  https://raw.githubusercontent.com/obra/superpowers/main/skills/requesting-code-review/code-reviewer.md):
  dispatch a reviewer subagent with "precisely crafted context — never your
  session's history," because diff review should happen in the subagent's context
  and only findings return. The template enforces read-only behavior, checks plan
  alignment → code quality → architecture → tests ("verify real behavior, not
  mocks") → production readiness, and has an explicit **Calibration** section:
  categorize by *actual* severity ("not everything is Critical"), acknowledge
  strengths first so the implementer trusts the feedback, always give a clear
  verdict (Yes / No / With fixes). Coordinator-side rules: fix Critical now, fix
  Important before proceeding, and **push back with technical reasoning when the
  reviewer is wrong**.
- **Dimillian/Skills `review-swarm`**
  (https://github.com/Dimillian/Skills/tree/main/review-swarm): four parallel
  read-only sub-agents by concern — Intent/Regression, Security/Privacy,
  Performance/Reliability, Contracts/Coverage — all given the same **intent
  packet** (what behavior is meant to change, what must stay unchanged, stated
  constraints). Findings must include file:line, issue, why-it-matters, fix, and
  confidence; nits and speculative concerns are banned. The orchestrator then
  filters aggressively (drop duplicates, weak claims, intent conflicts),
  normalizes severity + confidence, orders output high-severity/high-confidence
  first, converts unclear ones into open questions rather than findings, and ends
  with a fix-now / fix-soon / optional path. "It is better to miss a nit than to
  bury the user in low-value noise" and "If there are no material issues, say
  that directly instead of manufacturing feedback."
- **wshobson/agents `code-reviewer`**
  (https://raw.githubusercontent.com/wshobson/agents/main/plugins/comprehensive-review/agents/code-reviewer.md):
  a capability-checklist persona (security, performance, configuration,
  production readiness) assigned to the strongest model tier (review is classed
  with architecture and security as "opus" work); its response approach is
  **automated tools first, manual review second** for logic/architecture, with
  structured severity-organized feedback.
- **anthropics/skills** (https://github.com/anthropics/skills): reference for the
  SKILL.md packaging format itself (YAML frontmatter `name` + `description`,
  instructions below, dynamic loading) — the medium all the above patterns ship
  in; no official Anthropic code-review skill exists in that repo.

## Methodology and papers

- **Google eng-practices — "What to look for in a code review"**
  (https://google.github.io/eng-practices/review/reviewer/looking-for.html): the
  canonical human rubric — design, functionality (think about edge cases,
  concurrency, "think like a user"), complexity with special vigilance for
  **over-engineering** ("solve the problem they know needs to be solved *now*"),
  tests ("Will the tests actually fail when the code is broken?"), naming,
  comments (explain *why*, not *what*), style ("Nit:" prefix; never block on
  personal style), consistency, documentation, read **every line**, look at the
  CL in broad **context**, and call out **good things**. This maps almost
  one-to-one onto a reviewer checklist prompt.
- **RovoDev Code Reviewer @ Atlassian** (ICSE-SEIP'26,
  https://arxiv.org/abs/2601.01129): the most concrete published industrial
  pipeline. Three stages: (1) zero-shot generation with structured prompt
  (persona, task definition, chain-of-thought, **review guidelines for code /
  test files / comment tone**, PR title+description, Jira summary); (2) an
  LLM-as-judge **factual correctness** filter (binary selection-based judgment,
  gpt-4o-mini); (3) a ModernBERT **actionability** classifier fine-tuned on 50k+
  generated comments labeled by whether the commented lines were actually changed
  in the next commit. Deployed to 1,900+ repos, 54k comments, ~2.1 comments/PR.
  Results: 38.70% of comments led to code changes (human-written: 44.45%), median
  PR cycle time −30.8%, human-written comments −35.6%. Ablations worth stealing:
  review guidelines are the most valuable prompt component (+5pp localization;
  persona/CoT/PR/Jira context only 1–3%); the actionability gate adds +20pp
  correct-location alignment while the expensive factual-check judge had *minimal*
  measured impact — the authors recommend prioritizing actionability filtering.
  Also: incorrect/non-actionable comments appeared when context was unknown
  (unfamiliar languages/frameworks), and adding more context only helped
  marginally.
- **CR-Bench** (2026, https://arxiv.org/abs/2603.11078): benchmark + fine-grained
  evaluator for code review agents; compares single-shot vs Reflexion-based
  agents. Finding: agents designed to surface *all* hidden issues exhibit a low
  signal-to-noise ratio, and there is a measurable **trade-off frontier between
  issue resolution and spurious findings** — i.e., recall-maximizing review
  designs pay for it in false positives, which is exactly the failure mode
  severity gates and finding-caps are meant to control.
- **CodeAgent** (2024, https://arxiv.org/abs/2402.02172): multi-agent review
  system with role-specialized agents and a **QA-Checker supervisory agent** that
  verifies every agent contribution actually addresses the review question;
  evaluated on change/commit-message inconsistency detection, vulnerability
  introduction, style adherence, and revision suggestion. Early evidence that
  multi-agent + supervisor beats single-pass generation for review.
- **Ericsson experience report** (ICSME 2025, https://arxiv.org/abs/2507.19115):
  a lightweight internal tool combining LLMs with **static program analysis**;
  encouraging results in preliminary evaluation with experienced developers —
  another industrial data point for the deterministic+LLM hybrid.
- **Martian Code Review Bench** (https://codereview.withmartian.com/?mode=offline):
  independent leaderboard scoring reviewers on real-world PRs with precision
  (don't drown devs in false positives), recall (catch actual bugs), and F1 —
  the framing cubic cites. Useful as a model for how to score pinpoint's own
  eval scenarios: count false positives, not just caught bugs.

## What pinpoint could adopt

Current review stage (`skills/pinpoint/SKILL.md` "Run an Adversarial Review"):
one independent read-only reviewer given the raw issue, repo rules, diff, and
reproduction evidence; six challenge categories; findings closed with
blocker/should-fix/nit counts and a BLOCK / FIX-THEN-COMMIT / CLEAR verdict;
every finding verified independently before acting; disclosed self-review
fallback. Eval scenarios live in `evals/scenarios/`.

Ranked by likely value. **[prompt]** = adoptable in the SKILL.md text alone;
**[tooling]** = needs scripts, files, or harness support.

1. **[prompt, high]** Turn finding-verification into a scored re-rank gate. The
   reviewer already must "verify every finding independently" — formalize it the
   PR-Agent way: after generating findings, require a second pass that scores
   each finding for correctness *and* actionability with a one-line rationale,
   drops zero-scored ones, and re-ranks the rest before severities are assigned
   (https://docs.pr-agent.ai/core-abilities/self_reflection/). RovoDev's ablation
   says actionability filtering is where the value is
   (https://arxiv.org/abs/2601.01129). Zero new machinery; one added paragraph.
2. **[prompt, high]** Split the single reviewer into parallel concern-axis
   reviewers sharing one intent packet, with the main agent as deterministic
   aggregator (dedupe, drop speculative, order by severity×confidence). The six
   challenge categories in pinpoint are already the axis list — review-swarm
   shows the mechanics (https://github.com/Dimillian/Skills/tree/main/review-swarm).
   Keep mattpocock's rule: don't cross-rank axes; report per-axis worst finding so
   a strong axis can't mask a weak one. Add **confidence** to each finding
   (pinpoint has severity but not confidence) and order output
   severity×confidence.
3. **[prompt, high]** Add an explicit noise budget: cap findings (PR-Agent
   defaults to 3 for `/review`), ban nits without concrete impact, and require
   the reviewer to state "no material issues" when true instead of manufacturing
   feedback — pinpoint's CLEAR verdict exists but the skill doesn't forbid
   padding the finding list to look thorough
   (https://github.com/Dimillian/Skills/tree/main/review-swarm,
   https://docs.pr-agent.ai/tools/review/). CR-Bench's resolution-vs-spurious
   frontier is the justification (https://arxiv.org/abs/2603.11078).
4. **[prompt, high]** Make intent-anchoring a first-class axis: does the diff
   actually address the reported issue (quote the issue/spec line per gap), and
   flag unrequested behavior as scope creep — CodeRabbit's linked-issue
   assessment and mattpocock's Spec axis, both prompt-only
   (https://docs.coderabbit.ai/pr-reviews/walkthroughs,
   https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md).
   RovoDev's ablation (guidelines >> other context) supports investing prompt
   budget here rather than in persona framing.
5. **[prompt, medium]** Calibration rules copied from the obra template:
   categorize by actual severity ("not everything is Critical"), acknowledge what
   is correct before listing issues, and always end with the explicit verdict —
   this both reduces severity inflation and makes CLEAR non-vacuous
   (https://raw.githubusercontent.com/obra/superpowers/main/skills/requesting-code-review/code-reviewer.md).
   Add Google's "will the tests actually fail when the code is broken?" to
   pinpoint's existing test-quality challenge
   (https://google.github.io/eng-practices/review/reviewer/looking-for.html).
6. **[prompt, medium]** "Skip what tooling already enforces." Reviewers should
   not re-report findings the repo's configured linter/type checker/formatter
   already catches (mattpocock's baseline rule; CodeRabbit's whole 50-tool fleet
   exists so the LLM doesn't waste budget on them
   (https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md,
   https://docs.coderabbit.ai/tools)). Prompt-only version: instruct the reviewer
   to check for and run repo-configured static checks first and subtract their
   output.
7. **[prompt→light tooling, medium]** A repo-local review-learnings file. Commercial
   tools all converge on persistent, scoped, "explain-the-why" learnings
   (https://docs.coderabbit.ai/knowledge-base/learnings,
   https://www.greptile.com/learning.md). Pinpoint already has the "Apply
   Transferable Reasoning" section as built-in learnings; a per-repo
   `PINPOINT_LEARNINGS.md` (read by the reviewer, appended when a finding is
   rejected with evidence) is the local equivalent. Cheap: one file convention
   plus two sentences in the skill.
8. **[light tooling, medium]** Fingerprinted findings for re-review dedup. When
   review runs again after fixes, previously-rejected or already-fixed findings
   must not reappear — PR-Agent's hidden fingerprints and cubic's
   "comments only on new issues" solve this with infrastructure
   (https://docs.pr-agent.ai/tools/improve/,
   https://docs.cubic.dev/ai-review/key-features). Local equivalent: a findings
   ledger (per change-id) the reviewer reads and reconciles against.
9. **[tooling, medium]** Precision/recall scoring for eval scenarios. Martian's
   F1 framing and CR-Bench's spurious-finding frontier say an eval that only
   counts "did it catch the planted bug" rewards noisy reviewers
   (https://codereview.withmartian.com/?mode=offline,
   https://arxiv.org/abs/2603.11078). Extend `evals/SCORING.md` so review-stage
   scenarios also count false-positive findings and track precision, not just
   recall.
10. **[tooling, low for us]** Deterministic finding seeds (Semgrep/CodeQL custom
    rules, reviewdog-style diff filtering) fed to the reviewer as verified
    observations to triage for reachability — a natural fit with pinpoint's
    "prove impact through runtime reachability," but real infra to wire
    (https://semgrep.dev/docs/,
    https://github.com/reviewdog/reviewdog). Defer unless review volume justifies
    it.
11. **[tooling, low for us]** Full-codebase context graphs (Greptile/cubic) and
    model routing / Ultrareview-style escalation (https://www.greptile.com/agent.md,
    https://www.cubic.dev/blog/cubic-is-the-best-ai-code-reviewer-on-martian-s-benchmark).
    Pinpoint's traced-path reachability is the manual version of the same
    advantage; a cheaper [prompt] interpolation is an explicit "escalate to a
    deeper second pass when blast radius is wide or ownership is unclear" clause
    rather than always-on heavyweight review.

Already aligned with best practice (no change needed): independent read-only
reviewer with crafted context instead of session history (obra, review-swarm);
evidence-backed findings with file:line and independent verification (universal);
severity-gated verdict that can block progress (PR-Agent labels, Sourcery status
check, CodeRabbit pre-merge checks); disclosed self-review fallback (PR-Agent's
self-review checkbox pattern).
