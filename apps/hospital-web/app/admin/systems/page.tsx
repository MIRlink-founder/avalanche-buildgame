import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';

export default function AdminSystemsPage() {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center border-b bg-background px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">시스템 설정</h1>
          <p className="text-sm text-muted-foreground">
            운영사 시스템 기본 설정을 관리합니다.
          </p>
        </div>
      </header>

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">추가 설정</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              시스템 설정 기능은 준비 중입니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
