import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);
    private readonly counters: Map<string, number> = new Map();

    increment(key: string, value = 1) {
        const prev = this.counters.get(key) || 0;
        this.counters.set(key, prev + value);
        this.logger.debug(`metric ${key} incremented -> ${prev + value}`);
    }

    get(key: string) {
        return this.counters.get(key) || 0;
    }

    getAll() {
        return Object.fromEntries(this.counters.entries());
    }
}
