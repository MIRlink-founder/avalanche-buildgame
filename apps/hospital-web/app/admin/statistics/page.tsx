import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCreditCard,
  faFileLines,
} from '@fortawesome/free-regular-svg-icons';
import { Badge } from '@mire/ui/components/badge';
import { Button } from '@mire/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';

export default function AdminStatisticsPage() {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center justify-between gap-4 border-b bg-background px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">정산 통계</h1>
          <p className="text-sm text-muted-foreground">
            월별 정산 흐름과 병원별 성과를 한눈에 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary-subtle text-primary text-xs font-semibold">
            2026.02 기준
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-secondary"
          >
            리포트 다운로드
          </Button>
        </div>
      </header>

      <div className="space-y-6 p-6">
        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs font-semibold">
                총 거래액
              </p>
              <p className="mt-2 text-2xl font-semibold">12,540,000원</p>
              <p className="text-muted-foreground mt-2 text-xs">
                전월 대비 +8.2%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs font-semibold">
                정산 예정
              </p>
              <p className="mt-2 text-2xl font-semibold">2,340,000원</p>
              <p className="text-muted-foreground mt-2 text-xs">대기 4건</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs font-semibold">
                정산 완료
              </p>
              <p className="mt-2 text-2xl font-semibold">10,200,000원</p>
              <p className="text-muted-foreground mt-2 text-xs">완료 12건</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs font-semibold">
                NFT 가산 적용
              </p>
              <p className="mt-2 text-2xl font-semibold">5개 병원</p>
              <p className="text-muted-foreground mt-2 text-xs">
                평균 가산율 1.5%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader className="border-border bg-secondary border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <FontAwesomeIcon
                  icon={faFileLines}
                  className="text-primary size-4"
                />
                정산 추이
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                최근 6개월 정산 흐름을 요약합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="border-border bg-secondary/60 flex h-44 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                차트 데이터를 연결하세요
              </div>
            </CardContent>
            <CardFooter className="border-border border-t px-4 py-3 text-xs text-muted-foreground">
              기준: 월별 정산 완료액 합산
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="border-border bg-secondary border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="text-primary size-4"
                />
                병원별 상위
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                이번 달 정산액 기준 상위 3개 병원
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {['이튼튼치과', '포레스트치과', '하이화이트치과'].map(
                (name, index) => (
                  <div
                    key={name}
                    className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>
                      {index + 1}. {name}
                    </span>
                    <span className="text-muted-foreground">3,200,000원</span>
                  </div>
                ),
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="border-border bg-secondary border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <FontAwesomeIcon
                  icon={faCreditCard}
                  className="text-primary size-4"
                />
                결제 수단 비중
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                카드/이체 비중을 비교합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="border-border bg-secondary/60 flex h-28 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                비중 차트 준비 중
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-border bg-secondary border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="text-primary size-4"
                />
                정산 완료율
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                이번 달 완료율 75%
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="border-border bg-secondary/60 flex h-28 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                완료율 차트 준비 중
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-border bg-secondary border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <FontAwesomeIcon
                  icon={faFileLines}
                  className="text-primary size-4"
                />
                이상 징후
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                결제 취소·실패 패턴을 모니터링합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="border-border bg-secondary/60 flex h-28 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                이상 징후 카드 준비 중
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
