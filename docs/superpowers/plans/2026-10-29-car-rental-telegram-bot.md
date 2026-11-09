# Car Rental Telegram Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable internal Telegram bot that records clients, vehicles, rentals and deposits, reads RPM Club profiles, and sends scheduled reports.

**Architecture:** A TypeScript service receives Telegram updates, invokes a testable domain/application layer, and persists data in its own PostgreSQL database through Prisma. A separate RPM Club adapter reads only `integration.v_members`; scheduled jobs and form state are persistent and idempotent.

**Tech Stack:** Node.js 22, TypeScript, grammY, Prisma/PostgreSQL 17, Zod, Vitest, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-10-29-car-rental-telegram-bot-design.md`

## Global Constraints

- All configured Telegram users are administrators; every other user is denied and audited.
- No payments, transfers, acquiring, client notifications, RPM Club writes, or action «+1».
- RPM Club access is read-only through `integration.v_members` and uses `user_id` UUID as the external key.
- Secrets are environment variables and never committed.
- The summary runs at 10:00 and 22:00 in `TIMEZONE`; without `SUMMARY_CHAT_ID`, sending is disabled.
- Data and forms must survive restart; duplicate Telegram updates and scheduled jobs must not duplicate effects.

## Review Focus

- Invalid/changed `TIMEZONE` must disable scheduled sending and leave an actionable error, tested in Task 7.
- A Telegram retry with the same update ID must not create a second domain record, tested in Task 5.
- A booking ending exactly as another begins must be handled consistently as a non-overlap, tested in Task 3.
- Untrusted client text must not be interpreted as a command or unsafe Telegram markup, tested in Task 6.
- RPM Club timeout/error must not block local card and rental operations, tested in Task 4.

### Task 1: Service skeleton and deployable configuration

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.env.example`
- Create: `src/config.ts`, `src/main.ts`, `src/health.ts`
- Create: `Dockerfile`, `compose.yaml`, `README.md`
- Test: `tests/config.test.ts`, `tests/health.test.ts`

**Interfaces:**
- Produces: `loadConfig(env: NodeJS.ProcessEnv): AppConfig`; `createHealthServer(): FastifyInstance`.

- [ ] Write configuration tests for required bot/database settings, invalid time zone, optional RPM Club URL and absent summary chat.
- [ ] Run `npm test -- tests/config.test.ts` and verify failure.
- [ ] Implement `AppConfig` parsing with Zod and `/health` returning `{ status: "ok" }`.
- [ ] Add Docker Compose with isolated bot PostgreSQL and documented commands for development, migration, test and production launch.
- [ ] Run `npm test -- tests/config.test.ts tests/health.test.ts` and `npm run build`; verify both pass.

### Task 2: Database schema, migrations and repositories

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`
- Create: `src/db/client.ts`, `src/db/repositories/*.ts`
- Test: `tests/repositories.test.ts`

**Interfaces:**
- Produces: `ClientRepository`, `VehicleRepository`, `RentalRepository`, `DepositRepository`, `AuditRepository`, `JobRepository`, `FormStateRepository`, `ProcessedUpdateRepository`.

- [ ] Write repository integration tests for audit events, persistent form state, unique processed update IDs and duplicate deposit-return prevention.
- [ ] Run `npm test -- tests/repositories.test.ts` and verify failure.
- [ ] Add Prisma entities for the spec’s users, clients, client identifiers, vehicles, rentals, deposits, inspections, club profiles, audit events, jobs and form state, with decimal money and UTC timestamps.
- [ ] Implement repositories with transactions for state-changing operations and migrations/seed data for lead sources.
- [ ] Run migrations against Compose PostgreSQL and `npm test -- tests/repositories.test.ts`; verify pass.

### Task 3: Rental and deposit domain rules

**Files:**
- Create: `src/domain/types.ts`, `src/domain/rentals.ts`, `src/domain/deposits.ts`, `src/domain/clients.ts`
- Test: `tests/domain/rentals.test.ts`, `tests/domain/deposits.test.ts`, `tests/domain/clients.test.ts`

**Interfaces:**
- Consumes: repository transaction interfaces from Task 2.
- Produces: `createRental(input): Result<Rental, DomainError>`, `activateRental(id)`, `extendRental(id, expectedReturnAt)`, `completeRental(input)`, `markDepositReturned(id)`.

- [ ] Write failing tests for invalid dates, inclusive/exclusive vehicle-period conflict, forbidden status transitions, mandatory damage comment, first-rental client activation, 14-calendar-day deposit due date and double return rejection.
- [ ] Run `npm test -- tests/domain` and verify failure.
- [ ] Implement explicit rental/deposit transitions and conflict detection. Treat matching end/start instants as non-overlapping; block overlap for `booked` and `active` rentals.
- [ ] Add audit entries to every mutation and create a deposit task on completion.
- [ ] Run `npm test -- tests/domain`; verify pass.

### Task 4: RPM Club read-only adapter and client lookup

**Files:**
- Create: `src/rpm-club/client.ts`, `src/rpm-club/types.ts`, `src/services/client-lookup.ts`
- Test: `tests/rpm-club/client.test.ts`, `tests/services/client-lookup.test.ts`

**Interfaces:**
- Produces: `RpmClubClient.search(query): Promise<RpmMember[]>`; `RpmClubClient.getByUserId(userId): Promise<RpmMember | null>`; `ClientLookupService.find(query)`.

- [ ] Write failing tests for parameterized queries limited to `integration.v_members`, timeout degradation and multiple-match result requiring confirmation.
- [ ] Run `npm test -- tests/rpm-club tests/services/client-lookup.test.ts` and verify failure.
- [ ] Implement a read-only PostgreSQL pool with a short timeout and map the documented eight RPM Club fields.
- [ ] Persist only confirmed mappings and last successful status snapshot; return local results when RPM Club is unavailable.
- [ ] Run related tests and `npm run typecheck`; verify pass.

### Task 5: Application services and idempotent update handling

**Files:**
- Create: `src/services/rental-service.ts`, `src/services/deposit-service.ts`, `src/services/update-service.ts`
- Test: `tests/services/rental-service.test.ts`, `tests/services/update-service.test.ts`

**Interfaces:**
- Consumes: domain services, repositories and `RpmClubClient`.
- Produces: `UpdateService.process(updateId: number, action: () => Promise<void>): Promise<boolean>`.

- [ ] Write failing tests for the A2–A9 lifecycle, duplicate update IDs and local operations while RPM Club is down.
- [ ] Run `npm test -- tests/services` and verify failure.
- [ ] Implement application orchestration, transaction boundaries, audit attribution and processed-update idempotency.
- [ ] Run `npm test -- tests/services`; verify pass.

### Task 6: Telegram interface and persistent forms

**Files:**
- Create: `src/telegram/bot.ts`, `src/telegram/authorization.ts`, `src/telegram/forms.ts`, `src/telegram/format.ts`, `src/telegram/commands/*.ts`
- Test: `tests/telegram/authorization.test.ts`, `tests/telegram/forms.test.ts`, `tests/telegram/format.test.ts`

**Interfaces:**
- Consumes: `UpdateService`, repositories and `AppConfig`.
- Produces: `createBot(deps): Bot`; commands `/start`, `/new`, `/find`, `/rentals`, `/deposits`, `/summary`, `/help`, `/cancel`.

- [ ] Write failing tests for unknown-user denial/audit (A1), saved form recovery (A3/A11), safe rendering of untrusted text (A12), confirmation before critical actions and non-command forwarded text.
- [ ] Run `npm test -- tests/telegram` and verify failure.
- [ ] Implement administrator middleware, command router, callback actions, persisted step-by-step rental form, validation/error recovery and card formatting.
- [ ] Wire Telegram update IDs through `UpdateService.process`.
- [ ] Run `npm test -- tests/telegram`; verify pass.

### Task 7: Scheduled reports and deposit reminders

**Files:**
- Create: `src/reports/summary.ts`, `src/jobs/scheduler.ts`, `src/jobs/runner.ts`
- Test: `tests/reports/summary.test.ts`, `tests/jobs/scheduler.test.ts`

**Interfaces:**
- Produces: `buildSummary(at: Date): SummaryMessage[]`; `scheduleDueJobs(now: Date): Promise<void>`; `runJob(jobId): Promise<void>`.

- [ ] Write failing tests for four summary sections, empty sections, long-message splitting, 10:00/22:00 once-only scheduling, absent chat ID, invalid zone, retry and deposit-due reminder.
- [ ] Run `npm test -- tests/reports tests/jobs` and verify failure.
- [ ] Implement summary queries/rendering, persistent idempotency keys, bounded retry and internal-chat-only notification with a card link.
- [ ] Run `npm test -- tests/reports tests/jobs`; verify pass.

### Task 8: End-to-end acceptance and operations documentation

**Files:**
- Create: `tests/acceptance/a1-a15.test.ts`, `docs/ACCEPTANCE.md`, `docs/DEPLOYMENT.md`
- Modify: `README.md`, `.env.example`

**Interfaces:**
- Consumes: fully wired app from Tasks 1–7.
- Produces: documented, repeatable acceptance commands and deployment checklist.

- [ ] Write acceptance tests mapping A1–A15 to fixtures and adapters, explicitly marking RPM Club’s test database requirement.
- [ ] Run `npm test -- tests/acceptance` and verify failure.
- [ ] Wire application composition in `src/main.ts`, provide migration/backup/restore guidance, create least-privilege RPM Club SQL request and document secret configuration.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `docker compose config`; verify pass.

## Self-review

- Spec coverage: Tasks 2–7 cover entities, workflows, authorisation, RPM Club, summaries, restart recovery and observability; Task 8 maps every stated acceptance scenario.
- Type consistency: repositories are the persistence boundary; domain services return typed `Result`; Telegram consumes application services only.
- Review focus: every listed failure mode is assigned to Tasks 3–7.
- Proportion: tasks split setup, persistence, rules, integration, interface, jobs and acceptance into independently verifiable units.
