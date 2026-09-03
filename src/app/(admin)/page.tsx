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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function DashboardPage() {
  const { user: currentUser } = useAuth();
  const { activePortfolio } = usePortfolio();
  const [leadMonths, setLeadMonths] = useState(6);
  const { data: statsResponse, isLoading } = useStats(leadMonths);
  const liveStats = statsResponse?.data;

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
          <h2 className="mb-2 text-4xl font-semibold tracking-tight">
            Welcome back,{' '}
            <span className="text-primary">{currentUser?.role}</span>
          </h2>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Activity className="h-3 w-3 text-primary" />
            System overview & recent activity
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
          v1.4.2-stable
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
            <div className="mb-1 text-3xl font-semibold tracking-tight">
              {isLoading ? <Skeleton className="h-9 w-16" /> : stat.value}
            </div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {stat.name}
            </div>
            <div className="mt-4 border-t border-border pt-4 text-xs uppercase tracking-wide text-primary/70">
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
                <h3 className="text-sm font-semibold">
                  Portfolio Distribution
                </h3>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-medium leading-none opacity-60"
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
                <div className="py-10 text-center text-xs text-muted-foreground opacity-50">
                  No active portfolios tracked
                </div>
              ) : (
                liveStats?.breakdown?.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-secondary/10 p-4 transition-all hover:border-primary/50 hover:bg-secondary/20"
                  >
                    <span className="text-xs font-medium">{item.name}</span>
                    <div className="flex gap-6">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-primary">
                          {item.visitorCount || 0}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Visitors
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-foreground">
                          {item.blogCount}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Blogs
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-foreground">
                          {item.projectCount}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
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
                <h3 className="text-sm font-semibold">
                  Lead Generation Velocity
                </h3>
              </div>
              <Select
                value={leadMonths.toString()}
                onValueChange={(val) => setLeadMonths(Number(val))}
              >
                <SelectTrigger className="h-9 w-40 shrink-0 border-white/10 bg-secondary/50 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 Months</SelectItem>
                  <SelectItem value="6">Last 6 Months</SelectItem>
                  <SelectItem value="12">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-h-[300px]">
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : liveStats?.leadsMonthly &&
                liveStats.leadsMonthly.length > 0 ? (
                <LeadGrowthChart data={liveStats.leadsMonthly} />
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-muted-foreground">
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
            <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-primary" />
              Conversion Funnel
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total Leads
                  </p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? '...' : liveStats?.totalLeads}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Conv. Rate
                  </p>
                  <p className="text-2xl font-semibold text-primary">
                    {isLoading ? '...' : liveStats?.conversionRate}%
                  </p>
                </div>
              </div>
              <div className="space-y-1 border-t border-border pt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs font-medium">Active Inbound</span>
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Engine */}
          <div className="rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold">
              <Zap className="h-4 w-4 text-primary" />
              Traffic Engine
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Sessions
                  </p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? '...' : liveStats?.traffic?.totalSessions}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Bounce
                  </p>
                  <p className="text-2xl font-semibold text-primary">
                    {isLoading ? '...' : `${liveStats?.traffic?.bounceRate}%`}
                  </p>
                </div>
              </div>
              <div className="space-y-1 border-t border-border pt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Avg. Duration
                </p>
                <p className="text-xs font-medium">
                  {isLoading
                    ? '...'
                    : `${liveStats?.traffic?.averageDuration} Seconds`}
                </p>
              </div>
            </div>
          </div>

          {/* Newsletter Engine */}
          <div className="rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold">
              <Mail className="h-4 w-4 text-primary" />
              Newsletter Hub
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Campaigns
                  </p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? '...' : liveStats?.campaigns}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Analytics
                  </p>
                  <p className="text-2xl font-semibold text-primary">
                    {isLoading ? '...' : liveStats?.analytics}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Infrastructure */}
          <div className="rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Server className="h-4 w-4 text-muted-foreground" />
              Infrastructure
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs text-muted-foreground">
                  Categories
                </span>
                <span className="text-xs font-semibold">
                  {isLoading ? '...' : liveStats?.categories}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs text-muted-foreground">Users</span>
                <span className="text-xs font-semibold">
                  {isLoading ? '...' : liveStats?.users}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Node Env</span>
                <Badge variant="default" className="h-4 px-2 py-0 text-xs">
                  {process.env.NODE_ENV === 'development'
                    ? 'Development'
                    : 'Production'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
