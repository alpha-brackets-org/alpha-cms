'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Layers,
  ImageIcon,
  Users,
  Settings,
  Globe,
  LogOut,
  Loader2,
  Shield,
  Mail,
  Code,
  Target,
  X,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortfolios } from '@/hooks/use-portfolios';
import { useAuth } from '@/providers/AuthProvider';
import { isAdmin } from '@/lib/auth';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { useLogout } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const pathname = usePathname();
  const { user, loading: isAuthLoading } = useAuth();
  const { data: portfolios = [], isLoading } = usePortfolios();
  const { activePortfolio, setActivePortfolio } = usePortfolio();
  const logoutMutation = useLogout();

  const handlePortfolioChange = (id: string) => {
    setActivePortfolio(id || null);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/', adminOnly: false },
    { name: 'Categories', icon: Layers, href: '/categories', adminOnly: false },
    { name: 'Blogs', icon: FileText, href: '/blogs', adminOnly: false },
    { name: 'FAQs', icon: HelpCircle, href: '/faqs', adminOnly: false },
    {
      name: 'Case Studies',
      icon: Briefcase,
      href: '/case-studies',
      adminOnly: false,
    },
    { name: 'Projects', icon: Code, href: '/projects', adminOnly: false },
    { name: 'Media', icon: ImageIcon, href: '/media', adminOnly: false },
    { name: 'Newsletter', icon: Mail, href: '/subscribers', adminOnly: false },
    { name: 'Leads (CRM)', icon: Target, href: '/leads', adminOnly: false },
    { name: 'Portfolios', icon: Globe, href: '/portfolios', adminOnly: false },
    { name: 'Users', icon: Users, href: '/users', adminOnly: true },
    {
      name: 'API Docs',
      icon: Settings,
      href: '/api-docs',
      adminOnly: true,
      newTab: true,
    },
  ].filter((item) => {
    if (isAuthLoading && item.adminOnly) return false;
    return !item.adminOnly || isAdmin(user);
  });

  return (
    <aside className="grain flex h-screen w-64 flex-col overflow-hidden border-r-2 border-border bg-card">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b-2 border-border p-6">
        <div>
          <h1 className="text-xl font-bold tracking-ultrawide text-primary">
            ALPHA CMS
          </h1>
          <p className="mt-1 text-[10px] uppercase text-muted-foreground">
            CMS INFRASTRUCTURE
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Portfolio Selector */}
      <div className="mb-2 border-b-2 border-border bg-secondary/50 px-6 py-4">
        <div className="mb-2 flex items-center justify-between">
          <Label>Active Portfolio</Label>
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          )}
        </div>
        <Select
          value={activePortfolio || ''}
          onChange={(e) => handlePortfolioChange(e.target.value)}
          disabled={isLoading}
          className="h-10"
        >
          <option value="">All Portfolios</option>
          {portfolios.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Navigation */}
      <nav className="scrollbar-none flex-1 space-y-1 overflow-y-auto px-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClose}
            target={item.newTab ? '_blank' : undefined}
            rel={item.newTab ? 'noopener noreferrer' : undefined}
            className={cn(
              'group flex items-center gap-3 border-2 border-transparent px-4 py-3 text-sm font-medium transition-all',
              pathname === item.href
                ? 'border-primary bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <item.icon
              className={cn(
                'h-5 w-5',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-4 border-t-2 border-border bg-secondary/10 p-4">
        {/* User Profile */}
        <div className="border-2 border-border bg-card p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center border-2 border-border bg-primary/10 text-xs font-black text-primary">
              {user?.email?.[0].toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-bold uppercase tracking-tight">
                {user?.email || 'Guest Operator'}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-primary">
                  <Shield className="h-2 w-2" />
                  {user?.role || 'VIEWER'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-secondary/30 px-4 py-3 text-[10px] font-bold uppercase tracking-brutal">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="text-muted-foreground">System Active</span>
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="flex w-full items-center justify-start gap-3 border-2 border-transparent px-4 py-3 text-xs font-bold uppercase tracking-widest text-destructive transition-colors hover:border-destructive/20 hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>
    </aside>
  );
};
