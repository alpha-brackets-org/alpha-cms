'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnsubscribe } from '@/hooks/use-subscribers';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('e');
  const portfolioId = searchParams.get('p');

  const unsubscribeMutation = useUnsubscribe();

  const handleUnsubscribe = () => {
    if (!email || !portfolioId) {
      return;
    }
    unsubscribeMutation.mutate({ email, portfolioId });
  };

  const isIdle =
    !unsubscribeMutation.isPending &&
    !unsubscribeMutation.isSuccess &&
    !unsubscribeMutation.isError;
  const isPending = unsubscribeMutation.isPending;
  const isSuccess = unsubscribeMutation.isSuccess;
  const isError = unsubscribeMutation.isError || !email || !portfolioId;

  const errorMessage =
    !email || !portfolioId
      ? 'Invalid unsubscribe link. Missing required parameters.'
      : (unsubscribeMutation.error as Error)?.message ||
        'Failed to unsubscribe. Please try again later.';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border-4 border-foreground bg-card p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-8 flex items-center gap-4">
          <div className="border-4 border-foreground bg-primary p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">
            Alpha CMS
          </h1>
        </div>

        {isIdle && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-2 border-border bg-secondary/5 p-4">
              <Mail className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Subscriber
                </p>
                <p className="font-mono text-sm">{email || 'N/A'}</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed">
              Are you sure you want to unsubscribe from this newsletter? You
              will stop receiving updates and broadcasts.
            </p>

            <Button
              onClick={handleUnsubscribe}
              className="w-full py-8 font-black uppercase tracking-widest"
            >
              Confirm Unsubscribe
            </Button>
          </div>
        )}

        {isPending && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="animate-pulse font-black uppercase tracking-widest">
              Processing Protocol...
            </p>
          </div>
        )}

        {isSuccess && (
          <div className="space-y-6 py-8 text-center">
            <div className="mb-4 inline-block border-4 border-foreground bg-green-500 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-xl font-black uppercase">Unsubscribed</h2>
            <p className="text-sm text-muted-foreground">
              {unsubscribeMutation.data?.message ||
                'You have been successfully unsubscribed.'}
            </p>
            <p className="pt-4 text-[10px] font-bold uppercase text-muted-foreground/50">
              You can close this window now.
            </p>
          </div>
        )}

        {isError && (
          <div className="space-y-6 py-8 text-center">
            <div className="mb-4 inline-block border-4 border-foreground bg-destructive p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-xl font-black uppercase">Request Failed</h2>
            <p className="text-sm font-bold text-destructive">{errorMessage}</p>
            <Button
              variant="outline"
              onClick={() => unsubscribeMutation.reset()}
              className="mt-6 border-4 border-foreground"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
