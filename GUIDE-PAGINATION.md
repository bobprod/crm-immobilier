# 📄 Guide d'Implémentation de la Pagination

## 📦 Composant Créé

**Fichier**: `frontend/src/shared/components/pagination-wrapper.tsx`

Un composant de pagination complet avec:
- Navigation par numéros de page
- Boutons Précédent/Suivant
- Ellipsis (...) pour les longues listes
- Sélecteur d'items par page (10, 20, 50, 100)
- Affichage du nombre total de résultats
- Hook `usePagination` pour gérer l'état facilement

---

## 🚀 Comment Utiliser

### Étape 1: Import

```typescript
import PaginationWrapper, { usePagination } from '@/shared/components/pagination-wrapper';
```

### Étape 2: Utiliser le Hook

```typescript
export default function MyListComponent() {
  const [allItems, setAllItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  // Hook de pagination
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    skip,
    take,
  } = usePagination(totalItems, 20); // 20 items par défaut

  // Charger les données avec skip/take
  const loadData = async () => {
    const data = await api.getAll({ skip, take });
    setAllItems(data);
    setTotalItems(data.total); // Si l'API retourne le total
  };

  useEffect(() => {
    loadData();
  }, [currentPage, itemsPerPage]);
}
```

### Étape 3: Afficher la Pagination

```typescript
return (
  <div>
    {/* Liste des items */}
    <div className="space-y-4">
      {allItems.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>

    {/* Pagination */}
    <PaginationWrapper
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={setCurrentPage}
      onItemsPerPageChange={setItemsPerPage}
      showItemsPerPage={true}
    />
  </div>
);
```

---

## 📋 Exemples d'Implémentation

### Exemple 1: Liste Simple (Frontend uniquement)

```typescript
import PaginationWrapper, { usePagination } from '@/shared/components/pagination-wrapper';

export default function PropertiesList() {
  const [allProperties, setAllProperties] = useState([]);

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    skip,
    take,
  } = usePagination(allProperties.length, 20);

  // Pagination côté frontend (slice)
  const paginatedProperties = allProperties.slice(skip, skip + take);

  return (
    <>
      <div className="grid gap-4">
        {paginatedProperties.map(property => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      <PaginationWrapper
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={allProperties.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </>
  );
}
```

### Exemple 2: Pagination Backend (Recommandé)

```typescript
import PaginationWrapper, { usePagination } from '@/shared/components/pagination-wrapper';

export default function MandatesList() {
  const [mandates, setMandates] = useState([]);
  const [totalMandates, setTotalMandates] = useState(0);
  const [loading, setLoading] = useState(false);

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    skip,
    take,
  } = usePagination(totalMandates, 20);

  const loadMandates = async () => {
    setLoading(true);
    try {
      // Passer skip et take à l'API
      const response = await mandatesAPI.list({ skip, take });
      setMandates(response.data);
      setTotalMandates(response.total); // Total vient du backend
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMandates();
  }, [currentPage, itemsPerPage]);

  return (
    <>
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="space-y-4">
          {mandates.map(mandate => (
            <MandateCard key={mandate.id} mandate={mandate} />
          ))}
        </div>
      )}

      <PaginationWrapper
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalMandates}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </>
  );
}
```

---

## 🔧 Modifications Backend Requises

Pour une pagination backend complète, les APIs doivent supporter `skip` et `take`:

### Exemple NestJS Controller

```typescript
@Get()
async findAll(@Query() query: any) {
  const skip = parseInt(query.skip) || 0;
  const take = parseInt(query.take) || 20;

  const [data, total] = await this.service.findAllWithCount({
    skip,
    take,
    // autres filtres...
  });

  return {
    data,
    total,
    skip,
    take,
    totalPages: Math.ceil(total / take),
  };
}
```

### Exemple avec Prisma

```typescript
async findAllWithCount(params: { skip: number; take: number }) {
  const [data, total] = await Promise.all([
    this.prisma.mandate.findMany({
      skip: params.skip,
      take: params.take,
      include: { owner: true, property: true },
    }),
    this.prisma.mandate.count(),
  ]);

  return [data, total];
}
```

---

## 📍 Où Ajouter la Pagination

### Priorité HAUTE (Performance critique)

1. **Mandates** - `/mandates/index.tsx`
   - Peut avoir des centaines de mandats
   - Chargement lent sans pagination

2. **Transactions** - `/transactions/index.tsx`
   - Historique croissant
   - Performance impactée

3. **Finance Lists**:
   - `/finance` - Commissions, Invoices, Payments
   - Données financières volumineuses

### Priorité MOYENNE

4. **Properties** - `/properties/index.tsx`
   - Liste de biens peut être longue

5. **Prospects** - `/prospects/index.tsx`
   - Base de prospects croissante

### Priorité BASSE

6. **Appointments** - `/appointments/index.tsx`
   - Généralement moins de données
   - Filtré par date

---

## 🎨 Personnalisation

### Changer le nombre d'items par défaut

```typescript
const { ... } = usePagination(totalItems, 50); // 50 au lieu de 20
```

### Désactiver le sélecteur d'items par page

```typescript
<PaginationWrapper
  // ... props
  showItemsPerPage={false}
/>
```

### Modifier les options d'items par page

Éditer `pagination-wrapper.tsx`:

```typescript
<select ...>
  <option value="5">5</option>
  <option value="25">25</option>
  <option value="50">50</option>
  <option value="200">200</option>
</select>
```

---

## ⚡ Performance Tips

1. **Toujours utiliser la pagination backend** pour les grandes listes (>100 items)
2. **Éviter de charger tous les items** puis paginer côté frontend
3. **Mettre en cache les pages** visitées si besoin
4. **Utiliser React.memo()** pour les items de liste
5. **Virtualiser** si besoin pour des listes de 1000+ items (react-window)

---

## ✅ Checklist d'Implémentation

- [ ] Importer `PaginationWrapper` et `usePagination`
- [ ] Initialiser le hook avec le total d'items
- [ ] Modifier l'API call pour utiliser `skip` et `take`
- [ ] Afficher le composant `PaginationWrapper`
- [ ] Tester changement de page
- [ ] Tester changement d'items par page
- [ ] Vérifier le bon affichage du total
- [ ] Optimiser backend si nécessaire

---

## 🔍 Dépannage

### La pagination ne s'affiche pas
- Vérifier que `totalPages > 1` ou `showItemsPerPage={true}`
- Vérifier que `totalItems` est bien défini

### Les numéros de page sont incorrects
- S'assurer que `totalItems` vient du backend (count total, pas count de la page)
- Vérifier le calcul: `totalPages = Math.ceil(totalItems / itemsPerPage)`

### Le changement de page ne recharge pas les données
- Ajouter `currentPage` et `itemsPerPage` dans les dépendances de `useEffect`

```typescript
useEffect(() => {
  loadData();
}, [currentPage, itemsPerPage]); // ✅ Correct
```

---

**Composant créé par**: Claude (Sonnet 4.5)
**Date**: 2025-12-07
**Version**: 1.0
