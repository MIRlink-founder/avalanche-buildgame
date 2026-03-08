'use client';

import { useState } from 'react';
import { Label, Checkbox } from '@mire/ui';
import { Settings } from 'lucide-react';
import type { ImplantPlacementFormData } from './treatment-sheet-types';
import { FixtureSelectModal } from './FixtureSelectModal';
import { FixtureManageModal } from './FixtureManageModal';

export interface ImplantItemOption {
  id: number;
  manufacturerName: string;
  brandName: string;
  size: string;
}

export interface ImplantPlacementSheetProps {
  value: ImplantPlacementFormData;
  onChange: (data: ImplantPlacementFormData) => void;
  readOnly?: boolean;
  /** DB에서 받은 ACTIVE ImplantItem 목록 — 있으면 Fixture를 셀렉트로 선택 */
  implantItems?: ImplantItemOption[];
  /** 픽스처 목록 갱신 시 호출 (관리 모달 저장 후 목록 다시 fetch) */
  onFixtureListChange?: () => void;
}

const INITIAL_FIXATION_OPTIONS = [
  '15N',
  '20N',
  '25N',
  '30N',
  '35N',
  '40N',
  '45N 이상',
];
const BONE_QUALITY_OPTIONS = ['D1', 'D2', 'D3', 'D4'] as const;
const KERATINIZED_OPTIONS = ['충분', '부족', 'FGG 필요', 'FGG함'] as const;
const SINUS_LIFT_OPTIONS = ['안함', 'Crestal', 'Lateral'] as const;
const SINUS_LIFT_MATERIALS = ['합성골', '이종골', '동종골', '자가치아이식재'];
const BONE_GRAFT_OPTIONS = [
  '합성골',
  '자가골',
  '이종골',
  '동종골',
  '자가치아이식재',
  'PRF',
  'PRP',
  '흡수성 막',
  '비흡수성 막',
  'Titanium Mesh',
  'Ridge Split',
  'Block Bone',
];
const PROSTHESIS_TIMING_OPTIONS = [
  '1개월 후',
  '2개월 후',
  '3개월 후',
  '4개월 후',
  '5개월 후',
  '6개월 후',
  '8개월 후',
];

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

export function ImplantPlacementSheet({
  value,
  onChange,
  readOnly = false,
  implantItems = [],
  onFixtureListChange,
}: ImplantPlacementSheetProps) {
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  const update = (patch: Partial<ImplantPlacementFormData>) => {
    onChange({ ...value, ...patch });
  };

  const toggleArray = (
    key: 'sinusLiftMaterials' | 'boneGraft',
    item: string,
  ) => {
    const arr = value[key] ?? [];
    const next = arr.includes(item)
      ? arr.filter((x) => x !== item)
      : [...arr, item];
    update({ [key]: next });
  };

  return (
    <div className="space-y-0 text-sm">
      <Row label="Fixture">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => !readOnly && setSelectModalOpen(true)}
            disabled={readOnly}
            className="border-input bg-background h-10 flex-1 min-w-0 rounded-md border px-3 py-2 text-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {value.fixture ?? '임플란트 픽스처 선택'}
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setManageModalOpen(true)}
              className="rounded-md border border-input p-2 hover:bg-muted"
              aria-label="픽스처 설정"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </Row>

      <FixtureSelectModal
        open={selectModalOpen}
        onOpenChange={setSelectModalOpen}
        implantItems={implantItems}
        currentItemId={value.fixtureItemId}
        onSelect={(itemId, label) => {
          update({
            fixtureItemId: itemId ?? undefined,
            fixture: label || undefined,
          });
        }}
      />
      <FixtureManageModal
        open={manageModalOpen}
        onOpenChange={setManageModalOpen}
        onSaved={onFixtureListChange}
      />

      <Row label="초기고정">
        <div className="flex flex-wrap gap-3">
          {INITIAL_FIXATION_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <input
                type="radio"
                name="initialFixation"
                checked={(value.initialFixation ?? '') === opt}
                onChange={() => update({ initialFixation: opt })}
                disabled={readOnly}
                className="rounded-full border-input"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </Row>

      <Row label="골질">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            {BONE_QUALITY_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <input
                  type="radio"
                  name="boneQuality"
                  checked={(value.boneQuality ?? '') === opt}
                  onChange={() => update({ boneQuality: opt })}
                  disabled={readOnly}
                  className="rounded-full border-input"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              각화치은
            </span>
            {KERATINIZED_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <input
                  type="radio"
                  name="keratinizedGingiva"
                  checked={(value.keratinizedGingiva ?? '') === opt}
                  onChange={() => update({ keratinizedGingiva: opt })}
                  disabled={readOnly}
                  className="rounded-full border-input"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </Row>

      <Row label="상악동거상">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            {SINUS_LIFT_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <input
                  type="radio"
                  name="sinusLift"
                  checked={(value.sinusLift ?? '') === opt}
                  onChange={() => {
                    // "안함" 선택 시 재료 선택 초기화
                    if (!readOnly) {
                      update({
                        sinusLift: opt,
                        sinusLiftMaterials:
                          opt === '안함'
                            ? []
                            : (value.sinusLiftMaterials ?? []),
                      });
                    }
                  }}
                  disabled={readOnly}
                  className="rounded-full border-input"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {(value.sinusLift === 'Crestal' || value.sinusLift === 'Lateral') && (
            <div className="flex flex-wrap gap-3 pt-1">
              {SINUS_LIFT_MATERIALS.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Checkbox
                    checked={(value.sinusLiftMaterials ?? []).includes(opt)}
                    onCheckedChange={() =>
                      !readOnly && toggleArray('sinusLiftMaterials', opt)
                    }
                    disabled={readOnly}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </Row>

      <Row label="골이식">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {BONE_GRAFT_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Checkbox
                checked={(value.boneGraft ?? []).includes(opt)}
                onCheckedChange={() =>
                  !readOnly && toggleArray('boneGraft', opt)
                }
                disabled={readOnly}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </Row>

      <Row label="수술 횟수">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="surgeryCount"
              checked={(value.surgeryCount ?? '') === '1회법'}
              onChange={() => update({ surgeryCount: '1회법' })}
              disabled={readOnly}
              className="rounded-full border-input"
            />
            <span>1회법 (One stage)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="surgeryCount"
              checked={(value.surgeryCount ?? '') === '2회법'}
              onChange={() => update({ surgeryCount: '2회법' })}
              disabled={readOnly}
              className="rounded-full border-input"
            />
            <span>2회법 (2차 수술 필요)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer ml-2">
            <Checkbox
              checked={value.healingInput ?? false}
              onCheckedChange={(c) =>
                !readOnly && update({ healingInput: c === true })
              }
              disabled={readOnly}
            />
            <span>힐링 입력</span>
            {value.healingInput && (
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Φ</span>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={9}
                    value={
                      value.healingPhi === undefined
                        ? ''
                        : Math.max(1, Math.min(9, Number(value.healingPhi)))
                    }
                    onChange={(e) => {
                      if (readOnly) return;
                      let val = parseFloat(e.target.value);
                      if (val !== undefined) {
                        val = Math.max(1, Math.min(9, val));
                      }
                      update({ healingPhi: val });
                    }}
                    disabled={readOnly}
                    className="border-input bg-background h-10 w-20 rounded-md border px-2 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Height</span>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={15}
                    value={
                      value.healingHeight === undefined
                        ? ''
                        : Math.max(1, Math.min(15, Number(value.healingHeight)))
                    }
                    onChange={(e) => {
                      if (readOnly) return;
                      let val = parseFloat(e.target.value);
                      if (val !== undefined) {
                        val = Math.max(1, Math.min(15, val));
                      }
                      update({ healingHeight: val });
                    }}
                    disabled={readOnly}
                    className="border-input bg-background h-10 w-20 rounded-md border px-2 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            )}
          </label>
        </div>
      </Row>

      <Row label="보철시기">
        <div className="flex flex-wrap gap-3">
          {PROSTHESIS_TIMING_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <input
                type="radio"
                name="prosthesisTiming"
                checked={(value.prosthesisTiming ?? '') === opt}
                onChange={() => update({ prosthesisTiming: opt })}
                disabled={readOnly}
                className="rounded-full border-input"
              />
              <span>{opt}</span>
            </label>
          ))}
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
