import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines } from '@fortawesome/free-regular-svg-icons';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';
import { SettlementsClient } from './settlements-client';

export default function HospitalSettlementsPage() {
  return (
    <section className="space-y-5">
      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FontAwesomeIcon
              icon={faFileLines}
              className="text-primary size-5"
            />
            매출/정산 조회
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2 text-sm">
            결제 내역과 정산금 정보를 한 화면에서 확인합니다.
          </CardDescription>
        </CardHeader>
      </Card>

      <SettlementsClient />
    </section>
  );
}
