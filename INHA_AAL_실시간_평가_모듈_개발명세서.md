# INHA AAL 실시간 평가 모듈 개발 명세서

> **연동 대상:** INHA Application Architecture Lab (INHA AAL)  
> **목적:** 6개 팀 데모데이 발표에 대한 심사위원 평가와 동료(학생) 평가를 QR 기반 무로그인 방식으로 개인별 입력받고, 결과를 실시간 대시보드로 노출한다.  
> **방식:** 공용 QR 코드 1개 → 역할 선택 → 개인 코드 입력 → 팀별 평가 제출 → 실시간 집계  
> **기술 스택:** Vite + React + TypeScript + Supabase + Tailwind CSS + shadcn/ui  
> **DB/Realtime:** Supabase PostgreSQL + RLS + Realtime  
> **배포:** GitHub Pages 기반 서버리스 PWA  

---

## 0. 운영 정책 및 변경 반영 원칙

이 문서는 INHA Application Architecture Lab의 데모데이 실시간 평가 모듈 개발 기준 문서이다. 평가 항목, 점수 산식, 평가자 코드 정책, 중복 제출 방지 방식, DB 스키마, RLS 정책, 관리자 대시보드 기능이 변경될 경우 관련 코드, migration, Edge Function, 화면 구현과 함께 본 문서도 반드시 갱신한다.

본 모듈은 로그인 없이 공용 QR 코드로 접근하는 평가 전용 기능이다. 단, 관리자 대시보드와 QR 코드 노출 화면은 기존 INHA AAL 관리자 메뉴 안에서 접근하는 것을 원칙으로 한다.

### 0.1 최소 구현 반영 범위

현재 버전은 간소 모듈로 다음 기능만 우선 제공한다.

- 공개 평가 페이지 `/evaluate`
- 역할 선택, 개인 코드 입력, 팀별 평가 입력 및 수정
- 심사위원 5개 항목, 학생 동료평가 3개 항목 점수 저장
- 학생 본인 팀 제외
- 동일 평가자·동일 팀 평가는 upsert로 수정 가능
- 관리자/연구원 메뉴 `실시간 평가`
- 관리자 QR 코드 표시 및 실시간 집계 대시보드
- Supabase Realtime 기반 `evaluation_scores` 변경 감지 후 집계 새로고침
- 관리자 평가정보 수정: 세션 제목, 설명, 평가 수정 허용 여부
- 관리자 초기화: 현재 세션 점수 초기화, 기존 팀 기준 평가정보 재생성
- 평가 점수 초기화는 관리자/연구원 전용 `evaluation_scores` delete RLS 정책으로 실제 제출 점수를 삭제하고, 삭제 건수를 화면에 표시한다.
- 기본 평가정보 재생성 시 심사위원 코드는 `J1`부터 `J5`까지 자동 생성한다.

이번 최소 버전에서는 별도 Edge Function과 복잡한 설정 화면은 제외하고, Supabase 테이블·View·RLS와 React 화면만으로 동작하도록 구성한다.

---

## 1. 핵심 요구사항 요약

| 항목 | 내용 |
|---|---|
| 참가 규모 | 6개 팀, 팀당 3~6명 |
| 평가 주체 | 심사위원 J1~J# / 학생 개인 학번 |
| 접속 방식 | 공용 QR 코드 1개 → 역할 선택(심사위원/학생) → 개인 코드 입력 |
| 로그인 여부 | 로그인 없음 |
| 모바일 지원 | 필수. QR 접속 후 모바일 입력 최적화 |
| 심사위원 평가 | 5개 항목, 100점 만점, 최종 점수에 ×0.7 반영 |
| 동료평가 | 3개 항목, 30점 만점, 팀별 평균값을 그대로 30% 반영 |
| 본인 팀 제외 | 학생 코드/학번과 소속 팀을 사전 매핑하여 자동 제외 |
| 입력 UI | 숫자 타이핑 방식 |
| 평가 대상 정보 | 평가자는 팀 이름과 프로젝트 주제를 볼 수 있음 |
| 결과 반영 | 제출 즉시 Supabase Realtime으로 MC용 라이브 대시보드에 반영 |
| 중복 제출 | 동일 평가자가 동일 팀을 재평가할 수 없도록 DB·UI 이중 차단 |
| 평가 수정 | 평가정보 수정 가능 |
| 최종 결과 | 관리자 메뉴에서 실시간 표시 |
| QR 코드 | 관리자 화면에서 노출 |

---

## 2. 최종 점수 산식

### 2.1 최종 점수 공식

```text
최종 점수(100점) = 심사위원 원점수(100점) × 0.7 + 동료평가 팀별 평균 점수(30점, 그대로 합산)
```

### 2.2 구성 점수

| 구분 | 원점수 | 최종 반영 |
|---|---:|---:|
| 심사위원 평가 | 100점 | 70점 |
| 동료평가 | 30점 | 30점 |
| 합계 | - | 100점 |

### 2.3 동료평가 평균 산식

동료평가 팀별 평균 점수는 해당 팀을 평가한 모든 개인 제출 점수를 기준으로 계산한다.

```text
동료평가 팀별 평균 점수 = 트림 처리 후 남은 동료평가 총점의 평균
```

트림 처리 기준은 다음과 같다.

- 각 팀별 동료평가 제출 총점 기준 최고점 1건 제거
- 각 팀별 동료평가 제출 총점 기준 최저점 1건 제거
- 단, 제출 수가 충분하지 않은 경우에는 트림하지 않는다
- 권장 기준: 제출 수 5건 이상일 때만 최고점 1건, 최저점 1건 제거

---

## 3. 평가 문항 정의

## 3.1 심사위원 평가 문항

- `role = judge`
- 총점: 100점
- 최종 반영: 원점수 × 0.7

| key | label | max_score | 세부 기준 |
|---|---:|---:|---|
| `j_problem` | 문제정의 및 기획력 | 20 | 주제 선정의 배경과 필요성, 목표 설정의 명확성, 문제 해결 접근 방식의 타당성 |
| `j_tech` | 기술적 완성도 | 25 | 구현 수준, 코드/시스템 품질, 사용 기술의 적절성, 완성도와 안정성 |
| `j_creativity` | 창의성 및 혁신성 | 20 | 아이디어의 독창성, 기존 서비스/솔루션과의 차별점 |
| `j_practicality` | 실용성 및 확장 가능성 | 15 | 실제 활용 가능성, 향후 고도화·확장 방향의 구체성 |
| `j_presentation` | 발표 및 커뮤니케이션 | 20 | 발표 전달력, 자료 구성, 질의응답 대응력 |

### 심사위원 총점

```text
judge_total = j_problem + j_tech + j_creativity + j_practicality + j_presentation
judge_weighted = judge_total × 0.7
```

---

## 3.2 동료평가 문항

- `role = peer`
- 총점: 30점
- 최종 반영: 팀별 평균값을 그대로 합산

| key | label | max_score | 세부 기준 |
|---|---:|---:|---|
| `p_topic` | 주제 선정 및 기획력 | 10 | 문제의식과 기획 방향에 대한 공감도, 참신함 |
| `p_impact` | 임팩트·몰입도 | 10 | 발표를 들으며 느낀 흥미·설득력 |
| `p_teamwork` | 배울 점·팀워크 | 10 | 우리 팀에도 참고가 될 만한 점, 협업 인상 |

### 동료평가 총점

```text
peer_total = p_topic + p_impact + p_teamwork
peer_average = team별 peer_total의 트림 평균
```

---

## 4. 사용자 흐름

```text
[공용 QR 스캔]
     │
     ▼
/evaluate
역할 선택: 심사위원 / 학생
     │
     ├─ 심사위원 선택
     │      │
     │      ▼
     │   코드 입력: J1~J#
     │      │
     │      ▼
     │   /evaluate/judge
     │      │
     │      ▼
     │   팀 선택
     │      │
     │      ▼
     │   5문항 숫자 입력
     │      │
     │      ▼
     │   제출
     │      │
     │      ▼
     │   다음 팀 선택
     │      │
     │      ▼
     │   6팀 모두 완료 시 종료 화면
     │
     └─ 학생 선택
            │
            ▼
         코드 입력: 학번
            │
            ▼
         /evaluate/peer
            │
            ▼
         본인 팀 제외된 5팀 목록
            │
            ▼
         팀 선택
            │
            ▼
         3문항 숫자 입력
            │
            ▼
         제출
            │
            ▼
         다음 팀 선택
            │
            ▼
         5팀 모두 완료 시 종료 화면

[MC/관리자 화면]
/evaluate/dashboard
     │
     ▼
관리자 메뉴 또는 관리자 코드로 접근
     │
     ▼
Supabase Realtime 기반 실시간 집계 표시
```

---

## 5. 라우팅 구조

| 경로 | 접근 주체 | 설명 |
|---|---|---|
| `/evaluate` | 전체 | QR 접속 랜딩 페이지, 역할 선택 |
| `/evaluate/judge-code` | 심사위원 | 심사위원 코드 입력 |
| `/evaluate/peer-code` | 학생 | 학번 입력 |
| `/evaluate/judge` | 심사위원 | 심사위원 평가 팀 목록 및 입력 화면 |
| `/evaluate/peer` | 학생 | 본인 팀 제외 팀 목록 및 입력 화면 |
| `/evaluate/complete` | 평가자 | 모든 평가 완료 안내 화면 |
| `/admin/evaluation` | 관리자 | 평가 관리 메인 화면 |
| `/admin/evaluation/qrcode` | 관리자 | 평가 QR 코드 표시 화면 |
| `/admin/evaluation/dashboard` | 관리자/MC | 실시간 평가 대시보드 |
| `/admin/evaluation/results` | 관리자 | 최종 결과 확인 및 다운로드 |
| `/admin/evaluation/settings` | 관리자 | 평가 세션, 평가자, 문항, 공개 상태 관리 |

---

## 6. 화면별 구현 명세

## 6.1 `/evaluate` QR 랜딩 페이지

### 목적

공용 QR 코드로 접속한 평가자가 자신의 역할을 선택한다.

### 주요 UI

- 상단: INHA Application Architecture Lab 로고 또는 타이틀
- 안내 문구: “데모데이 평가에 참여해 주세요.”
- 버튼 2개
  - 심사위원 평가
  - 학생 동료평가
- 모바일 우선 레이아웃

### 동작

- 심사위원 선택 시 `/evaluate/judge-code` 이동
- 학생 선택 시 `/evaluate/peer-code` 이동

---

## 6.2 심사위원 코드 입력 화면

### 목적

심사위원이 사전에 발급된 코드로 평가 화면에 진입한다.

### 입력값

| 필드 | 설명 | 예시 |
|---|---|---|
| judge_code | 심사위원 코드 | J1, J2, J3, J4, J5 |

### 검증

- `evaluation_judges` 테이블에 존재하는 코드인지 확인
- 활성화된 평가 세션인지 확인
- 코드가 유효하면 브라우저 세션 또는 localStorage에 평가자 토큰 저장

### 오류 메시지

- “등록되지 않은 심사위원 코드입니다.”
- “현재 활성화된 평가 세션이 아닙니다.”

---

## 6.3 학생 코드 입력 화면

### 목적

학생이 학번을 입력하여 본인 소속 팀이 제외된 동료평가 화면에 진입한다.

### 입력값

| 필드 | 설명 | 예시 |
|---|---|---|
| student_no | 학번 | 12212345 |

### 검증

- `evaluation_participants` 테이블에 존재하는 학번인지 확인
- 학번에 team_id가 매핑되어 있는지 확인
- 활성화된 평가 세션인지 확인
- 본인 팀은 평가 대상 목록에서 제외

### 오류 메시지

- “등록되지 않은 학번입니다.”
- “소속 팀 정보가 없습니다. 관리자에게 문의해 주세요.”
- “현재 활성화된 평가 세션이 아닙니다.”

---

## 6.4 심사위원 평가 화면

### 목적

심사위원이 6개 팀을 평가한다.

### 주요 UI

- 평가자 표시: “심사위원 J1”
- 진행 현황: “2 / 6팀 평가 완료”
- 팀 카드 목록
  - 팀명
  - 프로젝트명
  - 주제 또는 한 줄 정의
  - 평가 완료 여부
- 평가 입력 모달 또는 상세 화면
- 5개 항목 숫자 입력
- 총점 자동 계산
- 제출 버튼

### 입력 제약

| 항목 | 입력 범위 |
|---|---:|
| 문제정의 및 기획력 | 0~20 |
| 기술적 완성도 | 0~25 |
| 창의성 및 혁신성 | 0~20 |
| 실용성 및 확장 가능성 | 0~15 |
| 발표 및 커뮤니케이션 | 0~20 |

### 동작

- 이미 평가한 팀은 “평가 완료” 표시
- 평가 수정 가능 정책이 켜져 있으면 기존 평가 수정 가능
- 평가 수정 불가 정책이면 제출 후 입력 잠금
- 제출 즉시 Realtime 대시보드에 반영

---

## 6.5 학생 동료평가 화면

### 목적

학생이 본인 팀을 제외한 나머지 5개 팀을 평가한다.

### 주요 UI

- 평가자 표시: “학번 12212345”
- 진행 현황: “3 / 5팀 평가 완료”
- 본인 팀 제외 안내
- 팀 카드 목록
  - 팀명
  - 프로젝트명
  - 주제 또는 한 줄 정의
  - 평가 완료 여부
- 3개 항목 숫자 입력
- 총점 자동 계산
- 제출 버튼

### 입력 제약

| 항목 | 입력 범위 |
|---|---:|
| 주제 선정 및 기획력 | 0~10 |
| 임팩트·몰입도 | 0~10 |
| 배울 점·팀워크 | 0~10 |

### 동작

- 본인 팀은 목록에서 자동 제외
- 이미 평가한 팀은 “평가 완료” 표시
- 평가 수정 가능 정책이 켜져 있으면 기존 평가 수정 가능
- 제출 즉시 Realtime 대시보드에 반영

---

## 6.6 평가 완료 화면

### 목적

평가자가 모든 평가를 완료했음을 안내한다.

### 주요 UI

- 완료 메시지
- 평가 완료 팀 수
- 수정 가능 기간 안내
- 종료 버튼

### 예시 문구

```text
평가가 완료되었습니다.
참여해 주셔서 감사합니다.
```

---

## 6.7 관리자 QR 코드 화면

### 목적

관리자가 평가용 공용 QR 코드를 화면에 띄워 발표장에 공유한다.

### 주요 UI

- 현재 활성 평가 세션명
- QR 코드 이미지
- 평가 접속 URL
- 새로고침 버튼
- 평가 시작/종료 상태 표시

### QR URL 예시

```text
https://inha-lab.github.io/Application_Arch_Lab/evaluate
```

---

## 6.8 실시간 대시보드 화면

### 목적

MC 또는 관리자가 평가 진행 현황과 팀별 점수를 실시간으로 확인한다.

### 주요 UI

- 팀별 현재 순위
- 팀별 최종 점수
- 심사위원 평균 원점수
- 심사위원 반영 점수
- 동료평가 평균 점수
- 제출 현황
  - 심사위원 제출 수
  - 학생 제출 수
  - 전체 진행률
- 팀별 상세 보기
- Realtime 연결 상태 표시

### 권장 표시 항목

| 순위 | 팀명 | 프로젝트명 | 심사위원 원점수 평균 | 심사위원 반영 | 동료평가 평균 | 최종 점수 | 제출 현황 |
|---:|---|---|---:|---:|---:|---:|---|
| 1 | Team 1 | 프로젝트명 | 92.5 | 64.75 | 27.2 | 91.95 | J 3/3, P 22/25 |

---

## 7. 데이터베이스 스키마

아래 스키마는 Supabase PostgreSQL 기준 초안이다. 실제 구현 시 기존 INHA AAL의 `teams`, `profiles`, `participants` 테이블과 연동할 수 있다.

---

## 7.1 `evaluation_sessions`

평가 세션 정보를 관리한다.

```sql
create table if not exists public.evaluation_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  course_term text,
  is_active boolean not null default false,
  allow_edit boolean not null default true,
  peer_trim_enabled boolean not null default true,
  peer_trim_min_count integer not null default 5,
  judge_weight numeric(4,2) not null default 0.70,
  peer_max_score integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 7.2 `evaluation_teams`

평가 대상 팀 정보를 관리한다.

```sql
create table if not exists public.evaluation_teams (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.evaluation_sessions(id) on delete cascade,
  team_no integer not null,
  team_name text not null,
  project_title text,
  topic_summary text,
  notion_url text,
  presentation_order integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, team_no)
);
```

---

## 7.3 `evaluation_participants`

학생 평가자와 소속 팀 매핑 정보를 관리한다.

```sql
create table if not exists public.evaluation_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.evaluation_sessions(id) on delete cascade,
  student_no text not null,
  student_name text,
  team_id uuid references public.evaluation_teams(id) on delete set null,
  role text not null default 'peer' check (role in ('peer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, student_no)
);
```

---

## 7.4 `evaluation_judges`

심사위원 평가자 정보를 관리한다.

```sql
create table if not exists public.evaluation_judges (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.evaluation_sessions(id) on delete cascade,
  judge_code text not null,
  judge_name text,
  judge_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, judge_code)
);
```

---

## 7.5 `evaluation_scores`

심사위원 평가와 동료평가 점수를 통합 저장한다.

```sql
create table if not exists public.evaluation_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.evaluation_sessions(id) on delete cascade,
  team_id uuid not null references public.evaluation_teams(id) on delete cascade,

  evaluator_role text not null check (evaluator_role in ('judge', 'peer')),
  evaluator_code text not null,

  -- judge fields
  j_problem integer,
  j_tech integer,
  j_creativity integer,
  j_practicality integer,
  j_presentation integer,

  -- peer fields
  p_topic integer,
  p_impact integer,
  p_teamwork integer,

  total_score numeric(6,2) not null default 0,
  memo text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(session_id, team_id, evaluator_role, evaluator_code),

  constraint judge_score_range check (
    evaluator_role <> 'judge'
    or (
      j_problem between 0 and 20 and
      j_tech between 0 and 25 and
      j_creativity between 0 and 20 and
      j_practicality between 0 and 15 and
      j_presentation between 0 and 20
    )
  ),

  constraint peer_score_range check (
    evaluator_role <> 'peer'
    or (
      p_topic between 0 and 10 and
      p_impact between 0 and 10 and
      p_teamwork between 0 and 10
    )
  )
);
```

---

## 7.6 `evaluation_score_logs`

평가 수정 이력을 관리한다.

```sql
create table if not exists public.evaluation_score_logs (
  id uuid primary key default gen_random_uuid(),
  score_id uuid references public.evaluation_scores(id) on delete cascade,
  session_id uuid not null,
  team_id uuid not null,
  evaluator_role text not null,
  evaluator_code text not null,
  before_data jsonb,
  after_data jsonb,
  changed_at timestamptz not null default now()
);
```

---

## 8. 점수 계산 View

## 8.1 심사위원 팀별 평균 View

```sql
create or replace view public.v_evaluation_judge_summary as
select
  session_id,
  team_id,
  count(*) as judge_count,
  avg(total_score) as judge_avg_raw,
  avg(total_score) * 0.7 as judge_weighted
from public.evaluation_scores
where evaluator_role = 'judge'
group by session_id, team_id;
```

---

## 8.2 동료평가 트림 평균 View

```sql
create or replace view public.v_evaluation_peer_summary as
with ranked as (
  select
    session_id,
    team_id,
    total_score,
    row_number() over (partition by session_id, team_id order by total_score asc, created_at asc) as rn_low,
    row_number() over (partition by session_id, team_id order by total_score desc, created_at asc) as rn_high,
    count(*) over (partition by session_id, team_id) as score_count
  from public.evaluation_scores
  where evaluator_role = 'peer'
), trimmed as (
  select *
  from ranked
  where not (
    score_count >= 5
    and (rn_low = 1 or rn_high = 1)
  )
)
select
  session_id,
  team_id,
  count(*) as peer_count_after_trim,
  avg(total_score) as peer_avg
from trimmed
group by session_id, team_id;
```

---

## 8.3 최종 결과 View

```sql
create or replace view public.v_evaluation_final_results as
select
  t.session_id,
  t.id as team_id,
  t.team_no,
  t.team_name,
  t.project_title,
  t.topic_summary,
  coalesce(j.judge_count, 0) as judge_count,
  coalesce(j.judge_avg_raw, 0) as judge_avg_raw,
  coalesce(j.judge_weighted, 0) as judge_weighted,
  coalesce(p.peer_count_after_trim, 0) as peer_count,
  coalesce(p.peer_avg, 0) as peer_avg,
  coalesce(j.judge_weighted, 0) + coalesce(p.peer_avg, 0) as final_score
from public.evaluation_teams t
left join public.v_evaluation_judge_summary j
  on j.session_id = t.session_id and j.team_id = t.id
left join public.v_evaluation_peer_summary p
  on p.session_id = t.session_id and p.team_id = t.id
where t.is_active = true
order by final_score desc, judge_weighted desc, peer_avg desc;
```

---

## 9. RLS 정책

무로그인 평가 방식이므로 브라우저에서 직접 테이블에 무제한 insert/update를 허용하면 안 된다. 다음 중 하나의 방식을 선택한다.

### 권장 방식

- 평가 제출은 Supabase Edge Function을 통해 처리한다.
- Edge Function 내부에서 service-role 권한으로 평가자 코드 검증, 본인 팀 제외 검증, 중복 제출 검증, 점수 범위 검증 후 저장한다.
- 브라우저 클라이언트에는 `anon key`만 사용한다.
- `service_role key`는 절대 브라우저에 노출하지 않는다.

### 테이블 RLS 기본 정책

```sql
alter table public.evaluation_sessions enable row level security;
alter table public.evaluation_teams enable row level security;
alter table public.evaluation_participants enable row level security;
alter table public.evaluation_judges enable row level security;
alter table public.evaluation_scores enable row level security;
alter table public.evaluation_score_logs enable row level security;
```

### 공개 읽기 정책 예시

평가자가 팀명과 주제를 볼 수 있어야 하므로 활성 세션의 팀 정보는 공개 읽기를 허용할 수 있다.

```sql
create policy "public can read active evaluation teams"
on public.evaluation_teams
for select
to anon
using (
  is_active = true
  and exists (
    select 1
    from public.evaluation_sessions s
    where s.id = evaluation_teams.session_id
      and s.is_active = true
  )
);
```

### 점수 테이블 직접 쓰기 차단

```sql
create policy "deny anon direct insert scores"
on public.evaluation_scores
for insert
to anon
with check (false);

create policy "deny anon direct update scores"
on public.evaluation_scores
for update
to anon
using (false)
with check (false);
```

---

## 10. Edge Function 명세

## 10.1 `verify-evaluator-code`

### 목적

심사위원 코드 또는 학생 학번을 검증하고 평가 가능한 팀 목록을 반환한다.

### Request

```json
{
  "session_id": "uuid",
  "role": "judge | peer",
  "code": "J1 또는 학번"
}
```

### Response: 심사위원

```json
{
  "ok": true,
  "role": "judge",
  "evaluator_code": "J1",
  "display_name": "심사위원 J1",
  "teams": [
    {
      "team_id": "uuid",
      "team_name": "Team 1",
      "project_title": "프로젝트명",
      "topic_summary": "한 줄 정의",
      "already_submitted": false
    }
  ]
}
```

### Response: 학생

```json
{
  "ok": true,
  "role": "peer",
  "evaluator_code": "12212345",
  "display_name": "12212345",
  "own_team_id": "uuid",
  "teams": [
    {
      "team_id": "uuid",
      "team_name": "Team 2",
      "project_title": "프로젝트명",
      "topic_summary": "한 줄 정의",
      "already_submitted": false
    }
  ]
}
```

---

## 10.2 `submit-evaluation-score`

### 목적

평가 점수를 저장하거나 수정한다.

### Request: 심사위원

```json
{
  "session_id": "uuid",
  "role": "judge",
  "evaluator_code": "J1",
  "team_id": "uuid",
  "scores": {
    "j_problem": 18,
    "j_tech": 23,
    "j_creativity": 17,
    "j_practicality": 14,
    "j_presentation": 19
  }
}
```

### Request: 학생

```json
{
  "session_id": "uuid",
  "role": "peer",
  "evaluator_code": "12212345",
  "team_id": "uuid",
  "scores": {
    "p_topic": 9,
    "p_impact": 8,
    "p_teamwork": 10
  }
}
```

### 처리 규칙

1. 활성 평가 세션인지 확인한다.
2. 평가자 코드가 유효한지 확인한다.
3. 학생 평가자인 경우 본인 팀 평가인지 확인하고, 본인 팀이면 차단한다.
4. 점수 범위가 문항별 max_score를 초과하지 않는지 확인한다.
5. 동일 평가자가 동일 팀을 이미 평가했는지 확인한다.
6. `allow_edit = true`이면 update 처리한다.
7. `allow_edit = false`이고 기존 평가가 있으면 중복 제출 오류를 반환한다.
8. 저장 또는 수정 후 `evaluation_score_logs`에 변경 이력을 기록한다.

### Response

```json
{
  "ok": true,
  "mode": "insert | update",
  "total_score": 91,
  "message": "평가가 저장되었습니다."
}
```

---

## 10.3 `get-evaluation-results`

### 목적

관리자 대시보드에서 최종 집계 결과를 조회한다.

### Request

```json
{
  "session_id": "uuid"
}
```

### Response

```json
{
  "ok": true,
  "results": [
    {
      "rank": 1,
      "team_id": "uuid",
      "team_name": "Team 1",
      "project_title": "프로젝트명",
      "judge_avg_raw": 92.5,
      "judge_weighted": 64.75,
      "peer_avg": 27.2,
      "final_score": 91.95,
      "judge_count": 3,
      "peer_count": 22
    }
  ]
}
```

---

## 11. 중복 제출 방지 정책

## 11.1 DB 차단

`evaluation_scores` 테이블에 다음 unique 제약을 둔다.

```sql
unique(session_id, team_id, evaluator_role, evaluator_code)
```

이를 통해 동일 평가자가 동일 팀을 중복 평가하는 것을 DB 레벨에서 차단한다.

## 11.2 UI 차단

- 평가 완료 팀은 “평가 완료” 배지 표시
- 수정 가능 상태에서는 “수정하기” 버튼 노출
- 수정 불가 상태에서는 입력 폼 비활성화
- 제출 직후 버튼 비활성화 및 loading 상태 표시

## 11.3 Edge Function 차단

- 기존 제출 여부를 확인한다.
- `allow_edit = false`이면 기존 제출이 있을 때 오류 반환
- `allow_edit = true`이면 update 처리

---

## 12. 본인 팀 제외 정책

학생 동료평가에서는 본인 소속 팀 평가를 금지한다.

### 구현 기준

- `evaluation_participants.student_no`로 평가자 확인
- `evaluation_participants.team_id`를 본인 팀으로 판단
- 팀 목록 조회 시 `team_id != own_team_id` 조건 적용
- 제출 시에도 Edge Function에서 동일 조건 재검증

### 차단 메시지

```text
본인 팀은 평가할 수 없습니다.
```

---

## 13. Realtime 대시보드 구현

## 13.1 구독 대상

대시보드는 `evaluation_scores` 변경 이벤트를 구독한다.

```ts
supabase
  .channel('evaluation-dashboard')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'evaluation_scores',
      filter: `session_id=eq.${sessionId}`,
    },
    () => {
      refetchResults()
    }
  )
  .subscribe()
```

## 13.2 대시보드 갱신 방식

- insert/update 발생 시 결과 View 또는 Edge Function 재조회
- 순위, 점수, 제출 수 즉시 업데이트
- Realtime 연결 상태를 화면에 표시

## 13.3 표시 상태

| 상태 | 설명 |
|---|---|
| 연결됨 | Realtime 구독 정상 |
| 재연결 중 | 네트워크 지연 또는 일시 장애 |
| 수동 새로고침 필요 | Realtime 연결 실패 |

---

## 14. TypeScript 타입 정의

```ts
export type EvaluatorRole = 'judge' | 'peer'

export interface EvaluationSession {
  id: string
  title: string
  description?: string | null
  course_term?: string | null
  is_active: boolean
  allow_edit: boolean
  peer_trim_enabled: boolean
  peer_trim_min_count: number
  judge_weight: number
  peer_max_score: number
  created_at: string
  updated_at: string
}

export interface EvaluationTeam {
  id: string
  session_id: string
  team_no: number
  team_name: string
  project_title?: string | null
  topic_summary?: string | null
  notion_url?: string | null
  presentation_order?: number | null
  is_active: boolean
}

export interface JudgeScores {
  j_problem: number
  j_tech: number
  j_creativity: number
  j_practicality: number
  j_presentation: number
}

export interface PeerScores {
  p_topic: number
  p_impact: number
  p_teamwork: number
}

export interface EvaluationResultRow {
  rank: number
  team_id: string
  team_name: string
  project_title?: string | null
  topic_summary?: string | null
  judge_count: number
  judge_avg_raw: number
  judge_weighted: number
  peer_count: number
  peer_avg: number
  final_score: number
}
```

---

## 15. 컴포넌트 구조

```text
src/
  features/
    evaluation/
      pages/
        EvaluateLandingPage.tsx
        JudgeCodePage.tsx
        PeerCodePage.tsx
        JudgeEvaluationPage.tsx
        PeerEvaluationPage.tsx
        EvaluationCompletePage.tsx
        EvaluationDashboardPage.tsx
        EvaluationQrPage.tsx
        EvaluationResultsPage.tsx
        EvaluationSettingsPage.tsx
      components/
        RoleSelectCard.tsx
        EvaluatorCodeForm.tsx
        TeamEvaluationCard.tsx
        JudgeScoreForm.tsx
        PeerScoreForm.tsx
        ScoreInput.tsx
        EvaluationProgress.tsx
        EvaluationCompleteBanner.tsx
        EvaluationQrCode.tsx
        LiveRankingTable.tsx
        TeamScoreDetail.tsx
        RealtimeStatusBadge.tsx
      hooks/
        useEvaluationSession.ts
        useEvaluatorVerify.ts
        useEvaluationSubmit.ts
        useEvaluationResults.ts
        useEvaluationRealtime.ts
      lib/
        score.ts
        validation.ts
        constants.ts
```

---

## 16. 점수 검증 로직

## 16.1 심사위원 평가 검증

```ts
export function validateJudgeScores(scores: JudgeScores) {
  const rules = {
    j_problem: 20,
    j_tech: 25,
    j_creativity: 20,
    j_practicality: 15,
    j_presentation: 20,
  }

  for (const [key, max] of Object.entries(rules)) {
    const value = scores[key as keyof JudgeScores]
    if (!Number.isInteger(value) || value < 0 || value > max) {
      return {
        ok: false,
        message: `${key} 점수는 0점 이상 ${max}점 이하로 입력해야 합니다.`,
      }
    }
  }

  return { ok: true }
}
```

## 16.2 동료평가 검증

```ts
export function validatePeerScores(scores: PeerScores) {
  const rules = {
    p_topic: 10,
    p_impact: 10,
    p_teamwork: 10,
  }

  for (const [key, max] of Object.entries(rules)) {
    const value = scores[key as keyof PeerScores]
    if (!Number.isInteger(value) || value < 0 || value > max) {
      return {
        ok: false,
        message: `${key} 점수는 0점 이상 ${max}점 이하로 입력해야 합니다.`,
      }
    }
  }

  return { ok: true }
}
```

---

## 17. 관리자 기능 명세

## 17.1 평가 세션 관리

| 기능 | 설명 |
|---|---|
| 평가 세션 생성 | 데모데이 평가 세션 생성 |
| 활성 세션 지정 | 현재 QR 평가에 사용할 세션 지정 |
| 평가 시작/종료 | `is_active` 상태 변경 |
| 평가 수정 허용 여부 | `allow_edit` 변경 |
| 트림 평균 사용 여부 | `peer_trim_enabled` 변경 |

## 17.2 평가 팀 관리

| 기능 | 설명 |
|---|---|
| 팀 등록 | 팀명, 프로젝트명, 주제 등록 |
| 발표 순서 등록 | 대시보드와 평가 화면 정렬 기준 |
| 노션 URL 등록 | 프로젝트 기획서 링크 저장 |
| 팀 활성/비활성 | 평가 대상 포함 여부 관리 |

## 17.3 평가자 관리

| 기능 | 설명 |
|---|---|
| 심사위원 코드 등록 | J1, J2, J3, J4, J5 등록 |
| 학생 학번 등록 | 참가자 명단 기반 일괄 등록 |
| 학생-팀 매핑 | 본인 팀 제외를 위한 team_id 매핑 |
| 평가자 활성/비활성 | 평가 참여 가능 여부 제어 |

## 17.4 결과 관리

| 기능 | 설명 |
|---|---|
| 실시간 순위 확인 | 팀별 최종 점수 실시간 표시 |
| 상세 점수 확인 | 심사위원/동료평가 구분 표시 |
| 제출 현황 확인 | 평가자별 제출 완료 여부 확인 |
| CSV 다운로드 | 최종 결과 및 원자료 다운로드 |
| 점수 수정 이력 확인 | 평가 변경 로그 조회 |

---

## 18. CSV/Excel 업로드 항목

## 18.1 팀 업로드

| 컬럼 | 필수 | 설명 |
|---|---|---|
| team_no | Y | 팀 번호 |
| team_name | Y | 팀명 |
| project_title | N | 프로젝트명 |
| topic_summary | N | 한 줄 정의/주제 |
| notion_url | N | 노션 기획서 URL |
| presentation_order | N | 발표 순서 |

## 18.2 학생 업로드

| 컬럼 | 필수 | 설명 |
|---|---|---|
| student_no | Y | 학번 |
| student_name | N | 이름 |
| team_no | Y | 소속 팀 번호 |

## 18.3 심사위원 업로드

| 컬럼 | 필수 | 설명 |
|---|---|---|
| judge_code | Y | J1, J2 등 |
| judge_name | N | 심사위원 이름 |
| judge_label | N | 표시명 |

---

## 19. 보안 고려사항

1. 무로그인 평가이므로 평가자 코드는 외부에 노출되지 않도록 관리한다.
2. 학생 학번만으로 접근하므로 평가 시간 외에는 반드시 `is_active = false`로 전환한다.
3. 평가 제출은 Edge Function을 통해서만 처리한다.
4. 브라우저에는 Supabase `anon key`만 사용한다.
5. `service_role key`는 Edge Function 환경에서만 사용한다.
6. 관리자 화면은 기존 INHA AAL 인증 및 역할 기반 권한으로 보호한다.
7. 평가 종료 후에는 평가 URL 접근 시 종료 안내 화면을 표시한다.
8. 원자료 다운로드는 교수 또는 관리자 권한만 허용한다.

---

## 20. PWA 및 모바일 UI 기준

- QR 접속 후 모바일에서 바로 입력 가능해야 한다.
- 숫자 입력 필드는 모바일 숫자 키패드가 열리도록 설정한다.

```tsx
<input
  type="number"
  inputMode="numeric"
  min={0}
  max={20}
/>
```

- 한 화면에 너무 많은 항목을 넣지 않고 카드형 UI로 구성한다.
- 제출 버튼은 하단 고정 영역에 배치하는 것을 권장한다.
- 점수 입력 중 총점이 실시간 표시되어야 한다.
- 네트워크 오류 시 재시도 버튼을 제공한다.

---

## 21. 개발 우선순위

## Phase 1. 평가 기본 기능

1. 평가 세션 테이블 생성
2. 팀/학생/심사위원 테이블 생성
3. 평가 점수 테이블 생성
4. QR 랜딩 페이지 구현
5. 코드 검증 Edge Function 구현
6. 심사위원 평가 입력 구현
7. 학생 동료평가 입력 구현
8. 중복 제출 차단 구현

## Phase 2. 실시간 대시보드

1. 점수 집계 View 구현
2. 최종 결과 View 구현
3. Supabase Realtime 구독 구현
4. MC용 대시보드 구현
5. 제출 현황 표시
6. 순위 자동 갱신

## Phase 3. 관리자 기능

1. 관리자 QR 코드 화면 구현
2. 평가 세션 관리 구현
3. 팀/평가자 업로드 구현
4. 평가 수정 허용/차단 설정 구현
5. 결과 CSV 다운로드 구현
6. 평가 로그 확인 화면 구현

## Phase 4. 운영 안정화

1. 모바일 UI 개선
2. 입력 오류 메시지 개선
3. 평가 종료 화면 구현
4. 네트워크 장애 대응
5. 대시보드 수동 새로고침 기능
6. 실제 데모데이 리허설

---

## 22. 운영 체크리스트

## 22.1 행사 전

- [ ] 평가 세션 생성
- [ ] 6개 팀 정보 등록
- [ ] 팀별 프로젝트명/주제 등록
- [ ] 학생 학번 및 팀 매핑 등록
- [ ] 심사위원 코드 등록
- [ ] QR 코드 정상 접속 확인
- [ ] 모바일 입력 테스트
- [ ] 본인 팀 제외 테스트
- [ ] 중복 제출 차단 테스트
- [ ] 실시간 대시보드 갱신 테스트

## 22.2 행사 중

- [ ] 평가 세션 활성화
- [ ] QR 코드 화면 송출
- [ ] 심사위원 코드 안내
- [ ] 학생 평가 참여 안내
- [ ] 대시보드 Realtime 연결 상태 확인
- [ ] 제출 현황 모니터링
- [ ] 미제출자 안내

## 22.3 행사 후

- [ ] 평가 세션 비활성화
- [ ] 최종 결과 확인
- [ ] CSV 원자료 다운로드
- [ ] 평가 수정 이력 확인
- [ ] 최종 순위 확정
- [ ] 운영 결과 백업

---

## 23. 향후 확장 고려사항

- 팀별 발표 순서에 따라 현재 발표 팀만 평가 가능하도록 제한
- 평가 시간 타이머 기능
- 심사위원별 가중치 설정
- 평가자별 제출 현황 비공개/공개 옵션
- 결과 공개 범위 설정
- 평가 종료 후 학생에게 익명 통계 공개
- Notion 프로젝트 기획서와 평가 화면 연결
- 발표 영상 또는 산출물 링크 연결
- QR 코드 세션별 자동 생성
- 여러 데모데이/학기별 평가 이력 관리

---

## 24. 문서 변경 이력

| 일자 | 변경 내용 | 작성자 |
|---|---|---|
| 2026-07-08 | 실시간 평가 모듈 개발 명세서 최초 작성 | INHA AAL |
