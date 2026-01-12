import React, { useState } from 'react';
import { Sidebar } from './Sidebar';

/**
 * Main Layout Component
 *
 * Application layout with sidebar navigation:
 * - Sidebar (collapsible)
 * - Main content area
 * - Breadcrumbs
 * - Responsive design
 *
 * Phase 2.2: UX/UI Restructuring
 */

export interface MainLayoutProps {
  children: React.ReactNode;
  /** Page title for breadcrumbs */
  title?: string;
  /** Breadcrumb items */
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, title, breadcrumbs }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Breadcrumbs */}
        {(title || breadcrumbs) && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {crumb.href ? (
                      <a href={crumb.href} className="hover:text-purple-600 transition-colors">
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-gray-900 font-medium">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Page Title */}
            {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </div>
      </main>
    </div>
  );
};
