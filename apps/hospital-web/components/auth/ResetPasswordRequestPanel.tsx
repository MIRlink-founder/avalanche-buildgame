'use client';

import { useEffect, useState } from 'react';
import { Button } from '@mire/ui/components/button';
import { getPayloadFromToken } from '@/lib/decode-token';

type RequestResponse = {
  success: boolean;
  mailSent: boolean;
  resetLink?: string;
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

interface ResetPasswordRequestPanelProps {
  variant?: 'card' | 'embedded';
  showTitle?: boolean;
  showFootnote?: boolean;
  buttonFullWidth?: boolean;
  inlineMessage?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ResetPasswordRequestPanel({
  variant = 'card',
  showTitle = true,
  showFootnote = true,
  buttonFullWidth = variant === 'card',
  inlineMessage,
}: ResetPasswordRequestPanelProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [mailSent, setMailSent] = useState<boolean | null>(null);
  const [resetLink, setResetLink] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const payload = token ? getPayloadFromToken(token) : null;
    if (payload?.email) {
      setEmail(payload.email);
    }
  }, []);

  const handleSend = async () => {
    if (!email.trim()) {
      setError('로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
      setStatus('error');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('이메일 형식을 확인해주세요');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setError('');
    setMailSent(null);
    setResetLink('');

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = (await response.json().catch(() => ({}))) as
        | RequestResponse
        | { error?: string };

      if (!response.ok || !(data as RequestResponse).success) {
        setError(
          (data as { error?: string }).error ||
            '재설정 링크 발송에 실패했습니다',
        );
        setStatus('error');
        return;
      }

      const payload = data as RequestResponse;
      setMailSent(payload.mailSent);
      setResetLink(payload.resetLink ?? '');
      setStatus('sent');
    } catch (sendError) {
      console.error(sendError);
      setError('재설정 링크 발송 중 오류가 발생했습니다');
      setStatus('error');
    }
  };

  const Wrapper = variant === 'card' ? 'section' : 'div';
  const wrapperClass =
    variant === 'card'
      ? 'space-y-4 rounded-lg border bg-card p-6'
      : 'space-y-2';
  const buttonSize = variant === 'embedded' ? 'xl' : 'default';
  const buttonClassName = buttonFullWidth ? 'w-full' : 'w-full md:w-auto';
  const inlineText =
    status === 'sent' && mailSent
      ? '등록된 이메일로 재설정 링크를 발송했습니다. 메일을 확인해주세요.'
      : !email
        ? '로그인 정보를 확인할 수 없습니다.'
        : inlineMessage;

  return (
    <Wrapper className={wrapperClass}>
      {showTitle && (
        <div className="space-y-1">
          <h3 className="text-base font-semibold">비밀번호 재설정</h3>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size={buttonSize}
          onClick={handleSend}
          disabled={status === 'sending' || !email}
          className={buttonClassName}
        >
          {status === 'sending' ? '발송 중...' : '재설정 링크 발송'}
        </Button>
        {inlineText && (
          <p className="text-muted-foreground text-xs">{inlineText}</p>
        )}
      </div>

      {status === 'error' && error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {status === 'sent' && !mailSent && resetLink && (
        <div className="border-border bg-secondary/40 rounded-md border px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground">
              메일 발송에 실패했습니다. 아래 버튼으로 재설정 페이지를
              열어주세요.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                window.location.href = resetLink;
              }}
            >
              재설정 페이지 열기
            </Button>
          </div>
        </div>
      )}

      {showFootnote && (
        <p className="text-muted-foreground text-xs">
          재설정 링크는 발송 후 1시간 동안만 유효합니다.
        </p>
      )}
    </Wrapper>
  );
}
