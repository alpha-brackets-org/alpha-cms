'use client';

import React, { useState } from 'react';
import {
  FileText,
  Briefcase,
  Users,
  ImageIcon,
  TrendingUp,
  Target,
  Zap,
  Activity,
  Server,
  Mail,
} from 'lucide-react';
import { useStats } from '@/hooks/use-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { LeadGrowthChart } from '@/components/dashboard/LeadGrowthChart';
import { useAuth } from '@/providers/AuthProvider';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { Select } from '@/components/ui/select';

export default function DashboardPage() {
  const { user: currentUser } = useAuth();
  const { activePortfolio } = usePortfolio();
  const [leadMonths, setLeadMonths] = useState(6);
  const { data: liveStats, isLoading } = useStats(leadMonths);

  const stats = [
    {
      name: 'Total Blogs',
      value: liveStats?.blogs,
      icon: FileText,
      trend: liveStats?.blogsTrend,
    },
    {
      name: 'Case Studies',
      value: liveStats?.projects,
      icon: Briefcase,
      trend: liveStats?.projectsTrend,
    },
    {
      name: 'Total Media',
      value: liveStats?.media,
      icon: ImageIcon,
      trend: liveStats?.mediaTrend,
    },
    {
      name: 'Portfolios',
      value: liveStats?.portfolios,
      icon: Users,
      trend: liveStats?.portfoliosTrend,
    },
  ];

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Welcome Section */}
      <div className="flex items-start justify-between border-b border-white/10 pb-8">
        <div>
          <h2 className="mb-2 text-4xl font-bold uppercase tracking-tighter">
            WELCOME BACK,{' '}
            <span className="text-primary">{currentUser?.role}</span>
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Activity className="h-3 w-3 text-primary" />
            SYSTEM OVERVIEW & RECENT ACTIVITY
            {activePortfolio && (
              <>
                <span className="mx-2 opacity-20">|</span>
                <span className="text-foreground">
                  Filtering by: {activePortfolio}
                </span>
              </>
            )}
          </div>
        </div>
        <Badge className="rounded-full border border-white/10 bg-secondary px-4 py-1 font-medium text-primary shadow-sm">
          v1.4.2-STABLE
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="group rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <stat.icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            </div>
            <div className="mb-1 text-3xl font-black tracking-tighter">
              {isLoading ? <Skeleton className="h-9 w-16" /> : stat.value}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {stat.name}
            </div>
            <div className="mt-4 border-t border-border pt-4 text-[9px] font-black uppercase tracking-widest text-primary/70">
              {isLoading ? <Skeleton className="h-3 w-20" /> : stat.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left/Main Column (8 Units) */}
        <div className="space-y-8 lg:col-span-8">
          {/* Portfolio Distribution */}
          <div className="rounded-2xl border border-white/10 bg-card/50 p-8 shadow-sm backdrop-blur-xl">
            <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-ultrawide">
                  Portfolio Distribution
                </h3>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] font-bold uppercase leading-none opacity-60"
              >
                Live Clusters
              </Badge>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))
              ) : liveStats?.breakdown?.length === 0 ? (
                <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
                  No active portfolios tracked
                </div>
              ) : (
                liveStats?.breakdown?.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-secondary/10 p-4 transition-all hover:border-primary/50 hover:bg-secondary/20"
                  >
                    <span className="text-xs font-bold uppercase tracking-tight">
                      {item.name}
                    </span>
                    <div className="flex gap-6">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-primary">
                          {item.visitorCount || 0}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                          Visitors
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-foreground">
                          {item.blogCount}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                          Blogs
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-foreground">
                          {item.projectCount}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                          Projects
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Large Lead Velocity Chart */}
          <div className="rounded-2xl border border-white/10 bg-card/50 p-8 shadow-sm backdrop-blur-xl">
            <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-ultrawide">
                  Lead Generation Velocity
                </h3>
              </div>
              <Select
                value={leadMonths.toString()}
                onChange={(e) => setLeadMonths(Number(e.target.value))}
                wrapperClassName="w-40 shrink-0"
                className="h-9 border-white/10 bg-secondary/50 text-[11px] font-bold uppercase tracking-wide"
              >
                <option value="3">Last 3 Months</option>
                <option value="6">Last 6 Months</option>
                <option value="12">Last 12 Months</option>
              </Select>
            </div>
            <div className="min-h-[300px]">
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : liveStats?.leadsMonthly?.length > 0 ? (
                <LeadGrowthChart data={liveStats.leadsMonthly} />
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  No movement detected in funnel
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right/Sidebar Column (4 Units) */}
        <div className="space-y-8 lg:col-span-4">
          {/* Conversion Funnel */}
          <div className="rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <Target className="h-4 w-4 text-primary" />
              Conversion Funnel
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                    Total Leads
                  </p>
                  <p className="text-2xl font-black">
                    {isLoading ? '...' : liveStats?.totalLeads}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                    Conv. Rate
                  </p>
                  <p className="text-2xl font-black text-primary">
                    {isLoading ? '...' : liveStats?.conversionRate}%
                  </p>
                </div>
              </div>
              <div className="space-y-1 border-t border-border pt-4">
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-tight">
                    Active Inbound
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Engine */}
          <div className="rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <Zap className="h-4 w-4 text-primary" />
              Traffic Engine
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                    Sessions
                  </p>
                  <p className="text-2xl font-black">
                    {isLoading ? '...' : liveStats?.traffic?.totalSessions}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                    Bounce
                  </p>
                  <p className="text-2xl font-black text-primary">
                    {isLoading ? '...' : `${liveStats?.traffic?.bounceRate}%`}
                  </p>
                </div>
              </div>
              <div className="space-y-1 border-t border-border pt-4">
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                  Avg. Duration
                </p>
                <p className="text-[10px] font-black uppercase tracking-tight">
                  {isLoading
                    ? '...'
                    : `${liveStats?.traffic?.averageDuration} Seconds`}
                </p>
              </div>
            </div>
          </div>

          {/* Newsletter Engine */}
          <div className="rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <Mail className="h-4 w-4 text-primary" />
              Newsletter Hub
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                    Campaigns
                  </p>
                  <p className="text-2xl font-black">
                    {isLoading ? '...' : liveStats?.campaigns}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                    Analytics
                  </p>
                  <p className="text-2xl font-black text-primary">
                    {isLoading ? '...' : liveStats?.analytics}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Infrastructure */}
          <div className="rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <Server className="h-4 w-4 text-muted-foreground" />
              Infrastructure
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">
                  Categories
                </span>
                <span className="text-[10px] font-black">
                  {isLoading ? '...' : liveStats?.categories}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">
                  Users
                </span>
                <span className="text-[10px] font-black">
                  {isLoading ? '...' : liveStats?.users}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">
                  Node Env
                </span>
                <Badge variant="default" className="h-4 px-2 py-0 text-[8px]">
                  {process.env.NODE_ENV === 'development' ? 'DEVELOPMENT' : 'PRODUCTION'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
