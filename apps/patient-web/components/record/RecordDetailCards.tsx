'use client';

import { ShieldCheck } from 'lucide-react';
import type { TreatmentSheet } from '@/lib/record-types';
import type {
  ImplantPlacementFormData,
  ImplantProsthesisFormData,
  LaminateFormData,
} from '@/lib/record-types';

const TYPE_LABELS: Record<string, string> = {
  implant_placement: '임플란트 식립',
  implant_prosthesis: '임플란트 보철',
  laminate: '라미네이트',
};

function Row({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | undefined;
}) {
  if (value === undefined || value === null || value === '') return null;
  const display =
    typeof value === 'boolean' ? (value ? '사용' : '미사용') : String(value);
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 py-2 border-b border-border/50 last:border-b-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{display}</span>
    </div>
  );
}

function ImplantPlacementCard({
  tooth,
  fd,
}: {
  tooth: number;
  fd: ImplantPlacementFormData;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          🦷
        </span>
        {TYPE_LABELS.implant_placement}
      </h3>
      <div className="space-y-0">
        <Row label="치아번호" value={`#${tooth}`} />
        <Row label="Fixture" value={fd.fixture} />
        <Row label="초기고정" value={fd.initialFixation} />
        <Row label="골질" value={fd.boneQuality} />
        <Row label="각화치은" value={fd.keratinizedGingiva} />
        <Row label="상악동거상" value={fd.sinusLift} />
        {fd.sinusLiftMaterials?.length ? (
          <Row
            label="상악동 거상 재료"
            value={fd.sinusLiftMaterials.join(', ')}
          />
        ) : null}
        {fd.boneGraft?.length ? (
          <Row label="골이식" value={fd.boneGraft.join(', ')} />
        ) : null}
        <Row label="수술횟수" value={fd.surgeryCount} />
        {fd.healingInput != null && (
          <Row label="힐링 입력" value={fd.healingInput} />
        )}
        <Row label="보철시기" value={fd.prosthesisTiming} />
        <Row label="Comment" value={fd.comment} />
      </div>
    </div>
  );
}

function ImplantProsthesisCard({
  tooth,
  fd,
}: {
  tooth: number;
  fd: ImplantProsthesisFormData;
}) {
  const methodLabel =
    fd.method === '직접 입력' ? fd.methodDirectInput : fd.method;
  let abutmentLabel: string | undefined;
  if (fd.abutmentType === '직접 입력') {
    abutmentLabel = fd.abutmentDirectInput ?? fd.abutmentPreset;
  } else if (
    fd.abutmentType === 'Solid(Rigid)' ||
    fd.abutmentType === 'Transfer(SCRP)'
  ) {
    abutmentLabel = fd.abutmentSubType
      ? `${fd.abutmentType} / ${fd.abutmentSubType}`
      : fd.abutmentType;
  } else if (fd.abutmentType === '오버덴취용') {
    abutmentLabel = fd.abutmentOverdent
      ? fd.abutmentOverdent === '기타' &&
        (fd.abutmentDirectInput ?? fd.abutmentPreset)
        ? `오버덴취용 / ${fd.abutmentDirectInput ?? fd.abutmentPreset}`
        : `오버덴취용 / ${fd.abutmentOverdent}`
      : fd.abutmentType;
  } else {
    abutmentLabel = fd.abutmentType;
  }
  if (
    abutmentLabel &&
    fd.hexStatus &&
    !fd.sizeNotEntered &&
    (fd.diameter != null || fd.cuff != null || fd.height != null)
  ) {
    abutmentLabel += ` (Hex-ø=${fd.diameter ?? '-'}, C=${fd.cuff ?? '-'}, H=${fd.height ?? '-'})`;
  }
  if (abutmentLabel && fd.torque) abutmentLabel += ` -${fd.torque}`;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          🦷
        </span>
        {TYPE_LABELS.implant_prosthesis}
      </h3>
      <div className="space-y-0">
        <Row label="치아번호" value={`#${tooth}`} />
        <Row label="어벗 선택" value={abutmentLabel} />
        <Row label="방식" value={methodLabel} />
        <Row label="접착 유형" value={fd.cementationType} />
        <Row label="Comment" value={fd.comment} />
      </div>
    </div>
  );
}

function LaminateCard({ tooth, fd }: { tooth: number; fd: LaminateFormData }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          🦷
        </span>
        {TYPE_LABELS.laminate}
      </h3>
      <div className="space-y-0">
        <Row label="치아번호" value={`#${tooth}`} />
        <Row label="제조사" value={fd.manufacturer} />
        <Row label="제품명" value={fd.product} />
        <Row label="Shade" value={fd.shade} />
        <Row label="LOT" value={fd.lot} />
        <Row label="시멘트" value={fd.cement} />
        <Row label="Comment" value={fd.comment} />
      </div>
    </div>
  );
}

export function RecordDetailCards({
  treatmentSheets,
}: {
  treatmentSheets: TreatmentSheet[];
}) {
  if (!treatmentSheets.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        이 진료일에 등록된 상세 정보가 없습니다.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {treatmentSheets.map((sheet) => {
        if (sheet.type === 'implant_placement' && sheet.formData) {
          return (
            <ImplantPlacementCard
              key={sheet.id}
              tooth={sheet.tooth}
              fd={sheet.formData as ImplantPlacementFormData}
            />
          );
        }
        if (sheet.type === 'implant_prosthesis' && sheet.formData) {
          return (
            <ImplantProsthesisCard
              key={sheet.id}
              tooth={sheet.tooth}
              fd={sheet.formData as ImplantProsthesisFormData}
            />
          );
        }
        if (sheet.type === 'laminate' && sheet.formData) {
          return (
            <LaminateCard
              key={sheet.id}
              tooth={sheet.tooth}
              fd={sheet.formData as LaminateFormData}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

export function BlockchainCertSection() {
  return (
    <div className="rounded-lg bg-primary text-primary-foreground p-4 flex gap-3">
      <ShieldCheck className="size-6 shrink-0 mt-0.5" aria-hidden />
      <div>
        <h4 className="font-semibold mb-1">블록체인 인증 완료</h4>
        <p className="text-sm text-primary-foreground">
          이 진료 기록은 블록체인 기술로 보호되어 위·변조가 불가능합니다.
          언제든지 타 병원에서 신뢰할 수 있는 자료로 활용하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}
