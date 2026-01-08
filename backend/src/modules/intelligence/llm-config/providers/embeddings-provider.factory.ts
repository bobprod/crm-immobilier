import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { ApiKeysService } from '../../../../shared/services/api-keys.service';
import { EmbeddingsProvider, JinaProvider } from './jina.provider';

/**
 * Factory pour créer des instances de providers d'embeddings
 */
@Injectable()
export class EmbeddingsProviderFactory {
    constructor(
        private readonly prisma: PrismaService,
        private readonly apiKeysService: ApiKeysService,
    ) { }

    /**
     * Créer un provider d'embeddings pour un utilisateur avec BYOK support
     */
    async createProviderForUser(
        userId: string,
        providerName: string = 'jina',
    ): Promise<EmbeddingsProvider> {
        // Valider que le provider est supporté
        const validProviders = ['jina'];

        if (!validProviders.includes(providerName)) {
            throw new BadRequestException(
                `Provider d'embeddings ${providerName} non supporté. Providers valides: ${validProviders.join(', ')}`,
            );
        }

        // 1. Essayer de récupérer depuis UserLlmProvider (réutiliser la table existante)
        const userProvider = await this.prisma.userLlmProvider.findUnique({
            where: {
                userId_provider: { userId, provider: providerName.toUpperCase() },
            },
        });

        // Si la clé API est présente dans UserLlmProvider, l'utiliser directement
        if (userProvider?.apiKey) {
            console.log(`🔑 Clé BYOK trouvée dans UserLlmProvider pour ${providerName}`);
            return this.createProviderInstance({
                provider: providerName,
                apiKey: userProvider.apiKey,
            });
        }

        // 2. Fallback sur ApiKeysService (user → agency → superadmin)
        console.log(`🔍 Fallback ApiKeysService pour ${providerName}...`);
        const apiKey = await this.apiKeysService.getApiKey(
            userId,
            providerName as any, // Type assertion temporaire
        );

        if (!apiKey) {
            throw new BadRequestException(
                `Aucune clé API ${providerName} configurée. Veuillez ajouter votre clé dans Paramètres > Providers.`,
            );
        }

        console.log(`✅ Clé API récupérée via fallback pour ${providerName}`);

        return this.createProviderInstance({
            provider: providerName,
            apiKey,
        });
    }

    /**
     * Créer une instance de provider selon le type
     */
    private createProviderInstance(config: { provider: string; apiKey: string }): EmbeddingsProvider {
        let provider: EmbeddingsProvider;

        switch (config.provider) {
            case 'jina':
                provider = new JinaProvider(config.apiKey);
                break;

            default:
                throw new BadRequestException(`Provider d'embeddings non supporté : ${config.provider}`);
        }

        if (!provider.isConfigured()) {
            throw new BadRequestException(
                `Clé API ${config.provider} invalide. Veuillez vérifier votre configuration.`,
            );
        }

        return provider;
    }

    /**
     * Tester une configuration d'embeddings
     */
    async testProvider(apiKey: string, provider: string = 'jina'): Promise<boolean> {
        try {
            const providerInstance = this.createProviderInstance({ provider, apiKey });

            // Tester avec un texte simple
            const embedding = await providerInstance.createEmbeddings('test');
            return embedding && embedding.length > 0;
        } catch (error) {
            console.error('Test embeddings provider failed:', error);
            return false;
        }
    }
}
