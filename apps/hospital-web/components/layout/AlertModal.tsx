'use client';

import { Button } from '@mire/ui';

export interface AlertModalProps {
  // 모달 안에 보여줄 메시지
  message: string;
  // 주 액션 버튼
  primaryButton?: { label: string; onClick: () => void };
  // 보조 액션 버튼
  secondaryButton?: { label: string; onClick: () => void };
}

// 재사용 가능한 알림/확인 모달
export function AlertModal({
  message,
  primaryButton,
  secondaryButton,
}: AlertModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <p className="text-center text-foreground">{message}</p>
        {primaryButton && (
          <Button
            className="mt-6 w-full"
            size="xl"
            onClick={primaryButton.onClick}
          >
            {primaryButton.label}
          </Button>
        )}
        {secondaryButton && (
          <Button
            variant="outline"
            className="mt-6 w-full"
            size="xl"
            onClick={secondaryButton.onClick}
          >
            {secondaryButton.label}
          </Button>
        )}
      </div>
    </div>
  );
}
