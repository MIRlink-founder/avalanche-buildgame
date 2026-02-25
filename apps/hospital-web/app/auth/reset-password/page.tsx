import { Suspense } from 'react';
import Navigation from '@/components/layout/Navigation';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Navigation />
      <div className="w-full max-w-4xl space-y-6 rounded-lg border bg-card p-12 shadow-sm">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">확인 중...</p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
