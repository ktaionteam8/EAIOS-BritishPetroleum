# Model

Switch context between Opus (planning) and Sonnet (execution) based on the task type.

## Usage
```
/model plan      → reminds to use Opus for this task
/model execute   → confirms Sonnet is active for this task
/model status    → shows current model strategy
```

## Model Strategy for this project

| Mode | Model | When to use |
|---|---|---|
| **Planning** | `claude-opus-4-6` | Architectural decisions, plan mode, complex analysis, PR reviews, security audits, debugging |
| **Execution** | `claude-sonnet-4-6` | All regular prompts, writing code, editing files, running commands, day-to-day tasks |

## Rules

### Use Opus when:
- Entering plan mode for any non-trivial task
- Reviewing a PR (`/pr-review`)
- Running a security audit (`security-auditor` agent)
- Diagnosing a complex bug (`debugger` agent)
- Designing database schema or API architecture
- Making decisions that affect multiple layers of the stack

### Use Sonnet when:
- Implementing a planned feature
- Writing or editing files
- Running tests or commands
- Answering questions about the codebase
- Any single-step or clearly defined task

## How it's configured

- **Default model**: `claude-sonnet-4-6` (set in `.claude/settings.json`)
- **Planning model**: `claude-opus-4-6` (set in `.claude/settings.json` under `agents.planningModel`)
- **Agents on Opus**: `code-reviewer`, `security-auditor`, `debugger`
- **Agents on Sonnet**: `test-writer`, `refactorer`, `doc-writer`
