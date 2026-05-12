'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Target,
  FileText,
  Calendar,
  Mail,
} from 'lucide-react';
import { useLeads, useUpdateLead } from '@/hooks/use-leads';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LeadStatus } from '@/schemas/cms';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useState } from 'react';

export default function LeadDetailPage() {
  const { id } = useParams() as { id: string };
  const { toast } = useToast();

  const { data: leadsResponse, isLoading } = useLeads();
  const updateMutation = useUpdateLead();

  const [newNote, setNewNote] = useState('');
  const [status, setStatus] = useState<LeadStatus>(LeadStatus.NEW);

  const lead = leadsResponse?.data?.find((l) => l._id === id);

  useEffect(() => {
    if (lead) {
      setStatus(lead.status as LeadStatus);
    }
  }, [lead]);

  const handleAddNote = () => {
    if (!newNote.trim() || !lead) return;

    const noteEntry = {
      content: newNote.trim(),
      adminName: 'Admin', // Placeholder, could be from user session
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [...(lead.notes || []), noteEntry];

    updateMutation.mutate(
      { id: id as string, data: { notes: updatedNotes } },
      {
        onSuccess: () => {
          setNewNote('');
          toast({
            title: 'NOTE ADDED',
            description: 'Engagement history updated.',
          });
        },
      }
    );
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    setStatus(newStatus);
    updateMutation.mutate(
      { id: id as string, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({
            title: 'STATUS UPDATED',
            description: `Lead moved to ${newStatus.toUpperCase()}`,
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Lead not found.
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b-2 border-border bg-secondary/80 p-4 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/leads"
            className="border-2 border-transparent p-2 transition-all hover:border-border hover:bg-background"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest">
              Lead Profile
            </h2>
            <p className="font-mono text-[9px] lowercase text-primary">
              /leads/{id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            AUTO-SAVE ACTIVE
          </Badge>
        </div>
      </div>

      <div className="flex-1 space-y-8 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Info Card */}
          <div className="space-y-8 lg:col-span-2">
            <div className="border-2 border-border bg-card p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-start justify-between border-b-2 border-border pb-6">
                <div>
                  <h1 className="text-4xl font-bold uppercase tracking-tight text-primary">
                    {lead.firstName} {lead.lastName}
                  </h1>
                  <div className="mt-2 flex items-center gap-4 font-mono text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {lead.email}
                    </span>
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </span>
                    )}
                  </div>
                </div>
                <Badge
                  variant={
                    status === LeadStatus.QUALIFIED ? 'default' : 'secondary'
                  }
                  className="px-4 py-1 text-sm"
                >
                  {status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Building2 className="h-3 w-3" /> Company
                  </Label>
                  <p className="text-lg font-bold">
                    {lead.company || 'Not Provided'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <User className="h-3 w-3" /> Job Title
                  </Label>
                  <p className="text-lg font-bold">
                    {lead.jobTitle || 'Not Provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Label className="mb-4 flex items-center gap-2 border-b-2 border-border pb-3 text-xs font-bold uppercase tracking-ultrawide">
                <FileText className="h-4 w-4 text-primary" /> Engagement History
                & Notes
              </Label>

              <div className="mb-6 flex flex-col gap-3">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type a new internal note or update..."
                  rows={3}
                  className="resize-none font-mono text-xs"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || updateMutation.isPending}
                  className="self-end px-6 text-[10px] font-bold"
                >
                  ADD NOTE TO TIMELINE
                </Button>
              </div>

              <div className="space-y-4">
                {lead.notes && lead.notes.length > 0 ? (
                  lead.notes
                    .slice()
                    .reverse()
                    .map((note, i) => (
                      <div
                        key={i}
                        className="relative border-l-2 border-primary/20 pb-4 pl-4 last:pb-0"
                      >
                        <div className="absolute -left-[9px] top-0 h-4 w-4 border-2 border-primary bg-background" />
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-primary">
                            {note.adminName || 'Admin'}
                          </span>
                          <span className="font-mono text-[9px] text-muted-foreground">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                          {note.content}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="py-8 text-center text-xs italic text-muted-foreground">
                    No engagement history recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="border-2 border-border bg-secondary/30 p-6">
              <Label className="mb-4 flex items-center gap-2 border-b-2 border-border/50 pb-3 text-xs font-bold uppercase tracking-ultrawide">
                <Target className="h-4 w-4 text-primary" /> Qualification
              </Label>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <Select
                    value={status}
                    onChange={(e) =>
                      handleStatusChange(e.target.value as LeadStatus)
                    }
                  >
                    {Object.values(LeadStatus).map((s) => (
                      <option key={s} value={s}>
                        {s.toUpperCase()}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-2 border-border bg-card p-6">
              <Label className="mb-4 flex items-center gap-2 border-b-2 border-border pb-3 text-xs font-bold uppercase tracking-ultrawide">
                <Calendar className="h-4 w-4 text-primary" /> Acquisition Data
              </Label>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    Source
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {lead.source === 'case_study'
                      ? 'CASE STUDY DOWNLOAD'
                      : lead.source.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">
                    Downloaded Content
                  </p>
                  {lead.downloadedItems && lead.downloadedItems.length > 0 ? (
                    <div className="space-y-2">
                      {lead.downloadedItems.map((item, i) => (
                        <div
                          key={i}
                          className="truncate rounded-sm border border-border/50 bg-secondary/50 p-2 font-mono text-xs"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">
                      No downloads recorded.
                    </p>
                  )}
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    Captured At
                  </p>
                  <p className="mt-1 font-mono text-xs">
                    {new Date(lead.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
