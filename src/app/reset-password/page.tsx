'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPassword } from '@/hooks/use-auth';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const resetMutation = useResetPassword();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('PASSWORDS DO NOT MATCH');
      return;
    }

    setError('');

    resetMutation.mutate(
      { token, password },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => router.push('/login'), 2000);
        },
      }
    );
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">
          INVALID OR MISSING SECURITY TOKEN
        </p>
        <Button
          onClick={() => router.push('/login')}
          variant="outline"
          className="mt-4"
        >
          Return to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md border-2 border-border bg-card p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 border-2 border-border bg-primary/10 p-4 text-primary">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tighter">
          Finalize Restore
        </h1>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Define your new encryption key
        </p>
      </div>

      {success ? (
        <div className="border-2 border-primary bg-primary/10 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            PASSWORD RESTORED SUCCESSFULLY. REDIRECTING...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                New Key
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  className="h-12 rounded-none border-2 border-border pl-10 focus:ring-0 focus:ring-offset-0"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Confirm Key
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  className="h-12 rounded-none border-2 border-border pl-10 focus:ring-0 focus:ring-offset-0"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-destructive">
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={resetMutation.isPending}
            variant="brutal"
            className="w-full py-8 text-xs"
          >
            {resetMutation.isPending ? 'ENCRYPTING...' : 'RE-ESTABLISH ACCESS'}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={<div>INITIALIZING...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
