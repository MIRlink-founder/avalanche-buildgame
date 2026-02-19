import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines } from '@fortawesome/free-regular-svg-icons';
import { Button } from '@mire/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';
import { SettlementsClient } from './settlements-client';

export default function SettlementsPage() {
  return (
    <section className="space-y-5">
      <Card className="border-border bg-secondary">
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
              Settlements
            </p>
            <CardTitle className="mt-2 flex items-center gap-2 text-2xl">
              <FontAwesomeIcon
                icon={faFileLines}
                className="text-primary size-5"
              />
              월별 정산 리스트
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2 text-sm">
              병원별 정산 내역을 확인하고 지급 상태를 관리하세요.
            </CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/admin">정산 관리로</Link>
          </Button>
        </CardHeader>
      </Card>

      <SettlementsClient />
    </section>
  );
}
