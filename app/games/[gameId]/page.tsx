"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { gamesApi } from "@/lib/api";

type Stage = { id: string; name: string; imageUrl: string | null };
type DeckItem = {
  gameDeckId: string;
  sinnerId: string;
  userIdentityId: string;
  syncGrade: number;
  identity: {
    id: string;
    name: string;
    tier: string;
    grade: number;
    imageUrl: string | null;
  };
};
type RerollCandidate = {
  identityId: string;
  userIdentityId: string;
  rankInRoll: number;
  rolledTier: string;
  name: string;
  imageUrl: string | null;
};
type RerollResult = {
  rerollId: string;
  floorNumber: number;
  candidates: RerollCandidate[];
};

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [deck, setDeck] = useState<DeckItem[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [difficulty, setDifficulty] = useState<"NORMAL" | "HARD">("NORMAL");
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [floor, setFloor] = useState<number>(1);
  const [reroll, setReroll] = useState<RerollResult | null>(null);
  const [appliedReroll, setAppliedReroll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      gamesApi.getDeck(gameId) as Promise<{ items: DeckItem[] }>,
      gamesApi.getStages(gameId, difficulty) as Promise<{
        floor: number;
        stages: Stage[];
      }>,
    ])
      .then(([deckRes, stageRes]) => {
        setDeck(deckRes.items);
        setStages(stageRes.stages);
        setFloor(stageRes.floor);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [gameId, difficulty]);

  async function handleStageSelect(stage: Stage) {
    setSelectedStage(stage);
    setReroll(null);
    setAppliedReroll(false);
    try {
      await gamesApi.selectStage(gameId, { stageId: stage.id, difficulty });
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleCreateReroll() {
    try {
      const res = (await gamesApi.createReroll(gameId)) as RerollResult;
      setReroll(res);
      setAppliedReroll(false);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleApplyReroll(userIdentityId: string) {
    if (!reroll) return;
    try {
      await gamesApi.applyReroll(gameId, reroll.rerollId, {
        selectUserIdentityId: userIdentityId,
      });

      // 덱 새로고침
      const deckRes = (await gamesApi.getDeck(gameId)) as { items: DeckItem[] };
      setDeck(deckRes.items);
      setAppliedReroll(true);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleAdvance() {
    try {
      const res = (await gamesApi.advance(gameId)) as { currentFloor: number };
      setFloor(res.currentFloor);
      setSelectedStage(null);
      setReroll(null);
      setAppliedReroll(false);

      const stageRes = (await gamesApi.getStages(gameId, difficulty)) as {
        floor: number;
        stages: Stage[];
      };
      setStages(stageRes.stages);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleFinish(status: "CLEAR" | "FAILURE") {
    try {
      await gamesApi.updateStatus(gameId, { status });
      window.location.href = `/games/${gameId}/summary`;
    } catch (e: any) {
      alert(e.message);
    }
  }

  // 리롤 후보에서 identity 이름 찾기
  function getCandidateName(candidate: RerollCandidate) {
    const deckItem = deck.find(
      (d) => d.userIdentityId === candidate.userIdentityId,
    );
    return deckItem?.identity.name ?? candidate.identityId;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">게임 진행 - {floor}층</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleFinish("CLEAR")}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            클리어
          </button>
          <button
            onClick={() => handleFinish("FAILURE")}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            실패
          </button>
        </div>
      </div>

      {/* 난이도 선택 */}
      <div className="flex gap-2 mb-6">
        {(["NORMAL", "HARD"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-4 py-2 rounded border ${
              difficulty === d
                ? "bg-blue-500 text-white border-blue-500"
                : "border-gray-300 hover:border-gray-500"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* STEP 1: 스테이지 선택 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">STEP 1. 스테이지 선택</h2>
        <div className="grid grid-cols-8 gap-2">
          {stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => handleStageSelect(stage)}
              className={`border rounded-lg overflow-hidden transition ${
                selectedStage?.id === stage.id
                  ? "border-blue-500 ring-2 ring-blue-300"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div
                className="w-full bg-gray-100"
                style={{ aspectRatio: "2/3" }}
              >
                {stage.imageUrl ? (
                  <img
                    src={stage.imageUrl}
                    alt={stage.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-1">
                    <span className="text-xs text-gray-400 text-center leading-tight">
                      {stage.name}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-center py-1 px-1 leading-tight truncate">
                {stage.name}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* STEP 2: 리롤 */}
      {selectedStage && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">STEP 2. 리롤</h2>

          {!reroll ? (
            <button
              onClick={handleCreateReroll}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600"
            >
              리롤 뽑기
            </button>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                {appliedReroll
                  ? "✅ 적용 완료! 다음 층으로 넘어가세요."
                  : "적용할 identity를 선택하세요."}
              </p>
              <div className="flex gap-3 mb-4">
                {reroll.candidates.map((c) => (
                  <button
                    key={c.userIdentityId}
                    onClick={() =>
                      !appliedReroll && handleApplyReroll(c.userIdentityId)
                    }
                    disabled={appliedReroll}
                    className={`border rounded-xl overflow-hidden text-left transition w-36 ${
                      appliedReroll
                        ? "border-gray-200 opacity-50"
                        : "border-gray-300 hover:border-purple-400 hover:shadow-md"
                    }`}
                  >
                    {/* 이미지 */}
                    <div className="w-full aspect-square bg-gray-100">
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-gray-400">No img</span>
                        </div>
                      )}
                    </div>
                    {/* 정보 */}
                    <div className="p-2">
                      <p className="font-semibold text-xs leading-tight">
                        {c.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tier: {c.rolledTier}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {!appliedReroll && (
                <button
                  onClick={handleCreateReroll}
                  className="text-sm text-purple-500 underline"
                >
                  다시 리롤
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* STEP 3: 다음 층 */}
      {appliedReroll && (
        <button
          onClick={handleAdvance}
          className="mb-8 bg-yellow-400 text-black px-6 py-3 rounded-lg hover:bg-yellow-500"
        >
          다음 층으로 →
        </button>
      )}

      {/* 현재 덱 */}
      <section>
        <h2 className="text-lg font-semibold mb-3">현재 덱</h2>
        <div className="grid grid-cols-12 gap-1">
          {deck.map((item) => (
            <div
              key={item.gameDeckId}
              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              {item.identity.imageUrl ? (
                <img
                  src={item.identity.imageUrl}
                  alt={item.identity.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-gray-400 text-center px-1 leading-tight">
                    {item.identity.name}
                  </span>
                </div>
              )}
              {/* 티어 뱃지 */}
              <div className="absolute top-0.5 right-0.5 bg-black/60 text-white text-xs px-1 rounded leading-tight">
                {item.identity.tier}
              </div>
              {/* 호버 툴팁 */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <p className="text-white text-xs text-center px-1 leading-tight">
                  {item.identity.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
