import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from '../TaskItem';
import { Task } from '../../tasks.service';

describe('TaskItem', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnComplete = vi.fn();

  const mockTask: Task = {
    id: '1',
    title: 'Tâche de test',
    description: 'Description de test',
    status: 'todo',
    priority: 'high',
    dueDate: '2025-12-31',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-02T10:00:00Z',
  };

  /**
   * Test 1: Affiche le titre de la tâche
   */
  it('affiche le titre de la tâche', () => {
    render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Tâche de test')).toBeInTheDocument();
  });

  /**
   * Test 2: Affiche la description
   */
  it('affiche la description de la tâche', () => {
    render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Description de test')).toBeInTheDocument();
  });

  /**
   * Test 3: Affiche le badge de priorité
   */
  it('affiche le badge de priorité avec la bonne couleur', () => {
    const { container } = render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    // Vérifier la présence du badge high (rouge)
    const highBadge = container.querySelector('.bg-red-100');
    expect(highBadge).toBeInTheDocument();
  });

  /**
   * Test 4: Affiche le badge de statut
   */
  it('affiche le badge de statut correct', () => {
    render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('À faire')).toBeInTheDocument();
  });

  /**
   * Test 5: Affiche la date d'échéance
   */
  it('affiche la date d\'échéance', () => {
    render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    // La date devrait être affichée (format local peut varier)
    expect(screen.getByText(/31\/12\/2025/i) || screen.getByText(/12\/31\/2025/i)).toBeTruthy();
  });

  /**
   * Test 6: Affiche la date de création
   */
  it('affiche la date de création', () => {
    render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText(/Créé le/i)).toBeInTheDocument();
  });

  /**
   * Test 7: Applique line-through si tâche done
   */
  it('applique line-through au titre si tâche terminée', () => {
    const doneTask: Task = {
      ...mockTask,
      status: 'done',
    };

    render(
      <TaskItem
        task={doneTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    const titleElement = screen.getByText('Tâche de test');
    expect(titleElement).toHaveClass('line-through');
  });

  /**
   * Test 8: Réduit l'opacité si tâche done
   */
  it('réduit l\'opacité de la carte si tâche terminée', () => {
    const doneTask: Task = {
      ...mockTask,
      status: 'done',
    };

    const { container } = render(
      <TaskItem
        task={doneTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    // La card devrait avoir opacity-75
    const card = container.querySelector('.opacity-75');
    expect(card).toBeInTheDocument();
  });

  /**
   * Test 9: Appelle onComplete au clic CheckCircle
   */
  it('appelle onComplete au clic sur le bouton CheckCircle', () => {
    render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    // Trouver le bouton CheckCircle (premier button)
    const buttons = screen.getAllByRole('button');
    const checkButton = buttons[0]; // Le premier bouton est CheckCircle

    fireEvent.click(checkButton);

    expect(mockOnComplete).toHaveBeenCalledWith('1');
  });

  /**
   * Test 10: Ouvre le dropdown menu
   */
  it('ouvre le dropdown menu au clic', () => {
    render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    // Trouver le bouton dropdown (MoreVertical)
    const buttons = screen.getAllByRole('button');
    const dropdownButton = buttons[buttons.length - 1]; // Dernier bouton

    fireEvent.click(dropdownButton);

    // Le menu devrait s'ouvrir (Modifier et Supprimer visibles)
    expect(screen.getByText('Modifier')).toBeInTheDocument();
    expect(screen.getByText('Supprimer')).toBeInTheDocument();
  });

  /**
   * Test 11: Appelle onEdit au clic Modifier
   */
  it('appelle onEdit au clic sur Modifier', () => {
    render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    // Ouvrir le dropdown
    const buttons = screen.getAllByRole('button');
    const dropdownButton = buttons[buttons.length - 1];
    fireEvent.click(dropdownButton);

    // Cliquer sur Modifier
    const editButton = screen.getByText('Modifier');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  /**
   * Test 12: Appelle onDelete au clic Supprimer
   */
  it('appelle onDelete au clic sur Supprimer', () => {
    render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    // Ouvrir le dropdown
    const buttons = screen.getAllByRole('button');
    const dropdownButton = buttons[buttons.length - 1];
    fireEvent.click(dropdownButton);

    // Cliquer sur Supprimer
    const deleteButton = screen.getByText('Supprimer');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockTask);
  });

  /**
   * Test 13: Affiche les bonnes couleurs selon priorité
   */
  it('affiche les bonnes couleurs pour chaque priorité', () => {
    // Priorité basse (bleu)
    const lowTask: Task = { ...mockTask, priority: 'low' };
    const { container: lowContainer } = render(
      <TaskItem task={lowTask} onEdit={mockOnEdit} onDelete={mockOnDelete} onComplete={mockOnComplete} />
    );
    expect(lowContainer.querySelector('.bg-blue-100')).toBeInTheDocument();

    // Priorité moyenne (jaune)
    const mediumTask: Task = { ...mockTask, priority: 'medium' };
    const { container: mediumContainer } = render(
      <TaskItem task={mediumTask} onEdit={mockOnEdit} onDelete={mockOnDelete} onComplete={mockOnComplete} />
    );
    expect(mediumContainer.querySelector('.bg-yellow-100')).toBeInTheDocument();

    // Priorité haute (rouge)
    const highTask: Task = { ...mockTask, priority: 'high' };
    const { container: highContainer } = render(
      <TaskItem task={highTask} onEdit={mockOnEdit} onDelete={mockOnDelete} onComplete={mockOnComplete} />
    );
    expect(highContainer.querySelector('.bg-red-100')).toBeInTheDocument();
  });

  /**
   * Test 14: Affiche les bonnes couleurs selon statut
   */
  it('affiche les bonnes couleurs pour chaque statut', () => {
    // Todo (gris)
    const todoTask: Task = { ...mockTask, status: 'todo' };
    const { container: todoContainer } = render(
      <TaskItem task={todoTask} onEdit={mockOnEdit} onDelete={mockOnDelete} onComplete={mockOnComplete} />
    );
    expect(todoContainer.querySelector('.bg-gray-100')).toBeInTheDocument();

    // In Progress (violet)
    const inProgressTask: Task = { ...mockTask, status: 'in_progress' };
    const { container: inProgressContainer } = render(
      <TaskItem task={inProgressTask} onEdit={mockOnEdit} onDelete={mockOnDelete} onComplete={mockOnComplete} />
    );
    expect(inProgressContainer.querySelector('.bg-purple-100')).toBeInTheDocument();

    // Done (vert)
    const doneTask: Task = { ...mockTask, status: 'done' };
    const { container: doneContainer } = render(
      <TaskItem task={doneTask} onEdit={mockOnEdit} onDelete={mockOnDelete} onComplete={mockOnComplete} />
    );
    expect(doneContainer.querySelector('.bg-green-100')).toBeInTheDocument();
  });

  /**
   * Test 15: N'affiche pas la description si vide
   */
  it('n\'affiche pas la description si elle est vide', () => {
    const taskWithoutDesc: Task = {
      ...mockTask,
      description: undefined,
    };

    render(
      <TaskItem
        task={taskWithoutDesc}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.queryByText('Description de test')).not.toBeInTheDocument();
  });

  /**
   * Test 16: N'affiche pas la date d'échéance si non définie
   */
  it('n\'affiche pas la date d\'échéance si non définie', () => {
    const taskWithoutDueDate: Task = {
      ...mockTask,
      dueDate: undefined,
    };

    const { container } = render(
      <TaskItem
        task={taskWithoutDueDate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    // Ne devrait pas avoir l'icône Calendar
    const calendarIcon = container.querySelector('[data-testid="calendar-icon"]');
    expect(calendarIcon).not.toBeInTheDocument();
  });

  /**
   * Test 17: Applique hover effect
   */
  it('applique un hover effect sur la carte', () => {
    const { container } = render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onComplete={mockOnComplete}
      />
    );

    const card = container.querySelector('.hover\\:shadow-md');
    expect(card).toBeInTheDocument();
  });
});
