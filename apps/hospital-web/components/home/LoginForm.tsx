'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
import { Checkbox } from '@mire/ui/components/checkbox';

const STORAGE_KEY = 'mire_saved_email';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem(STORAGE_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('이메일 형식을 확인해주세요');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setEmailError('이메일 형식을 확인해주세요');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // accessToken 저장
        localStorage.setItem('accessToken', data.accessToken);
        // 로컬스토리지에 아이디 저장/삭제
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY, email);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }

        const role = data.user?.role;
        switch (role) {
          case 'SUPER_ADMIN': // 운영사 - 슈퍼 어드민
            router.push('/admin/hospitals');
            break;
          case 'SUB_ADMIN': // 운영사 - 하위 어드민
            router.push('/admin/hospitals');
            break;
          case 'MASTER_ADMIN': // 병원 - 마스터 어드민
            router.push('/dashboard');
            break;
          case 'DEPT_ADMIN': // 병원 - 학과 어드민
            router.push('/dashboard');
            break;
          default:
            router.push('/');
        }
      } else {
        if (response.status === 403) {
          if (data.error?.includes('탈퇴')) {
            alert('탈퇴된 계정입니다. 관리자에게 문의하세요.');
          } else if (data.error?.includes('차단')) {
            alert('운영 정책에 의해 차단된 계정입니다.');
          } else {
            alert(data.error || '로그인에 실패했습니다.');
          }
        } else {
          alert('아이디 또는 비밀번호를 확인해주세요.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && password) {
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          id="email"
          type="email"
          placeholder="아이디를 입력해주세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleEmailBlur}
          disabled={isLoading}
          className={emailError ? 'border-red-500' : ''}
        />
        {emailError && <p className="text-sm text-red-500">{emailError}</p>}
      </div>

      <div className="space-y-2">
        <Input
          id="password"
          type="password"
          placeholder="비밀번호를 입력해주세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
      </div>

      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={isLoading}
          />
          <label
            htmlFor="remember"
            className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            아이디 저장
          </label>
        </div>

        <Link
          href="/auth/reset-password"
          className="text-muted-foreground hover:text-primary cursor-pointer text-sm underline transition-colors"
        >
          비밀번호를 잊으셨나요?
        </Link>
      </div>

      <Button
        type="submit"
        size="xl"
        className="w-full"
        disabled={isLoading || !email || !password || emailError !== ''}
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </Button>

      <Link href="/auth/register">
        <Button
          size="xl"
          className="w-full bg-black text-white hover:bg-gray-800"
        >
          회원가입
        </Button>
      </Link>
    </form>
  );
}
