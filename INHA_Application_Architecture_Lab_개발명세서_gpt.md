# INHA Application Architecture Lab — 개발 명세서

> **Stack:** Vite + React + TypeScript + Supabase + Tailwind CSS + shadcn/ui  
> **배포:** GitHub Pages (서버리스 PWA)  
> **저장소:** GitHub Public Repository  
> <https://github.com/inha-lab/Application_Arch_Lab>

> **인증:** Supabase Auth  
> **DB:** Supabase PostgreSQL + RLS  
> **API URL:** `TBD`  
> **Local Path:** `/Users/imsangjun/Documents/JAVIS/Application_Architect`

---

## 0. 운영 정책 및 변경 반영 원칙

이 문서는 코드와 DB 정책 변경 시 함께 갱신한다. 이후 기능, 권한, RLS, 모집/선발 운영 방식이 바뀌면 관련 migration 또는 화면 구현과 함께 본 MD 파일에도 변경 내용을 반영한다.

### 0-1. 프로젝트 목적

INHA Application Architecture Lab은 대학 **어플리케이션 설계** 과목을 계절학기 수업 기반의 **PBL 또는 해커톤형 실습 구조**로 운영하기 위한 웹 기반 관리 시스템이다.

본 시스템은 다음 운영을 지원한다.

- 수강자 리스트 관리
- 수강자 일괄 등록 및 계정 생성
- 직무 기반 그룹 편성
- 팀 편성 및 팀장 지정
- 프로젝트 주제 관리
- 주차별 진행상황 기록
- 프로젝트 기획/설계/구현/발표/산출물 관리
- 교수 및 연구원의 진행상황 모니터링
- 학생의 마이페이지 및 팀 프로젝트 관리

### 0-2. 수업 운영 방식

수업은 다음 비율로 운영한다.

| 구분 | 비율 | 내용 |
|---|---:|---|
| 이론 강의 | 약 20% | 미니 강의, 프로젝트 주제 구체화, 기술 스택 안내 |
| 실습/PBL | 약 80% | 팀 프로젝트 실습, 공유, 피드백, 발표, 산출물 제출 |

### 0-3. 직무 기반 그룹 운영

수강자는 인턴십 직무를 기준으로 크게 3개 그룹으로 편성한다.

| 그룹 | 설명 |
|---|---|
| SW 엔지니어링 | 시스템 설계, 인프라, DevOps, 운영 자동화, 품질 관리 중심 |
| SW 개발 | 웹/앱 서비스 개발, 프론트엔드, 백엔드, DB 연동 중심 |
| AI 개발 | AI 서비스, LLM, 데이터 분석, 모델/API 활용 중심 |

각 그룹은 공통 기술 스택과 관심사를 공유하며, 팀 내에서는 서로 다른 직무가 협업하도록 구성한다. 단, 실제 운영 상황에 따라 관리자가 수동 조정할 수 있다.

### 0-4. 팀 운영 기준

| 항목 | 기준 |
|---|---|
| 팀 수 | 4~5팀 |
| 팀당 인원 | 4~6명 |
| 그룹핑 방식 | 관리자 지정 |
| 팀장 | 관리자가 지정 가능 |
| 팀 주제 | 채용형 인턴십 진행을 위한 과제로 선정하는 것을 권장 |

### 0-5. 디자인 기준

로그인 전 메인 페이지 및 전체 UI 톤은 다음 사이트의 디자인 방향을 참고한다.

- <https://inha-lab.github.io/AX_Career_Lab>

기본 UI 원칙은 다음과 같다.

- GitHub Pages 기반 정적 배포에 적합한 가벼운 PWA
- Tailwind CSS 기반 반응형 레이아웃
- shadcn/ui 기반 일관된 컴포넌트 사용
- 교수/연구원/학생 역할별 대시보드 분리
- 공개 소개 페이지와 로그인 후 관리 페이지 명확히 분리

---

## 0-6. PBL 주제 구체화 5단계 워크플로우

학생은 아래 5단계를 순서대로 따라가며 프로젝트 주제를 구체화한다.

### 1단계. 인턴십 기업 이해하기

- 내가 인턴으로 합류하는 기업의 주요 업무는 무엇인가?
- 그 업무에서 반복적으로 생기는 불편함·비효율이 있는가?
- IT 기술로 자동화하거나 개선할 수 있는 영역이 있는가?

### 2단계. 문제 정의하기

- 해결하려는 문제를 한 문장으로 쓸 수 있는가?
- 예: `직원들이 자산 대여 현황을 엑셀로 관리해 분실·중복이 잦다.`
- 문제가 구체적일수록 좋은 프로젝트 주제가 된다.

### 3단계. 사용자 정의하기

- 누가 이 서비스를 사용하는가?
  - 사내 직원
  - 외부 고객
  - 관리자
  - 학생
  - 교수
  - 기업 담당자 등
- 사용자는 몇 명 규모인가?
- 사용자가 원하는 핵심 기능 3가지는 무엇인가?

### 4단계. 기능 범위 결정하기

| 구분 | 기준 |
|---|---|
| Must Have | 반드시 있어야 하는 기능, 최대 3개 |
| Should Have | 있으면 좋은 기능, 최대 3개 |
| Won't Have | 이번 프로젝트에서는 하지 않는 것, 명시적으로 제외 |

### 5단계. 인턴십 연결고리 찾기

- 이 프로젝트를 인턴십 첫 주에 보여준다면 어떤 반응을 기대하는가?
- 이 프로젝트를 통해 어떤 기술을 증명할 수 있는가?
- 면접관 또는 기업 담당자가 “이 학생은 바로 투입 가능하다”고 느낄 수 있는가?

---

## 0-7. 현재 확정 운영 흐름

1. 로그인 전 메인 페이지 UI는 공개 소개 페이지로 유지한다.
2. 관리자가 각 학기별 수강자를 일괄 등록한다.
   - 아이디: 이메일
   - 비밀번호: 임시비밀번호
3. 사용자는 마이페이지에서 기본정보 및 비밀번호를 설정 또는 변경할 수 있다.
4. 팀 관리를 지원한다.
   - 팀명
   - 주제
   - 참여자 정보
   - 팀장
   - 직무
5. 각 진행 단계에 대한 현황을 기록하고 모니터링할 수 있어야 한다.
6. 프로젝트 진행 단계는 다음을 포함한다.
   - 프로젝트 기획
   - 설계
   - 구현
   - 발표
   - 산출물 확인
7. 팀 수는 4~5팀, 팀당 4~6명으로 운영한다.
8. 그룹핑은 관리자가 지정하며, 팀장은 관리자가 선임할 수 있다.
9. 진행 결과는 표준화된 Notion 포맷 또는 시스템 내 템플릿을 이용해 관리할 수 있다.
10. 프로젝트 기획서 작성 템플릿을 시스템에서 제공한다.
11. 주차별 간략 보고서를 작성한다.
12. 교수와 연구원은 전체 팀의 진행상황을 모니터링한다.

---

## 0-8. 프로젝트 기획서 작성 템플릿

각 팀은 다음 항목을 기준으로 프로젝트 기획서를 작성한다.

| 항목 | 설명 |
|---|---|
| 팀명 | 팀 이름 |
| 팀원 | 팀원 이름 및 직무 |
| 인턴십 기업 | 프로젝트와 연결되는 기업 또는 가상의 인턴십 기업 |
| 프로젝트명 | 서비스 또는 시스템 이름 |
| 한 줄 정의 | 프로젝트를 한 문장으로 설명 |
| 해결하는 문제 | 구체적인 문제 정의 |
| 타겟 사용자 | 실제 서비스를 사용할 사용자 |
| Must Have 기능 | 반드시 구현할 핵심 기능, 최대 3개 |
| Should Have 기능 | 가능하면 구현할 기능, 최대 3개 |
| Won't Have | 이번 프로젝트에서 제외할 범위 |
| 기술 스택 | 프론트엔드, 백엔드, DB, AI, 배포 기술 등 |
| GPU 사용 여부 | GPU 서버 또는 AI 모델 사용 여부 |
| 4주 완성 계획 | 주차별 구현 계획 |
| 인턴십 연결고리 | 인턴십 직무와의 연계성 |
| 기대 성과 | 결과물, 포트폴리오, 면접 활용 가능성 |

---

## 0-9. 계정 생성 정책

### 기본 원칙

- 관리자가 수강자를 일괄 회원가입 처리한다.
- 수강자 명단 파일 예시:
  - `어플리케이션 설계(NCS과정)(2026하계-AAO6513-901)_participants.xlsx`
- 브라우저 클라이언트에는 `service_role key`를 절대 넣지 않는다.
- Auth user 생성, profiles 등록, applications 연결 등 권한이 필요한 작업은 Supabase Edge Function에서만 처리한다.

### Edge Function 정책

| 기능 | Edge Function | 설명 |
|---|---|---|
| 선발 확정 계정 생성 | `register-accepted-application` | 선발 확정된 지원자의 Auth user 생성, profiles student 등록, applications 연결 |
| 관리자 수동 사용자 등록 | `register-managed-user` | 관리자가 직접 사용자를 등록할 때 Auth user 생성 및 profiles 등록 |
| 비밀번호 초기화 | `reset-managed-user-password` | 관리자가 동일 규칙으로 학생 비밀번호 초기화 |

### Supabase 환경변수 정책

Supabase Edge Function의 다음 환경변수는 예약 환경변수이며 런타임에 기본 제공된다.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

따라서 다음 명령으로 직접 등록하지 않는다.

```bash
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_ANON_KEY=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

### 초기 비밀번호 생성 규칙

초기 비밀번호는 휴대폰 번호에서 숫자만 추출한 뒤 다음 규칙으로 생성한다.

1. 숫자만 추출한다.
2. 앞자리 `010`이 있으면 제외한다.
3. 정확히 8자리로 만든다.
4. 숫자가 8자리 미만이면 뒤에 `0`을 채운다.
5. 숫자가 8자리보다 길면 앞 8자리만 사용한다.

예시:

| 휴대폰 번호 | 처리 결과 | 초기 비밀번호 |
|---|---|---|
| 010-1234-5678 | 12345678 | 12345678 |
| 010-9876-5432 | 98765432 | 98765432 |
| 010-123-4567 | 1234567 | 12345670 |
| 010-1111-2222-3333 | 111122223333 | 11112222 |

학생은 최초 로그인 후 마이페이지에서 개인 비밀번호로 재설정한다.

---

## 0-10. 역할 및 권한 개요

| 역할 | 영문 코드 | 권한 |
|---|---|---|
| 교수 | `professor` | 모든 기능 접근, 수강자 관리, 팀 관리, 진행상황 관리, 산출물 확인, 통계 확인 |
| 학생 | `student` | 본인 정보 관리, 본인 팀 정보 확인, 프로젝트 기획서 작성, 주간(일)보고 작성, 산출물 제출 |
| 연구원 | `researcher` | 교수와 동일한 전체 관리 권한, 수강생·관리자·팀·프로젝트·보고서·산출물·공지 관리 |

## 0-11. 구현 현황 (2026-06-21)

- [x] Vite + React + TypeScript + Tailwind CSS 프로젝트 골격
- [x] GitHub Pages base path 및 배포 workflow
- [x] 공개 소개 페이지와 로그인 화면
- [x] Supabase Auth 연결 및 역할 기반 보호 라우팅
- [x] 교수/학생/연구원 대시보드와 메뉴 골격
- [x] 마이페이지 기본정보 조회
- [x] 마이페이지 주요정보 읽기 전용 조회 및 사용자 비밀번호 변경
- [x] 교수 전용 수강생 비밀번호 초기화 Edge Function
- [x] 전체 초기 DB 스키마, helper function, RLS migration
- [x] 수강자 직접 등록·수정·삭제 및 엑셀 업로드
- [x] 수강자 직접 등록 시 학생 계정 생성 및 팀원 배정 후보 즉시 반영
- [x] 수강자 기업명 컬럼 관리
- [x] 팀 생성·수정·삭제, 팀원 배정 및 팀장 지정
- [x] 학생 본인 팀 프로젝트 단계 수동 설정 및 관리자 팀장 지정
- [x] 수강생 로그인 활동 기록 및 교수·연구원 조회 대시보드
- [x] GPU 서버 사용 신청 및 팀별 시간 예약 현황 조회
- [x] 교수 전용 관리자(교수/연구원) 등록 화면 및 Edge Function
- [x] 수강생·관리자 목록 순번 표시 및 컬럼별 양방향 정렬
- [x] 모바일 대시보드 상단 제목 및 메인 접속 QR 코드
- [x] `public/icons` 기반 favicon/PWA 아이콘 구조
- [x] Excel 업로드 연계 Edge Function 기반 수강생 계정 일괄 생성
- [x] 학생 내 팀 조회 및 프로젝트 기획서 CRUD
- [x] 주간(일)보고, 산출물, 공지사항 CRUD
- [x] 교수·연구원 팀별 진행상황 모니터링
- [x] 실제 Supabase 프로젝트 연동 통합 테스트

---

## 목차

1. [프로젝트 초기 설정](#1-프로젝트-초기-설정)
2. [디렉터리 구조](#2-디렉터리-구조)
3. [환경 변수](#3-환경-변수)
4. [Supabase 설정](#4-supabase-설정)
5. [데이터베이스 스키마](#5-데이터베이스-스키마)
6. [RLS 정책](#6-rls-정책)
7. [TypeScript 타입 정의](#7-typescript-타입-정의)
8. [인증 및 라우팅](#8-인증-및-라우팅)
9. [공통 컴포넌트](#9-공통-컴포넌트)
10. [기능별 구현 명세](#10-기능별-구현-명세)
11. [PWA 설정](#11-pwa-설정)
12. [GitHub Actions 배포](#12-github-actions-배포)
13. [개발 우선순위](#13-개발-우선순위)

---

## 1. 프로젝트 초기 설정

### 1-1. 프로젝트 생성

```bash
npm create vite@latest Application_Arch_Lab -- --template react-ts
cd Application_Arch_Lab
npm install
```

### 1-2. 필수 패키지 설치

```bash
npm install @supabase/supabase-js
npm install react-router-dom
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge
npm install date-fns
npm install xlsx
npm install zod react-hook-form @hookform/resolvers
```

### 1-3. Tailwind CSS 설정

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1-4. shadcn/ui 설정

```bash
npx shadcn@latest init
```

권장 컴포넌트:

```bash
npx shadcn@latest add button card input label textarea select table tabs badge dialog dropdown-menu form toast progress alert separator sheet
```

---

## 2. 디렉터리 구조

```text
Application_Arch_Lab/
├── public/
│   ├── manifest.webmanifest
│   ├── icons/
│   └── screenshots/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   ├── team/
│   │   ├── project/
│   │   └── report/
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── utils.ts
│   │   └── password.ts
│   ├── pages/
│   │   ├── public/
│   │   ├── auth/
│   │   ├── professor/
│   │   ├── student/
│   │   ├── researcher/
│   │   └── shared/
│   ├── routes/
│   │   └── AppRouter.tsx
│   ├── types/
│   │   ├── database.types.ts
│   │   └── app.types.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── functions/
│   │   ├── register-accepted-application/
│   │   ├── register-managed-user/
│   │   └── reset-managed-user-password/
│   └── migrations/
├── .env.example
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## 3. 환경 변수

### 3-1. `.env.example`

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_BASE_PATH=/Application_Arch_Lab/
```

### 3-2. 보안 원칙

- `VITE_SUPABASE_ANON_KEY`는 브라우저에 노출 가능한 anon key만 사용한다.
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 프론트엔드 환경변수에 넣지 않는다.
- 관리자 권한이 필요한 작업은 반드시 Edge Function을 통해 처리한다.
- GitHub Public Repository에는 `.env` 파일을 커밋하지 않는다.

---

## 4. Supabase 설정

### 4-1. Supabase 프로젝트 구성

Supabase에서 다음 기능을 사용한다.

| 기능 | 사용 여부 | 설명 |
|---|---|---|
| Auth | 사용 | 이메일/비밀번호 로그인 |
| PostgreSQL | 사용 | 수강자, 팀, 프로젝트, 보고서 관리 |
| RLS | 필수 | 역할별 접근 제어 |
| Edge Functions | 사용 | 관리자 계정 생성, 비밀번호 초기화 |
| Storage | 선택 | 발표자료, 산출물 파일 업로드 시 사용 |

### 4-2. 인증 정책

- 로그인 방식: 이메일 + 비밀번호
- 학생 계정은 관리자가 일괄 생성
- 학생은 최초 로그인 후 비밀번호 변경
- 교수/연구원 계정은 관리자가 직접 등록
- 역할 정보는 `profiles.role` 기준으로 판단

---

## 5. 데이터베이스 스키마

### 5-1. ENUM 타입

```sql
create type app_role as enum ('professor', 'student', 'researcher');
create type semester_term as enum ('spring', 'summer', 'fall', 'winter');
create type job_group as enum ('sw_engineering', 'sw_development', 'ai_development');
create type project_status as enum ('planning', 'design', 'implementation', 'presentation', 'completed');
create type report_status as enum ('draft', 'submitted', 'reviewed');
```

### 5-2. `profiles`

사용자 기본 프로필 테이블이다.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  student_no text,
  department text,
  phone text,
  role app_role not null default 'student',
  job_group job_group,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5-3. `semesters`

학기 및 계절학기 단위 관리 테이블이다.

```sql
create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  term semester_term not null,
  course_code text,
  course_name text not null,
  section text,
  title text not null,
  is_active boolean not null default false,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5-4. `participants`

학기별 수강자 등록 테이블이다.

```sql
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  email text not null,
  name text not null,
  student_no text,
  department text,
  phone text,
  training_job text,
  company_name text,
  participation_year int,
  course_type text,
  job_group job_group,
  memo text,
  is_registered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (semester_id, email)
);
```

### 5-5. `teams`

팀 정보 관리 테이블이다.

```sql
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete cascade,
  name text not null,
  topic text,
  internship_company text,
  project_name text,
  description text,
  leader_profile_id uuid references public.profiles(id) on delete set null,
  status project_status not null default 'planning',
  notion_url text,
  github_url text,
  demo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (semester_id, name)
);
```

### 5-6. `team_members`

팀 구성원 관리 테이블이다.

```sql
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_in_team text,
  job_group job_group,
  is_leader boolean not null default false,
  created_at timestamptz not null default now(),
  unique (team_id, profile_id)
);
```

### 5-7. `project_plans`

프로젝트 기획서 테이블이다.

```sql
create table public.project_plans (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references public.teams(id) on delete cascade,
  team_name text,
  internship_company text,
  project_name text,
  one_line_summary text,
  problem_statement text,
  target_users text,
  must_have jsonb not null default '[]'::jsonb,
  should_have jsonb not null default '[]'::jsonb,
  wont_have jsonb not null default '[]'::jsonb,
  tech_stack jsonb not null default '[]'::jsonb,
  gpu_required boolean not null default false,
  four_week_plan jsonb not null default '[]'::jsonb,
  internship_link text,
  expected_outcome text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5-8. `weekly_reports`

주차별 간략 보고서 테이블이다.

```sql
create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  week_no int not null,
  title text not null,
  progress_summary text,
  completed_items jsonb not null default '[]'::jsonb,
  next_items jsonb not null default '[]'::jsonb,
  issues text,
  support_needed text,
  status report_status not null default 'draft',
  submitted_by uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, week_no)
);
```

### 5-9. `project_artifacts`

산출물 관리 테이블이다.

```sql
create table public.project_artifacts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  artifact_type text not null,
  url text,
  file_path text,
  description text,
  submitted_by uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
```

### 5-10. `announcements`

공지사항 테이블이다.

```sql
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid references public.semesters(id) on delete cascade,
  title text not null,
  content text not null,
  pinned boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 5-11. `login_activity_logs`

수강생이 이메일과 비밀번호로 앱에 성공적으로 로그인한 활동을 기록한다. 세션 복원과 단순 페이지 이동은 로그인 횟수에 포함하지 않는다.

```sql
create table public.login_activity_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  user_agent text,
  logged_in_at timestamptz not null default now()
);
```

- 기록: 인증된 사용자가 `record_login_activity()` RPC로 본인 로그만 생성
- 조회: 본인 또는 교수·연구원
- 관리자 지표: 기간별 로그인 횟수, 접속 수강생 수, 오늘 로그인 수, 수강생별 최근 로그인

### 5-12. `gpu_reservations`

GPU 서버 사용 신청 및 예약 현황을 관리한다.

```sql
create table public.gpu_reservations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  gpu_id text not null check (gpu_id in ('GPU_#0', 'GPU_#1')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  purpose text,
  requested_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

- GPU는 `GPU_#0`, `GPU_#1` 두 개로 운영한다.
- 예약 시간은 1시간 단위로 입력한다.
- 예약 종료는 `종료시간`으로 선택한다.
- 종료시간이 시작 시간과 같거나 빠르면 다음날 종료로 처리한다.
- 팀별 예약 시간의 최대 사용 제한은 두지 않는다.
- 같은 GPU의 겹치는 시간 예약은 DB exclusion constraint로 차단한다.
- 두 GPU를 동시에 선택하면 동일 시간에 GPU별 예약이 각각 생성된다.
- 학생 화면에서도 전체 GPU 예약 현황의 팀명과 신청자 정보를 확인할 수 있도록 GPU 예약에 연결된 팀·신청자 프로필 조회 정책을 별도로 제공한다.

---

## 6. RLS 정책

### 6-1. RLS 기본 원칙

- 모든 주요 테이블은 RLS를 활성화한다.
- 교수는 전체 데이터에 접근할 수 있다.
- 연구원은 교수와 동일한 전체 관리 권한을 가진다.
- 학생은 본인 및 본인 팀 관련 데이터만 조회/작성/수정할 수 있다.
- Auth user 생성 및 관리자성 작업은 Edge Function에서 service role로 처리한다.

### 6-2. 공통 Helper Function

```sql
create or replace function public.current_user_role()
returns app_role
language sql
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;
```

```sql
create or replace function public.is_professor()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('professor', 'researcher')
  )
$$;
```

```sql
create or replace function public.is_researcher_or_professor()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('professor', 'researcher')
  )
$$;
```

```sql
create or replace function public.is_team_member(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = target_team_id
    and tm.profile_id = auth.uid()
  )
$$;
```

### 6-3. 예시 RLS 정책

#### profiles

```sql
alter table public.profiles enable row level security;

create policy "professor can manage profiles"
on public.profiles
for all
using (public.is_professor())
with check (public.is_professor());

create policy "users can read own profile"
on public.profiles
for select
using (id = auth.uid() or public.is_researcher_or_professor());

create policy "users can update own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());
```

#### teams

```sql
alter table public.teams enable row level security;

create policy "professor can manage teams"
on public.teams
for all
using (public.is_professor())
with check (public.is_professor());

create policy "researcher can read teams"
on public.teams
for select
using (public.is_researcher_or_professor());

create policy "team members can read own team"
on public.teams
for select
using (public.is_team_member(id));
```

#### project_plans

```sql
alter table public.project_plans enable row level security;

create policy "professor can manage project plans"
on public.project_plans
for all
using (public.is_professor())
with check (public.is_professor());

create policy "researcher can read project plans"
on public.project_plans
for select
using (public.is_researcher_or_professor());

create policy "team members can manage own project plan"
on public.project_plans
for all
using (public.is_team_member(team_id))
with check (public.is_team_member(team_id));
```

#### weekly_reports

```sql
alter table public.weekly_reports enable row level security;

create policy "professor can manage weekly reports"
on public.weekly_reports
for all
using (public.is_professor())
with check (public.is_professor());

create policy "researcher can read weekly reports"
on public.weekly_reports
for select
using (public.is_researcher_or_professor());

create policy "team members can manage own weekly reports"
on public.weekly_reports
for all
using (public.is_team_member(team_id))
with check (public.is_team_member(team_id));
```

---

## 7. TypeScript 타입 정의

### 7-1. 주요 타입

```ts
export type AppRole = 'professor' | 'student' | 'researcher'

export type SemesterTerm = 'spring' | 'summer' | 'fall' | 'winter'

export type JobGroup =
  | 'sw_engineering'
  | 'sw_development'
  | 'ai_development'

export type ProjectStatus =
  | 'planning'
  | 'design'
  | 'implementation'
  | 'presentation'
  | 'completed'

export type ReportStatus = 'draft' | 'submitted' | 'reviewed'
```

### 7-2. 비밀번호 생성 유틸

```ts
export function makeInitialPassword(phone: string): string {
  let digits = phone.replace(/\D/g, '')

  if (digits.startsWith('010')) {
    digits = digits.slice(3)
  }

  if (digits.length < 8) {
    return digits.padEnd(8, '0')
  }

  return digits.slice(0, 8)
}
```

---

## 8. 인증 및 라우팅

### 8-1. 라우팅 구조

| 경로 | 접근 | 설명 |
|---|---|---|
| `/` | Public | 공개 소개 페이지 |
| `/login` | Public | 로그인 |
| `/mypage` | 로그인 사용자 | 내 정보 수정, 비밀번호 변경 |
| `/professor` | 교수 | 교수 대시보드 |
| `/professor/participants` | 교수 | 수강자 관리 |
| `/professor/activity-logs` | 교수 | 수강생 로그인 활동 조회 |
| `/professor/teams` | 교수 | 팀 관리 |
| `/professor/projects` | 교수 | 프로젝트 현황 관리 |
| `/professor/reports` | 교수 | 주간(일)보고 관리 |
| `/professor/gpu-reservations` | 교수 | GPU 서버 예약 현황 및 신청 |
| `/student` | 학생 | 학생 대시보드 |
| `/student/team` | 학생 | 내 팀 정보 |
| `/student/project-plan` | 학생 | 프로젝트 기획서 작성 |
| `/student/weekly-reports` | 학생 | 주간(일)보고 작성 |
| `/student/gpu-reservations` | 학생 | GPU 서버 사용 신청 |
| `/researcher` | 연구원 | 연구원 모니터링 대시보드 |
| `/researcher/monitoring` | 연구원 | 팀별 진행상황 모니터링 |
| `/researcher/activity-logs` | 연구원 | 수강생 로그인 활동 조회 |
| `/researcher/gpu-reservations` | 연구원 | GPU 서버 예약 현황 및 신청 |

### 8-2. 역할 기반 접근 제어

- 로그인하지 않은 사용자는 Public 페이지와 로그인 페이지만 접근 가능
- 로그인 후 `profiles.role`을 조회하여 대시보드로 이동
- 역할별 접근 권한이 없는 경우 `/unauthorized` 페이지로 이동

---

## 9. 공통 컴포넌트

### 9-1. Layout

| 컴포넌트 | 설명 |
|---|---|
| `PublicLayout` | 공개 소개 페이지 레이아웃 |
| `DashboardLayout` | 로그인 후 공통 레이아웃 |
| `SidebarNav` | 역할별 사이드바 메뉴 |
| `TopBar` | 사용자 정보, 로그아웃, 알림 표시 |
| `PageHeader` | 페이지 제목/설명/액션 버튼 영역 |

### 9-2. 공통 UI

| 컴포넌트 | 설명 |
|---|---|
| `RoleBadge` | 교수/학생/연구원 역할 표시 |
| `JobGroupBadge` | SW 엔지니어링/SW 개발/AI 개발 표시 |
| `StatusBadge` | 프로젝트 상태 표시 |
| `ProgressCard` | 팀별 진행률 표시 |
| `EmptyState` | 데이터 없음 안내 |
| `ConfirmDialog` | 삭제/초기화 등 확인 모달 |
| `ExcelUploadBox` | 수강자 엑셀 업로드 |

---

## 10. 기능별 구현 명세

## 10-1. 공개 메인 페이지

### 목적

로그인 전 사용자가 시스템의 목적과 수업 운영 방식을 이해할 수 있도록 소개한다.

### 주요 콘텐츠

- INHA Application Architecture Lab 소개
- PBL/해커톤형 수업 운영 방식 안내
- 20% 이론 + 80% 실습 구조 안내
- 3개 직무 그룹 안내
- 프로젝트 진행 단계 안내
- 로그인 버튼

---

## 10-2. 로그인

### 기능

- 이메일/비밀번호 로그인
- 로그인 후 역할별 대시보드 이동
- 로그인 실패 메시지 표시
- 비밀번호 재설정 안내

---

## 10-3. 마이페이지

### 학생 기능

- 이름 확인
- 학번 확인
- 학과 확인
- 연락처 수정
- 자기소개 수정
- 비밀번호 변경

### 교수/연구원 기능

- 이름 확인 및 수정
- 연락처 수정
- 비밀번호 변경

---

## 10-4. 수강자 관리

### 접근 권한

- 교수 전용

### 기능

- 학기 생성 및 선택
- 수강자 엑셀 업로드
- 수강자 목록 조회
- 수강자 직무 그룹 지정
- 계정 일괄 생성
- 임시 비밀번호 생성
- 학생 상세 조회
- 비밀번호 초기화
- 수강자 삭제 또는 비활성 처리

### 엑셀 업로드 필드

| 필드 | 필수 | 설명 |
|---|---|---|
| 학생명 | 필수 | 학생 이름 |
| 학과 | 선택 | 소속 학과 |
| 학번 | 선택 | 학생 번호 |
| 연락처 | 필수 | 학생 연락처 및 초기 비밀번호 생성용 |
| 메일주소 | 필수 | 로그인 ID |
| 훈련직무 | 선택 | 인턴십 또는 교육 훈련 직무 |
| 기업명 | 선택 | 인턴십 또는 연계 기업명 |
| 참여연도 | 선택 | 프로그램 참여 연도 |
| 과정구분 | 선택 | NCS 과정 등 운영 과정 구분 |

---

## 10-5. 팀 관리

### 접근 권한

- 교수: 생성/수정/삭제 가능
- 연구원: 조회 가능
- 학생: 본인 팀 조회 가능

### 기능

- 팀 생성
- 팀명 수정
- 팀 주제 입력
- 팀장 지정
- 팀원 배정
- 수강생 관리에서 직접 등록 또는 Excel 업로드로 계정 생성이 완료된 학생을 팀원 후보로 표시
- 수강생 정보 없이 학생 계정만 먼저 등록된 경우에도 팀관리 후보에 표시하고 `수강생정보 미등록`으로 구분
- 계정 연결이 완료되지 않은 수강생은 팀관리에서 별도 표시하고, 관리자 버튼으로 계정 연결 후 팀원 후보에 반영
- 직무 균형 확인
- 팀별 프로젝트 상태 변경
- Notion URL 등록
- GitHub URL 등록
- Demo URL 등록

---

## 10-6. 프로젝트 기획서 관리

### 접근 권한

- 교수: 전체 조회/수정/피드백
- 연구원: 전체 조회
- 학생: 본인 팀 기획서 작성/수정

### 입력 항목

- 팀명
- 팀원 및 직무
- 인턴십 기업
- 프로젝트명
- 한 줄 정의
- 해결하는 문제
- 타겟 사용자
- Must Have 기능
- Should Have 기능
- Won't Have
- 기술 스택
- GPU 사용 여부
- 4주 완성 계획
- 인턴십 연결고리
- 기대 성과

---

## 10-7. 주간(일)보고 관리

### 접근 권한

- 교수·연구원: 전체 조회/검토
- 학생: 본인 팀 보고서 작성/수정

### 학생 작성 및 수정 방식

- 팀원이 작성한 보고서는 같은 팀에 소속된 모든 수강생이 조회하고 수정할 수 있다.
- 보고서 목록의 `수정` 버튼을 누르면 기존 보고서 내용을 작성 폼에 불러온다.
- `수정 저장`은 기존 보고서 상태를 유지하면서 내용을 저장한다.
- `수정 후 제출`은 수정 내용을 저장하고 제출 상태와 제출자·제출일시를 갱신한다.
- 수정 중 취소하면 새 보고서 작성 화면으로 돌아간다.
- 브라우저 탭을 이동했다가 돌아올 때 동일 사용자의 인증 토큰이 자동 갱신되더라도 입력 화면을 다시 마운트하지 않으며, 작성 중인 폼 내용을 유지한다.

### 관리자 조회 방식

- 전체 팀을 팀별 그룹으로 구분해 표시한다.
- 각 팀 카드에서 프로젝트 기획서 요약과 보고서 목록을 함께 확인한다.
- 보고서 목록에는 주차, 작성일, 제목, 진행 요약, 상태를 표시한다.
- 개별 보고서 제목을 선택하면 전용 상세 화면으로 이동한다.
- 상세 화면에서 진행 요약, 완료 항목, 다음 계획, 이슈, 지원 요청을 확인한다.

### 보고서 항목

| 항목 | 설명 |
|---|---|
| 주차/작성일 | 1주차, 2주차 등 주차와 실제 보고 작성일 |
| 제목 | 보고서 제목 |
| 진행 요약 | 이번 주 진행 내용 요약 |
| 완료 항목 | 완료한 작업 목록 |
| 다음 계획 | 다음 주 작업 계획 |
| 이슈 | 문제점 또는 지연 사항 |
| 지원 요청 | 교수/연구원 지원 필요 사항 |
| 상태 | 작성중/제출/검토완료 |

---

## 10-8. 진행상황 모니터링

### 접근 권한

- 교수
- 연구원

### 기능

- 전체 팀 진행률 요약
- 팀별 프로젝트 상태 확인
- 기획서 제출 여부 확인
- 주차별 보고서 제출 여부 확인
- 산출물 제출 현황 확인
- 팀별 이슈 및 지원 요청 확인
- 프로젝트 현황 카드에 `전체리포트` 버튼 제공
- 전체리포트 상세 화면에서 팀명, 프로젝트 주제, 기업명, GitHub/Notion/Demo URL, 팀원정보, 프로젝트 기획서, 주간(일)보고 전체 내용, 산출물 목록을 통합 확인
- 전체리포트 상세 화면에서 브라우저 출력 기능 제공
- 전체리포트 상세 화면에서 HTML 파일 다운로드 기능 제공
- 전체리포트 출력 및 다운로드 상단에는 제목 `인하대학교 어플리케이션 설계 PBL- 2026여름학기`와 생성일자(현재 날짜 및 시간)를 표시

### 대시보드 지표

| 지표 | 설명 |
|---|---|
| 총 수강자 수 | 현재 학기 등록 학생 수 |
| 총 팀 수 | 생성된 팀 수 |
| 기획서 제출률 | 팀별 기획서 제출 여부 기준 |
| 주차별 보고서 제출률 | 주차별 제출 현황 |
| 발표 준비율 | 발표자료/데모 제출 여부 |
| 산출물 제출률 | 최종 산출물 제출 여부 |

---

## 10-9. 산출물 관리

### 산출물 유형

- GitHub
- Notion
- ERD
- UML
- 기타

### 기능

- 산출물 링크 등록
- 비공개 Storage 파일 첨부 및 권한 기반 다운로드
- 설명 입력
- 제출자 기록
- 제출 시각 기록
- 교수/연구원 확인
- 교수/연구원 산출물 관리 화면은 팀별로 그룹핑하여 표시
- 각 팀 그룹과 그룹 내 산출물은 최신 제출 순서 기준으로 정렬

---

## 10-10. 공지사항

### 기능

- 교수 공지사항 작성
- 교수·연구원 공지사항 수정
- 학기별 공지사항 관리
- 중요 공지 상단 고정
- 학생/연구원 공지 조회

---

## 10-11. 로그인 활동

### 접근 권한

- 교수·연구원: 전체 수강생 로그인 활동 조회
- 학생: 관리자 화면 접근 불가

### 기능

- 성공한 명시적 로그인 시각 기록
- 오늘, 최근 7일, 최근 30일, 전체 기간 필터
- 이름·학번·이메일 검색
- 접속 기기와 브라우저 구분
- 수강생별 최근 로그인 확인

---

## 10-12. GPU 서버 사용 신청

### 접근 권한

- 교수·연구원: 전체 팀 예약 현황 조회, 팀 선택 후 예약 신청 및 취소
- 학생: 전체 예약 현황 조회, 본인 팀 기준 예약 신청 및 취소

### GPU 자원

- `GPU_#0`
- `GPU_#1`

### 기능

- 추가 메뉴 `GPU 예약`으로 제공
- 날짜별 시간대 예약표 제공
- GPU별 예약 건수와 총 예약 시간 요약
- 예약일, 시작 시간, 종료시간, GPU 선택, 사용 목적 입력
- 종료시간이 시작 시간과 같거나 빠르면 다음날 종료로 예약
- 팀별 예약 시간 최대 제한 없음
- GPU는 각각 신청 가능하며 두 GPU 동시 선택도 가능
- 같은 GPU의 겹치는 시간 예약은 등록 불가
- 학생과 관리자가 전체 GPU 예약 현황을 한눈에 확인
- 전체 예약 현황에는 팀명, 예약 시간, 사용 목적, 신청자 정보를 표시
- 예약 취소 기능 제공

---

## 11. PWA 설정

### 11-1. PWA 목적

- 학생이 모바일에서 바로 접속 가능
- QR 코드 기반 수업 중 빠른 접속
- 홈 화면 추가 지원
- GitHub Pages 기반 정적 배포 최적화

### 11-2. `manifest.webmanifest`

```json
{
  "name": "INHA Application Architecture Lab",
  "short_name": "App Arch Lab",
  "description": "INHA Application Architecture Lab PBL Management System",
  "start_url": "/Application_Arch_Lab/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/Application_Arch_Lab/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/Application_Arch_Lab/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 11-3. Vite base 설정

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Application_Arch_Lab/',
})
```

### 11-4. GitHub Pages 새로고침 경로 복원

- GitHub Pages는 SPA 하위 경로를 직접 새로고침하면 정적 파일 경로로 해석하므로 `public/404.html`에서 원래 URL을 `sessionStorage.redirect`에 저장한 뒤 `/Application_Arch_Lab/`로 이동한다.
- 앱 초기화 시 저장된 redirect URL의 `pathname + search + hash`를 그대로 복원한다.
- 복원 시 `/Application_Arch_Lab` base path를 제거하지 않아 `https://inha-lab.github.io/Application_Arch_Lab/professor/artifacts` 같은 현재 페이지 주소가 유지된다.
- redirect URL에 base path가 누락된 경우에도 `/Application_Arch_Lab`을 보정해 라우터 기준 경로를 유지한다.
- 새로고침 직후 Supabase 초기 인증 이벤트가 먼저 발생하더라도 `getSession()` 기반 초기 세션 확인이 완료될 때까지 보호 라우트가 로그인 화면으로 이동하지 않도록 한다.
- Supabase `persistSession` 기반 저장 세션을 복원해 새로고침 후에도 로그인 상태를 유지한다.

---

## 12. GitHub Actions 배포

### 12-1. 배포 방식

- GitHub Public Repository 사용
- GitHub Pages로 정적 배포
- `main` 브랜치 push 시 자동 배포

### 12-2. `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 13. 개발 우선순위

### Phase 1. 기본 골격 구축

- Vite + React + TypeScript 프로젝트 생성
- Tailwind CSS + shadcn/ui 설정
- GitHub Pages 배포 설정
- Supabase 연결
- 공개 메인 페이지 구현
- 로그인 구현
- 역할 기반 라우팅 구현

### Phase 2. 사용자 및 수강자 관리

- profiles 테이블 구축
- semesters 테이블 구축
- participants 테이블 구축
- 엑셀 업로드 기능 구현
- Edge Function 기반 사용자 일괄 생성
- 마이페이지 구현
- 비밀번호 변경/초기화 구현

### Phase 3. 팀 및 프로젝트 관리

- teams 테이블 구축
- team_members 테이블 구축
- 팀 생성/수정/배정 기능
- 팀장 지정 기능
- 프로젝트 상태 관리
- Notion/GitHub/Demo URL 관리

### Phase 4. 프로젝트 기획서 및 보고서

- project_plans 테이블 구축
- 프로젝트 기획서 작성 UI
- weekly_reports 테이블 구축
- 주차별 보고서 작성 UI
- 교수/연구원 검토 UI

### Phase 5. 모니터링 및 산출물 관리

- 진행상황 대시보드
- 제출률/진행률 통계
- project_artifacts 테이블 구축
- 산출물 제출/확인 기능
- 공지사항 기능

### Phase 6. 운영 안정화

- RLS 정책 점검
- Edge Function 보안 점검
- 모바일/PWA 사용성 개선
- 실제 수강자 명단 업로드 테스트
- 학기별 운영 데이터 검증
- README 및 개발 명세서 최신화

---

## 부록 A. 권장 화면 목록

| 구분 | 화면 |
|---|---|
| Public | 메인 소개, 로그인 |
| 공통 | 마이페이지, 권한 없음, 로딩, 오류 |
| 교수 | 대시보드, 학기 관리, 수강자 관리, 팀 관리, 프로젝트 관리, 보고서 관리, 산출물 관리, 공지사항 |
| 학생 | 대시보드, 내 팀, 프로젝트 기획서, 주간(일)보고, 산출물 제출, 마이페이지 |
| 연구원 | 모니터링 대시보드, 팀별 현황, 보고서 조회, 산출물 조회 |

---

## 부록 B. 운영 체크리스트

### 학기 시작 전

- [ ] Supabase 프로젝트 생성
- [ ] GitHub Repository 생성 및 Pages 설정
- [ ] 환경변수 등록
- [ ] DB migration 적용
- [ ] RLS 정책 적용
- [ ] 교수/연구원 계정 생성
- [ ] 학기 정보 생성
- [ ] 수강자 엑셀 업로드
- [ ] 학생 계정 일괄 생성
- [ ] 팀 편성

### 수업 진행 중

- [ ] 팀별 프로젝트 주제 입력 확인
- [ ] 프로젝트 기획서 제출 확인
- [ ] 주차별 보고서 제출 확인
- [ ] 팀별 이슈 확인
- [ ] 교수/연구원 피드백 기록
- [ ] 발표자료 및 산출물 제출 확인

### 수업 종료 후

- [ ] 최종 산출물 확인
- [ ] 발표 결과 정리
- [ ] 팀별 성과 기록
- [ ] 우수 프로젝트 선별
- [ ] 인턴십 연계 가능 프로젝트 정리
- [ ] 다음 학기 운영 개선사항 반영

---

## 부록 C. 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|---|---|---|---|
| v0.1 | 2026-06-20 | 최초 개발 명세서 작성 | INHA Application Architecture Lab |
