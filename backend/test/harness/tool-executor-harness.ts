import 'ts-node/register';
import { ToolExecutorService } from '../../src/modules/intelligence/ai-orchestrator/services/tool-executor.service';

// Minimal mocks
const mockLlm = { generate: async (p: any) => ({ text: 'ok' }) };
const mockSerp = {};
const mockFirecrawl = {};

function makeMockWebData(behavior: 'fallback-success' | 'all-fail') {
    return {
        fetchHtml: jestFn(async (url: string, options: any) => {
            if (behavior === 'all-fail') throw new Error('fetch failed');
            // simulate firecrawl failing
            if (options?.provider === 'firecrawl') throw new Error('firecrawl error');
            return { provider: options?.provider || 'puppeteer', url, text: 'ok', html: '<p>ok</p>' };
        }),
        fetchMultipleUrls: jestFn(async (urls: string[], options: any) => {
            if (behavior === 'all-fail') throw new Error('fetch failed');
            return urls.map((u) => ({ provider: options?.provider || 'puppeteer', url: u, text: 'ok' }));
        }),
    } as any;
}

function makeMockProviderSelector() {
    return {
        selectOptimalStrategy: async (uid: string, aid?: string) => ({
            search: [],
            scrape: ['puppeteer', 'cheerio'],
            enrichment: [],
            analysis: ['llm'],
        }),
    } as any;
}

function jestFn(fn: Function) {
    // tiny shim replacing jest.fn()
    const f: any = async (...args: any[]) => fn(...args);
    f.mockImplementation = (impl: Function) => { return impl; };
    return f;
}

async function runScenario(name: string, behavior: 'fallback-success' | 'all-fail') {
    console.log('---', name, '---');

    const webData = makeMockWebData(behavior);
    const providerSelector = makeMockProviderSelector();

    const executor = new ToolExecutorService(
        mockLlm as any,
        mockSerp as any,
        mockFirecrawl as any,
        webData,
        providerSelector,
    );

    const toolCall = {
        id: 'tc-harness',
        tool: 'firecrawl',
        action: 'scrape',
        params: { url: 'https://example.com', tenantId: 't1' },
        metadata: {},
    } as any;

    try {
        const result = await executor.executeToolCall(toolCall, new Map());
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('Unhandled error:', err?.message || err);
    }
}

async function main() {
    await runScenario('Retry should succeed (firecrawl -> puppeteer)', 'fallback-success');
    await runScenario('All providers fail', 'all-fail');
}

main().catch((e) => { console.error(e); process.exit(1); });
