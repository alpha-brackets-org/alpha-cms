'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/use-auth';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const loginMutation = useLogin();

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          router.push('/');
        },
      }
    );
  };

  return (
    <div className="grain flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
            HUB<span className="text-primary">ACCESS</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-ultrawide text-muted-foreground">
            Alpha Brackets Digital Infrastructure
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-8 rounded-2xl border border-white/10 bg-card/50 p-6 shadow-2xl backdrop-blur-xl md:p-10"
        >
          {error && (
            <div className="border-2 border-destructive bg-destructive/10 p-4 text-center text-[10px] font-bold uppercase tracking-brutal text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-3 w-3" /> Identity Email
              </Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abc@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="h-3 w-3" /> Access Key
              </Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            variant="default"
            className="w-full py-6 text-sm"
          >
            {loginMutation.isPending ? 'Authenticating...' : 'Initiate Session'}
          </Button>

          <div className="pt-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Authorized Personnel Only • Encryption Active
            </p>
            <Link
              href="/forgot-password"
              className="mt-2 block text-[9px] font-bold uppercase tracking-widest opacity-40 transition-opacity hover:opacity-100"
            >
              Lost Access Key?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
