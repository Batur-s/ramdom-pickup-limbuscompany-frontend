"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { gamesApi } from "@/lib/api";
import Link from "next/link";
import * as XLSX from "xlsx";

type SummaryStage = {
  floor: number;
  difficulty: string;
  stages: { id: string; name: string };
};

type SummaryDeck = {
  sinnerId: string;
  userIdentity: {
    syncGrade: number;
    identity: {
      id: string;
      name: string;
      tier: string;
      grade: number;
      imageUrl: string | null;
    };
  };
};

type Summary = {
  id: string;
  title: string;
  status: string;
  currentFloor: number;
  createdAt: string;
  gameStages: SummaryStage[];
  gameDecks: SummaryDeck[];
};

export default function SummaryPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (gamesApi.getSummary(gameId) as Promise<Summary>)
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [gameId]);

  function handleExport() {
    if (!summary) return;

    // 시트 1: 런 정보
    const infoData = [
      ["제목", summary.title],
      ["결과", { CLEAR: "클리어", FAILURE: "실패", PAUSE: "진행 중" }[summary.status] ?? summary.status],
      ["최종 층", summary.currentFloor],
      ["날짜", new Date(summary.createdAt).toLocaleDateString("ko-KR")],
    ];

    // 시트 2: 층별 기록
    const stageData = [
      ["층", "난이도", "스테이지"],
      ...summary.gameStages.map((s) => [s.floor, s.difficulty, s.stages?.name ?? "-"]),
    ];

    // 시트 3: 최종 덱
    const deckData = [
      ["인격명", "티어", "동기화 등급"],
      ...summary.gameDecks.map((d) => [
        d.userIdentity.identity.name,
        d.userIdentity.identity.tier,
        d.userIdentity.syncGrade,
      ]),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(infoData), "런 정보");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stageData), "층별 기록");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deckData), "최종 덱");

    XLSX.writeFile(wb, `림버스런_${summary.title}_${new Date().toLocaleDateString("ko-KR")}.xlsx`);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a0f0a' }}>
        <p className="text-yellow-700">로딩 중...</p>
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a0f0a' }}>
        <p className="text-red-700">게임 정보를 불러올 수 없어요.</p>
      </main>
    );
  }

  const statusLabel = {
    CLEAR: "✅ 클리어",
    FAILURE: "❌ 실패",
    PAUSE: "⏸ 진행 중",
  }[summary.status] ?? summary.status;

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a0f0a' }}>
      {/* 네비게이션 */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-yellow-900/30">
        <Link href="/" className="text-yellow-800 hover:text-yellow-600 text-sm">← 메인으로</Link>
        <span className="text-yellow-700 text-sm">런 기록</span>
      </nav>

      <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#f5e6c8' }}>{summary.title}</h1>
          <div className="flex gap-4 text-yellow-800 text-sm">
            <span>{statusLabel}</span>
            <span>최종 {summary.currentFloor}층</span>
            <span>{new Date(summary.createdAt).toLocaleDateString("ko-KR")}</span>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("링크가 복사됐어요!");
            }}
            className="px-6 py-2 rounded-lg font-bold text-sm transition hover:scale-105"
            style={{ backgroundColor: '#8B5E3C', color: '#f5e6c8' }}
          >
            🔗 링크 공유
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 rounded-lg font-bold text-sm transition hover:scale-105 border border-yellow-900/50 text-yellow-700 hover:border-yellow-700"
          >
            📊 엑셀 저장
          </button>
          <Link
            href="/"
            className="px-6 py-2 rounded-lg text-sm border border-yellow-900/30 text-yellow-800 hover:border-yellow-800"
          >
            메인으로
          </Link>
        </div>

        {/* 층별 스테이지 기록 */}
        <section className="mb-8">
          <h2 className="text-sm font-bold mb-4 text-yellow-700 uppercase tracking-widest">층별 기록</h2>
          {summary.gameStages.length === 0 ? (
            <p className="text-yellow-900 text-sm">스테이지 기록이 없어요.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {summary.gameStages.map((s) => (
                <div
                  key={s.floor}
                  className="flex items-center gap-4 border border-yellow-900/30 rounded-lg px-4 py-3"
                  style={{ backgroundColor: 'rgba(44,26,14,0.5)' }}
                >
                  <span className="font-bold text-yellow-700 w-12">{s.floor}층</span>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${
                    s.difficulty === "HARD"
                      ? "bg-red-900/50 text-red-400"
                      : "bg-blue-900/50 text-blue-400"
                  }`}>
                    {s.difficulty}
                  </span>
                  <span className="font-medium" style={{ color: '#f5e6c8' }}>{s.stages?.name ?? "-"}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 최종 덱 */}
        <section>
          <h2 className="text-sm font-bold mb-4 text-yellow-700 uppercase tracking-widest">최종 덱</h2>
          <div className="grid grid-cols-6 gap-3">
            {summary.gameDecks.map((item) => (
              <div key={item.sinnerId} className="flex flex-col items-center gap-2">
                <div
                  className="w-full aspect-square rounded-xl overflow-hidden relative group border border-yellow-900/30"
                  style={{ backgroundColor: 'rgba(44,26,14,0.8)' }}
                >
                  {item.userIdentity.identity.imageUrl ? (
                    <img
                      src={item.userIdentity.identity.imageUrl}
                      alt={item.userIdentity.identity.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-yellow-800">No img</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                    <p className="text-yellow-200 text-xs text-center px-1 leading-tight">
                      {item.userIdentity.identity.name}
                    </p>
                  </div>
                  <div className="absolute top-1 right-1 bg-black/70 text-yellow-400 text-xs px-1 rounded">
                    {item.userIdentity.identity.tier}
                  </div>
                </div>
                <p className="text-xs text-yellow-800">동기화 {item.userIdentity.syncGrade}등급</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}