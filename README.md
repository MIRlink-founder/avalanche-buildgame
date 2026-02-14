# MI;Re (미르링크) - NX Monorepo

Avalanche 블록체인 기반 치과 문제 해결 웹3 애플리케이션.

## 구조

```
mire-nx-workspace/
├── apps/
│   ├── hospital-web/       ← 운영사/병원 웹 (기존 코드 이전)
│   └── patient-web/        ← 환자 웹 (최소 구성)
├── packages/
│   ├── database/           ← Prisma 7 공통 모듈 (스키마, 클라이언트, 마이그레이션)
│   ├── blockchain/         ← wagmi 3 + viem 2 (Avalanche 체인, 컨트랙트)
│   └── ui/                 ← shadcn/ui 공통 컴포넌트 (cn, Button, Dialog 등)
├── nx.json
├── package.json
└── tsconfig.base.json
```

## 핵심 명령어

| 명령 | 용도 |
|------|------|
| `npm run dev:hospital` | 병원 웹 개발 서버 |
| `npm run dev:patient` | 환자 웹 개발 서버 |
| `npm run build:all` | 양쪽 앱 동시 빌드 |
| `npm run db:generate` | Prisma 클라이언트 생성 |
| `npm run db:migrate:dev` | DB 마이그레이션 (개발) |
| `npm run db:studio` | Prisma Studio |

## Import 패턴

```typescript
import { prisma } from '@mire/database'
import { config } from '@mire/blockchain/wagmi/config'
import { Button } from '@mire/ui/components/button'
import { cn } from '@mire/ui/utils'
```
