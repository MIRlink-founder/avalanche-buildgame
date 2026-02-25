'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
} from '@mire/ui';
import type { ImplantItemOption } from './ImplantPlacementSheet';

export interface FixtureSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  implantItems: ImplantItemOption[];
  currentItemId?: number | null;
  onSelect: (itemId: number | null, label: string) => void;
}

function getLabel(item: ImplantItemOption) {
  return `${item.manufacturerName}, ${item.brandName}, ${item.size}`;
}

export function FixtureSelectModal({
  open,
  onOpenChange,
  implantItems,
  currentItemId,
  onSelect,
}: FixtureSelectModalProps) {
  const [search, setSearch] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [directInput, setDirectInput] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(
    currentItemId ?? null,
  );

  const manufacturers = useMemo(() => {
    const set = new Set(implantItems.map((i) => i.manufacturerName));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [implantItems]);

  const brands = useMemo(() => {
    if (!manufacturerFilter) return [];
    const filtered = implantItems.filter(
      (i) => i.manufacturerName === manufacturerFilter,
    );
    const set = new Set(filtered.map((i) => i.brandName));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [implantItems, manufacturerFilter]);

  const filteredList = useMemo(() => {
    let list = implantItems;
    if (manufacturerFilter) {
      list = list.filter((i) => i.manufacturerName === manufacturerFilter);
    }
    if (brandFilter) {
      list = list.filter((i) => i.brandName === brandFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.manufacturerName.toLowerCase().includes(q) ||
          i.brandName.toLowerCase().includes(q) ||
          i.size.toLowerCase().includes(q),
      );
    }
    return list;
  }, [implantItems, manufacturerFilter, brandFilter, search]);

  const handleComplete = () => {
    if (selectedId != null) {
      const item = implantItems.find((i) => i.id === selectedId);
      onSelect(selectedId, item ? getLabel(item) : '');
    } else if (directInput.trim()) {
      onSelect(null, directInput.trim());
    } else {
      onSelect(null, '');
    }
    onOpenChange(false);
    setSearch('');
    setManufacturerFilter('');
    setBrandFilter('');
    setDirectInput('');
    setSelectedId(currentItemId ?? null);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSearch('');
    setManufacturerFilter('');
    setBrandFilter('');
    setDirectInput('');
    setSelectedId(currentItemId ?? null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>임플란트 픽스처 선택</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm py-4">
          {/* <div className="flex gap-2 items-center">
            <Label className="shrink-0 w-16">검색</Label>
            <Input
              placeholder="제조사, 제품명, 사이즈로 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-10"
            />
          </div> */}
          <div className="grid gap-4">
            <div className="flex gap-2 items-center">
              <Label className="shrink-0 w-14">제조사</Label>
              <Select
                value={manufacturerFilter}
                onChange={(e) => {
                  setManufacturerFilter(e.target.value);
                  setBrandFilter('');
                }}
                className="flex-1"
              >
                <option value="">전체</option>
                {manufacturers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2 items-center">
              <Label className="shrink-0 w-14">제품명</Label>
              <Select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="flex-1"
              >
                <option value="">전체</option>
                {brands.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <div className="mt-1 border border-input rounded-md max-h-48 overflow-auto bg-background">
              {filteredList.length === 0 ? (
                <p className="p-3 text-muted-foreground text-center">
                  조건에 맞는 품목이 없습니다.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {filteredList.map((item) => {
                    const label = getLabel(item);
                    const isSelected = selectedId === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 ${
                            isSelected ? 'bg-primary/10 text-primary' : ''
                          }`}
                        >
                          {label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Label className="shrink-0 w-20">직접입력</Label>
            <Input
              value={directInput}
              onChange={(e) => {
                setDirectInput(e.target.value);
                if (e.target.value.trim()) setSelectedId(null);
              }}
              className="flex-1 h-10"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button onClick={handleComplete}>선택 완료</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
