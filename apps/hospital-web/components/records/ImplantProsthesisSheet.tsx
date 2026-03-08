'use client';

import { Label, Checkbox } from '@mire/ui';
import type { ImplantProsthesisFormData } from './treatment-sheet-types';

const METHOD_OPTIONS = ['Cement type', 'Screw type', 'SCRP type'] as const;
const CEMENTATION_OPTIONS = ['영구 접착', '임시 접착'] as const;
const ABUTMENT_OPTIONS = [
  'Solid(Rigid)',
  'Transfer(SCRP)',
  '오버덴취용',
  'UCLA',
] as const;
const ABUTMENT_SUB_SOLID_TRANSFER = [
  '기성 Abut',
  'Custom Abut',
  'Angled Abut',
  'Milling Abut',
  '지르코니아 Abut',
] as const;
const ABUTMENT_OVERDENT_OPTIONS = [
  'Ball Abut',
  'Locator',
  'Magnetic Abut',
  '기타',
] as const;
const ABUTMENT_PRESET_OPTIONS = [
  '커스텀 어버트먼트',
  '하이니스 어버트먼트',
] as const;
const TORQUE_OPTIONS = [
  '15N ↓',
  '20N',
  '25N',
  '30N',
  '35N',
  '40N',
  '45N ↑',
] as const;
const DEFAULT_TORQUE_BY_ABUTMENT: Record<string, string> = {
  'Solid(Rigid)': '25N',
  'Transfer(SCRP)': '30N',
  오버덴취용: '25N',
  UCLA: '30N',
  '직접 입력': '30N',
};
const SIZE_MIN = 0;
const SIZE_MAX = 10;

function clampSizeInput(raw: string): number | undefined {
  if (raw === '') return undefined;
  const num = Number(raw);
  if (Number.isNaN(num)) return undefined;
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, num));
}

export interface ImplantProsthesisSheetProps {
  value: ImplantProsthesisFormData;
  onChange: (data: ImplantProsthesisFormData) => void;
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

export function ImplantProsthesisSheet({
  value,
  onChange,
  readOnly = false,
}: ImplantProsthesisSheetProps) {
  const update = (patch: Partial<ImplantProsthesisFormData>) => {
    onChange({ ...value, ...patch });
  };

  const isMethodDirect = (value.method ?? '') === '직접 입력';
  const isAbutmentDirect = (value.abutmentType ?? '') === '직접 입력';
  const isTransfer = value.abutmentType === 'Transfer(SCRP)';
  const isOverdent = value.abutmentType === '오버덴취용';
  const isUCLA = value.abutmentType === 'UCLA';
  const isOverdentEtc = isOverdent && (value.abutmentOverdent ?? '') === '기타';

  const setAbutmentType = (opt: string) => {
    update({
      abutmentType: opt,
      abutmentSubType: undefined,
      abutmentZirconia: false,
      abutmentOverdent: undefined,
      abutmentPreset: undefined,
      abutmentDirectInput: undefined,
      hexStatus: undefined,
      torque: DEFAULT_TORQUE_BY_ABUTMENT[opt] ?? value.torque,
    });
  };

  return (
    <div className="space-y-0 text-sm">
      <Row label="방식">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            {METHOD_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <input
                  type="radio"
                  name="method"
                  checked={(value.method ?? '') === opt}
                  onChange={() => update({ method: opt })}
                  disabled={readOnly}
                  className="rounded-full border-input"
                />
                <span>{opt}</span>
              </label>
            ))}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="method"
                checked={isMethodDirect}
                onChange={() => update({ method: '직접 입력' })}
                disabled={readOnly}
                className="rounded-full border-input"
              />
              <span>직접 입력</span>
            </label>
          </div>
          {isMethodDirect && (
            <input
              type="text"
              value={value.methodDirectInput ?? ''}
              onChange={(e) =>
                update({ methodDirectInput: e.target.value || undefined })
              }
              disabled={readOnly}
              placeholder="방식 직접 입력"
              className="border-input bg-background h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
        </div>
      </Row>

      <Row label="접착 유형">
        <div className="flex flex-wrap gap-3">
          {CEMENTATION_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <input
                type="radio"
                name="cementationType"
                checked={(value.cementationType ?? '') === opt}
                onChange={() => update({ cementationType: opt })}
                disabled={readOnly}
                className="rounded-full border-input"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </Row>

      <Row label="어벗 선택">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {ABUTMENT_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <input
                  type="radio"
                  name="abutmentType"
                  checked={(value.abutmentType ?? '') === opt}
                  onChange={() => setAbutmentType(opt)}
                  disabled={readOnly}
                  className="rounded-full border-input"
                />
                <span>{opt}</span>
              </label>
            ))}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="abutmentType"
                checked={isAbutmentDirect}
                onChange={() => setAbutmentType('직접 입력')}
                disabled={readOnly}
                className="rounded-full border-input"
              />
              <span>직접 입력</span>
            </label>
          </div>

          {/* 어벗 타입별 박스: 선택지 + HEX(조건부) */}
          <>
            {isTransfer && (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
                <div className="flex flex-wrap gap-3">
                  {ABUTMENT_SUB_SOLID_TRANSFER.map((opt) =>
                    opt === '지르코니아 Abut' ? (
                      <label
                        key={opt}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          name="abutmentZirconia"
                          checked={value.abutmentZirconia === true}
                          onChange={(e) => {
                            update({ abutmentZirconia: e.target.checked });
                          }}
                          disabled={
                            readOnly ||
                            !(
                              value.abutmentSubType === '기성 Abut' ||
                              value.abutmentSubType === 'Custom Abut'
                            )
                          }
                          className="rounded border-input"
                        />
                        <span>{opt}</span>
                      </label>
                    ) : (
                      <label
                        key={opt}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="abutmentSubType"
                          checked={(value.abutmentSubType ?? '') === opt}
                          onChange={() => {
                            if (opt !== '기성 Abut' && opt !== 'Custom Abut') {
                              update({
                                abutmentSubType: opt,
                                abutmentZirconia: false,
                              });
                            } else {
                              update({ abutmentSubType: opt });
                            }
                          }}
                          disabled={readOnly}
                          className="rounded-full border-input"
                        />
                        <span>{opt}</span>
                      </label>
                    ),
                  )}
                </div>
                <div className="flex flex-row items-center gap-3">
                  <span className="text-muted-foreground flex items-center">
                    HEX 여부
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="hexStatus"
                      checked={(value.hexStatus ?? '') === 'hex'}
                      onChange={() => update({ hexStatus: 'hex' })}
                      disabled={readOnly}
                      className="rounded-full border-input"
                    />
                    <span>Hex</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="hexStatus"
                      checked={(value.hexStatus ?? '') === 'non_hex'}
                      onChange={() => update({ hexStatus: 'non_hex' })}
                      disabled={readOnly}
                      className="rounded-full border-input"
                    />
                    <span>Non-Hex</span>
                  </label>
                </div>
              </div>
            )}

            {/* 오버덴취용: Ball/Locator/Magnetic/기타, 기타일 때만 input+select+HEX */}
            {isOverdent && (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
                <div className="flex flex-wrap gap-3">
                  {ABUTMENT_OVERDENT_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="abutmentOverdent"
                        checked={(value.abutmentOverdent ?? '') === opt}
                        onChange={() =>
                          update({
                            abutmentOverdent: opt,
                            ...(opt !== '기타'
                              ? {
                                  abutmentPreset: undefined,
                                  abutmentDirectInput: undefined,
                                }
                              : {}),
                          })
                        }
                        disabled={readOnly}
                        className="rounded-full border-input"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                  {isOverdentEtc && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        type="text"
                        value={value.abutmentDirectInput ?? ''}
                        onChange={(e) =>
                          update({
                            abutmentDirectInput: e.target.value || undefined,
                          })
                        }
                        disabled={readOnly}
                        placeholder="직접 입력"
                        className="border-input bg-background h-8 flex-1 min-w-[120px] rounded-md border px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <select
                        value={value.abutmentPreset ?? ''}
                        onChange={(e) => {
                          const v = e.target.value || undefined;
                          update({
                            abutmentPreset: v,
                            abutmentDirectInput: v,
                          });
                        }}
                        disabled={readOnly}
                        className="border-input bg-background h-8 min-w-[140px] rounded-md border px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">선택</option>
                        {ABUTMENT_PRESET_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {isOverdentEtc && (
                  <div className="flex flex-row items-center gap-3">
                    <span className="text-muted-foreground">HEX 여부</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="hexStatusOverdent"
                        checked={(value.hexStatus ?? '') === 'hex'}
                        onChange={() => update({ hexStatus: 'hex' })}
                        disabled={readOnly}
                        className="rounded-full border-input"
                      />
                      <span>Hex</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="hexStatusOverdent"
                        checked={(value.hexStatus ?? '') === 'non_hex'}
                        onChange={() => update({ hexStatus: 'non_hex' })}
                        disabled={readOnly}
                        className="rounded-full border-input"
                      />
                      <span>Non-Hex</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* UCLA: HEX만 */}
            {isUCLA && (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="text"
                    value={value.abutmentDirectInput ?? ''}
                    onChange={(e) =>
                      update({
                        abutmentDirectInput: e.target.value || undefined,
                      })
                    }
                    disabled={readOnly}
                    placeholder="직접 입력"
                    className="border-input bg-background h-8 flex-1 min-w-[120px] rounded-md border px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <select
                    value={value.abutmentPreset ?? ''}
                    onChange={(e) => {
                      const v = e.target.value || undefined;
                      update({
                        abutmentPreset: v,
                        abutmentDirectInput: v,
                      });
                    }}
                    disabled={readOnly}
                    className="border-input bg-background h-8 min-w-[140px] rounded-md border px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">선택</option>
                    {ABUTMENT_PRESET_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-row items-center gap-3">
                  <span className="text-muted-foreground">HEX 여부</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="hexStatusUCLA"
                      checked={(value.hexStatus ?? '') === 'hex'}
                      onChange={() => update({ hexStatus: 'hex' })}
                      disabled={readOnly}
                      className="rounded-full border-input"
                    />
                    <span>Hex</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="hexStatusUCLA"
                      checked={(value.hexStatus ?? '') === 'non_hex'}
                      onChange={() => update({ hexStatus: 'non_hex' })}
                      disabled={readOnly}
                      className="rounded-full border-input"
                    />
                    <span>Non-Hex</span>
                  </label>
                </div>
              </div>
            )}

            {/* 직접 입력: input + select(커스텀/하이니스) + HEX */}
            {isAbutmentDirect && (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="text"
                    value={value.abutmentDirectInput ?? ''}
                    onChange={(e) =>
                      update({
                        abutmentDirectInput: e.target.value || undefined,
                      })
                    }
                    disabled={readOnly}
                    placeholder="직접 입력"
                    className="border-input bg-background h-8 flex-1 min-w-[120px] rounded-md border px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <select
                    value={value.abutmentPreset ?? ''}
                    onChange={(e) => {
                      const v = e.target.value || undefined;
                      update({
                        abutmentPreset: v,
                        abutmentDirectInput: v,
                      });
                    }}
                    disabled={readOnly}
                    className="border-input bg-background h-8 min-w-[140px] rounded-md border px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">선택</option>
                    {ABUTMENT_PRESET_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-row items-center gap-3">
                  <span className="text-muted-foreground">HEX 여부</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="hexStatusUCLA"
                      checked={(value.hexStatus ?? '') === 'hex'}
                      onChange={() => update({ hexStatus: 'hex' })}
                      disabled={readOnly}
                      className="rounded-full border-input"
                    />
                    <span>Hex</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="hexStatusUCLA"
                      checked={(value.hexStatus ?? '') === 'non_hex'}
                      onChange={() => update({ hexStatus: 'non_hex' })}
                      disabled={readOnly}
                      className="rounded-full border-input"
                    />
                    <span>Non-Hex</span>
                  </label>
                </div>
              </div>
            )}
          </>
        </div>
      </Row>

      <Row label="체결력 선택">
        <select
          value={value.torque ?? ''}
          onChange={(e) => update({ torque: e.target.value || undefined })}
          disabled={readOnly}
          className="border-input bg-background h-10 w-full min-w-0 max-w-[200px] rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">선택</option>
          {TORQUE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Row>

      <Row label="사이즈">
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={value.sizeNotEntered ?? false}
              onCheckedChange={(c) => {
                if (readOnly) return;
                const checked = c === true;
                update({
                  sizeNotEntered: checked,
                  ...(checked
                    ? {
                        diameter: 0,
                        cuff: 0,
                        height: 0,
                      }
                    : {
                        diameter: value.diameter ?? 10,
                        cuff: value.cuff ?? 2,
                        height: value.height ?? 10,
                      }),
                });
              }}
              disabled={readOnly}
            />
            <span>입력 안함</span>
          </label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Diameter</span>
              <input
                type="number"
                step={0.5}
                value={value.diameter ?? ''}
                onChange={(e) =>
                  update({
                    diameter: clampSizeInput(e.target.value),
                  })
                }
                disabled={readOnly || value.sizeNotEntered}
                className="border-input bg-background h-10 w-20 rounded-md border px-2 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Cuff</span>
              <input
                type="number"
                step={0.5}
                value={value.cuff ?? ''}
                onChange={(e) =>
                  update({
                    cuff: clampSizeInput(e.target.value),
                  })
                }
                disabled={readOnly || value.sizeNotEntered}
                className="border-input bg-background h-10 w-20 rounded-md border px-2 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Height</span>
              <input
                type="number"
                step={0.5}
                value={value.height ?? ''}
                onChange={(e) =>
                  update({
                    height: clampSizeInput(e.target.value),
                  })
                }
                disabled={readOnly || value.sizeNotEntered}
                className="border-input bg-background h-10 w-20 rounded-md border px-2 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
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
