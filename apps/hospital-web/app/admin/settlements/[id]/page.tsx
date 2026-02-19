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
import { SettlementDetailClient } from './settlement-detail-client';

type SettlementDetailPageProps = {
  params: {
    id: string;
  };
};

export default function SettlementDetailPage({
  params,
}: SettlementDetailPageProps) {
  return (
    <section className="space-y-5">
      <Card className="border-border bg-secondary">
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FontAwesomeIcon
                icon={faFileLines}
                className="text-primary size-5"
              />
              정산 상세
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2 text-sm">
              정산 ID #{params.id} 상세 정보와 결제/이체 내역을 확인합니다.
            </CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/settlements">정산 조회로</Link>
          </Button>
        </CardHeader>
      </Card>

      <SettlementDetailClient settlementId={params.id} />
    </section>
  );
}
