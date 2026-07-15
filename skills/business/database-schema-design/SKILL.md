---
name: database-schema-design
description: Use before implementing database-backed features — design the data model with business rules, access patterns, indexing strategy, and migration plan
outputs:
  - schema-designed
  - needs-clarification
  - schema-too-complex
---

# Database Schema Design

## Overview

Design a clean, well-bounded data model that serves the application's access patterns and enforces business rules at the database level.

**Announce at start:** "I'm using the database-schema-design skill to design this data model."

## The Process

### Step 1: Understand the Domain

Before designing tables, understand the business domain:

Ask (one at a time):
1. What are the core business entities? (users, orders, products, etc.)
2. What are the key relationships between entities?
3. What are the most frequent read operations? (drives indexing)
4. What are the most frequent write operations? (drives normalization decisions)
5. What constraints must the data enforce? (uniqueness, referential integrity, valid values)

### Step 2: Identify Entities and Relationships

Produce an entity list:

```
Entities:
- User (one per account)
- Project (many per user)
- Task (many per project)
- Comment (many per task)
- Tag (many-to-many with tasks)
```

Map relationships:
- One-to-one: each user has one profile
- One-to-many: one project has many tasks
- Many-to-many: tasks can have multiple tags; tags can apply to multiple tasks

### Step 3: Define Each Table

For each entity, define:

```sql
-- Example: tasks table
CREATE TABLE tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
    status      TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
    priority    INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    due_date    TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by  UUID NOT NULL REFERENCES users(id)
);
```

For each column:
- Name and type
- Nullable or NOT NULL
- Default value (if any)
- Constraint (CHECK, UNIQUE, FK)
- Business rule the constraint enforces

### Step 4: Design Indexes

For each frequent query pattern, define the supporting index:

```sql
-- Most frequent queries on tasks:
-- 1. "all tasks in a project, sorted by priority" → (project_id, priority)
CREATE INDEX tasks_project_priority ON tasks(project_id, priority);

-- 2. "all overdue tasks for a user" → (created_by, due_date) WHERE status != 'done'
CREATE INDEX tasks_user_due ON tasks(created_by, due_date) WHERE status != 'done';
```

**Index rules:**
- Every FK should have an index
- Every `WHERE` column in frequent queries should be indexed
- Compound indexes: leading column is the one with highest cardinality in the filter
- Don't index every column — over-indexing slows writes

### Step 5: Enforce Business Rules

Identify business rules that belong in the database (not just the application):
- **Uniqueness**: "each user can only have one active subscription"
- **Valid state transitions**: if complex, use a CHECK constraint or trigger
- **Referential integrity**: all FKs with appropriate ON DELETE behavior (CASCADE, SET NULL, RESTRICT)
- **Audit fields**: `created_at`, `updated_at`, `deleted_at` on every entity table

### Step 6: Plan Migrations

For new schemas:
- One migration file per logical change
- Migration naming: `YYYYMMDDHHMMSS_description.sql`
- Each migration must be reversible (DOWN migration)

For changes to existing schemas:
- Never drop columns in the same migration that removes code using them
- Add columns as nullable first, backfill, then add NOT NULL constraint
- Rename columns in two phases: add new name, migrate, drop old name

### Step 7: Produce Schema Document

Save to `docs/ai-works/specs/YYYY-MM-DD-<context>-schema-design.md`.

Call `superpowers:writing-plans` to produce the implementation plan for the schema.

### Step 8: Declare Output

- If requirements are unclear (entities not defined, access patterns unknown) → output: `needs-clarification`
- If schema has 20+ tables or complex graph relationships → output: `schema-too-complex` → suggest breaking into phases
- Otherwise → output: `schema-designed`

## <BRANCH-POINT id="complexity-check">

After Step 2:
- If more than 15 entities or relationships are unclear: output = `needs-clarification` or `schema-too-complex`
- Otherwise: output = `schema-designed` — proceed to Step 3

</BRANCH-POINT>
