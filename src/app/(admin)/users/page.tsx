'use client';

import React, { useState } from 'react';
import {
  Plus,
  Users,
  Edit,
  Trash2,
  ShieldCheck,
  Loader2,
  Mail,
  Fingerprint,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/use-users';
import { usePortfolios } from '@/hooks/use-portfolios';
import { Skeleton } from '@/components/ui/skeleton';
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserRole, UserSchema } from '@/schemas/cms';
import { User } from '@/types/cms';
import { useAuth } from '@/providers/AuthProvider';
import { hasPermission, CmsPermission } from '@/lib/auth';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading } = useUsers();
  const { data: portfolios = [] } = usePortfolios();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(editingUser?._id || '');
  const deleteMutation = useDeleteUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<User>({
    resolver: zodResolver(UserSchema.omit({ _id: true })),
    defaultValues: {
      email: '',
      role: UserRole.ADMIN,
      portfolios: [],
    },
  });

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      reset(user);
    } else {
      setEditingUser(null);
      reset({ email: '', role: UserRole.ADMIN, portfolios: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset();
  };

  const onSubmit = (data: User) => {
    if (editingUser) {
      updateMutation.mutate(data, {
        onSuccess: () => closeModal(),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => closeModal(),
      });
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const handleDeleteTrigger = (id: string) => {
    setTargetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!targetId) return;
    deleteMutation.mutate(targetId, {
      onSuccess: () => setConfirmOpen(false),
    });
  };

  return (
    <div className="relative min-h-full space-y-12 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold uppercase tracking-tight">
            Administrators
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Manage system access and roles
          </p>
        </div>
        {hasPermission(currentUser, CmsPermission.CAN_EDIT_USERS) && (
          <Button onClick={() => openModal()} className="gap-2">
            <Plus className="h-4 w-4" />
            INVITE OPERATOR
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="space-y-4 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-border bg-secondary/10 py-20 text-center">
            <div className="flex flex-col items-center gap-4 opacity-40">
              <Users className="h-12 w-12" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-ultrawide">
                  No operators registered in the system
                </p>
                <p className="mt-1 text-[8px] uppercase tracking-widest">
                  Authorized personnel must be invited to access this
                  infrastructure.
                </p>
              </div>
            </div>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="group border-2 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:border-primary"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="border-2 border-border bg-secondary p-2 text-primary transition-colors group-hover:border-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold lowercase tracking-tight">
                      {user.email.split('@')[0]}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-primary">
                      <ShieldCheck className="h-3 w-3" />
                      {user.role}
                    </div>
                  </div>
                </div>
                {hasPermission(currentUser, CmsPermission.CAN_EDIT_USERS) && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openModal(user)}
                      className="h-8 w-8 hover:bg-secondary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTrigger(user._id)}
                      className="h-8 w-8 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 truncate border-2 border-border bg-secondary/20 p-2 font-mono text-xs">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2 border border-border/30 bg-secondary/10 p-1 px-2 font-mono text-[9px] text-muted-foreground">
                  <Fingerprint className="h-3 w-3" />
                  UID: {user._id}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="p-8 sm:max-w-md">
          <DialogHeader className="mb-6 border-none p-0">
            <DialogTitle>
              {editingUser ? 'Modify Credentials' : 'Authorize New Operator'}
            </DialogTitle>
            <DialogDescription>
              Set system access and permissions for this operator.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {(createMutation.error || updateMutation.error) && (
              <div className="animate-in fade-in slide-in-from-top-1 border-2 border-destructive bg-destructive/10 p-3 text-[10px] font-bold uppercase text-destructive">
                {
                  ((createMutation.error || updateMutation.error) as Error)
                    .message
                }
              </div>
            )}
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                {...register('email')}
                placeholder="operator@saadqadir.com"
              />
              {errors.email && (
                <p className="text-[9px] font-bold uppercase text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Access Protocol (Role)</Label>
              <Select {...register('role')}>
                <option value={UserRole.ADMIN}>Admin (Global Access)</option>
                <option value={UserRole.EDITOR}>
                  Editor (Assigned Portfolios)
                </option>
                <option value={UserRole.VIEWER}>Viewer (Read-Only)</option>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
                PORTFOLIO ASSIGNMENTS
              </Label>
              <div className="custom-scrollbar grid max-h-40 grid-cols-2 gap-3 overflow-y-auto pr-2">
                {portfolios.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center gap-3 border-2 border-foreground bg-secondary/10 p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors hover:bg-secondary/20"
                  >
                    <input
                      type="checkbox"
                      id={`p-${p._id}`}
                      value={p._id}
                      {...register('portfolios')}
                      className="h-4 w-4 cursor-pointer accent-primary"
                    />
                    <label
                      htmlFor={`p-${p._id}`}
                      className="cursor-pointer select-none truncate text-[9px] font-bold uppercase"
                    >
                      {p.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-[8px] italic text-muted-foreground">
                * Admin role bypasses these assignments for global visibility.
              </p>
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-8"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {editingUser ? 'AUTHORIZE CHANGES' : 'INVITE OPERATOR'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <BrutalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="TERMINATE ACCESS?"
        message="Are you sure you want to revoke access for this operator? They will no longer be able to log in to the CMS."
        confirmText="REVOKE ACCESS"
      />
    </div>
  );
}
