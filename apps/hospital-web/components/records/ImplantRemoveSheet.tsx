'use client';

import { Label } from '@mire/ui';
import type { ImplantRemoveFormData } from './treatment-sheet-types';

export interface ImplantRemoveSheetProps {
  value: ImplantRemoveFormData;
  onChange: (data: ImplantRemoveFormData) => void;
  readOnly?: boolean;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 py-3 border-b border-border/50 last:border-b-0 items-start">
      <Label className="text-muted-foreground text-sm">{label}</Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function ImplantRemoveSheet({
  value,
  onChange,
  readOnly = false,
}: ImplantRemoveSheetProps) {
  const update = (patch: Partial<ImplantRemoveFormData>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-0 text-sm">
      <Row label="방식">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="method"
              checked={(value.method ?? '') === '단순'}
              onChange={() => update({ method: '단순' })}
              disabled={readOnly}
              className="rounded-full border-input"
            />
            <span>임플란트 제거(단순)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="method"
              checked={(value.method ?? '') === '복잡'}
              onChange={() => update({ method: '복잡' })}
              disabled={readOnly}
              className="rounded-full border-input"
            />
            <span>임플란트 제거(복잡)</span>
          </label>
        </div>
      </Row>
      <Row label="Comment">
        <textarea
          value={value.comment ?? ''}
          onChange={(e) => update({ comment: e.target.value || undefined })}
          disabled={readOnly}
          placeholder="기타 사항을 입력 해주세요."
          rows={3}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
        />
      </Row>
    </div>
  );
}
