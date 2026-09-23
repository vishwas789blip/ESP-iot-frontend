import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-900">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <TopBar onMenuClick={() => setMobileOpen(true)} collapsed={collapsed} />
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          collapsed ? 'lg:pl-[68px]' : 'lg:pl-64'
        }`}
      >
        <div className="p-4 lg:p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
