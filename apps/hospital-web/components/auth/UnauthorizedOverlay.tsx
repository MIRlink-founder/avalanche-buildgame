'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@mire/ui/components/button';
import { ShieldAlert } from 'lucide-react';

interface UnauthorizedOverlayProps {
  message?: string;
}

export function UnauthorizedOverlay({
  message = '이 기능은 마스터 관리자만 사용할 수 있습니다.'
}: UnauthorizedOverlayProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md">
      <div className="mx-4 max-w-md rounded-lg bg-white p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-orange-100 p-4">
            <ShieldAlert className="h-12 w-12 text-orange-600" />
          </div>
        </div>

        <h2 className="mb-3 text-center text-xl font-bold text-gray-900">
          접근 권한이 없습니다
        </h2>

        <p className="mb-6 text-center text-gray-600">
          {message}
        </p>

        <Button
          onClick={() => router.push('/dashboard')}
          className="w-full"
          size="lg"
        >
          대시보드로 돌아가기
        </Button>
      </div>
    </div>
  );
}
