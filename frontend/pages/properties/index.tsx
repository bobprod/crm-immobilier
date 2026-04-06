import { MainLayout } from '@/shared/components/layout';
import { PropertyList } from '@/modules/business/properties/components/PropertyList';

export default function PropertiesPage() {
  return (
    <MainLayout title="Propriétés" breadcrumbs={[{ label: 'Propriétés' }]}>
      <PropertyList />
    </MainLayout>
  );
}
