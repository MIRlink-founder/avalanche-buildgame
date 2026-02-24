'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mire/ui';
import { Checkbox } from '@mire/ui';

// 사전 정보 (진료 기록 생성용)
export interface PreInfo {
  treatmentDate: string;
  birthDate: string;
  gender: 'M' | 'F';
  phm: string[];
}

const PHM_NONE = 'none';

export const PHM_OPTIONS: { value: string; label: string }[] = [
  { value: PHM_NONE, label: '해당 사항 없음' },
  { value: 'hypertension', label: '고혈압' },
  { value: 'diabetes', label: '당뇨' },
  { value: 'hyperlipidemia', label: '고지혈' },
  { value: 'antithrombotic', label: '항혈전제' },
  { value: 'hepatitis', label: '간염' },
  { value: 'tuberculosis', label: '결핵' },
  { value: 'kidney_dialysis', label: '신장투석' },
  { value: 'gastrointestinal', label: '위장장애' },
  { value: 'mronj', label: '골다공증약 (MRONJ 유발약제)' },
  { value: 'prostate', label: '전립선' },
  { value: 'chronic_renal', label: '만성 신부전' },
  { value: 'cancer', label: '암' },
  { value: 'thyroid', label: '갑상선' },
  { value: 'heart_disease', label: '심장질환' },
  { value: 'liver_cirrhosis', label: '만성간경화' },
];

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export type PreInfoModalMode = 'full' | 'dateOnly';

export interface PreInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // full: 신규 환자(전체 입력), dateOnly: 기존 환자(진료일만)
  mode?: PreInfoModalMode;
  initial?: Partial<PreInfo>;
  onComplete: (data: PreInfo) => void;
}

// 사전 정보 입력 모달
export function PreInfoModal({
  open,
  onOpenChange,
  mode = 'full',
  initial,
  onComplete,
}: PreInfoModalProps) {
  const [treatmentDate, setTreatmentDate] = useState(getTodayString());
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? '');
  const [gender, setGender] = useState<'M' | 'F'>(initial?.gender ?? 'M');
  const [phm, setPhm] = useState<string[]>(initial?.phm ?? []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTreatmentDate(initial?.treatmentDate ?? getTodayString());
      setBirthDate(initial?.birthDate ?? '');
      setGender(initial?.gender ?? 'M');
      setPhm(initial?.phm ?? []);
      setError(null);
    }
  }, [
    open,
    initial?.treatmentDate,
    initial?.birthDate,
    initial?.gender,
    initial?.phm,
  ]);

  const handlePhmChange = (value: string, checked: boolean) => {
    if (value === PHM_NONE) {
      setPhm(checked ? [PHM_NONE] : []);
      return;
    }
    if (checked) {
      setPhm((prev) => [...prev.filter((v) => v !== PHM_NONE), value]);
    } else {
      setPhm((prev) => prev.filter((v) => v !== value));
    }
  };

  const handleBirthDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 8);
    setBirthDate(v);
  };

  const handleSubmit = () => {
    setError(null);
    if (mode === 'full' && !/^\d{8}$/.test(birthDate)) {
      setError('생년월일을 8자리 숫자로 입력해주세요.');
      return;
    }
    const phmFiltered =
      mode === 'full'
        ? phm.filter((v) => v !== PHM_NONE)
        : (initial?.phm ?? []);
    onComplete({
      treatmentDate,
      birthDate: mode === 'dateOnly' ? (initial?.birthDate ?? '') : birthDate,
      gender: mode === 'dateOnly' ? (initial?.gender ?? 'M') : gender,
      phm: phmFiltered,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogTitle>
          {mode === 'dateOnly' ? '진료일 입력' : '사전 정보 입력'}
        </DialogTitle>

        <div className="mt-6 space-y-6">
          {/* 진료일 입력 */}
          <div className="space-y-4">
            <Label htmlFor="treatmentDate">진료일 입력</Label>
            <input
              id="treatmentDate"
              type="date"
              value={treatmentDate}
              onChange={(e) => setTreatmentDate(e.target.value)}
              className="mt-1 h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* 기본 정보 입력 (full 모드만) */}
          {mode === 'full' && (
            <div className="space-y-4">
              <Label className="block">기본 정보 입력</Label>
              <div>
                <Label
                  htmlFor="birthDate"
                  className="text-sm text-muted-foreground"
                >
                  생년월일
                </Label>
                <Input
                  id="birthDate"
                  type="text"
                  inputMode="numeric"
                  placeholder="생년월일 8자리(예: 19950101)"
                  value={birthDate}
                  onChange={handleBirthDateInput}
                />
              </div>
              <div>
                <span className="text-sm text-muted-foreground">성별</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'M'}
                      onChange={() => setGender('M')}
                      className="h-4 w-4"
                    />
                    <span>남성</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'F'}
                      onChange={() => setGender('F')}
                      className="h-4 w-4"
                    />
                    <span>여성</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PHM 선택 (full 모드만) */}
          {mode === 'full' && (
            <div className="space-y-4">
              <Label className="block">PHM 선택</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {PHM_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={phm.includes(opt.value)}
                      onCheckedChange={(checked) =>
                        handlePhmChange(opt.value, checked === true)
                      }
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            size="xl"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
          <Button className="flex-1" size="xl" onClick={handleSubmit}>
            완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
