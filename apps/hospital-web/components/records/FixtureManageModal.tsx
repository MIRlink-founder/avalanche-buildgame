'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  Button,
  Input,
  Label,
  Checkbox,
} from '@mire/ui';
import { Pencil, Trash2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/get-auth-headers';

interface Manufacturer {
  id: number;
  name: string;
}

interface ImplantBrand {
  id: number;
  name: string;
}

interface FixtureRow {
  id: number;
  brandId: number;
  manufacturerName: string;
  brandName: string;
  size: string;
  status: string;
}

export interface FixtureManageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function FixtureManageModal({
  open,
  onOpenChange,
  onSaved,
}: FixtureManageModalProps) {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [brands, setBrands] = useState<ImplantBrand[]>([]);
  const [items, setItems] = useState<FixtureRow[]>([]);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<
    number | null
  >(null);
  const [searchManufacturer, setSearchManufacturer] = useState('');
  const [searchFixture, setSearchFixture] = useState('');
  const [addBrandId, setAddBrandId] = useState('');
  const [addSize, setAddSize] = useState('');
  const [addProductNameDirect, setAddProductNameDirect] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSize, setEditSize] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  useEffect(() => {
    if (!open) return;
    const headers = getAuthHeaders();
    fetch('/api/manufacturers', { headers })
      .then((r) => r.json())
      .then((data: Manufacturer[]) =>
        setManufacturers(Array.isArray(data) ? data : []),
      )
      .catch(() => setManufacturers([]));
  }, [open]);

  useEffect(() => {
    if (!open || selectedManufacturerId == null) {
      setBrands([]);
      setItems([]);
      setAddBrandId('');
      return;
    }
    const headers = getAuthHeaders();
    fetch(`/api/implant-brands?manufacturerId=${selectedManufacturerId}`, {
      headers,
    })
      .then((r) => r.json())
      .then((data: ImplantBrand[]) =>
        setBrands(Array.isArray(data) ? data : []),
      )
      .catch(() => setBrands([]));

    fetch(
      `/api/implant-items?manufacturerId=${selectedManufacturerId}&includeInactive=1`,
      { headers },
    )
      .then((r) => r.json())
      .then((data: FixtureRow[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, [open, selectedManufacturerId]);

  const filteredManufacturers = useMemo(() => {
    const q = searchManufacturer.trim().toLowerCase();
    if (!q) return manufacturers;
    return manufacturers.filter((m) => m.name.toLowerCase().includes(q));
  }, [manufacturers, searchManufacturer]);

  const filteredItems = useMemo(() => {
    const q = searchFixture.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.brandName.toLowerCase().includes(q) ||
        i.size.toLowerCase().includes(q),
    );
  }, [items, searchFixture]);

  const handleAdd = async () => {
    const headers = getAuthHeaders();
    let brandId: number;

    if (addProductNameDirect.trim()) {
      if (selectedManufacturerId == null) return;
      const brandRes = await fetch('/api/implant-brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          manufacturerId: selectedManufacturerId,
          name: addProductNameDirect.trim(),
        }),
      });
      if (!brandRes.ok) return;
      const brand = (await brandRes.json()) as { id: number; name: string };
      brandId = brand.id;
    } else {
      const parsed = parseInt(addBrandId, 10);
      if (Number.isNaN(parsed) || !addSize.trim()) return;
      brandId = parsed;
    }

    if (!addSize.trim()) return;

    const res = await fetch('/api/implant-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ brandId, size: addSize.trim() }),
    });
    if (!res.ok) return;
    setAddSize('');
    setAddProductNameDirect('');
    if (selectedManufacturerId != null) {
      const list = await fetch(
        `/api/implant-items?manufacturerId=${selectedManufacturerId}&includeInactive=1`,
        { headers },
      ).then((r) => r.json());
      setItems(Array.isArray(list) ? list : []);
      const brandList = await fetch(
        `/api/implant-brands?manufacturerId=${selectedManufacturerId}`,
        { headers },
      ).then((r) => r.json());
      setBrands(Array.isArray(brandList) ? brandList : []);
    }
    onSaved?.();
  };

  const handleEdit = (row: FixtureRow) => {
    setEditingId(row.id);
    setEditSize(row.size);
    setEditStatus(row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
  };

  const handleSaveEdit = async () => {
    if (editingId == null) return;
    const headers = getAuthHeaders();
    const res = await fetch(`/api/implant-items/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ size: editSize.trim(), status: editStatus }),
    });
    if (!res.ok) return;
    setEditingId(null);
    if (selectedManufacturerId != null) {
      const list = await fetch(
        `/api/implant-items?manufacturerId=${selectedManufacturerId}&includeInactive=1`,
        { headers },
      ).then((r) => r.json());
      setItems(Array.isArray(list) ? list : []);
    }
    onSaved?.();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 픽스처를 삭제하시겠습니까?')) return;
    const headers = getAuthHeaders();
    const res = await fetch(`/api/implant-items/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) return;
    if (selectedManufacturerId != null) {
      const list = await fetch(
        `/api/implant-items?manufacturerId=${selectedManufacturerId}&includeInactive=1`,
        { headers },
      ).then((r) => r.json());
      setItems(Array.isArray(list) ? list : []);
    }
    onSaved?.();
  };

  const handleClose = () => {
    onOpenChange(false);
    onSaved?.();
    setSelectedManufacturerId(null);
    setSearchManufacturer('');
    setSearchFixture('');
    setAddBrandId('');
    setAddSize('');
    setAddProductNameDirect('');
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl max-h-[90vh] flex flex-col"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* 좌측: 제조사 목록 + 검색 */}
          <div className="w-44 shrink-0 flex flex-col gap-4">
            <div className="text-lg font-semibold">제조사 목록</div>
            <div className="flex items-center">
              <Input
                placeholder="제조사 검색"
                value={searchManufacturer}
                onChange={(e) => setSearchManufacturer(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1 overflow-auto p-1">
              {filteredManufacturers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedManufacturerId(m.id)}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded ${
                    selectedManufacturerId === m.id
                      ? 'bg-primary/20 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* 우측: 픽스쳐 목록 + 추가 */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 rounded-md">
            <div className="text-lg font-semibold">픽스쳐 목록</div>
            <div className="flex items-center">
              <Input
                placeholder="픽스처 검색"
                value={searchFixture}
                onChange={(e) => setSearchFixture(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            {selectedManufacturerId == null ? (
              <div className="flex-1 border rounded-md flex items-center justify-center text-muted-foreground text-sm">
                제조사를 선택하세요
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto border rounded-md">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-2 border-b">제품명</th>
                        <th className="text-left p-2 border-b">사이즈</th>
                        <th className="text-left p-2 border-b w-20">
                          사용안함
                        </th>
                        <th className="p-2 border-b w-16">수정</th>
                        <th className="p-2 border-b w-14">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((row) =>
                        editingId === row.id ? (
                          <tr key={row.id} className="border-b">
                            <td className="p-2">{row.brandName}</td>
                            <td className="p-2">
                              <Input
                                value={editSize}
                                onChange={(e) => setEditSize(e.target.value)}
                                className="h-8 text-sm"
                              />
                            </td>
                            <td className="p-2">
                              <Checkbox
                                checked={editStatus === 'INACTIVE'}
                                onCheckedChange={(c) =>
                                  setEditStatus(c ? 'INACTIVE' : 'ACTIVE')
                                }
                              />
                            </td>
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveEdit()}
                              >
                                저장
                              </Button>
                            </td>
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                              >
                                취소
                              </Button>
                            </td>
                          </tr>
                        ) : (
                          <tr
                            key={row.id}
                            className="border-b hover:bg-muted/30"
                          >
                            <td className="p-2">{row.brandName}</td>
                            <td className="p-2">{row.size}</td>
                            <td className="p-2">
                              <Checkbox
                                checked={row.status === 'INACTIVE'}
                                disabled
                              />
                            </td>
                            <td className="p-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(row)}
                                className="p-1 rounded hover:bg-muted"
                                aria-label="수정"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </td>
                            <td className="p-2">
                              <button
                                type="button"
                                onClick={() => handleDelete(row.id)}
                                className="text-destructive text-xs hover:underline"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 border border-border space-y-4 rounded-md">
                  <div className="font-semibold">픽스쳐 추가</div>
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        픽스쳐 제품명
                      </Label>
                      <Input
                        value={addProductNameDirect}
                        onChange={(e) => {
                          setAddProductNameDirect(e.target.value);
                          if (e.target.value.trim()) setAddBrandId('');
                        }}
                        className="ml-1 h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        픽스쳐 사이즈
                      </Label>
                      <Input
                        value={addSize}
                        onChange={(e) => setAddSize(e.target.value)}
                        className="ml-1 h-8 text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAdd}
                      disabled={
                        (!addBrandId && !addProductNameDirect.trim()) ||
                        !addSize.trim()
                      }
                    >
                      추가
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
