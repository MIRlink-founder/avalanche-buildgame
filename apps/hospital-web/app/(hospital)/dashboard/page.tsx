'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Separator } from '@mire/ui';
import { Camera, BarChart3 } from 'lucide-react';
import { BarcodeScanModal } from '@/components/dashboard/BarcodeScanModal';
import Image from 'next/image';

export default function DashboardPage() {
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);

  // TODO: API 연동 후 실제 데이터로 교체
  const monthlyReward = '450,000';
  const monthlyUploadCount = 30;
  const accumulatedReward = '5,200,000';
  const currentMonthLabel = '2026년 2월';

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center">
      {/* 상단 배너 */}
      <section className="w-full rounded-xl bg-primary/10 p-6 text-foreground">
        <div className="flex flex-wrap items-center gap-6">
          <Image src="/assets/Logo.svg" alt="Mirlink" width={120} height={20} />
          <p className="leading-relaxed text-muted-foreground">
            데이터 단절 없는 진료 환경을 구축하여, <br />
            의료의 수준을 한 단계 높이는{' '}
            <span className="font-bold text-primary">
              NO.1 덴탈 데이터 솔루션
            </span>
          </p>
        </div>
      </section>

      {/* 환자 진료 기록 조회 카드 */}
      <Card className="overflow-hidden w-full p-6">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            환자 진료 기록 조회
          </CardTitle>
          <p className="text-center font-normal text-muted-foreground">
            환자 카드의 바코드를 스캔 해 신규 진료 기록을 <br />
            작성하거나 조회 해주세요
          </p>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onClick={() => setBarcodeModalOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 py-10 transition-colors hover:border-muted-foreground/50 hover:bg-muted/70"
          >
            <Camera className="h-10 w-10 text-muted-foreground" />
            <span className="text-base font-semibold text-foreground">
              바코드 스캔 실행
            </span>
            <span className="text-sm text-muted-foreground">
              리더기로 카드를 스캔해주세요
            </span>
          </button>
        </CardContent>
      </Card>

      {/* 이번 달 실적 / 데이터 리포트 2열 */}
      <div className="grid gap-6 sm:grid-cols-2 w-full">
        <Card className="h-full p-6">
          <CardHeader>
            <CardTitle className="text-lg">이번 달 실적</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {currentMonthLabel} 리워드 예상액
              </p>
              <p className="text-4xl font-semibold text-foreground font-[Pretendard]">
                {monthlyReward}원
              </p>
            </div>
            <Separator />
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-muted-foreground">
                  이번 달 데이터 업로드
                </span>
                <span className="font-medium">{monthlyUploadCount}건</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">누적 적립액</span>
                <span className="font-medium">{accumulatedReward}원</span>
              </li>
            </ul>
            <Separator />
            <Link
              href="/settlements"
              className="block transition-opacity hover:opacity-90"
            >
              <p className="font-medium text-primary hover:underline">
                정산 내역 더보기 &gt;
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card className="h-full p-6">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <CardTitle className="text-lg">데이터 리포트</CardTitle>
            <BarChart3 className="h-8 w-8 shrink-0 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              빅데이터 분석을 통한 최신 임상 <br /> 트렌드와 통계 지표를
              제공합니다.
            </p>
            <Separator />
            <Link
              href="/reports"
              className="block transition-opacity hover:opacity-90"
            >
              <p className="font-medium text-primary hover:underline">
                리포트 확인하기 &gt;
              </p>
            </Link>
          </CardContent>
        </Card>
      </div>

      <BarcodeScanModal
        open={barcodeModalOpen}
        onOpenChange={setBarcodeModalOpen}
      />
    </div>
  );
}
