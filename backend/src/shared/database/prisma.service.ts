import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { createId } from '@paralleldrive/cuid2';

/**
 * PrismaService - Version avec pg direct (contourne le besoin des binaires Prisma)
 * Utilise le driver PostgreSQL natif pour les requêtes
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(PrismaService.name);

  // Proxy pour simuler l'API Prisma - Toutes les tables
  [key: string]: any; // Index signature pour accès dynamique

  // Mapping des noms de modèle Prisma vers les noms de table PostgreSQL
  private readonly tableNameMap: Record<string, string> = {
    llmConfig: 'llm_configs',
    mlConfig: 'ml_configs',
    // Tables LLM Router
    userLlmProvider: 'user_llm_providers',
    llmUsageLog: 'llm_usage_logs',
    providerPerformance: 'provider_performance',
    agencyApiKeys: 'agency_api_keys',
    globalSettings: 'global_settings',
    // Tables utilisateur
    user: 'users',
    users: 'users',
    ai_settings: 'ai_settings',
    // Tables AI/Billing
    aiPricing: 'ai_pricing',
    aiUsage: 'ai_usage',
    aiErrorLog: 'ai_error_log',
    aiCredits: 'ai_credits',
    userAiCredits: 'user_ai_credits',
    // Tables WhatsApp
    whatsAppConfig: 'whatsapp_configs',
    whatsAppConversation: 'whatsapp_conversations',
    whatsAppMessage: 'whatsapp_messages',
    whatsAppTemplate: 'whatsapp_templates',
    whatsAppContact: 'whatsapp_contacts',
    whatsAppCampaign: 'whatsapp_campaigns',
    whatsAppCampaignRecipient: 'whatsapp_campaign_recipients',
    // Tables Tracking (PascalCase = pas de @@map, donc nom direct)
    trackingEvent: 'TrackingEvent',
    trackingConfig: 'TrackingConfig',
    heatmapEvent: 'heatmap_events',
    trackingAbTest: 'tracking_ab_tests',
    // Tables Vitrine
    vitrineConfig: 'VitrineConfig',
    publishedProperty: 'PublishedProperty',
    vitrineAnalytics: 'VitrineAnalytics',
    propertySeo: 'PropertySeo',
    publicAgentProfile: 'PublicAgentProfile',
    publicLead: 'PublicLead',
    vitrineTemplate: 'VitrineTemplate',
    vitrinePage: 'VitrinePage',
    // Tables Provider
    providerConfig: 'provider_configs',
    providerUsageLog: 'provider_usage_logs',
    providerMetrics: 'provider_metrics',
    // Tables Investment
    investmentProject: 'investment_projects',
    investmentAnalysis: 'investment_analyses',
    investmentComparison: 'investment_comparisons',
    investmentAlert: 'investment_alerts',
    // Tables Intégrations
    userIntegration: 'user_integrations',
    syncLog: 'sync_logs',
    // Tables Business (Mandates, Owners, Transactions, Invoices)
    mandate: 'mandates',
    mandates: 'mandates',
    owner: 'owners',
    owners: 'owners',
    invoice: 'invoices',
    invoices: 'invoices',
    // Autres tables
    propertyTrackingStats: 'property_tracking_stats',
    activities: 'activities',
  };

  constructor() {
    // Désactiver SSL pour le développement local
    const isLocalDev =
      process.env.NODE_ENV === 'development' && process.env.DATABASE_URL?.includes('localhost');

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocalDev ? false : { rejectUnauthorized: false },
      // Connection pool settings to prevent crashes
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client can sit idle before being removed
      connectionTimeoutMillis: 5000, // How long to wait for a connection
    });

    // Handle pool errors to prevent crashes
    this.pool.on('error', (err) => {
      this.logger.error('Unexpected pool error:', err);
    });

    // Créer les proxies pour toutes les tables
    const tables = [
      'users',
      'user',
      'properties',
      'property',
      'prospects',
      'prospect',
      'appointments',
      'appointment',
      'tasks',
      'agencies',
      'documents',
      'interactions',
      'llmConfig',
      'ai_usage_metrics',
      'prospecting_campaigns',
      'prospecting_leads',
      'prospecting_matches',
      'conversion_events',
      'notifications',
      'notification',
      'settings',
      'communications',
      'matching',
      'matches',
      'campaign',
      'campaigns',
      'activity',
      'activities',
      'prospect_interactions',
      'prospect_preferences',
      'prospect_properties_shown',
      'prospect_timeline',
      'transaction',
      'transactions',
      // Tables additionnelles
      'ai_generations',
      'ai_settings',
      'analytics_events',
      'communication_templates',
      'contact_validations',
      'disposable_domains',
      'document_categories',
      'document_templates',
      'mlConfig',
      'ocr_results',
      'page',
      'pages',
      'propertySeo',
      'publishedProperty',
      'syncLog',
      'trackingConfig',
      'trackingEvent',
      'user_integrations',
      'validation_blacklist',
      'validation_whitelist',
      'vitrineAnalytics',
      'vitrineConfig',
      // Tables LLM Router et API Keys
      'userLlmProvider',
      'llmUsageLog',
      'providerPerformance',
      'agencyApiKeys',
      'globalSettings',
      // Tables AI/Billing
      'aiPricing',
      'aiUsage',
      'aiErrorLog',
      'aiCredits',
      'userAiCredits',
      // Tables WhatsApp
      'whatsAppConfig',
      'whatsAppConversation',
      'whatsAppMessage',
      'whatsAppTemplate',
      'whatsAppContact',
      'whatsAppCampaign',
      'whatsAppCampaignRecipient',
      // Tables Tracking
      'heatmapEvent',
      'trackingAbTest',
      // Tables Provider
      'providerConfig',
      'providerUsageLog',
      'providerMetrics',
      // Tables Investment
      'investmentProject',
      'investmentAnalysis',
      'investmentComparison',
      'investmentAlert',
      // Tables Intégrations
      'userIntegration',
      // Tables Business (Mandates, Owners, Transactions, Invoices)
      'mandate',
      'mandates',
      'owner',
      'owners',
      'invoice',
      'invoices',
      // Autres
      'propertyTrackingStats',
      // Tables Vitrine Publique
      'publicAgentProfile',
      'publicLead',
      'vitrineTemplate',
      'vitrinePage',
    ];

    tables.forEach((table) => {
      this[table] = this.createTableProxy(table);
    });
  }

  // Méthode $transaction pour les transactions
  async $transaction<T>(fn: (prisma: PrismaService) => Promise<T>): Promise<T> {
    return fn(this);
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      this.logger.log('Database connected successfully via pg driver');
      client.release();
    } catch (error) {
      this.logger.error('Database connection failed:', error);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  // Helper pour exécuter des requêtes SQL (supporte les template literals)
  async $queryRaw<T = any>(
    queryOrStrings: string | TemplateStringsArray,
    ...values: any[]
  ): Promise<T> {
    let query: string;
    let params: any[];

    if (typeof queryOrStrings === 'string') {
      query = queryOrStrings;
      params = values;
    } else {
      // Template literal - construire la query avec placeholders $1, $2, etc.
      query = (queryOrStrings as TemplateStringsArray).reduce(
        (acc: string, str: string, i: number) => {
          return acc + str + (i < values.length ? `$${i + 1}` : '');
        },
        '',
      );
      params = values;
    }

    const result = await this.pool.query(query, params);
    return result.rows as T;
  }

  async $executeRaw(
    queryOrStrings: string | TemplateStringsArray,
    ...values: any[]
  ): Promise<number> {
    let query: string;
    let params: any[];

    if (typeof queryOrStrings === 'string') {
      query = queryOrStrings;
      params = values;
    } else {
      query = (queryOrStrings as TemplateStringsArray).reduce(
        (acc: string, str: string, i: number) => {
          return acc + str + (i < values.length ? `$${i + 1}` : '');
        },
        '',
      );
      params = values;
    }

    const result = await this.pool.query(query, params);
    return result.rowCount || 0;
  }

  async $connect() {
    // Déjà connecté via le pool
  }

  async $disconnect() {
    await this.pool.end();
  }

  // Créer un proxy pour une table avec les méthodes Prisma-like
  private createTableProxy(tableName: string) {
    const self = this;
    // Utiliser le nom de table mappé si disponible, sinon utiliser le nom du modèle
    const actualTableName = self.tableNameMap[tableName] || tableName;

    return {
      findUnique: async (args: { where: any; select?: any; include?: any }) => {
        try {
          const whereClause = self.buildWhereClause(args.where);
          const query = `SELECT * FROM "${actualTableName}" WHERE ${whereClause} LIMIT 1`;
          self.logger.debug(`[${tableName}.findUnique] Query: ${query}`);
          const result = await self.pool.query(query);
          return result.rows[0] || null;
        } catch (error) {
          self.logger.error(`[${tableName}.findUnique] Error:`, error);
          throw error;
        }
      },

      findFirst: async (args?: { where?: any; orderBy?: any; select?: any }) => {
        let query = `SELECT * FROM "${actualTableName}"`;
        if (args?.where) {
          query += ` WHERE ${self.buildWhereClause(args.where)}`;
        }
        if (args?.orderBy) {
          query += ` ORDER BY ${self.buildOrderByClause(args.orderBy)}`;
        }
        query += ' LIMIT 1';
        const result = await self.pool.query(query);
        return result.rows[0] || null;
      },

      findMany: async (args?: {
        where?: any;
        orderBy?: any;
        take?: number;
        skip?: number;
        select?: any;
        include?: any;
      }) => {
        let query = `SELECT * FROM "${actualTableName}"`;
        if (args?.where) {
          query += ` WHERE ${self.buildWhereClause(args.where)}`;
        }
        if (args?.orderBy) {
          query += ` ORDER BY ${self.buildOrderByClause(args.orderBy)}`;
        }
        if (args?.take) {
          query += ` LIMIT ${args.take}`;
        }
        if (args?.skip) {
          query += ` OFFSET ${args.skip}`;
        }
        const result = await self.pool.query(query);
        return result.rows;
      },

      create: async (args: { data: any; select?: any }) => {
        // Auto-generate defaults if not provided (mimics Prisma @default())
        const now = new Date();
        const initialData = {
          id: args.data.id || createId(),
          createdAt: args.data.createdAt || now,
          updatedAt: args.data.updatedAt || now,
          ...args.data,
        };

        const finalData: any = {};
        for (const [key, value] of Object.entries(initialData)) {
          if (value !== null && typeof value === 'object' && 'connect' in (value as any)) {
            const valObj = value as any;
            if (valObj.connect.id) {
              finalData[`${key}Id`] = valObj.connect.id;
              continue;
            }
          }
          finalData[key] = value;
        }

        const keys = Object.keys(finalData);
        const values = Object.values(finalData);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.map((k) => `"${k}"`).join(', ');

        const query = `INSERT INTO "${actualTableName}" (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await self.pool.query(query, values);
        return result.rows[0];
      },

      update: async (args: { where: any; data: any; select?: any }) => {
        const setClauses: string[] = [];
        const values: any[] = [];
        let i = 1;

        // Auto-update updatedAt timestamp
        const data = { ...args.data };
        if (!data.updatedAt) data.updatedAt = new Date();

        for (const [key, value] of Object.entries(data)) {
          if (value !== null && typeof value === 'object') {
            const valObj = value as any;
            if ('increment' in valObj) {
              setClauses.push(`"${key}" = "${key}" + $${i++}`);
              values.push(valObj.increment);
              continue;
            }
            if ('decrement' in valObj) {
              setClauses.push(`"${key}" = "${key}" - $${i++}`);
              values.push(valObj.decrement);
              continue;
            }
            if ('connect' in valObj && valObj.connect.id) {
              // Guessing column name from relation name (common Prisma pattern)
              const colName = `${key}Id`;
              setClauses.push(`"${colName}" = $${i++}`);
              values.push(valObj.connect.id);
              continue;
            }
          }

          setClauses.push(`"${key}" = $${i++}`);
          values.push(value);
        }

        const whereClause = self.buildWhereClause(args.where);
        const query = `UPDATE "${actualTableName}" SET ${setClauses.join(', ')} WHERE ${whereClause} RETURNING *`;
        const result = await self.pool.query(query, values);
        return result.rows[0];
      },

      delete: async (args: { where: any }) => {
        const whereClause = self.buildWhereClause(args.where);
        const query = `DELETE FROM "${actualTableName}" WHERE ${whereClause} RETURNING *`;
        const result = await self.pool.query(query);
        return result.rows[0];
      },

      count: async (args?: { where?: any }) => {
        let query = `SELECT COUNT(*) as count FROM "${actualTableName}"`;
        if (args?.where) {
          query += ` WHERE ${self.buildWhereClause(args.where)}`;
        }
        const result = await self.pool.query(query);
        return parseInt(result.rows[0].count, 10);
      },

      aggregate: async (args: {
        where?: any;
        _sum?: any;
        _count?: any;
        _avg?: any;
        _min?: any;
        _max?: any;
      }) => {
        const aggregates: string[] = [];

        if (args._count) {
          aggregates.push('COUNT(*) as "_count"');
        }
        if (args._sum) {
          Object.keys(args._sum).forEach((field) => {
            if (args._sum[field]) aggregates.push(`SUM("${field}") as "sum_${field}"`);
          });
        }
        if (args._avg) {
          Object.keys(args._avg).forEach((field) => {
            if (args._avg[field]) aggregates.push(`AVG("${field}") as "avg_${field}"`);
          });
        }
        if (args._min) {
          Object.keys(args._min).forEach((field) => {
            if (args._min[field]) aggregates.push(`MIN("${field}") as "min_${field}"`);
          });
        }
        if (args._max) {
          Object.keys(args._max).forEach((field) => {
            if (args._max[field]) aggregates.push(`MAX("${field}") as "max_${field}"`);
          });
        }

        let query = `SELECT ${aggregates.length ? aggregates.join(', ') : 'COUNT(*) as "_count"'} FROM "${actualTableName}"`;
        if (args.where) {
          query += ` WHERE ${self.buildWhereClause(args.where)}`;
        }

        const result = await self.pool.query(query);
        const row = result.rows[0];

        return {
          _count: parseInt(row._count || '0', 10),
          _sum: args._sum
            ? Object.keys(args._sum).reduce(
              (acc, k) => ({ ...acc, [k]: parseFloat(row[`sum_${k}`]) || 0 }),
              {},
            )
            : null,
          _avg: args._avg
            ? Object.keys(args._avg).reduce(
              (acc, k) => ({ ...acc, [k]: parseFloat(row[`avg_${k}`]) || null }),
              {},
            )
            : null,
          _min: args._min
            ? Object.keys(args._min).reduce(
              (acc, k) => ({ ...acc, [k]: parseFloat(row[`min_${k}`]) || null }),
              {},
            )
            : null,
          _max: args._max
            ? Object.keys(args._max).reduce(
              (acc, k) => ({ ...acc, [k]: parseFloat(row[`max_${k}`]) || null }),
              {},
            )
            : null,
        };
      },

      groupBy: async (args: {
        by: string[];
        where?: any;
        orderBy?: any;
        take?: number;
        skip?: number;
        _sum?: any;
        _count?: any;
        _avg?: any;
        _min?: any;
        _max?: any;
      }) => {
        const selects: string[] = args.by.map((field) => `"${field}"`);
        const groupBys: string[] = args.by.map((field) => `"${field}"`);

        if (args._count) {
          if (typeof args._count === 'boolean') {
            selects.push('COUNT(*) as "_count"');
          } else {
            Object.keys(args._count).forEach((field) => {
              selects.push(`COUNT("${field}") as "count_${field}"`);
            });
          }
        }

        if (args._sum) {
          Object.keys(args._sum).forEach((field) => {
            selects.push(`SUM("${field}") as "sum_${field}"`);
          });
        }

        if (args._avg) {
          Object.keys(args._avg).forEach((field) => {
            selects.push(`AVG("${field}") as "avg_${field}"`);
          });
        }

        if (args._min) {
          Object.keys(args._min).forEach((field) => {
            selects.push(`MIN("${field}") as "min_${field}"`);
          });
        }

        if (args._max) {
          Object.keys(args._max).forEach((field) => {
            selects.push(`MAX("${field}") as "max_${field}"`);
          });
        }

        let query = `SELECT ${selects.join(', ')} FROM "${actualTableName}"`;

        if (args.where) {
          query += ` WHERE ${self.buildWhereClause(args.where)}`;
        }

        query += ` GROUP BY ${groupBys.join(', ')}`;

        if (args.orderBy) {
          query += ` ORDER BY ${self.buildOrderByClause(args.orderBy)}`;
        }

        if (args.take) {
          query += ` LIMIT ${args.take}`;
        }

        if (args.skip) {
          query += ` OFFSET ${args.skip}`;
        }

        const result = await self.pool.query(query);

        return result.rows.map((row) => {
          const item: any = {};
          args.by.forEach((field) => {
            item[field] = row[field];
          });

          if (args._count) {
            if (typeof args._count === 'boolean') {
              item._count = parseInt(row._count || '0', 10);
            } else {
              item._count = Object.keys(args._count).reduce(
                (acc, k) => ({
                  ...acc,
                  [k]: parseInt(row[`count_${k}`]) || 0,
                }),
                {},
              );
            }
          }

          if (args._sum) {
            item._sum = Object.keys(args._sum).reduce(
              (acc, k) => ({
                ...acc,
                [k]: parseFloat(row[`sum_${k}`]) || 0,
              }),
              {},
            );
          }

          if (args._avg) {
            item._avg = Object.keys(args._avg).reduce(
              (acc, k) => ({
                ...acc,
                [k]: parseFloat(row[`avg_${k}`]) || null,
              }),
              {},
            );
          }

          if (args._min) {
            item._min = Object.keys(args._min).reduce(
              (acc, k) => ({
                ...acc,
                [k]: row[`min_${k}`],
              }),
              {},
            );
          }

          if (args._max) {
            item._max = Object.keys(args._max).reduce(
              (acc, k) => ({
                ...acc,
                [k]: row[`max_${k}`],
              }),
              {},
            );
          }

          return item;
        });
      },

      upsert: async (args: { where: any; create: any; update: any }) => {
        const proxy = self.createTableProxy(tableName);
        const existing = await proxy.findUnique({ where: args.where });
        if (existing) {
          return proxy.update({ where: args.where, data: args.update });
        }
        return proxy.create({ data: args.create });
      },

      updateMany: async (args: { where?: any; data: any }) => {
        const setClauses: string[] = [];
        const values: any[] = [];
        let i = 1;

        // Auto-update updatedAt timestamp
        const data = { ...args.data };
        if (!data.updatedAt) data.updatedAt = new Date();

        for (const [key, value] of Object.entries(data)) {
          if (value !== null && typeof value === 'object') {
            const valObj = value as any;
            if ('increment' in valObj) {
              setClauses.push(`"${key}" = "${key}" + $${i++}`);
              values.push(valObj.increment);
              continue;
            }
            if ('decrement' in valObj) {
              setClauses.push(`"${key}" = "${key}" - $${i++}`);
              values.push(valObj.decrement);
              continue;
            }
          }

          setClauses.push(`"${key}" = $${i++}`);
          values.push(value);
        }

        let query = `UPDATE "${actualTableName}" SET ${setClauses.join(', ')}`;
        if (args.where) {
          query += ` WHERE ${self.buildWhereClause(args.where)}`;
        }

        const result = await self.pool.query(query, values);
        return { count: result.rowCount || 0 };
      },

      deleteMany: async (args?: { where?: any }) => {
        let query = `DELETE FROM "${actualTableName}"`;
        if (args?.where) {
          query += ` WHERE ${self.buildWhereClause(args.where)}`;
        }
        const result = await self.pool.query(query);
        return { count: result.rowCount || 0 };
      },
    };
  }

  private buildWhereClause(where: any): string {
    const conditions: string[] = [];

    // Helper pour formatter les valeurs correctement (spécialement les Dates)
    const formatValue = (val: any): string => {
      if (val instanceof Date) {
        return val.toISOString(); // Convertir Date en format ISO-8601 pour PostgreSQL
      }
      if (typeof val === 'string' && !isNaN(Date.parse(val))) {
        // Check if it looks like a date string
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        if (dateRegex.test(val)) {
          return val;
        }
      }
      return String(val);
    };

    // Mapping des clés composites vers leurs colonnes réelles
    const compositeKeyMap: Record<string, string[]> = {
      userId_provider: ['userId', 'provider'],
      userId_agencyId: ['userId', 'agencyId'],
    };

    // Check if a value looks like a Prisma operator object
    const isPrismaOperator = (obj: any): boolean => {
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
      const keys = Object.keys(obj);
      const operatorKeys = [
        'gte',
        'lte',
        'gt',
        'lt',
        'contains',
        'startsWith',
        'endsWith',
        'equals',
        'not',
        'in',
        'notIn',
      ];
      return keys.some((k) => operatorKeys.includes(k));
    };

    for (const [key, value] of Object.entries(where)) {
      // Handle composite keys like userId_provider
      if (compositeKeyMap[key] && typeof value === 'object' && value !== null) {
        const columns = compositeKeyMap[key];
        for (const col of columns) {
          if ((value as any)[col] !== undefined) {
            conditions.push(`"${col}" = '${formatValue((value as any)[col])}'`);
          }
        }
        continue;
      }

      // Handle Prisma's OR operator
      if (key === 'OR' && Array.isArray(value)) {
        const orConditions = value.map((condition) => `(${this.buildWhereClause(condition)})`);
        if (orConditions.length > 0) {
          conditions.push(`(${orConditions.join(' OR ')})`);
        }
        continue;
      }

      // Handle Prisma's AND operator
      if (key === 'AND' && Array.isArray(value)) {
        const andConditions = value.map((condition) => `(${this.buildWhereClause(condition)})`);
        if (andConditions.length > 0) {
          conditions.push(`(${andConditions.join(' AND ')})`);
        }
        continue;
      }

      // Handle Prisma's NOT operator
      if (key === 'NOT') {
        if (Array.isArray(value)) {
          const notConditions = value.map(
            (condition) => `NOT (${this.buildWhereClause(condition)})`,
          );
          conditions.push(notConditions.join(' AND '));
        } else {
          conditions.push(`NOT (${this.buildWhereClause(value)})`);
        }
        continue;
      }

      if (value === null) {
        conditions.push(`"${key}" IS NULL`);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Check if this is an operator object or a nested query
        if (isPrismaOperator(value)) {
          // Handle operators like { gte: x, lte: y }
          for (const [op, val] of Object.entries(value as object)) {
            const formattedVal = formatValue(val);
            switch (op) {
              case 'gte':
                conditions.push(`"${key}" >= '${formattedVal}'`);
                break;
              case 'lte':
                conditions.push(`"${key}" <= '${formattedVal}'`);
                break;
              case 'gt':
                conditions.push(`"${key}" > '${formattedVal}'`);
                break;
              case 'lt':
                conditions.push(`"${key}" < '${formattedVal}'`);
                break;
              case 'contains':
                conditions.push(`"${key}" ILIKE '%${formattedVal}%'`);
                break;
              case 'startsWith':
                conditions.push(`"${key}" ILIKE '${formattedVal}%'`);
                break;
              case 'endsWith':
                conditions.push(`"${key}" ILIKE '%${formattedVal}'`);
                break;
              case 'equals':
                conditions.push(`"${key}" = '${formattedVal}'`);
                break;
              case 'not':
                if (val === null) {
                  conditions.push(`"${key}" IS NOT NULL`);
                } else {
                  conditions.push(`"${key}" != '${formattedVal}'`);
                }
                break;
              case 'in':
                conditions.push(
                  `"${key}" IN (${(val as any[]).map((v) => `'${formatValue(v)}'`).join(', ')})`,
                );
                break;
              case 'notIn':
                conditions.push(
                  `"${key}" NOT IN (${(val as any[]).map((v) => `'${formatValue(v)}'`).join(', ')})`,
                );
                break;
              default:
                // Unknown operator - treat as equality
                conditions.push(`"${key}" = '${formattedVal}'`);
            }
          }
        } else {
          // Nested object - could be a relation query or other structure, skip for now
          this.logger.warn(`Skipping unsupported nested object for key "${key}":`, value);
        }
      } else if (Array.isArray(value)) {
        // Array value without operator - use IN clause
        conditions.push(`"${key}" IN (${value.map((v) => `'${formatValue(v)}'`).join(', ')})`);
      } else {
        conditions.push(`"${key}" = '${formatValue(value)}'`);
      }
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  }

  private buildOrderByClause(orderBy: any): string {
    if (Array.isArray(orderBy)) {
      return orderBy
        .map((o) => {
          const [key, dir] = Object.entries(o)[0];
          return `"${key}" ${(dir as string).toUpperCase()}`;
        })
        .join(', ');
    }

    const [key, dir] = Object.entries(orderBy)[0];
    return `"${key}" ${(dir as string).toUpperCase()}`;
  }
}
