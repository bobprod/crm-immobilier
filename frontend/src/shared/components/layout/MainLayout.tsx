import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ChatbotFloatingButton } from './ChatbotFloatingButton';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Main Layout Component
 *
 * Application layout with sidebar navigation:
 * - Dark elegant sidebar (collapsible)
 * - Main content area with clean white top bar
 * - Breadcrumbs
 * - Responsive design
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
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Secondary Toolbar (utility nav) */}
        <TopBar />

        {/* Breadcrumbs / Page title bar */}
        {(title || breadcrumbs) && (
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-2.5 flex items-center gap-4">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1.5 text-sm text-slate-500">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    {crumb.href ? (
                      <a href={crumb.href} className="hover:text-slate-800 transition-colors">
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-slate-800 font-medium">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Page Title */}
            {title && (
              <h1 className="text-xl font-bold text-slate-900 ml-auto hidden md:block">{title}</h1>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1600px]">{children}</div>
        </div>
      </main>

      {/* Floating Chatbot Button */}
      <ChatbotFloatingButton />
    </div>
  );
};
