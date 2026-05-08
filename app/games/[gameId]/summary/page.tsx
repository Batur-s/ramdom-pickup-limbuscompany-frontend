"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { gamesApi } from "@/lib/api";
import Link from "next/link";

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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">게임 정보를 불러올 수 없어요.</p>
      </main>
    );
  }

  const statusLabel =
    {
      CLEAR: "✅ 클리어",
      FAILURE: "❌ 실패",
      PAUSE: "⏸ 진행 중",
    }[summary.status] ?? summary.status;

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{summary.title}</h1>
        <div className="flex gap-4 text-gray-500 text-sm">
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
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          링크 공유
        </button>
        <Link
          href="/"
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
        >
          메인으로
        </Link>
      </div>
      {/* 층별 스테이지 기록 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">층별 기록</h2>
        {summary.gameStages.length === 0 ? (
          <p className="text-gray-400">스테이지 기록이 없어요.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {summary.gameStages.map((s) => (
              <div
                key={s.floor}
                className="flex items-center gap-4 border rounded-lg px-4 py-3"
              >
                <span className="font-bold text-gray-400 w-12">
                  {s.floor}층
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    s.difficulty === "HARD"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {s.difficulty}
                </span>
                <span className="font-medium">{s.stages?.name ?? "-"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* 최종 덱 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">최종 덱</h2>
        <div className="grid grid-cols-6 gap-3">
          {summary.gameDecks.map((item) => (
            <div
              key={item.sinnerId}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 relative group">
                {item.userIdentity.identity.imageUrl ? (
                  <img
                    src={item.userIdentity.identity.imageUrl}
                    alt={item.userIdentity.identity.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-gray-400">No img</span>
                  </div>
                )}
                {/* 호버 시 이름 표시 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                  <p className="text-white text-xs text-center px-1 leading-tight">
                    {item.userIdentity.identity.name}
                  </p>
                </div>
                {/* 티어 뱃지 */}
                <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
                  {item.userIdentity.identity.tier}
                </div>
              </div>
              {/* 동기화 등급 */}
              <p className="text-xs text-gray-400">
                동기화 {item.userIdentity.syncGrade}등급
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
