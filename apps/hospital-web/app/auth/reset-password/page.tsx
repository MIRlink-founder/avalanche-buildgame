import Image from 'next/image';
import { OnboardingCarousel } from '@/components/home/OnboardingCarousel';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden p-8 lg:flex lg:w-1/2">
        <OnboardingCarousel />
      </div>
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <div className="mb-4 flex items-center justify-center">
              <Image
                src="/assets/Logo.svg"
                alt="MI;Re Logo"
                width={200}
                height={40}
                priority
              />
            </div>
          </div>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
