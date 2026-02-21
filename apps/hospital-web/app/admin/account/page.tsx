import Link from 'next/link';
import { Button } from '@mire/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';

export default function AdminAccountPage() {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center border-b bg-background px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">내 계정</h1>
          <p className="text-sm text-muted-foreground">
            운영사 계정 정보와 보안 설정을 관리합니다.
          </p>
        </div>
      </header>

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">계정 보안</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              운영사 계정 비밀번호를 재설정할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/auth/reset-password">비밀번호 재설정</Link>
            </Button>
            <span className="text-muted-foreground text-xs">
              재설정 링크는 이메일로 발송됩니다.
            </span>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">추가 설정</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              계정 상세 설정 기능은 준비 중입니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
