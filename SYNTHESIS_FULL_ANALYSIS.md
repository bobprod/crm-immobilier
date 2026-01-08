# SYNTHESIS: Full analysis (backend, frontend, DB, docs)

Generated: 2026-01-08T00:00:00Z

## Executive summary

- Status: system partially implemented. Critical multi-provider orchestration gap found: `ProviderSelectorService` exists but is not used by the prospection pipeline.
- Impact: Hardcoded tool usage (SerpAPI / Firecrawl) causes full failures when a key provider is missing; no fallback in current orchestrator.
- Goal: Make orchestration dynamic, resilient and aligned with frontend provider preferences.

## Components scanned

- Backend: `backend/src/modules/intelligence/ai-orchestrator/*`, `backend/src/modules/scraping/*`, `backend/src/modules/prospecting-ai/*`
- Frontend: `frontend/src/pages/settings/provider-strategy.tsx`, `frontend/src/components/ProspectionProviderSelector.tsx`
- DB: `backend/prisma/schema.prisma`
- Docs: `MODULES_SYNCHRONIZATION_ANALYSIS.md`, `SYNCHRONIZATION_VISUAL.md`, `ACTION_PLAN_SYNC_MODULES.md`, `FRONTEND_BACKEND_SYNC_COMPLETE.md`, `ANALYSIS_AUTOGEN.md`

## What works (short)

- Prospection entrypoint: `ProspectionService` implemented and calls `AiOrchestratorService`.
- AI orchestration flow exists (Intent → Plan → Execute → Synthesize).
- `WebDataService` contains robust fallback logic (Firecrawl → Cheerio → Puppeteer).
- `ProviderSelectorService` implemented and exported by module; it correctly queries API keys and returns strategies.
- LLM integration and extraction flows are implemented and stable.
- Frontend provider selection UI implemented and posts preferences to backend endpoints.

## What does not work / risks (short)

- `ProviderSelectorService` is not invoked in `IntentAnalyzerService`, `ExecutionPlannerService`, or `ToolExecutorService` — service is a "zombie".
- `IntentAnalyzerService` returns hardcoded `requiredTools = ['serpapi','firecrawl','llm']`.
- `ExecutionPlannerService` builds hardcoded `ToolCall`s with `tool: 'serpapi'` and `tool: 'firecrawl'`.
- `ToolExecutorService` calls `FirecrawlService` directly instead of `WebDataService`, bypassing fallback. Missing handlers for `puppeteer` and `cheerio`.
- No replanning/retry on tool failure (single provider failure aborts orchestration).
- Frontend provider preferences are saved but the orchestrator doesn't consume them yet.

## DB notes

- `prisma/schema.prisma` is large and contains models for agencies, api keys, ai credits/usages, prospects, etc.
- Provider preferences currently appear to be handled at API-level (controllers + DTOs exist). Persistence of preferences into DB may be incomplete — verify `ProviderPreferences` model or controller implementations.

## Root causes

1. Architectural gap: Provider selection was designed but not wired into orchestration services.
2. Technical debt: Hardcoded tool names in planner & analyzer.
3. Inconsistent usage: Scraping calls bypass central `WebDataService`.

## Recommended fixes (concrete, in-priority order)

1) ExecutionPlannerService — CRITICAL (file: `backend/src/modules/intelligence/ai-orchestrator/services/execution-planner.service.ts`)
   - Make planner async and call `providerSelector.selectOptimalStrategy(userId, agencyId)`.
   - Replace hardcoded `tool` strings with `strategy.search[0]` and `strategy.scrape[0]`.

2) IntentAnalyzerService — HIGH (file: `backend/src/modules/intelligence/ai-orchestrator/services/intent-analyzer.service.ts`)
   - Use `providerSelector.getAvailableTools(userId, agencyId)` to populate `requiredTools` dynamically.

3) ToolExecutorService — HIGH (file: `backend/src/modules/intelligence/ai-orchestrator/services/tool-executor.service.ts`)
   - Inject `WebDataService` and route all scraping to it (e.g., `fetchHtml`, `fetchMultipleUrls`) so existing fallback logic is used.
   - Add cases for `puppeteer` and `cheerio` that delegate to `WebDataService` with provider override.
   - On tool failure, consult `ProviderSelectorService` for alternate provider and retry (simple backoff + one replanning).

4) ProspectionService / Controller — MEDIUM
   - Ensure user/agency context (userId, agencyId) is passed into orchestrator so ProviderSelector can consider BYOK keys and agency-wide subscriptions.

5) Frontend — LOW
   - Confirm provider preference endpoints are persisted and that API returns the active strategy when requested by UI.

6) Tests — REQUIRED
   - Add unit tests for `ProviderSelectorService` to simulate missing keys.
   - Add E2E tests for prospection: (a) all providers available, (b) serpapi missing, (c) firecrawl missing, (d) only built-ins.

## Minimal code changes (patch sketch)

- In `ExecutionPlannerService`: add `private readonly providerSelector: ProviderSelectorService` to constructor, make `planProspection` async and call `selectOptimalStrategy`. Replace `tool: 'serpapi'` → `tool: strategy.search[0]` and `tool: 'firecrawl'` → `tool: strategy.scrape[0]`.
- In `IntentAnalyzerService`: add `providerSelector` injection and use `await this.providerSelector.getAvailableTools(userId, agencyId)` to build `requiredTools`.
- In `ToolExecutorService`: add `webDataService` injection; update `executeFirecrawl()` to call `webDataService.fetchMultipleUrls()`; add `executePuppeteer()` and `executeCheerio()` delegating to `webDataService`.

## Tests & verification steps

1. Run backend build: in `backend/` run:

```bash
npm run build
```

2. Unit tests (if present) and custom tests:

```bash
cd backend
node test/test-provider-selection.js   # existing helper
```

3. E2E scenarios to run manually or via test harness:
   - SerpAPI + Firecrawl present → expect search: serpapi, scrape: firecrawl
   - SerpAPI absent, Firecrawl present → expect search fallback to internal / firecrawl or other search (depending on strategy)
   - Firecrawl absent → expect scrape fallback to puppeteer/cheerio
   - No external providers → expect built-ins used and slower scraping

## Automation added

- `tools/analyze-repo.js` — generates `ANALYSIS_AUTOGEN.md` (top-level list of MD files and snippets). Run manually or via VS Code task.
- `.vscode/tasks.json` — runs analysis on folder open (`runOn: folderOpen`).

## Timeline estimate (implementation)

- ExecutionPlanner + IntentAnalyzer + ToolExecutor changes + compile: 1.5–2 hrs
- Add puppeteer/cheerio tests and retries: 1 hr
- E2E tests and fixes: 1 hr
- Total: ~3.5–4 hrs for full integration and basic tests

## Next steps I can take (pick one)

1) I implement the code changes now (ExecutionPlanner → ToolExecutor → IntentAnalyzer), run `npm run build`, and fix TypeScript errors. (I can proceed ⇢ estimate 2 hours.)

2) I generate a prioritized PR diff with all changes ready for review (no build). (Faster: ~45–60 min.)

3) You review this synthesis, I then implement after your confirmation.

---

Files referenced (key):
- `backend/src/modules/intelligence/ai-orchestrator/services/provider-selector.service.ts`
- `backend/src/modules/intelligence/ai-orchestrator/services/execution-planner.service.ts`
- `backend/src/modules/intelligence/ai-orchestrator/services/intent-analyzer.service.ts`
- `backend/src/modules/intelligence/ai-orchestrator/services/tool-executor.service.ts`
- `backend/src/modules/scraping/services/web-data.service.ts`
- `frontend/src/components/ProspectionProviderSelector.tsx`
- `frontend/src/pages/settings/provider-strategy.tsx`

If you want, I will now implement the changes (option 1). Confirm and I will patch `execution-planner.service.ts` first and run a backend build.
