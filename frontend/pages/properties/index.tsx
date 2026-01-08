import Layout from '@/modules/core/layout/components/Layout';
import { PropertyList } from '@/modules/business/properties/components/PropertyList';
import { useEffect, useState } from 'react';
import { mockProperties } from '@/modules/business/properties/__mocks__/properties.mock';
import type { Property } from '@/shared/utils/properties-api';

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
