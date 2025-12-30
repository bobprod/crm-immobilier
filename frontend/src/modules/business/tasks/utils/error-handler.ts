/**
 * Utility pour gérer les erreurs du module Tasks de manière cohérente
 */

export interface ErrorHandlerOptions {
  toast: any;
  context: string;
  defaultMessage?: string;
  rethrow?: boolean;
}

/**
 * Gère les erreurs de manière standardisée avec logging et toast notification
 *
 * @param error - L'erreur capturée
 * @param options - Configuration du handler
 *
 * @example
 * ```typescript
 * try {
 *   await tasksService.create(data);
 * } catch (error: any) {
 *   handleTaskError(error, {
 *     toast,
 *     context: 'TaskList.create',
 *     defaultMessage: 'Impossible de créer la tâche',
 *     rethrow: true
 *   });
 * }
 * ```
 */
export function handleTaskError(error: any, options: ErrorHandlerOptions): void {
  const { toast, context, defaultMessage = 'Une erreur est survenue', rethrow = false } = options;

  // Logging pour debug
  console.error(`[${context}] Error:`, error);

  // Extraire le message d'erreur (priorité: API response > error.message > default)
  const errorMessage =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    defaultMessage;

  // Log détails si disponibles (utile pour debugging)
  if (error.response?.data) {
    console.error(`[${context}] Error details:`, error.response.data);
  }

  // Afficher toast d'erreur à l'utilisateur
  toast({
    title: 'Erreur',
    description: errorMessage,
    variant: 'destructive',
  });

  // Re-throw si demandé (utile pour propager l'erreur au composant parent)
  if (rethrow) {
    throw error;
  }
}

/**
 * Gère les erreurs avec un message de succès si l'opération réussit
 *
 * @param operation - Fonction async à exécuter
 * @param options - Configuration incluant messages succès/erreur
 *
 * @example
 * ```typescript
 * await handleTaskOperation(
 *   () => tasksService.delete(id),
 *   {
 *     toast,
 *     context: 'TaskList.delete',
 *     successMessage: 'Tâche supprimée avec succès',
 *     errorMessage: 'Impossible de supprimer la tâche'
 *   }
 * );
 * ```
 */
export async function handleTaskOperation<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions & {
    successMessage?: string;
    errorMessage?: string;
  }
): Promise<T | null> {
  try {
    const result = await operation();

    if (options.successMessage) {
      options.toast({
        title: 'Succès',
        description: options.successMessage,
      });
    }

    return result;
  } catch (error: any) {
    handleTaskError(error, {
      ...options,
      defaultMessage: options.errorMessage,
    });
    return null;
  }
}
