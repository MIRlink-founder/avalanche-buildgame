'use client';

import { Button } from '@mire/ui';
import { SquarePen } from 'lucide-react';
import { formatBirthDateDisplay } from './constants';
import { PHM_OPTIONS } from './PreInfoModal';

export interface PatientInfoBarProps {
  patientId: string;
  treatmentDate: string;
  birthDate?: string;
  gender?: 'M' | 'F';
  phmLabel?: string[];
  showPhmEdit?: boolean;
  onPhmEdit?: () => void;
}

export function PatientInfoBar({
  treatmentDate,
  birthDate = '',
  gender,
  phmLabel,
  showPhmEdit,
  onPhmEdit,
}: PatientInfoBarProps) {
  const treatmentDateDisplay = treatmentDate.replace(/-/g, '.');

  return (
    <div className="flex gap-1 items-center">
      <div className="text-foreground text-sm flex flex-wrap gap-2 items-center">
        {treatmentDate !== undefined && (
          <span className="flex items-center rounded-full bg-primary/20 px-4 py-1.5">
            진료일: {treatmentDateDisplay}
          </span>
        )}
        {birthDate !== undefined && (
          <span className="flex items-center rounded-full bg-primary/20 px-4 py-1.5">
            환자 나이: {formatBirthDateDisplay(birthDate)}
          </span>
        )}
        {gender !== undefined && (
          <span className="flex items-center rounded-full bg-primary/20 px-4 py-1.5">
            성별: {gender === 'M' ? '남' : '여'}
          </span>
        )}
        {phmLabel !== undefined && (
          <span className="flex items-center rounded-full bg-primary/20 px-4 py-1.5">
            PHM:{' '}
            {phmLabel.length
              ? phmLabel
                  .map(
                    (phm: string) =>
                      PHM_OPTIONS.find((o) => o.value === phm)?.label ?? phm,
                  )
                  .filter(Boolean)
                  .join(', ')
              : '해당 사항 없음'}
          </span>
        )}
      </div>
      {showPhmEdit && onPhmEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onPhmEdit}
        >
          <SquarePen className="h-4 w-4" aria-hidden />
        </Button>
      )}
    </div>
  );
}
