'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPassword } from '@/hooks/use-auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const forgotMutation = useForgotPassword();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    forgotMutation.mutate(email, {
      onSuccess: (data) => {
        setMessage(data.message);
      },
      onError: (err) => {
        setError(err.message || 'REQUEST FAILED');
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md border-2 border-border bg-card p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 border-2 border-border bg-destructive/10 p-4">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">
            Security Restore
          </h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Initiate password recovery protocol
          </p>
        </div>

        {message ? (
          <div className="space-y-6">
            <div className="border-2 border-primary bg-primary/10 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {message}
              </p>
            </div>
            <Link href="/login" className="block w-full">
              <Button
                variant="brutal"
                className="w-full uppercase tracking-widest"
              >
                Return to Base
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Operator Email
              </Label>
              <Input
                type="email"
                required
                className="h-12 rounded-none border-2 border-border focus:ring-0 focus:ring-offset-0"
                placeholder="OPERATOR@ALPHABRACKETS.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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
              disabled={forgotMutation.isPending}
              variant="brutal"
              className="w-full py-8 text-xs"
            >
              {forgotMutation.isPending
                ? 'TRANSMITTING...'
                : 'REQUEST RESTORE LINK'}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-40 transition-opacity hover:opacity-100"
            >
              <ArrowLeft className="h-3 w-3" />
              Abort Operation
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
