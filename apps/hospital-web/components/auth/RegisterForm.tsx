'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
import { Label } from '@mire/ui/components/label';
import { Checkbox } from '@mire/ui/components/checkbox';
import { Separator } from '@mire/ui/components/separator';
import { TermsModal } from './TermsModal';
import { TERMS_CONTENT, type TermsType } from '@/lib/terms';
import { CheckCircle2, XCircle, Upload, AlertCircle } from 'lucide-react';

const DAUM_POSTCODE_SCRIPT =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

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

interface FileUpload {
  name: string;
  size: number;
}

export function RegisterForm() {
  const router = useRouter();

  // 실제 DB 저장 필드
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [phone, setPhone] = useState('');

  // 프론트엔드만 표시되는 필드
  const [ceoName, setCeoName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');

  // 파일 업로드 (실제 저장 안 함)
  const [businessLicense, setBusinessLicense] = useState<FileUpload | null>(
    null,
  );
  const [medicalLicense, setMedicalLicense] = useState<FileUpload | null>(null);
  const [ceoDocument, setCeoDocument] = useState<FileUpload | null>(null);

  // 약관 동의
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeFinance, setAgreeFinance] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);

  // UI 상태
  const [emailChecked, setEmailChecked] = useState<boolean | null>(null);
  const [businessChecked, setBusinessChecked] = useState<boolean | null>(null);
  const [businessError, setBusinessError] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsModal, setTermsModal] = useState<{
    open: boolean;
    termsType: TermsType | null;
  }>({
    open: false,
    termsType: null,
  });

  // 담당자명 유효성 검증
  const validateName = (value: string) => {
    // 빈 값 체크
    if (!value.trim()) {
      setNameError('올바른 이름을 입력해주세요.');
      return false;
    }

    // 한글, 영문, 공백만 허용 (특수문자 제외)
    const nameRegex = /^[가-힣a-zA-Z\s]+$/;
    if (!nameRegex.test(value)) {
      setNameError('올바른 이름을 입력해주세요.');
      return false;
    }

    // 최대 20자 제한
    if (value.length > 20) {
      setNameError('올바른 이름을 입력해주세요.');
      return false;
    }

    setNameError('');
    return true;
  };

  // 담당자명 변경 핸들러
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // 최대 20자 제한
    if (value.length <= 20) {
      setName(value);
      validateName(value);
    }
  };

  // 이메일 형식 검증
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 이메일 변경 핸들러
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailChecked(null);
  };

  // 이메일 중복 확인
  const handleCheckEmail = async () => {
    if (!email) {
      alert('이메일을 입력해주세요');
      return;
    }

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      setEmailChecked(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/auth/check-email?email=${encodeURIComponent(email)}`,
      );
      const data = await response.json();

      if (data.exists) {
        setEmailChecked(false);
      } else {
        setEmailChecked(true);
      }
    } catch (error) {
      console.error('Email check error:', error);
      alert('이메일 확인 중 오류가 발생했습니다');
    }
  };

  // 휴대폰 번호 포맷팅 (010-1234-5678)
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');

    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // 휴대폰 번호 유효성 검증
  const validatePhone = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');

    if (!value) {
      setPhoneError('');
      return true;
    }

    if (numbers.length < 11) {
      setPhoneError('휴대폰 번호를 확인해주세요.');
      return false;
    }

    setPhoneError('');
    return true;
  };

  // 휴대폰 번호 변경 핸들러
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbers = value.replace(/[^\d]/g, '');

    // 11자리까지만 허용
    if (numbers.length <= 11) {
      const formatted = formatPhoneNumber(numbers);
      setPhone(formatted);
      validatePhone(formatted);
    }
  };

  // 사업자번호 포맷팅 (000-00-00000)
  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');

    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
    }
  };

  // 사업자번호 변경 핸들러
  const handleBusinessNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    const numbers = value.replace(/[^\d]/g, '');

    // 10자리까지만 허용
    if (numbers.length <= 10) {
      const formatted = formatBusinessNumber(numbers);
      setBusinessNumber(formatted);
      setBusinessChecked(null);
    }
  };

  // 사업자번호 조회
  const handleCheckBusiness = async () => {
    if (!businessNumber) {
      alert('사업자등록번호를 입력해주세요');
      return;
    }

    // 사업자번호 형식 검증 (000-00-00000)
    const businessRegex = /^\d{3}-\d{2}-\d{5}$/;
    if (!businessRegex.test(businessNumber)) {
      setBusinessChecked(false);
      setBusinessError('사업자 번호를 확인해주세요.');
      return;
    }

    try {
      // 사업자번호 중복 여부 확인 (국세청 API는 추후 연동 예정)
      const response = await fetch(
        `/api/auth/check-business?businessNumber=${encodeURIComponent(businessNumber)}`,
      );
      const data = await response.json();

      if (data.exists) {
        setBusinessChecked(false);
        setBusinessError('이미 가입된 병원입니다.');
      } else {
        setBusinessChecked(true);
        setBusinessError('');
      }
    } catch (error) {
      console.error('Business check error:', error);
      alert('사업자번호 확인 중 오류가 발생했습니다.');
    }
  };

  // 주소 검색 (Daum 우편번호 API)
  const handleSearchAddress = useCallback(() => {
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
            setPostalCode(data.zonecode);
            setAddress(road);
          },
        }).open();
      })
      .catch(() => alert('우편번호 서비스를 불러올 수 없습니다.'));
  }, []);

  // 파일 업로드 핸들러
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'business' | 'medical' | 'ceo',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다');
      return;
    }

    const fileData = { name: file.name, size: file.size };

    switch (type) {
      case 'business':
        setBusinessLicense(fileData);
        break;
      case 'medical':
        setMedicalLicense(fileData);
        break;
      case 'ceo':
        setCeoDocument(fileData);
        break;
    }
  };

  // 약관 전체 동의 토글
  const handleAgreeAllToggle = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeFinance(checked);
    setAgreeThirdParty(checked);
  };

  // 개별 약관이 모두 체크되면 전체 동의도 자동 체크
  useEffect(() => {
    if (agreeTerms && agreePrivacy && agreeFinance && agreeThirdParty) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [agreeTerms, agreePrivacy, agreeFinance, agreeThirdParty]);

  // 약관 모달 열기
  const openTermsModal = (termsType: TermsType) => {
    setTermsModal({
      open: true,
      termsType,
    });
  };

  // 약관 동의 핸들러
  const handleTermsAgree = (termsType: TermsType) => {
    switch (termsType) {
      case 'serviceTerms':
        setAgreeTerms(true);
        break;
      case 'privacyPolicy':
        setAgreePrivacy(true);
        break;
      case 'electronicFinance':
        setAgreeFinance(true);
        break;
      case 'thirdPartySharing':
        setAgreeThirdParty(true);
        break;
    }
  };

  // 회원가입 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검증
    if (!email || !name || !phone || !hospitalName || !businessNumber) {
      alert('필수 항목을 모두 입력해주세요'); // TODO: 추후 필수항목 추가
      return;
    }

    // 담당자명 유효성 검증
    if (!validateName(name)) {
      alert('올바른 담당자명을 입력해주세요');
      return;
    }

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      alert('이메일 형식이 올바르지 않습니다');
      return;
    }

    if (!emailChecked) {
      alert('이메일 중복 확인을 해주세요');
      return;
    }

    // 사업자번호 형식 검증
    const businessRegex = /^\d{3}-\d{2}-\d{5}$/;
    if (!businessRegex.test(businessNumber)) {
      alert('사업자등록번호 형식이 올바르지 않습니다');
      return;
    }

    if (!businessChecked) {
      alert('사업자번호 조회를 해주세요');
      return;
    }

    if (!agreeTerms || !agreePrivacy || !agreeFinance || !agreeThirdParty) {
      alert('필수 약관에 모두 동의해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          phone,
          hospitalName,
          businessNumber,
          ...(ceoName.trim() && { ceoName: ceoName.trim() }),
          ...([postalCode, address, detailAddress].some(Boolean) && {
            businessAddress: [postalCode, address, detailAddress]
              .filter(Boolean)
              .join(' ')
              .trim(),
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다');
      }

      alert(data.message || '회원가입이 완료되었습니다');
      router.push('/');
    } catch (error) {
      console.error('Register error:', error);
      alert(error instanceof Error ? error.message : '회원가입에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* 1. 담당자 정보 (계정 생성) */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">1. 담당자 정보 (계정 생성)</h2>

          <div className="space-y-2">
            <Label htmlFor="name">
              담당자명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="담당자명을 입력해주세요"
              value={name}
              onChange={handleNameChange}
              required
              maxLength={20}
              className={nameError ? 'border-destructive' : ''}
            />
            {nameError ? (
              <p className="text-destructive flex items-center gap-1 text-sm">
                <XCircle className="h-4 w-4" />
                {nameError}
              </p>
            ) : name && !nameError ? (
              <p className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                올바른 이름입니다
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              이메일 (아이디) <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={handleEmailChange}
                required
                readOnly={emailChecked === true}
                className={`flex-1 ${emailChecked === true ? 'bg-muted cursor-not-allowed' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCheckEmail}
                className="h-12 shrink-0"
                disabled={emailChecked === true}
              >
                중복확인
              </Button>
            </div>
            {emailChecked !== null && (
              <p
                className={`flex items-center gap-1 text-sm ${
                  emailChecked ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {emailChecked ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    사용 가능한 이메일입니다.
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    {!validateEmail(email)
                      ? '이메일 형식이 올바르지 않습니다.'
                      : '이미 가입된 이메일입니다.'}
                  </>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              휴대폰 번호 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="긴급 연락 가능한 휴대폰 번호를 입력해주세요"
              value={phone}
              required
              onChange={handlePhoneChange}
              maxLength={13}
              className={phoneError ? 'border-destructive' : ''}
            />
            <p className="text-sm text-gray-600">
              심사 반려 사유 안내 및 정산 이슈 발생 시 연락드릴 번호입니다.
            </p>
            {phoneError && (
              <p className="text-destructive flex items-center gap-1 text-sm">
                <XCircle className="h-4 w-4" />
                {phoneError}
              </p>
            )}
          </div>
        </section>

        <Separator />

        {/* 2. 병원 사업자 정보 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">2. 병원 사업자 정보</h2>

          <div className="space-y-2">
            <Label htmlFor="businessNumber">
              사업자등록번호 <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="businessNumber"
                type="text"
                placeholder="000-00-00000"
                value={businessNumber}
                onChange={handleBusinessNumberChange}
                required
                readOnly={businessChecked === true}
                maxLength={12}
                className={`flex-1 ${businessChecked === true ? 'bg-muted cursor-not-allowed' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCheckBusiness}
                className="h-12 shrink-0"
                disabled={businessChecked === true}
              >
                사업자 조회
              </Button>
            </div>
            {businessChecked !== null && (
              <p
                className={`flex items-center gap-1 text-sm ${
                  businessChecked ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {businessChecked ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    정상 사업자입니다.
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    {businessNumber.length < 12
                      ? '사업자등록번호 형식이 올바르지 않습니다.'
                      : businessError}
                  </>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hospitalName">
              병원명 (상호) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hospitalName"
              type="text"
              placeholder="병원명을 입력해주세요"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ceoName">
              대표자명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ceoName"
              type="text"
              placeholder="대표자명을 입력해주세요"
              value={ceoName}
              onChange={(e) => setCeoName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              병원 주소 <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="우편번호"
                value={postalCode}
                readOnly
                className="w-32"
              />
              <Button
                type="button"
                variant="outline"
                className="h-12"
                onClick={handleSearchAddress}
              >
                주소 검색
              </Button>
            </div>
            <Input
              type="text"
              placeholder="기본 주소 자동 입력"
              value={address}
              readOnly
            />
            <Input
              type="text"
              placeholder="상세 주소 입력"
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
            />
          </div>
        </section>

        <Separator />

        {/* 3. 필수 증빙 서류 */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-2 text-2xl font-bold">3. 필수 증빙 서류</h2>
            <p className="flex items-center gap-1 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              10MB 이하의 JPG, PDF 파일만 가능
            </p>
          </div>

          {/* 사업자등록증 */}
          <div className="space-y-2">
            <Label htmlFor="businessLicense">1) 사업자등록증 사본</Label>
            <div className="hover:border-primary cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors">
              <input
                id="businessLicense"
                type="file"
                accept=".jpg,.jpeg,.pdf"
                onChange={(e) => handleFileUpload(e, 'business')}
                className="hidden"
              />
              <label
                htmlFor="businessLicense"
                className="flex cursor-pointer flex-col items-center gap-2"
              >
                <Upload className="text-muted-foreground h-8 w-8" />
                {businessLicense ? (
                  <div>
                    <p className="font-medium">{businessLicense.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {(businessLicense.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm">
                      드래그 앤 드롭
                    </p>
                    <p className="text-muted-foreground text-sm">또는</p>
                    <Button type="button" variant="outline" size="sm">
                      파일 찾기
                    </Button>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* 의료기관 개설신고필증 */}
          <div className="space-y-2">
            <Label htmlFor="medicalLicense">
              2) 의료기관 개설신고필증 (필수){' '}
            </Label>
            <div className="hover:border-primary cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors">
              <input
                id="medicalLicense"
                type="file"
                accept=".jpg,.jpeg,.pdf"
                onChange={(e) => handleFileUpload(e, 'medical')}
                className="hidden"
              />
              <label
                htmlFor="medicalLicense"
                className="flex cursor-pointer flex-col items-center gap-2"
              >
                <Upload className="text-muted-foreground h-8 w-8" />
                {medicalLicense ? (
                  <div>
                    <p className="font-medium">{medicalLicense.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {(medicalLicense.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm">
                      드래그 앤 드롭
                    </p>
                    <p className="text-muted-foreground text-sm">또는</p>
                    <Button type="button" variant="outline" size="sm">
                      파일 찾기
                    </Button>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* 대표자 등장 서류 */}
          <div className="space-y-2">
            <Label htmlFor="ceoDocument">3) 대표자 통장 사본</Label>
            <div className="hover:border-primary cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors">
              <input
                id="ceoDocument"
                type="file"
                accept=".jpg,.jpeg,.pdf"
                onChange={(e) => handleFileUpload(e, 'ceo')}
                className="hidden"
              />
              <label
                htmlFor="ceoDocument"
                className="flex cursor-pointer flex-col items-center gap-2"
              >
                <Upload className="text-muted-foreground h-8 w-8" />
                {ceoDocument ? (
                  <div>
                    <p className="font-medium">{ceoDocument.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {(ceoDocument.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm">
                      드래그 앤 드롭
                    </p>
                    <p className="text-muted-foreground text-sm">또는</p>
                    <Button type="button" variant="outline" size="sm">
                      파일 찾기
                    </Button>
                  </>
                )}
              </label>
            </div>
          </div>
        </section>

        <Separator />

        {/* 4. 약관 동의 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">4. 약관 동의</h2>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeAll"
                checked={agreeAll}
                onCheckedChange={handleAgreeAllToggle}
              />
              <Label
                htmlFor="agreeAll"
                className="cursor-pointer text-base font-semibold"
              >
                약관 전체 동의
              </Label>
            </div>

            <Separator />

            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeTerms"
                    checked={agreeTerms}
                    onCheckedChange={(checked) =>
                      setAgreeTerms(checked as boolean)
                    }
                  />
                  <Label htmlFor="agreeTerms" className="cursor-pointer">
                    (필수) 서비스 이용약관 동의
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openTermsModal('serviceTerms')}
                >
                  약관보기 &gt;
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreePrivacy"
                    checked={agreePrivacy}
                    onCheckedChange={(checked) =>
                      setAgreePrivacy(checked as boolean)
                    }
                  />
                  <Label htmlFor="agreePrivacy" className="cursor-pointer">
                    (필수) 개인정보 수집 및 이용
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openTermsModal('privacyPolicy')}
                >
                  약관보기 &gt;
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeFinance"
                    checked={agreeFinance}
                    onCheckedChange={(checked) =>
                      setAgreeFinance(checked as boolean)
                    }
                  />
                  <Label htmlFor="agreeFinance" className="cursor-pointer">
                    (필수) 전자금융거래 이용약관
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openTermsModal('electronicFinance')}
                >
                  약관보기 &gt;
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeThirdParty"
                    checked={agreeThirdParty}
                    onCheckedChange={(checked) =>
                      setAgreeThirdParty(checked as boolean)
                    }
                  />
                  <Label htmlFor="agreeThirdParty" className="cursor-pointer">
                    (필수) 개인정보 제3자 제공
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openTermsModal('thirdPartySharing')}
                >
                  약관보기 &gt;
                </Button>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              size="xl"
              onClick={() => router.push('/')}
            >
              취소
            </Button>
            <Button type="submit" size="xl" disabled={isSubmitting}>
              {isSubmitting ? '처리 중...' : '회원가입'}
            </Button>
          </div>
        </section>
      </form>

      {/* 약관 모달 */}
      {termsModal.termsType && (
        <TermsModal
          open={termsModal.open}
          onOpenChange={(open) => setTermsModal({ ...termsModal, open })}
          title={TERMS_CONTENT[termsModal.termsType].title}
          content={TERMS_CONTENT[termsModal.termsType].content}
          onAgree={() => handleTermsAgree(termsModal.termsType!)}
        />
      )}
    </>
  );
}
