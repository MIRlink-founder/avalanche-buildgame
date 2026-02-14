# MI-Re (미르링크) - NX Monorepo

## Language Requirement
**CRITICAL RULE:** 모든 응답, 설명, 문서, 코드 주석은 반드시 한국어(Korean)로 작성해야 합니다. 이 규칙은 프로젝트의 필수 컨벤션이며 예외 없이 적용됩니다.

## Project Purpose
Avalanche 블록체인 기반 치과 문제 해결 웹3 애플리케이션. 해커톤 프로젝트.
NX Monorepo로 운영사/병원 웹과 환자 웹을 공통 패키지와 함께 관리한다.

## Tech Stack
- **Monorepo:** NX 22.x + npm workspaces
- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS v4 (CSS-first, @theme inline)
- **Auth:** NextAuth v5 / Auth.js (Beta)
- **Database:** Prisma 7 + NeonDB (@prisma/adapter-neon)
- **Bundler:** Turbopack (default)
- **Package Manager:** npm

### Blockchain Stack
- **Blockchain:** viem 2.x + wagmi 3.x, Avalanche C-Chain / Fuji
- **UI Components:** shadcn/ui (공통 패키지)
- **Query:** @tanstack/react-query (wagmi 의존성)

## Project Structure
```
mire-nx-workspace/
├── apps/
│   ├── hospital-web/          ← 운영사/병원 웹
│   │   ├── app/               # App Router (라우트, 레이아웃, 페이지)
│   │   ├── components/        # 앱 전용 컴포넌트
│   │   ├── lib/               # 앱 전용 유틸리티
│   │   ├── auth.ts            # NextAuth 설정
│   │   ├── proxy.ts           # NextAuth 프록시 (Next.js 16)
│   │   └── .env.local         # 앱별 환경변수
│   └── patient-web/           ← 환자 웹
│       ├── app/               # App Router
│       ├── components/        # 앱 전용 컴포넌트
│       ├── lib/               # 앱 전용 유틸리티
│       ├── auth.ts            # NextAuth 설정
│       ├── proxy.ts           # NextAuth 프록시 (Next.js 16)
│       └── .env.local         # 앱별 환경변수
├── packages/
│   ├── database/              ← Prisma 공통 모듈 (스키마, 클라이언트, 마이그레이션)
│   │   ├── src/
│   │   │   ├── index.ts       # 배럴 export (prisma, PrismaClient, 타입)
│   │   │   └── client.ts      # PrismaClient 싱글톤 (PrismaNeon 어댑터)
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # 데이터 스키마 (유일한 진실의 원천)
│   │   │   └── migrations/    # 마이그레이션 히스토리
│   │   └── prisma.config.ts   # Prisma CLI 설정
│   ├── blockchain/            ← wagmi + viem 공통 모듈
│   │   └── src/
│   │       ├── wagmi/         # config, chains, contracts (ABI, addresses)
│   │       └── viem/          # Public/Wallet client 팩토리
│   └── ui/                    ← shadcn/ui 공통 컴포넌트
│       └── src/
│           ├── utils.ts       # cn() 유틸리티
│           └── components/    # Button, Dialog, Input 등
├── nx.json                    # NX 설정
├── tsconfig.base.json         # 공통 TypeScript 설정 + 경로 별칭
└── package.json               # 루트 워크스페이스 설정
```

## Import Patterns
```typescript
// 공통 패키지 import (모든 앱에서 동일)
import { prisma } from '@mire/database'
import { config } from '@mire/blockchain/wagmi/config'
import { avalancheFuji } from '@mire/blockchain/wagmi/chains'
import { getContractAddress } from '@mire/blockchain/wagmi/contracts/addresses'
import { createPublicViemClient } from '@mire/blockchain/viem/clients'
import { Button } from '@mire/ui/components/button'
import { cn } from '@mire/ui/utils'

// 앱 내부 import (각 앱 내에서만)
import { something } from '@/lib/something'
import { MyComponent } from '@/components/MyComponent'
```

## Essential Commands
```bash
# 개발 서버
npm run dev:hospital         # 병원 웹 개발 서버
npm run dev:patient          # 환자 웹 개발 서버

# 빌드
npm run build:all            # 양쪽 앱 동시 빌드
npx nx build hospital-web    # 병원 웹만 빌드
npx nx build patient-web     # 환자 웹만 빌드

# Database (packages/database에서 실행)
npm run db:generate          # Prisma Client 재생성
npm run db:migrate:dev       # 개발 마이그레이션 (생성 + 적용 + generate)
npm run db:migrate:deploy    # 프로덕션 마이그레이션 (적용만)
npm run db:studio            # Prisma Studio GUI
```

## Code Conventions

### TypeScript
- Strict mode 활성화
- `any` 타입 사용 금지 — unknown + 타입 가드 사용
- Interface 선호 (type은 union/intersection에만)

### Components
- Server Components가 기본 — `'use client'`는 브라우저 API, 이벤트, hooks 필요 시에만
- Named exports 선호 (default export는 page.tsx, layout.tsx 등 Next.js 컨벤션만)
- 컴포넌트 파일명: PascalCase (e.g., `UserProfile.tsx`)

### Styling (Tailwind v4)
- CSS modules 사용 안 함 — Tailwind utility classes만 사용
- 커스텀 컬러: `bg-primary`, `text-foreground`, `border-border` 등 (globals.css 참조)
- Border radius: `rounded-[--radius]` (0.625rem)
- 다크모드 준비됨 (`.dark` 클래스 구조 존재, 아직 미구현)
- 새 색상 추가 시 globals.css의 :root, .dark, @theme inline 세 곳 모두 업데이트

### Data Fetching
- Server Components에서 직접 async/await — Route Handler 불필요
- Route Handler는 webhooks, 외부 API 전용
- Server Actions으로 mutation 처리
- mutation 후 `revalidatePath()` 필수

## NX Monorepo Conventions

### 패키지 관리
- 공통 코드는 반드시 `packages/` 하위 패키지로 분리
- 앱 간 직접 import 금지 — 반드시 공통 패키지를 통해 공유
- 새 패키지 추가 시 `tsconfig.base.json`의 paths에 별칭 등록 필수

### 빌드 의존성
- `nx.json`의 `targetDefaults.build.dependsOn: ["^build"]`로 패키지 빌드 순서 자동 해결
- 앱의 `next.config.js`에 `transpilePackages: ['@mire/database', '@mire/blockchain', '@mire/ui']` 필수

### TypeScript 설정
- `tsconfig.base.json`: 공통 설정 + 경로 별칭 (`@mire/*`)
- 각 앱 `tsconfig.json`: `composite: false` (Next.js와 NX 참조 충돌 방지)
- 각 앱의 `include`에 사용하는 패키지 소스 경로 포함 필수

## Database (Prisma + NeonDB)

### 핵심 원칙
- **스키마와 마이그레이션은 `packages/database/`에서만 관리**
- 양쪽 앱이 동일한 스키마를 공유
- DB 관련 명령은 반드시 `packages/database`에서만 실행
- **Prisma는 서버 사이드에서만 사용** — Server Components, Server Actions, Route Handlers
- Client Components에서 Prisma 직접 사용 금지
- Import: `import { prisma } from '@mire/database'`

### 스키마 수정 후 워크플로우
```bash
# 1. packages/database/prisma/schema.prisma 수정
# 2. 마이그레이션 생성 + 적용 + 클라이언트 재생성
npm run db:migrate:dev
# 3. 프로덕션 배포 시 (마이그레이션 적용만)
npm run db:migrate:deploy
```

### `prisma db push` 사용 금지
- 마이그레이션 히스토리를 남기지 않아 변경 추적 불가
- 팀 협업 시 DB 상태 불일치 및 drift 에러 유발
- 되돌릴 수 없어 데이터 유실 위험
- 항상 `migrate dev` → `migrate deploy` 워크플로우를 따른다

### 이중 연결 전략
- `DATABASE_URL` (풀링): 애플리케이션 런타임
- `DIRECT_URL` (직접): Prisma CLI 마이그레이션
- 두 변수 모두 필수

## Authentication (NextAuth v5)
- 설정 파일: 각 앱의 `auth.ts`
- 프록시: 각 앱의 `proxy.ts` (Next.js 16 전용, middleware.ts 아님)
- API: `/api/auth/*` (자동 라우팅)
- AUTH_SECRET 환경변수 필수

## Environment Variables
- 각 앱의 `.env.local`: 앱별 환경변수
- `.env.example`: 템플릿 (커밋됨)
- `env.d.ts`: TypeScript 환경변수 타입 선언
- `NEXT_PUBLIC_` 접두사: 브라우저 노출 가능한 변수만
- 시크릿 키에는 절대 `NEXT_PUBLIC_` 접두사 사용 금지
- `packages/database/.env`: Prisma CLI용 (DATABASE_URL, DIRECT_URL)

### Database Environment Variables
- `DATABASE_URL`: NeonDB 풀링 연결 (런타임용, -pooler 호스트)
- `DIRECT_URL`: NeonDB 직접 연결 (CLI 마이그레이션용, pooler 없는 호스트)

### Blockchain Environment Variables
- `NEXT_PUBLIC_CHAIN_ID`: 기본 체인 ID (43114: Avalanche, 43113: Fuji)
- `NEXT_PUBLIC_AVALANCHE_RPC_URL`: Avalanche C-Chain RPC URL (선택)
- `NEXT_PUBLIC_FUJI_RPC_URL`: Avalanche Fuji RPC URL (선택)
- 프라이빗키 관련 환경변수는 절대 `NEXT_PUBLIC_` 접두사 사용 금지

## Critical Warnings
1. Server Components에 불필요한 `'use client'` 추가 금지
2. `redirect()`를 try/catch 블록 안에서 호출 금지
3. `useSearchParams()`는 Client Components에서만 사용
4. Tailwind v4: `tailwind.config.js` 사용 안 함 — CSS @theme 사용
5. NextAuth: `middleware.ts` 아닌 `proxy.ts` 사용 (Next.js 16)
6. 프로덕션에서 `prisma migrate dev` 절대 사용 금지 → `prisma migrate deploy` 사용
7. 적용된 마이그레이션 파일 수정/삭제 금지 — 새 마이그레이션 생성만
8. Client Components에서 Prisma 사용 금지 — Server Components/Actions만
9. wagmi config 파일에 `'use client'` 추가 금지 — providers.tsx만 Client Component
10. ABI 정의 시 `as const` 생략 금지 — 타입 추론에 필수
11. QueryClient를 여러 번 생성 금지 — providers.tsx에서 싱글톤 패턴 사용
12. 앱 간 직접 import 금지 — 공통 패키지를 통해서만 공유
13. DB 관련 명령은 `packages/database`에서만 실행

## App Router Conventions
- **error.tsx**: 라우트 수준 에러 바운더리 (Client Component 필수)
- **global-error.tsx**: 글로벌 에러 바운더리 (html/body 태그 포함, Client Component 필수)
- **not-found.tsx**: 커스텀 404 페이지 (Server Component)
- **loading.tsx**: 로딩 상태 UI (Server Component)
- **layout.tsx**: 공유 레이아웃 (Server Component 기본)
- **page.tsx**: 페이지 컴포넌트 (Server Component 기본)

### Error Handling Best Practices
- 모든 에러 메시지는 한국어로 작성
- 사용자 친화적인 에러 설명 제공
- 복구 옵션 제공 (retry 버튼 등)
- error.digest 표시로 디버깅 지원
- global-error.tsx는 최후의 수단 (layout.tsx 에러 처리)

## Naming Conventions
- 파일명: kebab-case (예: user-profile.tsx)
- 컴포넌트명: PascalCase (예: UserProfile)
- 함수명: camelCase (예: getUserData)
- 상수명: UPPER_SNAKE_CASE (예: API_BASE_URL)
- CSS 변수명: kebab-case (예: --primary-color)
- 패키지명: @mire/kebab-case (예: @mire/database)

## Blockchain (wagmi + viem)
- **wagmi hooks는 Client Component에서만 사용** — useAccount, useConnect, useBalance 등
- **viem 클라이언트는 Server/Client 모두 사용 가능** — public client는 어디서나, wallet client는 Server Actions
- Import 패턴: `import { config } from '@mire/blockchain/wagmi/config'`
- Provider: 각 앱의 `app/providers.tsx`에 WagmiProvider + QueryClientProvider 통합 (SSR 지원)

### Contract ABI 관리
- 위치: `packages/blockchain/src/wagmi/contracts/abis.ts`
- **ABI 정의 시 `as const` 필수** — wagmi/viem이 타입을 정확히 추론
- 새 컨트랙트 추가 시:
  1. `abis.ts`에 ABI 추가 (`as const` 포함)
  2. `addresses.ts`에 체인별 주소 추가

### Contract 주소 관리
- 위치: `packages/blockchain/src/wagmi/contracts/addresses.ts`
- 체인 ID별 주소 관리: `{ 43114: '0x...', 43113: '0x...' }`
- 사용법:
  ```typescript
  import { getContractAddress } from '@mire/blockchain/wagmi/contracts/addresses'
  const address = getContractAddress('sampleToken', chainId)
  ```

### Avalanche Chains
- **Avalanche C-Chain** (메인넷): Chain ID 43114
- **Avalanche Fuji** (테스트넷): Chain ID 43113
- Fallback transport로 다중 RPC 자동 선택 (C-Chain만)
- 환경변수 미설정 시 공용 RPC 자동 사용

## Git Workflow
- 커밋 메시지는 한국어 또는 영어 허용
- 커밋 타입: feat, fix, docs, style, refactor, test, chore
- 브랜치 전략: main 브랜치 직접 작업 (해커톤 속도 우선)
- PR 리뷰 없음 (빠른 반복 개발)

## Testing Strategy
- 해커톤 특성상 테스트 스킵
- 프로덕션 빌드 성공이 최소 검증 기준 (`npm run build:all`)
- 수동 테스트로 주요 기능 검증

## Performance Guidelines
- 이미지 최적화: Next.js Image 컴포넌트 사용
- 폰트 최적화: next/font 사용
- 번들 사이즈 모니터링: npm run build 출력 확인
- Server Components 우선 사용으로 클라이언트 JS 최소화

## Security Checklist
- 환경변수에 API 키, DB 연결 문자열 저장
- NextAuth로 인증 처리 (직접 구현 금지)
- SQL Injection 방지: Prisma ORM 사용
- XSS 방지: React의 자동 이스케이프 활용
- CSRF 방지: NextAuth 내장 보호 기능 사용

## Development Workflow
1. 기능 구현 전 CLAUDE.md 참조
2. TypeScript strict 모드 준수
3. Server Component 우선, 필요 시에만 Client Component
4. Tailwind 유틸리티 클래스로 스타일링
5. 한국어 UI 텍스트 작성
6. `npm run build:all`로 검증
7. 커밋 및 푸시

## Common Pitfalls
- ❌ 'use client'를 Server Component에 추가
- ❌ Tailwind config 파일 생성 (v4는 CSS 기반)
- ❌ middleware.ts 사용 (Next.js 16에서는 proxy.ts)
- ❌ any 타입 사용
- ❌ 영어로 UI 텍스트 작성
- ❌ 앱 간 직접 import
- ❌ DB 명령을 앱 디렉토리에서 실행
- ❌ `prisma db push` 사용
- ✅ Server Component 기본, Client Component는 명시적으로
- ✅ CSS @theme inline으로 Tailwind 설정
- ✅ proxy.ts로 NextAuth 미들웨어
- ✅ unknown + 타입 가드
- ✅ 모든 UI 텍스트 한국어
- ✅ `@mire/*` import로 공통 패키지 사용
- ✅ `migrate dev` → `migrate deploy` 워크플로우

## AI Assistant Guidelines
- 모든 코드 설명과 주석을 한국어로 작성
- Server/Client Component 구분 명확히
- Tailwind v4 CSS-first 방식 준수
- Next.js 16 App Router 규칙 준수
- TypeScript strict 모드 준수
- 에러 처리는 한국어 메시지
- 커밋 전 `npm run build:all` 실행
- 공통 코드 수정 시 양쪽 앱 빌드 확인
- .planning/ 디렉토리는 gitignore됨 (커밋 금지)

## Resources
- [NX 문서](https://nx.dev)
- [Next.js 16 문서](https://nextjs.org/docs)
- [Tailwind CSS v4 문서](https://tailwindcss.com/docs)
- [NextAuth v5 문서](https://authjs.dev)
- [Avalanche 문서](https://docs.avax.network)
- [viem 문서](https://viem.sh)
- [wagmi 문서](https://wagmi.sh)
