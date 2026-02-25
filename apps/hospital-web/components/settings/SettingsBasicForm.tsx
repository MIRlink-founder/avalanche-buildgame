'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
import { Label } from '@mire/ui/components/label';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';

const DAUM_POSTCODE_SCRIPT =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

type HospitalSettings = {
  id: string;
  officialName: string;
  displayName: string | null;
  businessNumber: string;
  ceoName: string;
  accountBank: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  managerPhone: string | null;
  managerEmail: string | null;
  businessAddress: string | null;
  addressZipcode: string | null;
  addressRoad: string | null;
  addressDetail: string | null;
};

function loadDaumPostcodeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('window undefined'));
      return;
    }
    const existing = document.querySelector(
      `script[src="${DAUM_POSTCODE_SCRIPT}"]`,
    );
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = DAUM_POSTCODE_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('우편번호 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (data: {
          zonecode: string;
          roadAddress: string;
          jibunAddress: string;
          userSelectedType: 'R' | 'J';
        }) => void;
      }) => { open: () => void };
    };
  }
}

export function SettingsBasicForm() {
  const [hospital, setHospital] = useState<HospitalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 편집 가능 필드 로컬 상태
  const [accountBank, setAccountBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [addressZipcode, setAddressZipcode] = useState('');
  const [addressRoad, setAddressRoad] = useState('');
  const [addressDetail, setAddressDetail] = useState('');

  const fetchHospital = useCallback(async () => {
    const res = await fetch('/api/settings/hospital', {
      headers: getAuthHeaders(),
    });
    if (redirectIfUnauthorized(res)) return;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || '병원 정보를 불러오지 못했습니다.');
      return;
    }
    const data: HospitalSettings = await res.json();
    setHospital(data);
    setAccountBank(data.accountBank ?? '');
    setAccountNumber(data.accountNumber ?? '');
    setAccountHolder(data.accountHolder ?? '');
    setManagerPhone(data.managerPhone ?? '');
    setManagerEmail(data.managerEmail ?? '');
    if (data.businessAddress) {
      const parts = data.businessAddress.split('/');
      setAddressZipcode(data.addressZipcode ?? parts[0] ?? '');
      setAddressRoad(data.addressRoad ?? parts[1] ?? '');
      setAddressDetail(data.addressDetail ?? parts[2] ?? '');
    } else {
      setAddressZipcode(data.addressZipcode ?? '');
      setAddressRoad(data.addressRoad ?? '');
      setAddressDetail(data.addressDetail ?? '');
    }
  }, []);

  useEffect(() => {
    fetchHospital().finally(() => setLoading(false));
  }, [fetchHospital]);

  const openPostcode = useCallback(() => {
    loadDaumPostcodeScript()
      .then(() => {
        if (!window.daum?.Postcode) {
          alert('우편번호 서비스를 불러올 수 없습니다.');
          return;
        }
        new window.daum.Postcode({
          oncomplete(data) {
            const road =
              data.userSelectedType === 'R'
                ? data.roadAddress
                : data.jibunAddress;
            setAddressZipcode(data.zonecode);
            setAddressRoad(road);
          },
        }).open();
      })
      .catch(() => alert('우편번호 서비스를 불러올 수 없습니다.'));
  }, []);

  const formatAccountNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  };

  const handleAccountNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAccountNumber(formatAccountNumber(raw));
  };

  const handleSave = async () => {
    const zip = addressZipcode.trim();
    const road = addressRoad.trim();
    const detail = addressDetail.trim();
    if (!zip || !road || !detail) {
      alert('병원 주소를 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings/hospital', {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountBank: accountBank.trim() || null,
          accountNumber: accountNumber.replace(/-/g, '') || null,
          accountHolder: accountHolder.trim() || null,
          managerPhone: managerPhone.trim() || null,
          managerEmail: managerEmail.trim() || null,
          addressZipcode: zip,
          addressRoad: road,
          addressDetail: detail,
        }),
      });
      if (redirectIfUnauthorized(res)) return;

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert('병원 정보가 성공적으로 저장되었습니다.');
        window.location.reload();
        return;
      }
      if (
        res.status === 400 &&
        (data as { code?: string }).code === 'VALIDATION'
      ) {
        alert('누락 값이 존재합니다.');
        return;
      }
      alert('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } catch {
      alert('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        로딩 중…
      </div>
    );
  }

  if (!hospital) {
    return null;
  }

  const displayName = hospital.displayName ?? hospital.officialName;

  return (
    <div className="space-y-10">
      {/* 병원 식별 정보 — 읽기 전용 */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold">병원 식별 정보</h2>
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="hospitalName">병원명</Label>
            <Input
              id="hospitalName"
              value={displayName}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessNumber">사업자등록번호</Label>
            <Input
              id="businessNumber"
              value={hospital.businessNumber}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ceoName">대표자명</Label>
            <Input
              id="ceoName"
              value={hospital.ceoName}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>
        </div>
      </section>

      {/* 입금 계좌 */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold">입금 계좌</h2>
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="accountNumber">계좌번호</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={handleAccountNumberChange}
              placeholder="숫자만 입력"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountBank">은행</Label>
            <Input
              id="accountBank"
              value={accountBank}
              onChange={(e) => setAccountBank(e.target.value)}
              placeholder="은행명"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountHolder">예금주</Label>
            <Input
              id="accountHolder"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="예금주명"
            />
          </div>
        </div>
      </section>

      {/* 운영 및 배송 정보 */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold">운영 및 배송 정보</h2>
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="managerPhone">대표 전화번호</Label>
            <Input
              id="managerPhone"
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
              placeholder="02-1234-5678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="managerEmail">담당자 이메일</Label>
            <Input
              id="managerEmail"
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              placeholder="admin@mire.com"
            />
          </div>
        </div>
      </section>

      {/* 병원 주소 [필수] */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold">병원 주소</h2>
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="addressZipcode">우편번호</Label>
            <div className="flex gap-2">
              <Input
                id="addressZipcode"
                value={addressZipcode}
                readOnly
                className="bg-muted w-1/4"
              />
              <Button
                type="button"
                variant="outline"
                onClick={openPostcode}
                className="h-12"
              >
                주소 검색
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressRoad">기본 주소</Label>
            <Input
              id="addressRoad"
              value={addressRoad}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressDetail">상세 주소</Label>
            <Input
              id="addressDetail"
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="상세 주소 입력"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '저장 중…' : '변경 사항 저장'}
        </Button>
      </div>
    </div>
  );
}
