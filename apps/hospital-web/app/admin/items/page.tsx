import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';

export default function AdminItemPage() {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center border-b bg-background px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">물품 관리</h1>
          <p className="text-sm text-muted-foreground">물품을 관리합니다.</p>
        </div>
      </header>

      <div className="p-6">준비 중입니다.</div>
    </>
  );
}
