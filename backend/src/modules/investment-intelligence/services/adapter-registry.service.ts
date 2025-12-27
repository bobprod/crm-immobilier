/**
 * Adapter Registry Service
 * Manages all investment source adapters and routes requests
 */

import { Injectable, Logger } from '@nestjs/common';
import { BaseInvestmentSourceAdapter } from '../adapters/base-source.adapter';
import { BricksAdapter } from '../adapters/bricks.adapter';
import { HomunityAdapter } from '../adapters/homunity.adapter';
import { GenericAdapter } from '../adapters/generic.adapter';
import {
  PlatformDetectionResult,
  AdapterMetadata,
} from '../types/investment-project.types';

@Injectable()
export class AdapterRegistryService {
  private readonly logger = new Logger(AdapterRegistryService.name);
  private readonly adapters: BaseInvestmentSourceAdapter[] = [];

  constructor(
    private readonly bricksAdapter: BricksAdapter,
    private readonly homunityAdapter: HomunityAdapter,
    private readonly genericAdapter: GenericAdapter,
  ) {
    this.registerAdapters();
  }

  /**
   * Register all available adapters
   * Priority order matters: specific adapters before generic
   */
  private registerAdapters(): void {
    // Specific adapters (high priority)
    this.adapters.push(this.bricksAdapter);
    this.adapters.push(this.homunityAdapter);

    // TODO: Add more specific adapters as they are implemented
    // this.adapters.push(this.anaxagoAdapter);
    // this.adapters.push(this.fundimmoAdapter);
    // this.adapters.push(this.fundriseAdapter);
    // etc.

    // Generic adapter (lowest priority - fallback)
    this.adapters.push(this.genericAdapter);

    this.logger.log(`Registered ${this.adapters.length} adapters`);
  }

  /**
   * Detect which adapter can handle the given URL
   */
  detectPlatform(url: string): PlatformDetectionResult {
    this.logger.log(`Detecting platform for URL: ${url}`);

    for (const adapter of this.adapters) {
      const result = adapter.detect(url);
      if (result.detected) {
        this.logger.log(
          `Platform detected: ${result.source} (adapter: ${result.adapterName})`,
        );
        return result;
      }
    }

    // Fallback to generic
    this.logger.warn(`No specific adapter found for URL: ${url}, using generic`);
    return this.genericAdapter.detect(url);
  }

  /**
   * Get the appropriate adapter for a given URL
   */
  getAdapterForUrl(url: string): BaseInvestmentSourceAdapter {
    for (const adapter of this.adapters) {
      if (adapter.canHandle(url)) {
        this.logger.log(`Selected adapter: ${adapter.name} for URL: ${url}`);
        return adapter;
      }
    }

    // Fallback to generic
    this.logger.log(`Using generic adapter for URL: ${url}`);
    return this.genericAdapter;
  }

  /**
   * Get adapter by name
   */
  getAdapterByName(name: string): BaseInvestmentSourceAdapter | undefined {
    return this.adapters.find((a) => a.name === name);
  }

  /**
   * Get all registered adapters
   */
  getAllAdapters(): BaseInvestmentSourceAdapter[] {
    return [...this.adapters];
  }

  /**
   * Get metadata for all adapters
   */
  getAllAdapterMetadata(): AdapterMetadata[] {
    return this.adapters.map((a) => a.metadata);
  }

  /**
   * Get supported platforms count
   */
  getSupportedPlatformsCount(): number {
    return this.adapters.length;
  }

  /**
   * Check if a specific platform is supported
   */
  isPlatformSupported(url: string): boolean {
    const detection = this.detectPlatform(url);
    return detection.detected && detection.source !== 'other';
  }

  /**
   * Get adapter capabilities summary
   */
  getCapabilitiesSummary(): {
    totalAdapters: number;
    canImportFromUrl: number;
    canSearch: number;
    supportedCountries: string[];
  } {
    const capabilities = {
      totalAdapters: this.adapters.length,
      canImportFromUrl: 0,
      canSearch: 0,
      supportedCountries: new Set<string>(),
    };

    for (const adapter of this.adapters) {
      if (adapter.metadata.capabilities.canImportFromUrl) {
        capabilities.canImportFromUrl++;
      }
      if (adapter.metadata.capabilities.canSearch) {
        capabilities.canSearch++;
      }
      adapter.supportedCountries.forEach((country) =>
        capabilities.supportedCountries.add(country),
      );
    }

    return {
      ...capabilities,
      supportedCountries: Array.from(capabilities.supportedCountries),
    };
  }
}
