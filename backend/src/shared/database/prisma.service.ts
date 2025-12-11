import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';

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

  constructor() {
    // Désactiver SSL pour le développement local
    const isLocalDev = process.env.NODE_ENV === 'development' &&
                      process.env.DATABASE_URL?.includes('localhost');

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocalDev ? false : { rejectUnauthorized: false },
    });

    // Créer les proxies pour toutes les tables
    const tables = [
      'users', 'user', 'properties', 'property', 'prospects', 'prospect',
      'appointments', 'appointment', 'tasks', 'agencies', 'documents',
      'interactions', 'llmConfig', 'ai_usage_metrics', 'prospecting_campaigns',
      'prospecting_leads', 'prospecting_matches', 'conversion_events',
      'notifications', 'notification', 'settings', 'communications',
      'matching', 'matches', 'campaign', 'campaigns', 'activity', 'activities',
      'prospect_interactions', 'prospect_preferences', 'prospect_properties_shown',
      'prospect_timeline', 'transaction', 'transactions',
      // Tables additionnelles
      'ai_generations', 'ai_settings', 'analytics_events', 'communication_templates',
      'contact_validations', 'disposable_domains', 'document_categories',
      'document_templates', 'mlConfig', 'ocr_results', 'page', 'pages',
      'propertySeo', 'publishedProperty', 'syncLog', 'trackingConfig',
      'trackingEvent', 'user_integrations', 'validation_blacklist',
      'validation_whitelist', 'vitrineAnalytics', 'vitrineConfig',
    ];

    tables.forEach(table => {
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
      query = (queryOrStrings as TemplateStringsArray).reduce((acc: string, str: string, i: number) => {
        return acc + str + (i < values.length ? `$${i + 1}` : '');
      }, '');
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
      query = (queryOrStrings as TemplateStringsArray).reduce((acc: string, str: string, i: number) => {
        return acc + str + (i < values.length ? `$${i + 1}` : '');
      }, '');
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
    return {
      findUnique: async (args: { where: any; select?: any; include?: any }) => {
        try {
          const whereClause = self.buildWhereClause(args.where);
          const query = `SELECT * FROM "${tableName}" WHERE ${whereClause} LIMIT 1`;
          self.logger.debug(`[${tableName}.findUnique] Query: ${query}`);
          const result = await self.pool.query(query);
          return result.rows[0] || null;
        } catch (error) {
          self.logger.error(`[${tableName}.findUnique] Error:`, error);
          throw error;
        }
      },

      findFirst: async (args?: { where?: any; orderBy?: any; select?: any }) => {
        let query = `SELECT * FROM "${tableName}"`;
        if (args?.where) {
          query += ` WHERE ${this.buildWhereClause(args.where)}`;
        }
        if (args?.orderBy) {
          query += ` ORDER BY ${this.buildOrderByClause(args.orderBy)}`;
        }
        query += ' LIMIT 1';
        const result = await this.pool.query(query);
        return result.rows[0] || null;
      },

      findMany: async (args?: { where?: any; orderBy?: any; take?: number; skip?: number; select?: any; include?: any }) => {
        let query = `SELECT * FROM "${tableName}"`;
        if (args?.where) {
          query += ` WHERE ${this.buildWhereClause(args.where)}`;
        }
        if (args?.orderBy) {
          query += ` ORDER BY ${this.buildOrderByClause(args.orderBy)}`;
        }
        if (args?.take) {
          query += ` LIMIT ${args.take}`;
        }
        if (args?.skip) {
          query += ` OFFSET ${args.skip}`;
        }
        const result = await this.pool.query(query);
        return result.rows;
      },

      create: async (args: { data: any; select?: any }) => {
        const keys = Object.keys(args.data);
        const values = Object.values(args.data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.map(k => `"${k}"`).join(', ');

        const query = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await this.pool.query(query, values);
        return result.rows[0];
      },

      update: async (args: { where: any; data: any; select?: any }) => {
        const keys = Object.keys(args.data);
        const values = Object.values(args.data);
        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const whereClause = this.buildWhereClause(args.where);

        const query = `UPDATE "${tableName}" SET ${setClause} WHERE ${whereClause} RETURNING *`;
        const result = await this.pool.query(query, values);
        return result.rows[0];
      },

      delete: async (args: { where: any }) => {
        const whereClause = this.buildWhereClause(args.where);
        const query = `DELETE FROM "${tableName}" WHERE ${whereClause} RETURNING *`;
        const result = await this.pool.query(query);
        return result.rows[0];
      },

      count: async (args?: { where?: any }) => {
        let query = `SELECT COUNT(*) as count FROM "${tableName}"`;
        if (args?.where) {
          query += ` WHERE ${this.buildWhereClause(args.where)}`;
        }
        const result = await this.pool.query(query);
        return parseInt(result.rows[0].count, 10);
      },

      aggregate: async (args: { where?: any; _sum?: any; _count?: any; _avg?: any; _min?: any; _max?: any }) => {
        const aggregates: string[] = [];

        if (args._count) {
          aggregates.push('COUNT(*) as "_count"');
        }
        if (args._sum) {
          Object.keys(args._sum).forEach(field => {
            if (args._sum[field]) aggregates.push(`SUM("${field}") as "${field}"`);
          });
        }

        let query = `SELECT ${aggregates.length ? aggregates.join(', ') : 'COUNT(*) as "_count"'} FROM "${tableName}"`;
        if (args.where) {
          query += ` WHERE ${this.buildWhereClause(args.where)}`;
        }

        const result = await this.pool.query(query);
        const row = result.rows[0];

        return {
          _count: parseInt(row._count || '0', 10),
          _sum: args._sum ? Object.keys(args._sum).reduce((acc, k) => ({ ...acc, [k]: parseFloat(row[k]) || 0 }), {}) : null,
        };
      },

      upsert: async (args: { where: any; create: any; update: any }) => {
        const existing = await this.findUnique({ where: args.where });
        if (existing) {
          return this.update({ where: args.where, data: args.update });
        }
        return this.create({ data: args.create });
      },
    };
  }

  private buildWhereClause(where: any): string {
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(where)) {
      if (value === null) {
        conditions.push(`"${key}" IS NULL`);
      } else if (typeof value === 'object' && value !== null) {
        // Handle operators like { gte: x, lte: y }
        for (const [op, val] of Object.entries(value as object)) {
          switch (op) {
            case 'gte': conditions.push(`"${key}" >= '${val}'`); break;
            case 'lte': conditions.push(`"${key}" <= '${val}'`); break;
            case 'gt': conditions.push(`"${key}" > '${val}'`); break;
            case 'lt': conditions.push(`"${key}" < '${val}'`); break;
            case 'contains': conditions.push(`"${key}" ILIKE '%${val}%'`); break;
            case 'in': conditions.push(`"${key}" IN (${(val as any[]).map(v => `'${v}'`).join(', ')})`); break;
            default: conditions.push(`"${key}" = '${val}'`);
          }
        }
      } else {
        conditions.push(`"${key}" = '${value}'`);
      }
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  }

  private buildOrderByClause(orderBy: any): string {
    if (Array.isArray(orderBy)) {
      return orderBy.map(o => {
        const [key, dir] = Object.entries(o)[0];
        return `"${key}" ${(dir as string).toUpperCase()}`;
      }).join(', ');
    }

    const [key, dir] = Object.entries(orderBy)[0];
    return `"${key}" ${(dir as string).toUpperCase()}`;
  }
}
