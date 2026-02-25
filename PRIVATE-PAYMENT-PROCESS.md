# 결제 프로세스

> 브랜치: `feat/pg-payment-integration`
> 최종 업데이트: 2026-02-25

---

## 전체 결제 플로우

```
┌──────────┐      ┌──────────┐      ┌──────────────┐      ┌──────────┐
│  환자    │      │ POS 단말기│      │   NicePay    │      │ 우리 서버 │
│          │      │ (병원)    │      │   (PG사)     │      │          │
└────┬─────┘      └────┬─────┘      └──────┬───────┘      └────┬─────┘
     │  카드 제시       │                   │                   │
     │────────────────→│                   │                   │
     │                 │  결제 승인 요청     │                   │
     │                 │─────────────────→│                   │
     │                 │  승인 결과 반환     │                   │
     │                 │←─────────────────│                   │
     │  영수증 출력     │                   │                   │
     │←────────────────│                   │                   │
     │                 │                   │  Webhook (자동)    │
     │                 │                   │─────────────────→│
     │                 │                   │                   │ PaymentLog
     │                 │                   │                   │ DB 저장
     │                 │                   │       200 OK      │
     │                 │                   │←─────────────────│
     │                 │                   │                   │
```

```
┌──────────────┐
│ 병원 직원 웹  │
│              │
│ 진료기록 등록 │
│ 페이지       │
└──────┬───────┘
       │
       │ 1. 환자 바코드 스캔
       │ 2. 치아 선택 + 진료 타입 입력
       │ 3. [등록] 버튼
       │    └→ "더 추가할 기록이 없으신가요?" 모달
       │        └→ 확인
       │            └→ "단말기 결제를 완료하셨습니까?" 모달
       │                └→ 확인
       │                    └→ 암호화 → /api/records/register
       │                       → 블록체인 등록
       │
```

**핵심: POS 결제와 웹 진료 등록은 분리되어 있음**
- POS 결제 → NicePay Webhook → PaymentLog (자동)
- 웹에서는 "결제 완료?" 수동 확인 → 진료 기록 블록체인 등록
- 둘을 연결(매칭)하는 로직은 아직 없음 (의도적)

---

## API 목록과 역할

### 현재 사용 중

| API | 누가 호출하나 | 역할 |
|-----|-------------|------|
| `POST /api/payments/webhook` | **NicePay가 자동 호출** | POS 결제 발생 시 알림 수신 → PaymentLog DB 저장 |

### 향후 화면에 연결할 API

| API | 어디에 붙이나 | 역할 |
|-----|-------------|------|
| `GET /api/payments` | 결제 내역 조회 화면 | 목록 (필터/페이지네이션) |
| `GET /api/payments/[id]` | 결제 상세 화면 | 단건 상세 조회 |
| `POST /api/payments/cancel` | 결제 관리 화면 | 결제 취소 처리 |
| `POST /api/payments/status` | 결제 관리 화면 | PG 상태 실시간 확인 |
| `POST /api/payments/approve` | 온라인 결제 화면 (미구현) | 웹에서 직접 결제 승인 |

### NicePay 전용 API (PG 직접 통신)

| API | 역할 |
|-----|------|
| `POST /api/payments/nicepay/approve` | JS SDK 결제 승인 |
| `POST /api/payments/nicepay/cancel` | 결제 취소 |
| `POST /api/payments/nicepay/status` | 거래 상태 조회 |
| `POST /api/payments/nicepay/card-keyin` | 카드 수기입력 결제 |

---

## 환경변수 현황

```bash
# .env.local
PAYMENT_PROVIDER=MOCK              # ← 현재 가짜 모드 (실결제 안 됨)

# NicePay 인증 (팀장에게 받아야 함)
NICEPAY_MID=                       # ← 비어있음
NICEPAY_MERCHANT_KEY=              # ← 비어있음
NEXT_PUBLIC_NICEPAY_CLIENT_ID=     # ← 비어있음
NICEPAY_SECRET_KEY=                # ← 비어있음

# 설정됨
NICEPAY_WEBHOOK_SECRET=test-webhook-secret-key-for-dev
```

**실결제 활성화 방법:**
1. 팀장에게 NicePay 인증키 받기
2. 위 빈 값 채우기
3. `PAYMENT_PROVIDER=NICE_POS`로 변경

---

## DB 모델

### Payment (진료별 결제 — 향후 매칭용)
```
id, medicalRecordId(unique), hospitalId, subMid, approveNo,
amount, paymentMethod, status, pgTransactionId, paidAt, cancelledAt
```

### PaymentLog (Webhook 수신 로그 — 단순 적재)
```
id, hospitalId?, subMid, approveNo?, amount, status,
pgTransactionId?, paidAt?, cancelledAt?, rawPayload(원본JSON)
```

### PaymentIdempotency (중복 결제 방지)
```
idempotencyKey(unique), operation, requestHash, status, response, paymentId
```

---

## POS기 오기 전에 할 수 있는 것

### 1. NicePay 샌드박스 인증키 확보
- 팀장에게 요청: MID, MerchantKey, ClientID, SecretKey
- POS기 계약 시 발급되었을 가능성 높음
- 받으면 `.env.local`에 세팅

### 2. MOCK 모드로 전체 플로우 시나리오 테스트
- 브라우저 콘솔에서 `/api/payments/approve` 호출 → 승인 확인
- `/api/payments/cancel` 호출 → 취소 확인
- `/api/payments/webhook` 호출 (HMAC 시그니처 포함) → DB 저장 확인
- **이미 테스트 완료됨 (2026-02-25)**

### 3. 결제 내역 조회 UI 만들기
- `GET /api/payments` API는 이미 있음
- 병원 웹에 결제 내역 페이지 추가 가능
- 필터(날짜, 상태), 페이지네이션 지원됨
- **구현 완료 (2026-02-25)**: `/payments` 페이지, 탭(결제 목록 / Webhook 로그), 필터, 커서 기반 더보기, 행 클릭 Sheet 상세

### 4. 결제 취소 UI 만들기
- `POST /api/payments/cancel` API는 이미 있음
- 결제 상세 화면에서 취소 버튼 추가 가능
- **구현 완료 (2026-02-25)**: 결제 상세 Sheet에서 PAID 상태인 결제에 취소 사유 입력 + 취소 버튼 (cancel API 연동, persist=true)

### 5. Webhook 수신 모니터링 화면
- PaymentLog 테이블 조회 화면
- POS기 오면 실제 Webhook이 들어오는지 바로 확인 가능
- **구현 완료 (2026-02-25)**: `GET /api/payments/logs` API 신규 생성 + `/payments` 페이지 "Webhook 로그" 탭으로 조회 (상태/날짜 필터, 커서 페이지네이션)

### 6. PR 올리기
- 현재 브랜치 코드는 완성 상태
- MOCK 모드로 안전하게 동작하므로 main 머지해도 문제 없음

---

## POS기 도착 후 체크리스트

- [ ] NicePay 인증키 `.env.local`에 세팅
- [ ] `PAYMENT_PROVIDER=NICE_POS`로 변경
- [ ] POS 단말기에 SubMID 세팅
- [ ] 테스트 카드로 결제 → Webhook 수신 확인 (PaymentLog 테이블)
- [ ] 진료 기록 등록 페이지에서 전체 플로우 테스트
- [ ] 운영 환경 배포 시 Webhook URL을 NicePay에 등록
