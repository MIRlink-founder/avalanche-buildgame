# 결제 프로세스

> 브랜치: `feat/pg-payment-integration`
> 최종 업데이트: 2026-02-25

---

## 어떻게 결제가 이루어지나

현재 MI;Re의 결제는 **오프라인 POS 방식**으로 동작합니다. 환자가 병원에 방문하면 접수 데스크에서 POS 단말기로 카드 결제를 합니다. 이 과정에서 우리 웹 시스템은 개입하지 않습니다. 결제가 완료되면 PG사(NicePay)가 자동으로 우리 서버의 Webhook 엔드포인트(`POST /api/payments/webhook`)를 호출해서 결제 정보를 전달하고, 서버는 이걸 PaymentLog 테이블에 그대로 저장합니다.

병원 직원은 별도로 웹에서 진료기록을 등록합니다. 등록 버튼을 누르면 "더 추가할 기록이 없으신가요?" → "단말기 결제를 완료하셨습니까?" 순서로 확인 모달이 뜨고, 확인하면 진료 데이터가 암호화되어 블록체인에 등록됩니다. 즉, POS 결제와 진료기록 등록은 현재 분리되어 있고, 둘을 자동으로 매칭하는 로직은 아직 없습니다. 이건 의도적인 설계입니다.

```
환자 → POS 카드 결제 → PG사(NicePay) → Webhook → 서버 DB 저장 (자동)
병원 직원 → 웹에서 "결제 완료?" 수동 확인 → 블록체인 등록 (수동)
```

---

## Webhook은 어떻게 처리하나

PG사가 `POST /api/payments/webhook`을 호출하면, 서버는 먼저 `x-nicepay-signature` 헤더에 담긴 HMAC-SHA256 서명을 검증합니다. `crypto.timingSafeEqual()`을 써서 타이밍 공격도 방지합니다. 서명이 맞으면 JSON 본문을 파싱하고, 필수 필드인 `subMid`(가맹점 번호)와 `amount`(금액)가 있는지 확인합니다. PG사마다 필드명이 다를 수 있어서 `subMid` 또는 `mbrNo`, `amount` 또는 `amt` 등 대체 필드명도 지원합니다.

상태 코드는 PG사 값을 내부 값으로 매핑합니다. `0000`이나 `SUCCESS`면 `PAID`, `CANCEL`이면 `CANCELLED`, 나머지는 `READY`로 처리합니다. 매핑된 상태에 따라 `paidAt` 또는 `cancelledAt` 타임스탬프를 설정하고, 원본 JSON 전체를 `rawPayload`에 함께 저장합니다.

시그니처가 없거나 틀리면 401, 필수 필드가 없으면 400, DB 저장 실패 시 500을 반환합니다. 모든 에러 케이스를 curl로 테스트 완료했고 정상 동작합니다.

---

## 결제 승인과 취소 API

Webhook 외에 **결제 승인 API**(`POST /api/payments/approve`)와 **결제 취소 API**(`POST /api/payments/cancel`)도 구현되어 있습니다.

**결제 승인**은 온라인에서 직접 결제할 때 쓰는 API입니다. 현재는 오프라인 POS 방식이라 UI에서 호출하지 않지만, 나중에 온라인 결제로 전환하면 바로 쓸 수 있습니다. 내부적으로는 Strategy 패턴의 `PaymentProvider` 인터페이스를 통해 동작하는데, 환경변수 `PAYMENT_PROVIDER` 값이 `MOCK`이면 항상 성공을 반환하는 테스트용 프로바이더가, `NICE_POS`면 실제 NicePay 카드 키인 API를 호출하는 프로바이더가 선택됩니다. 승인이 성공하면 Payment 레코드를 생성하고 MedicalRecord 상태를 `DRAFT → PAID`로 변경합니다.

**결제 취소**는 이미 결제 상세 Sheet UI에 연결되어 있습니다. PAID 상태인 결제의 상세를 열면 취소 사유 입력란과 취소 버튼이 나타나고, 실행하면 `cancel` API를 호출합니다. 내부적으로 프로바이더의 `cancel()` 메서드를 호출하고, DB에서 Payment 상태를 `CANCELLED`로 업데이트하면서 MedicalRecord를 `PAID → DRAFT`로 되돌립니다.

두 API 모두 **멱등성(Idempotency)**을 지원합니다. `Idempotency-Key` 헤더를 보내면 같은 키로 중복 요청이 와도 동일한 응답을 반환합니다. 요청 본문의 SHA256 해시를 비교해서 같은 키인데 다른 내용이면 409 충돌을 반환합니다. 이 상태는 `PaymentIdempotency` 테이블에서 추적됩니다.

---

## NicePay 연동 구조

NicePay와의 통신은 두 가지 방식으로 구현되어 있습니다.

첫 번째는 **Legacy API**(`nicepay-client.ts`)로, EUC-KR 인코딩 기반의 구버전 API입니다. 카드 수기입력 결제(`/webapi/card_keyin.jsp`), 취소(`/webapi/cancel_process.jsp`), 상태 조회(`/webapi/inquery/trans_status.jsp`)를 지원합니다. 카드 정보는 AES-128-ECB로 암호화하고, EUC-KR 인코딩 처리를 위해 iconv-lite 라이브러리를 사용합니다.

두 번째는 **Start API v1**(`nicepay-v1-client.ts`)으로, UTF-8 JSON 기반의 REST API입니다. JS SDK 결제창 인증 후 서버 승인(`POST /v1/payments/{tid}`), 취소, 상태 조회를 지원합니다. Basic Auth(clientId:secretKey → Base64)로 인증합니다.

각 방식에 대응하는 Route Handler도 별도로 있습니다. `/api/payments/nicepay/card-keyin`, `/api/payments/nicepay/cancel`, `/api/payments/nicepay/status`는 Legacy API를, `/api/payments/nicepay/approve`는 v1 API를 호출합니다.

---

## DB 모델

**Payment**는 결제 원장입니다. 진료기록(MedicalRecord)과 1:1로 연결되고, 정산(Settlement)과도 연결될 수 있습니다. 가맹점 번호, 승인번호, PG 거래 ID, 금액, 결제수단, 상태(READY/PAID/SETTLED/CANCELLED), 결제/취소 일시를 저장합니다.

**PaymentLog**는 Webhook 수신 로그입니다. Payment와 달리 진료기록과 매칭하지 않고 PG에서 보내는 이벤트를 그대로 쌓습니다. 원본 JSON 전체를 `rawPayload`에 보존합니다.

**PaymentIdempotency**는 중복 결제 방지용입니다. 멱등성 키, 작업 유형(APPROVE/CANCEL), 요청 해시, 처리 상태(PENDING/SUCCEEDED/FAILED), 응답 본문을 저장합니다.

---

## UI 화면

결제 내역은 **정산 관리 페이지**(`/settlements`) 안에 탭으로 통합되어 있습니다. "정산 내역" 탭과 "결제 내역" 탭이 있고, 기존의 `/payments` URL은 `/settlements`로 자동 리다이렉트됩니다. 헤더 네비게이션에서 "결제 내역" 독립 메뉴는 제거했습니다.

결제 내역 탭에서는 상태(전체/대기/완료/취소)와 날짜 범위로 필터링할 수 있고, 각 행 오른쪽의 "상세" 버튼을 누르면 사이드 Sheet가 열려서 기본 정보, PG 정보, 일시 정보를 보여줍니다. PAID 상태인 결제는 상세 Sheet에서 바로 취소할 수 있습니다.

정산 상태는 대기/완료, 결제 상태는 대기/완료/취소로 표시됩니다.

---

## 환경변수 현황

현재 `PAYMENT_PROVIDER=MOCK`으로 설정되어 있어서 실결제는 이루어지지 않습니다. `NICEPAY_WEBHOOK_SECRET`만 dev용 테스트 키가 설정되어 있고, 나머지 NicePay 인증 정보(`NICEPAY_MID`, `NICEPAY_MERCHANT_KEY`, `NEXT_PUBLIC_NICEPAY_CLIENT_ID`, `NICEPAY_SECRET_KEY`)는 비어 있습니다.

실결제를 켜려면 팀장에게 NicePay 인증키를 받아서 빈 값을 채우고, `PAYMENT_PROVIDER=NICE_POS`로 바꾸면 됩니다.

---

## POS기 도착 후 체크리스트

- [ ] NicePay 인증키 `.env.local`에 세팅
- [ ] `PAYMENT_PROVIDER=NICE_POS`로 변경
- [ ] POS 단말기에 SubMID 세팅
- [ ] 테스트 카드로 결제 → Webhook 수신 확인
- [ ] 진료 기록 등록 페이지에서 전체 플로우 테스트
- [ ] 운영 환경 배포 시 Webhook URL을 NicePay에 등록

---

## 향후 확장 포인트

온라인 결제로 전환하면 진료 등록 시 approve API를 호출하는 플로우를 추가하면 됩니다. Webhook으로 들어온 PaymentLog와 진료기록을 자동 매칭하는 로직도 필요하게 될 겁니다. 정산 쪽은 NFT 검증 → 페이백 산출 → Settlement 레코드 생성하는 배치와, 실시간 매출/정산 예정/기정산 통계를 보여주는 대시보드가 남아 있습니다.
