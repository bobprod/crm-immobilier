import Layout from '@/modules/core/layout/components/Layout';
import { PropertyList } from '@/modules/business/properties/components/PropertyList';
import { useEffect, useState } from 'react';

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
  const [pageReady, setPageReady] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [loadingMode, setLoadingMode] = useState(false);
  const [errorMode, setErrorMode] = useState(false);

  // Parse query parameters from URL ASAP - synchronously check on mount
  useEffect(() => {
    // This runs IMMEDIATELY on client mount, before any other renders matter
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const isTestMode = params.get('testMode') === 'true';
    const isLoadingMode = params.get('loading') === 'true';
    const isErrorMode = params.get('error') === 'true';

    setTestMode(isTestMode);
    setLoadingMode(isLoadingMode);
    setErrorMode(isErrorMode);
    setPageReady(true);

    console.log('[PropertiesPage] Page ready - testMode:', isTestMode);
  }, []);

  // FIRST: Don't render ANYTHING including Layout until we know test mode
  if (!pageReady) {
    return null; // Return null, not a loading screen - this prevents early Layout render
  }

  let initialLoadingProp: boolean | undefined = undefined;
  let initialErrorProp: string | null | undefined = undefined;
  let initialPropertiesProp: Property[] | undefined = undefined;

  if (testMode) {
    if (loadingMode) {
      initialLoadingProp = true;
      initialErrorProp = null;
    } else if (errorMode) {
      initialLoadingProp = false;
      initialErrorProp = 'Failed to fetch properties';
    } else {
      initialLoadingProp = false;
      initialErrorProp = null;
      initialPropertiesProp = mockProperties;
    }
  }

  return (
    <Layout disableAuthRedirect={testMode}>
      <PropertyList
        initialLoading={initialLoadingProp}
        initialError={initialErrorProp}
        initialProperties={initialPropertiesProp}
      />
    </Layout>
  );
}
