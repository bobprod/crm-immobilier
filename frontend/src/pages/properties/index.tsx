import Layout from '@/modules/core/layout/components/Layout';
import { PropertyList } from '@/modules/business/properties/components/PropertyList';
import { useRouter } from 'next/router';

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: string;
}

const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Property 1',
    type: 'House',
    price: 100000,
    currency: 'USD',
    location: 'Test City 1',
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    status: 'For Sale',
  },
  {
    id: '2',
    title: 'Property 2',
    type: 'Apartment',
    price: 200000,
    currency: 'USD',
    location: 'Test City 2',
    bedrooms: 2,
    bathrooms: 1,
    area: 100,
    status: 'For Rent',
  },
  {
    id: '3',
    title: 'Property 3',
    type: 'Villa',
    price: 300000,
    currency: 'USD',
    location: 'Test City 3',
    bedrooms: 5,
    bathrooms: 3,
    area: 250,
    status: 'Sold',
  },
];

export default function PropertiesPage() {
  const router = useRouter();
  const isLoadingQuery = router.query.loading === 'true';
  const isErrorQuery = router.query.error === 'true';
  const isTestMode = router.query.testMode === 'true';

  let initialLoadingProp: boolean | undefined = undefined;
  let initialErrorProp: string | null | undefined = undefined;
  let initialPropertiesProp: Property[] | undefined = undefined;

  if (isTestMode) {
    if (isLoadingQuery) {
      initialLoadingProp = true;
      initialErrorProp = null; // Ensure no error state when testing loading
    } else if (isErrorQuery) {
      initialLoadingProp = false; // Ensure not loading when testing error
      initialErrorProp = 'Failed to fetch properties';
    } else {
      // Test mode for rendering properties list
      initialLoadingProp = false; // Not loading
      initialErrorProp = null; // No error
      initialPropertiesProp = mockProperties; // Provide mock data
    }
  }

  return (
    <Layout disableAuthRedirect={isTestMode}>
      <PropertyList
        initialLoading={initialLoadingProp}
        initialError={initialErrorProp}
        initialProperties={initialPropertiesProp}
      />
    </Layout>
  );
}
