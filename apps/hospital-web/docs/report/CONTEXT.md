# Reports 기능 권한 관리 컨텍스트

## 개요

Reports 기능은 **확장 가능한 Feature Gate 시스템**으로 권한을 관리합니다.
- 현재: 역할 기반 접근 제어 (MASTER_ADMIN만 접근 가능)
- 향후: 데이터 적재 수 기반 접근 제어 (진료 기록 100건 이상이면 모든 역할 접근 가능)

## 아키텍처

### 핵심 구성 요소

```
hospital-web/
├── lib/permissions/
│   ├── features.ts              # 타입 및 상수 정의
│   └── feature-access.ts        # 권한 체크 로직 (확장 지점 ⭐)
├── hooks/
│   └── useFeatureAccess.ts      # React Hook
├── components/auth/
│   ├── FeatureGate.tsx          # 게이트 컴포넌트
│   └── UnauthorizedOverlay.tsx  # 접근 거부 UI
└── app/(hospital)/reports/
    └── page.tsx                 # Reports 페이지
```

### 권한 체크 흐름

```
사용자 접근
    ↓
[useFeatureAccess Hook]
    ↓
1. localStorage에서 토큰 가져오기
2. 토큰에서 사용자 정보 추출
3. (선택) 데이터 통계 가져오기
    ↓
[checkFeatureAccess 함수]
    ↓
우선순위 1: 데이터 적재 수 체크
    ↓ (부족하면)
우선순위 2: 역할 체크 (MASTER_ADMIN)
    ↓
{ allowed: boolean, message: string }
```

## 현재 구현

### 1. 페이지 접근 제어

**파일:** `app/(hospital)/reports/page.tsx`

```typescript
<FeatureGate
  feature={FEATURES.REPORTS}
  deniedMessage="리포트 기능은 마스터 관리자만 사용할 수 있습니다."
>
  <ReportsContent />
</FeatureGate>
```

### 2. 네비게이션 메뉴 제어

**파일:** `components/layout/Navigation.tsx`

```typescript
// Reports 기능 접근 권한 체크
const { allowed: canAccessReports } = useFeatureAccess(FEATURES.REPORTS);

// 조건부 렌더링
{canAccessReports && (
  <NavLink href="/reports">데이터 리포트</NavLink>
)}
```

### 3. 권한 체크 로직

**파일:** `lib/permissions/feature-access.ts`

```typescript
const DATA_REQUIREMENTS: Record<Feature, {...}> = {
  [FEATURES.REPORTS]: {
    medicalRecordCount: 100, // 진료 기록 100건 이상
  },
};

// 우선순위
// 1. 데이터 적재 수 >= 100건 → 모든 역할 허용
// 2. 데이터 부족 → MASTER_ADMIN만 허용
```

## 테스트 계정

### MASTER_ADMIN (접근 가능)
- 이메일: `hospital@mire.com`
- 비밀번호: `hospital123`
- 역할: MASTER_ADMIN
- 결과: ✅ Reports 메뉴 표시, 페이지 접근 가능

### DEPT_ADMIN (접근 불가)
- 이메일: `doctor2@mire.com`
- 비밀번호: `doctor123`
- 역할: DEPT_ADMIN
- 결과: ❌ Reports 메뉴 숨김, 페이지 접근 시 권한 없음 화면

## 향후 확장: 데이터 통계 연동

### API 엔드포인트 생성 (예정)

**파일:** `app/api/hospital/stats/route.ts` (생성 필요)

```typescript
export async function GET(request: Request) {
  const user = await requireAuth(request);

  const stats = await prisma.medicalRecord.count({
    where: { hospitalId: user.hospitalId },
  });

  return NextResponse.json({
    medicalRecordCount: stats,
  });
}
```

### Reports 페이지에 적용

**파일:** `app/(hospital)/reports/page.tsx`

```typescript
<FeatureGate
  feature={FEATURES.REPORTS}
  fetchDataStats={async () => {
    const res = await fetch('/api/hospital/stats');
    return res.json(); // { medicalRecordCount: 150 }
  }}
>
  <ReportsContent />
</FeatureGate>
```

### 동작 방식

- **진료 기록 >= 100건**
  - ✅ DEPT_ADMIN도 Reports 메뉴 표시
  - ✅ DEPT_ADMIN도 페이지 접근 가능

- **진료 기록 < 100건**
  - ❌ DEPT_ADMIN은 Reports 메뉴 숨김
  - ✅ MASTER_ADMIN은 계속 접근 가능

## 새로운 조건 추가 방법

### 1. 데이터 요구사항 수정

**파일:** `lib/permissions/feature-access.ts`

```typescript
const DATA_REQUIREMENTS = {
  [FEATURES.REPORTS]: {
    medicalRecordCount: 100,
    paymentCount: 50,        // 결제 50건 추가
    settlementCount: 10,     // 정산 10건 추가
  },
};
```

### 2. 복잡한 로직 추가

```typescript
[FEATURES.REPORTS]: (user, dataStats) => {
  // 데이터 체크
  if (dataStats) {
    const hasEnough =
      (dataStats.medicalRecordCount ?? 0) >= 100 &&
      (dataStats.paymentCount ?? 0) >= 50;

    if (hasEnough) {
      return { allowed: true };
    }
  }

  // 역할 체크
  if (user.role === 'MASTER_ADMIN') {
    return { allowed: true };
  }

  // 특정 병원 예외 처리
  if (user.hospitalId === 'special-hospital-id') {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: '진료 기록 100건, 결제 50건 이상이 필요합니다.',
  };
},
```

## 다른 기능에 적용

### Analytics 기능 추가 예시

**1. features.ts에 기능 추가**
```typescript
export const FEATURES = {
  REPORTS: 'reports',
  ANALYTICS: 'analytics',  // 추가
} as const;
```

**2. feature-access.ts에 규칙 추가**
```typescript
const ACCESS_RULES = {
  [FEATURES.ANALYTICS]: (user, dataStats) => {
    if (dataStats?.medicalRecordCount >= 50) {
      return { allowed: true };
    }
    if (user.role === 'MASTER_ADMIN') {
      return { allowed: true };
    }
    return {
      allowed: false,
      message: '분석 기능은 마스터 관리자만 사용할 수 있습니다.',
    };
  },
};
```

**3. 페이지에 적용**
```typescript
<FeatureGate feature={FEATURES.ANALYTICS}>
  <AnalyticsContent />
</FeatureGate>
```

## 주의사항

1. **일관성 유지**
   - 모든 권한 체크는 `feature-access.ts`를 통해서만 수행
   - 컴포넌트에서 직접 role 체크 금지

2. **성능 고려**
   - `useFeatureAccess`는 localStorage 읽기 + 비동기 데이터 로딩
   - 필요한 곳에만 사용 (과도한 사용 주의)

3. **보안**
   - 서버 사이드에서도 권한 체크 필요 (클라이언트만으로는 불충분)
   - API Route에서 `requireAuth` + 역할/데이터 체크

4. **테스트**
   - 새로운 조건 추가 시 모든 역할로 테스트 필요
   - MASTER_ADMIN, DEPT_ADMIN, SUB_ADMIN 등

## 관련 파일

### 핵심 파일
- `lib/permissions/features.ts` - 타입 및 상수
- `lib/permissions/feature-access.ts` - **권한 로직 (확장 지점)**
- `hooks/useFeatureAccess.ts` - React Hook
- `components/auth/FeatureGate.tsx` - 게이트 컴포넌트

### 사용 예시
- `app/(hospital)/reports/page.tsx` - 페이지 레벨 적용
- `components/layout/Navigation.tsx` - 네비게이션 메뉴 조건부 표시

### UI 컴포넌트
- `components/auth/UnauthorizedOverlay.tsx` - 접근 거부 화면

## 참고

- 모든 메시지는 한국어로 작성 (CLAUDE.md 컨벤션)
- 타입 안전성: TypeScript strict 모드 준수
- 확장성: 새로운 조건 추가 시 최소 수정으로 가능
