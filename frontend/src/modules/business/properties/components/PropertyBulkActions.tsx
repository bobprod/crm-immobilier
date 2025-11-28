import { Button } from '@/shared/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { CheckSquare, Trash2, Tag, UserPlus, ArrowUpCircle } from 'lucide-react';

interface PropertyBulkActionsProps {
    selectedCount: number;
    onAction: (action: string, value?: any) => void;
}

export function PropertyBulkActions({ selectedCount, onAction }: PropertyBulkActionsProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10 mb-4">
            <span className="text-sm font-medium px-2">
                {selectedCount} sélectionné(s)
            </span>

            <div className="h-4 w-px bg-gray-300 mx-2" />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <ArrowUpCircle className="mr-2 h-4 w-4" />
                        Priorité
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Définir priorité</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onAction('priority', 'low')}>Basse</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('priority', 'medium')}>Moyenne</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('priority', 'high')}>Haute</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('priority', 'urgent')}>Urgente</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Tag className="mr-2 h-4 w-4" />
                        Statut
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Changer statut</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onAction('status', 'available')}>Disponible</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('status', 'reserved')}>Réservé</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('status', 'sold')}>Vendu</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('status', 'rented')}>Loué</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button
                variant="destructive"
                size="sm"
                onClick={() => onAction('delete')}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
            </Button>
        </div>
    );
}
