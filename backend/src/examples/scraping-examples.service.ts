/**
 * Exemples d'Utilisation du Pipeline Scraping + IA
 * 
 * Ce fichier contient des exemples concrets d'utilisation
 * du WebDataService avec l'AI Orchestrator / LLM Router
 * 
 * NOTE: Ce fichier est fourni à titre d'exemple uniquement.
 * Il n'est pas utilisé dans l'application et ne sera pas compilé.
 */

// Les imports sont commentés car ce fichier est un exemple
// import { Injectable, Logger } from '@nestjs/common';
// import { WebDataService } from '../modules/scraping/services/web-data.service';
// import { LLMProspectingService } from '../modules/prospecting/llm-prospecting.service';
// import { ProspectingIntegrationService } from '../modules/prospecting/prospecting-integration.service';
// import { RawScrapedItem } from '../modules/prospecting/dto';

/**
 * EXEMPLE 1: Scraping Simple avec Cheerio
 * Cas d'usage: Extraire rapidement les contacts d'un site simple
 */
async function example1_SimpleScrapingWithCheerio() {
  // const result = await webDataService.fetchHtml(url, {
  //   provider: 'cheerio',
  //   forceProvider: true,
  // });
  
  // Voir backend/src/modules/scraping/README.md pour plus de détails
}

/**
 * EXEMPLE 2: Scraping avec JavaScript (Puppeteer)
 * Cas d'usage: Sites avec contenu dynamique chargé en JavaScript
 */
async function example2_ScrapingWithPuppeteer() {
  // const result = await webDataService.fetchHtml(url, {
  //   provider: 'puppeteer',
  //   waitFor: 3000,
  //   screenshot: true,
  // });
}

/**
 * EXEMPLE 3: Extraction Structurée avec IA (Firecrawl)
 * Cas d'usage: Extraire des données structurées complexes
 */
async function example3_AIExtractionWithFirecrawl() {
  // const result = await webDataService.extractStructuredData(
  //   url,
  //   `Extraire les informations immobilières...`,
  //   userId
  // );
}

/**
 * EXEMPLE 4: Pipeline Complet - Scraping + Analyse LLM
 * Cas d'usage: Trouver des leads immobiliers et les analyser avec IA
 */
async function example4_CompleteScrapingAndLLMPipeline() {
  // 1. Scraping
  // const scrapedData = await webDataService.fetchMultipleUrls(urls);
  
  // 2. Conversion en RawScrapedItem
  // const rawItems = scrapedData.map(data => ({ ... }));
  
  // 3. Analyse LLM
  // const analyzedLeads = await llmProspectingService
  //   .buildProspectingLeadsFromRawBatch(rawItems);
  
  // 4. Insertion dans la base
  // const result = await prospectingIntegrationService
  //   .ingestScrapedItems(userId, campaignId, rawItems);
}

// Pour voir les exemples complets, consulter:
// - backend/src/modules/scraping/README.md
// - INTEGRATION_WEBDATA_AI_ORCHESTRATOR.md
