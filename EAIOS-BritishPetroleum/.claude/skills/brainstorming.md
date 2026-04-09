# Brainstorming

Explore user intent, requirements, and design before any implementation begins.

## HARD GATE

**Do NOT write any code, scaffold any files, or take any implementation action until:**
1. A design has been presented
2. The user has explicitly approved it

No exceptions. Planning and coding are separate sessions.

## The Nine-Step Process

### 1. Explore Context
- Read relevant existing files, docs, and recent commits
- Understand what's already built and what patterns are in use
- Note the current state before proposing changes

### 2. Offer a Visual Companion (if appropriate)
- For UI features: offer to sketch the layout in ASCII or describe the component tree
- For data models: offer an ER diagram or schema outline
- For APIs: offer an endpoint map

### 3. Ask Clarifying Questions — One at a Time
- Ask the single most important question first
- Wait for the answer before asking the next
- Prefer multiple-choice questions over open-ended ones
- Keep asking until requirements are unambiguous

### 4. Propose 2–3 Approaches with Trade-offs
- Never present just one option
- For each approach: describe what it is, pros, cons, and fit for this project
- Recommend one — but present the others fairly

### 5. Present Design Sections
Walk through the design:
- What changes (files, components, endpoints, tables)
- What stays the same
- Integration points with existing code
- Edge cases and how they're handled

### 6. Write Design Documentation
Save approved design to:
```
docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
```
Commit before proceeding.

### 7. Self-Review the Design
Before presenting:
- Does this solve the actual problem?
- Is there a simpler approach? (YAGNI)
- Does it match existing patterns in the codebase?
- Are there security or performance implications?

### 8. Get User Approval
Present the design. Ask explicitly: "Does this design look right? Should I proceed to planning?"

Do NOT proceed until you receive a clear yes.

### 9. Transition to Writing Plans
Once approved, invoke the `writing-plans` skill to break the design into implementable tasks.

## Design Principles

- **YAGNI ruthlessly** — eliminate features not needed right now
- **Match existing patterns** — don't introduce new conventions without reason
- **One question at a time** — never overwhelm with a list of questions
- **Isolated units** — design each piece to be independently testable

## For This Project

When brainstorming a new feature, consider:
- **Frontend**: Does it need a new page, component, or just a hook?
- **Backend**: New router, new service, or extending existing ones?
- **Database**: New model, new columns, or a query change?
- **Airflow**: New DAG or new task in an existing DAG?
- **All layers**: Does it touch frontend + backend + DB? Plan the integration points explicitly.
