import axios from 'axios';

/**
 * Interface pour les providers d'embeddings et de recherche sémantique
 */
export interface EmbeddingsProvider {
    name: string;

    /**
     * Créer des embeddings pour un texte
     */
    createEmbeddings(text: string): Promise<number[]>;

    /**
     * Créer des embeddings pour plusieurs textes
     */
    createEmbeddingsBatch(texts: string[]): Promise<number[][]>;

    /**
     * Reranker les résultats de recherche
     */
    rerank(query: string, documents: string[]): Promise<number[]>;

    /**
     * Extraire le contenu d'une URL
     */
    readUrl(url: string): Promise<string>;

    /**
     * Vérifier si le provider est configuré
     */
    isConfigured(): boolean;
}

/**
 * Provider Jina.ai pour embeddings, reranking et extraction de contenu
 */
export class JinaProvider implements EmbeddingsProvider {
    name = 'Jina.ai';
    private apiKey: string;
    private baseUrl = 'https://api.jina.ai/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Créer des embeddings pour un texte
     */
    async createEmbeddings(text: string): Promise<number[]> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/embeddings`,
                {
                    input: [text],
                    model: 'jina-embeddings-v2-base-en', // Modèle par défaut
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                }
            );

            return response.data.data[0].embedding;
        } catch (error: any) {
            console.error('Jina embeddings error:', error.response?.data || error.message);
            throw new Error(`Jina embeddings failed: ${error.message}`);
        }
    }

    /**
     * Créer des embeddings pour plusieurs textes
     */
    async createEmbeddingsBatch(texts: string[]): Promise<number[][]> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/embeddings`,
                {
                    input: texts,
                    model: 'jina-embeddings-v2-base-en',
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                }
            );

            return response.data.data.map((item: any) => item.embedding);
        } catch (error: any) {
            console.error('Jina batch embeddings error:', error.response?.data || error.message);
            throw new Error(`Jina batch embeddings failed: ${error.message}`);
        }
    }

    /**
     * Reranker les résultats de recherche
     */
    async rerank(query: string, documents: string[]): Promise<number[]> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/rerank`,
                {
                    query,
                    documents,
                    model: 'jina-reranker-v1-base-en',
                    top_n: documents.length,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                }
            );

            // Retourner les scores dans l'ordre original
            return response.data.results.map((result: any) => result.relevance_score);
        } catch (error: any) {
            console.error('Jina rerank error:', error.response?.data || error.message);
            throw new Error(`Jina rerank failed: ${error.message}`);
        }
    }

    /**
     * Extraire le contenu d'une URL
     */
    async readUrl(url: string): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/reader`,
                {
                    url,
                    return_format: 'markdown',
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                }
            );

            return response.data.content || '';
        } catch (error: any) {
            console.error('Jina reader error:', error.response?.data || error.message);
            throw new Error(`Jina reader failed: ${error.message}`);
        }
    }

    /**
     * Vérifier si le provider est configuré
     */
    isConfigured(): boolean {
        return !!this.apiKey && this.apiKey.startsWith('jina_') && this.apiKey.length > 20;
    }
}
