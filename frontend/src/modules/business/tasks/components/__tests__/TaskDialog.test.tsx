import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskDialog } from '../TaskDialog';
import { Task } from '../../tasks.service';

// Mock du toast
vi.mock('@/shared/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('TaskDialog', () => {
  const mockOnSubmit = vi.fn();
  const mockOnOpenChange = vi.fn();

  const mockTask: Task = {
    id: '1',
    title: 'Tâche existante',
    description: 'Description existante',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2025-12-31',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 1: Affiche "Nouvelle tâche" en mode création
   */
  it('affiche "Nouvelle tâche" en mode création', () => {
    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={null}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
    expect(screen.getByText('Créer')).toBeInTheDocument();
  });

  /**
   * Test 2: Affiche "Modifier la tâche" en mode édition
   */
  it('affiche "Modifier la tâche" en mode édition', () => {
    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={mockTask}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
    expect(screen.getByText('Mettre à jour')).toBeInTheDocument();
  });

  /**
   * Test 3: Pré-remplit le formulaire en mode édition
   */
  it('pré-remplit le formulaire avec les valeurs de la tâche', () => {
    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={mockTask}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Titre/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;

    expect(titleInput.value).toBe('Tâche existante');
    expect(descriptionInput.value).toBe('Description existante');
  });

  /**
   * Test 4: Valide que le titre doit avoir min 3 caractères
   */
  it('affiche erreur si titre < 3 caractères', async () => {
    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={null}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Titre/i);
    const submitButton = screen.getByText('Créer');

    // Entrer seulement 2 caractères
    await userEvent.type(titleInput, 'AB');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Le titre doit contenir au moins 3 caractères/i)
      ).toBeInTheDocument();
    });

    // onSubmit ne doit pas être appelé
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  /**
   * Test 5: Soumet avec les bonnes valeurs
   */
  it('soumet le formulaire avec les bonnes valeurs', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={null}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Titre/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const submitButton = screen.getByText('Créer');

    // Remplir le formulaire
    await userEvent.type(titleInput, 'Nouvelle tâche test');
    await userEvent.type(descriptionInput, 'Description de test');

    // Soumettre
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Nouvelle tâche test',
          description: 'Description de test',
          priority: 'medium', // Valeur par défaut
          status: 'todo', // Valeur par défaut
        })
      );
    });
  });

  /**
   * Test 6: Affiche loading pendant la soumission
   */
  it('affiche loading pendant la soumission', async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={null}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Titre/i);
    const submitButton = screen.getByText('Créer');

    await userEvent.type(titleInput, 'Test loading');
    fireEvent.click(submitButton);

    // Le bouton doit être disabled
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Attendre la fin de la soumission
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 200 });
  });

  /**
   * Test 7: Ferme le dialog après succès
   */
  it('ferme le dialog après soumission réussie', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={null}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Titre/i);
    const submitButton = screen.getByText('Créer');

    await userEvent.type(titleInput, 'Test fermeture');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  /**
   * Test 8: Reset le formulaire après succès
   */
  it('reset le formulaire après soumission réussie', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    const { rerender } = render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={null}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Titre/i) as HTMLInputElement;

    await userEvent.type(titleInput, 'Test reset');

    expect(titleInput.value).toBe('Test reset');

    // Soumettre
    const submitButton = screen.getByText('Créer');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Réouvrir le dialog (simule nouvelle création)
    rerender(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={null}
        onSubmit={mockOnSubmit}
      />
    );

    // Le formulaire doit être vide
    const newTitleInput = screen.getByLabelText(/Titre/i) as HTMLInputElement;
    expect(newTitleInput.value).toBe('');
  });

  /**
   * Test 9: Gère les erreurs de soumission
   */
  it('gère les erreurs lors de la soumission', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnSubmit.mockRejectedValue(new Error('Erreur réseau'));

    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={null}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Titre/i);
    const submitButton = screen.getByText('Créer');

    await userEvent.type(titleInput, 'Test erreur');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    // Le dialog ne devrait PAS se fermer en cas d'erreur
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);

    consoleError.mockRestore();
  });

  /**
   * Test 10: Bouton Annuler ferme le dialog
   */
  it('ferme le dialog au clic sur Annuler', () => {
    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={null}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  /**
   * Test 11: Affiche tous les champs du formulaire
   */
  it('affiche tous les champs nécessaires', () => {
    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={null}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByLabelText(/Titre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Priorité/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Statut/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date d'échéance/i)).toBeInTheDocument();
  });

  /**
   * Test 12: Convertit correctement la date en format input
   */
  it('convertit la date ISO en format input date', () => {
    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={mockTask}
        onSubmit={mockOnSubmit}
      />
    );

    const dateInput = screen.getByLabelText(/Date d'échéance/i) as HTMLInputElement;

    // La date doit être au format YYYY-MM-DD
    expect(dateInput.value).toBe('2025-12-31');
  });

  /**
   * Test 13: Les selects fonctionnent correctement
   */
  it('peut changer la priorité et le statut', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <TaskDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        task={null}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Titre/i);
    await userEvent.type(titleInput, 'Test selects');

    // Sélectionner priorité haute
    const prioritySelect = screen.getByLabelText(/Priorité/i);
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    // Sélectionner statut en cours
    const statusSelect = screen.getByLabelText(/Statut/i);
    fireEvent.change(statusSelect, { target: { value: 'in_progress' } });

    const submitButton = screen.getByText('Créer');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'high',
          status: 'in_progress',
        })
      );
    });
  });
});
