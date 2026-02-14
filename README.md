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

## Database (Prisma)

스키마와 마이그레이션은 모두 `packages/database/`에서 관리한다. 양쪽 앱이 동일한 스키마를 공유하므로, DB 관련 명령은 반드시 이 패키지에서만 실행한다.

### 스키마 수정 후 워크플로우

```bash
# 1. packages/database/prisma/schema.prisma 수정

# 2. 마이그레이션 파일 생성 + DB 적용 + 클라이언트 재생성 (개발)
npm run db:migrate:dev

# 3. 프로덕션 배포 시 (마이그레이션 적용만, 새 파일 생성 안 함)
npm run db:migrate:deploy
```

### 명령어 상세

| 명령 | 용도 | 언제 쓰는가 |
|------|------|-------------|
| `npm run db:generate` | Prisma 클라이언트 재생성 | 스키마 변경 후 타입만 업데이트할 때 |
| `npm run db:migrate:dev` | 마이그레이션 생성 + 적용 + generate | 개발 중 스키마 변경 시 |
| `npm run db:migrate:deploy` | 기존 마이그레이션 적용만 | 프로덕션/스테이징 배포 시 |
| `npm run db:studio` | Prisma Studio GUI | DB 데이터 직접 확인/수정 시 |

### `prisma db push` 사용 금지

`prisma db push`는 이 프로젝트에서 사용하지 않는다.

- **마이그레이션 히스토리를 남기지 않는다.** 스키마를 DB에 직접 밀어넣기 때문에 어떤 변경이 있었는지 추적이 불가능하다.
- **팀 협업 시 충돌을 유발한다.** 마이그레이션 파일 없이 각자 push하면 DB 상태가 서로 달라지고, migrate dev 실행 시 drift 에러가 발생한다.
- **되돌릴 수 없다.** 잘못 push하면 데이터가 유실될 수 있고, 롤백 방법이 없다.

항상 `migrate dev` → `migrate deploy` 워크플로우를 따른다.

## Import 패턴

```typescript
import { prisma } from '@mire/database'
import { config } from '@mire/blockchain/wagmi/config'
import { Button } from '@mire/ui/components/button'
import { cn } from '@mire/ui/utils'
```
