'use client';

import { Label } from '@mire/ui';
import type { LaminateFormData } from './treatment-sheet-types';

export interface LaminateSheetProps {
  value: LaminateFormData;
  onChange: (data: LaminateFormData) => void;
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

export function LaminateSheet({
  value,
  onChange,
  readOnly = false,
}: LaminateSheetProps) {
  const update = (patch: Partial<LaminateFormData>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-0 text-sm">
      <Row label="제조사">
        <input
          type="text"
          value={value.manufacturer ?? ''}
          onChange={(e) =>
            update({ manufacturer: e.target.value || undefined })
          }
          disabled={readOnly}
          className="border-input bg-background h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Row>
      <Row label="제품명">
        <input
          type="text"
          value={value.product ?? ''}
          onChange={(e) => update({ product: e.target.value || undefined })}
          disabled={readOnly}
          className="border-input bg-background h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Row>
      <Row label="Shade">
        <input
          type="text"
          value={value.shade ?? ''}
          onChange={(e) => update({ shade: e.target.value || undefined })}
          disabled={readOnly}
          className="border-input bg-background h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Row>
      <Row label="LOT">
        <input
          type="text"
          value={value.lot ?? ''}
          onChange={(e) => update({ lot: e.target.value || undefined })}
          disabled={readOnly}
          className="border-input bg-background h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Row>
      <Row label="시멘트">
        <input
          type="text"
          value={value.cement ?? ''}
          onChange={(e) => update({ cement: e.target.value || undefined })}
          disabled={readOnly}
          className="border-input bg-background h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
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
