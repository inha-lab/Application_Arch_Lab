# INHA Application Architecture Lab

어플리케이션 설계 계절학기 PBL 프로젝트 운영 시스템입니다.

## 로컬 실행

```bash
cp .env.example .env
npm install
npm run dev
```

Supabase 프로젝트 URL과 anon key를 `.env`에 설정한 뒤 `supabase/migrations/001_initial_schema.sql`을 적용합니다. `service_role` 키는 브라우저 환경변수에 넣지 않습니다.

## Git / Supabase 연결

- Git remote: `https://github.com/inha-lab/Application_Arch_Lab.git`
- Supabase project: `Application Arch Lab` (`jmcexcgybobnwqkaonaa`)

```bash
npm install
npx supabase login          # 새 환경에서 최초 1회
npx supabase link --project-ref jmcexcgybobnwqkaonaa
npm run db:push             # 원격 DB에 아직 적용하지 않은 migration 적용
```

로컬 Supabase는 Docker가 실행 중일 때 `npm run supabase:start`로 시작합니다. 원격 DB 반영 전에는 `npx supabase db diff --linked` 또는 Supabase 대시보드에서 변경 범위를 확인합니다.

## 구현 상태

- 공개 소개 페이지, 로그인, 인증 컨텍스트
- 교수/학생/연구원 역할별 라우팅과 대시보드 골격
- 마이페이지 기본정보 수정
- GitHub Pages/PWA 기본 설정
- 초기 DB 스키마 및 RLS migration

상세 요구사항과 개발 순서는 `INHA_Application_Architecture_Lab_개발명세서_gpt.md`를 기준으로 합니다.

사이트·PWA 아이콘은 `public/icons/`에 저장합니다. 현재 기본 SVG는 `inha_aal_icon_512.svg`이며, PWA PNG를 추가할 경우 `icon-192.png`, `icon-512.png` 이름을 사용합니다.
