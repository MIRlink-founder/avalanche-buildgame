import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faClipboard,
  faFileLines,
} from '@fortawesome/free-regular-svg-icons';
import { Button } from '@mire/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';

export default function AdminHome() {
  return (
    <section className="space-y-5">
      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FontAwesomeIcon
              icon={faChartBar}
              className="text-primary size-5"
            />
            운영사 대시보드
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            병원별 정산과 결제 현황을 한 곳에서 관리합니다.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border bg-background">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FontAwesomeIcon
                icon={faFileLines}
                className="text-primary size-4"
              />
              월별 정산 리스트
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              병원별 정산 상태와 지급 내역을 필터로 빠르게 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground text-xs font-semibold">
              정산 관리
            </p>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/admin/settlements">정산 리스트 열기</Link>
            </Button>
            <span className="text-muted-foreground text-xs">
              병원 ID와 기간을 준비해 주세요.
            </span>
          </CardFooter>
        </Card>

        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FontAwesomeIcon
                icon={faClipboard}
                className="text-primary size-4"
              />
              정산 흐름
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              정산 대기 내역은 지급 처리 후 상태를 완료로 변경합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-border text-muted-foreground bg-background rounded-md border px-4 py-3 text-xs">
              조회 결과는 필터 조건에 따라 실시간으로 갱신됩니다.
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
