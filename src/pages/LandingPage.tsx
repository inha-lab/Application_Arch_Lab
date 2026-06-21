import {
  ArrowRight,
  BrainCircuit,
  Code2,
  GitBranch,
  Layers3,
  ServerCog,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui";
const groups = [
  ["SW 엔지니어링", "시스템 설계·인프라·DevOps", ServerCog],
  ["SW 개발", "웹/앱·백엔드·DB 연동", Code2],
  ["AI 개발", "LLM·데이터·모델/API 활용", BrainCircuit],
] as const;
const stages = ["기획", "설계", "구현", "발표", "산출물"];
export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6">
          <Link
            to="/"
            className="flex items-center gap-3 font-black text-white"
          >
            <img
              src={`${import.meta.env.BASE_URL}icons/inha_aal_icon_512.svg`}
              alt="INHA Application Architecture Lab"
              className="h-10 w-10 rounded-xl"
            />
            <span>INHA App Arch Lab</span>
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur hover:bg-white hover:text-inha-950"
          >
            로그인
          </Link>
        </div>
      </header>
      <main>
        <section className="relative overflow-hidden bg-inha-950 px-5 pb-24 pt-40 text-white">
          <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-[.24em] text-blue-300">
              2026 Summer · Application Architecture
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.08] tracking-tight sm:text-7xl">
              AX아이디어를 설계하고,
              <br />
              <span className="text-blue-300">작동하는 결과물</span>로.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              인하대학교 어플리케이션 설계 수업의 PBL 프로젝트 공간입니다.
              기업의 문제를 발견하고, 팀으로 설계하며, 4주 안에 증명합니다.
            </p>
            <Link
              to="/login"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-black text-inha-950"
            >
              Lab 시작하기 <ArrowRight className="h-5 w-5" />
            </Link>
            <div className="mt-20 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-4">
              {[
                ["20%", "미니 강의"],
                ["80%", "PBL 실습"],
                ["4주", "집중 프로젝트"],
                ["4–6명", "팀 협업"],
              ].map(([value, label]) => (
                <div className="bg-white/5 p-5" key={label}>
                  <strong className="text-2xl">{value}</strong>
                  <p className="mt-1 text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-24">
          <p className="text-sm font-black text-inha-700">
            ROLE-BASED COLLABORATION
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            서로 다른 전문성, 하나의 팀
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {groups.map(([name, description, Icon], i) => (
              <Card key={name} className="group">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-inha-700 group-hover:bg-inha-950 group-hover:text-white">
                  <Icon />
                </span>
                <p className="mt-7 text-xs font-black text-slate-400">
                  0{i + 1}
                </p>
                <h3 className="mt-2 text-xl font-black">{name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </Card>
            ))}
          </div>
        </section>
        <section className="bg-slate-50 px-5 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-sm font-black text-inha-700">
                  PROJECT JOURNEY
                </p>
                <h2 className="mt-3 text-3xl font-black">
                  완성까지 이어지는 다섯 단계
                </h2>
              </div>
              <GitBranch className="hidden h-12 w-12 text-inha-700 sm:block" />
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-5">
              {stages.map((stage, i) => (
                <div
                  className="relative rounded-2xl border border-slate-200 bg-white p-5"
                  key={stage}
                >
                  <span className="text-xs font-black text-blue-600">
                    STEP {i + 1}
                  </span>
                  <strong className="mt-8 block text-lg">{stage}</strong>
                  {i < 4 && (
                    <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 text-slate-300 sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-inha-950 px-5 py-8 text-sm text-slate-400">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Layers3 className="h-5 w-5" />
          INHA Application Architecture Lab · PBL Management System
        </div>
      </footer>
    </div>
  );
}
