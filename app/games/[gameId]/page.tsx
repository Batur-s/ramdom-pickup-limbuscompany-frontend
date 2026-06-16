"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { gamesApi } from "@/lib/api";
import Link from "next/link";

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
  const [isSpinning, setIsSpinning] = useState(false);
  const [stoppedSlots, setStoppedSlots] = useState<number[]>([]);
  const [pendingReroll, setPendingReroll] = useState<RerollResult | null>(null);

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
    setIsSpinning(true);
    setStoppedSlots([]);
    setPendingReroll(null);
    setReroll(null);

    try {
      const res = (await gamesApi.createReroll(gameId)) as RerollResult;
      setPendingReroll(res);

      // 1번 슬롯 1초 후 멈춤
      setTimeout(() => setStoppedSlots([0]), 1000);
      // 2번 슬롯 1.7초 후 멈춤
      setTimeout(() => setStoppedSlots([0, 1]), 1700);
      // 3번 슬롯 2.4초 후 멈춤 + 결과 표시
      setTimeout(() => {
        setStoppedSlots([0, 1, 2]);
        setReroll(res);
        setAppliedReroll(false);
        setIsSpinning(false);
      }, 2400);
    } catch (e: any) {
      setIsSpinning(false);
      setStoppedSlots([]);
      if (e.message === "Not enough candidates outside deck") {
        alert(
          "리롤할 인격이 부족해요. 인격 관리에서 더 많은 인격을 등록해주세요.",
        );
      } else {
        alert(e.message);
      }
    }
  }

  async function handleApplyReroll(userIdentityId: string) {
    if (!reroll) return;
    try {
      await gamesApi.applyReroll(gameId, reroll.rerollId, {
        selectUserIdentityId: userIdentityId,
      });
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

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#1a0f0a" }}
      >
        <p className="text-yellow-700">로딩 중...</p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#1a0f0a" }}
    >
      {/* 네비게이션 */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-yellow-900/30">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-yellow-800 hover:text-yellow-600 text-sm"
          >
            ← 메인으로
          </Link>
          <h1 className="text-xl font-bold" style={{ color: "#f5e6c8" }}>
            게임 진행 · <span className="text-yellow-400">{floor}층</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleFinish("CLEAR")}
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{ backgroundColor: "#1a4731", color: "#4ade80" }}
          >
            클리어
          </button>
          <button
            onClick={() => handleFinish("FAILURE")}
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{ backgroundColor: "#4a1a1a", color: "#f87171" }}
          >
            실패
          </button>
        </div>
      </nav>

      <div className="flex-1 p-8">
        {/* 난이도 선택 */}
        <div className="flex gap-2 mb-8">
          {(["NORMAL", "HARD"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className="px-6 py-2 rounded-lg text-sm font-bold transition"
              style={{
                backgroundColor:
                  difficulty === d ? "#8B5E3C" : "rgba(60,30,10,0.5)",
                color: difficulty === d ? "#f5e6c8" : "#78350f",
                border: `1px solid ${difficulty === d ? "#8B5E3C" : "rgba(120,53,15,0.3)"}`,
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* STEP 1: 스테이지 선택 */}
        <section className="mb-8">
          <h2 className="text-sm font-bold mb-3 text-yellow-700 uppercase tracking-widest">
            Step 1 · 스테이지 선택
          </h2>
          <div className="grid grid-cols-8 gap-2">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => handleStageSelect(stage)}
                className="rounded-lg overflow-hidden transition border-2"
                style={{
                  borderColor:
                    selectedStage?.id === stage.id
                      ? "#f5e6c8"
                      : "rgba(120,53,15,0.3)",
                  boxShadow:
                    selectedStage?.id === stage.id
                      ? "0 0 12px rgba(245,230,200,0.3)"
                      : "none",
                }}
              >
                <div
                  className="w-full bg-yellow-900/20"
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
                      <span className="text-xs text-yellow-800 text-center leading-tight">
                        {stage.name}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center py-1 px-1 leading-tight truncate text-yellow-700">
                  {stage.name}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* STEP 2: 리롤 */}
        {selectedStage && (
          <section className="mb-8">
            <h2 className="text-sm font-bold mb-3 text-yellow-700 uppercase tracking-widest">
              Step 2 · 리롤
            </h2>

            {!reroll && !isSpinning ? (
              <button
                onClick={handleCreateReroll}
                className="px-6 py-3 rounded-lg font-bold transition hover:scale-105"
                style={{ backgroundColor: "#8B5E3C", color: "#f5e6c8" }}
              >
                🎲 리롤 뽑기
              </button>
            ) : isSpinning ? (
              <div className="flex gap-3">
                {[0, 1, 2].map((i) => {
                  const isStopped = stoppedSlots.includes(i);
                  const candidate = pendingReroll?.candidates[i];

                  return (
                    <div
                      key={i}
                      className="w-36 rounded-xl overflow-hidden border"
                      style={{
                        borderColor: isStopped
                          ? "#f5e6c8"
                          : "rgba(120,53,15,0.5)",
                        backgroundColor: "rgba(44,26,14,0.8)",
                        boxShadow: isStopped
                          ? "0 0 12px rgba(245,230,200,0.3)"
                          : "none",
                        transition: "border-color 0.3s, box-shadow 0.3s",
                      }}
                    >
                      <div className="w-full aspect-square overflow-hidden relative">
                        {isStopped && candidate ? (
                          <img
                            src={candidate.imageUrl ?? ""}
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex flex-col"
                            style={{
                              animation: "slot-spin 0.15s linear infinite",
                            }}
                          >
                            {[...deck, ...deck, ...deck].map((item, idx) => (
                              <img
                                key={idx}
                                src={item.identity.imageUrl ?? ""}
                                alt=""
                                className="w-full aspect-square object-cover flex-shrink-0"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        {isStopped && candidate ? (
                          <>
                            <p
                              className="font-semibold text-xs leading-tight"
                              style={{ color: "#f5e6c8" }}
                            >
                              {candidate.name}
                            </p>
                            <p className="text-xs text-yellow-800 mt-1">
                              Tier: {candidate.rolledTier}
                            </p>
                          </>
                        ) : (
                          <div className="h-4 bg-yellow-900/30 rounded animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : reroll ? (
              <div>
                <p
                  className="text-sm mb-3"
                  style={{ color: appliedReroll ? "#4ade80" : "#f5e6c8" }}
                >
                  {appliedReroll
                    ? "✅ 적용 완료! 다음 층으로 넘어가세요."
                    : "적용할 인격을 선택하세요."}
                </p>
                <div className="flex gap-3 mb-4">
                  {reroll.candidates.map((c) => (
                    <button
                      key={c.userIdentityId}
                      onClick={() =>
                        !appliedReroll && handleApplyReroll(c.userIdentityId)
                      }
                      disabled={appliedReroll}
                      className="rounded-xl overflow-hidden text-left transition w-36 border"
                      style={{
                        borderColor: appliedReroll
                          ? "rgba(120,53,15,0.2)"
                          : "rgba(120,53,15,0.5)",
                        backgroundColor: "rgba(44,26,14,0.8)",
                        opacity: appliedReroll ? 0.5 : 1,
                      }}
                    >
                      <div className="w-full aspect-square bg-yellow-900/20">
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-yellow-800">
                              No img
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p
                          className="font-semibold text-xs leading-tight"
                          style={{ color: "#f5e6c8" }}
                        >
                          {c.name}
                        </p>
                        <p className="text-xs text-yellow-800 mt-1">
                          Tier: {c.rolledTier}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {!appliedReroll && (
                  <button
                    onClick={handleCreateReroll}
                    className="text-sm text-yellow-800 hover:text-yellow-600 underline"
                  >
                    다시 리롤
                  </button>
                )}
              </div>
            ) : null}
          </section>
        )}

        {/* STEP 3: 다음 층 */}
        {appliedReroll && (
          <button
            onClick={handleAdvance}
            className="mb-8 px-6 py-3 rounded-lg font-bold transition hover:scale-105"
            style={{
              backgroundColor: "#8B5E3C",
              color: "#f5e6c8",
              boxShadow: "0 0 20px rgba(139,94,60,0.4)",
            }}
          >
            다음 층으로 →
          </button>
        )}

        {/* 현재 덱 */}
        <section>
          <h2 className="text-sm font-bold mb-3 text-yellow-700 uppercase tracking-widest">
            현재 덱
          </h2>
          <div className="grid grid-cols-12 gap-1">
            {deck.map((item) => (
              <div
                key={item.gameDeckId}
                className="relative group aspect-square rounded-lg overflow-hidden"
                style={{ backgroundColor: "rgba(44,26,14,0.8)" }}
              >
                {item.identity.imageUrl ? (
                  <img
                    src={item.identity.imageUrl}
                    alt={item.identity.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-yellow-800 text-center px-1 leading-tight">
                      {item.identity.name}
                    </span>
                  </div>
                )}
                <div className="absolute top-0.5 right-0.5 bg-black/70 text-yellow-400 text-xs px-1 rounded leading-tight">
                  {item.identity.tier}
                </div>
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <p className="text-yellow-200 text-xs text-center px-1 leading-tight">
                    {item.identity.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
