"use client";

import { useEffect, useState } from "react";
import { authApi, gamesApi, Game } from "@/lib/api";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  nickName: string;
  isNewUser: boolean;
  createdAt: string;
};

const statusLabel: Record<string, string> = {
  CLEAR: "✅ 클리어",
  FAILURE: "❌ 실패",
  PAUSE: "⏸ 진행 중",
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [nickName, setNickName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then((u) => {
        setUser(u);
        setNickName(u.nickName);
        return gamesApi.getAll() as Promise<{ items: Game[] }>;
      })
      .then((res) => setGames(res.items))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpdateProfile() {
    if (!nickName.trim()) return alert("닉네임을 입력해주세요");
    setSaving(true);
    try {
      const res = (await authApi.updateMe({ nickName })) as {
        id: string;
        nickName: string;
      };
      setUser((prev) => (prev ? { ...prev, nickName: res.nickName } : prev));
      setShowProfileModal(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a0f0a' }}>
        <p className="text-yellow-700">로딩 중...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a0f0a' }}>
        {/* 상단 네비게이션 */}
        <nav className="flex items-center justify-between px-8 py-4 border-b border-yellow-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-800 flex items-center justify-center">
              <span className="text-yellow-200 font-bold text-sm">LR</span>
            </div>
            <span className="text-yellow-200 font-bold text-xl">짭 림토체스</span>
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            className="bg-yellow-800 text-yellow-100 px-6 py-2 rounded hover:bg-yellow-700 transition font-bold"
          >
            로그인
          </a>
        </nav>

        {/* 메인 배너 */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="w-16 h-20 border border-yellow-500 rounded-lg" />
              ))}
            </div>
          </div>

          {/* 슬롯머신 느낌 장식 */}
          <div className="flex gap-3 mb-8 opacity-40">
            {['S', 'A', 'B', '?', 'S', 'A'].map((tier, i) => (
              <div key={i} className={`w-12 h-16 rounded-lg border-2 flex items-center justify-center font-bold text-lg
                ${tier === 'S' ? 'border-yellow-400 text-yellow-400' :
                  tier === 'A' ? 'border-orange-400 text-orange-400' :
                  tier === '?' ? 'border-white text-white animate-pulse' :
                  'border-green-400 text-green-400'}`}>
                {tier}
              </div>
            ))}
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-5xl md:text-7xl font-bold text-center mb-4"
            style={{ color: '#f5e6c8', textShadow: '0 0 30px rgba(200, 150, 50, 0.5)' }}>
            짭 림토체스
          </h1>
          <p className="text-yellow-600 text-lg md:text-xl text-center mb-2">
            Limbus Company Random Run Tracker
          </p>
          <p className="text-yellow-800 text-sm md:text-base text-center mb-12 max-w-md">
            보유한 인격으로 덱을 구성하고 랜덤 인격 가챠와 함께 거던 런을 기록하세요
          </p>

          {/* 기능 소개 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 w-full max-w-2xl">
            {[
              { icon: '🎲', title: '랜덤 리롤', desc: '가중치 기반 랜덤 인격 뽑기' },
              { icon: '📋', title: '런 기록', desc: '층별 스테이지와 덱 기록 저장' },
              { icon: '🔗', title: '공유', desc: '런 기록을 링크로 공유' },
            ].map((item, i) => (
              <div key={i} className="border border-yellow-900/50 rounded-xl p-4 text-center"
                style={{ backgroundColor: 'rgba(60, 30, 10, 0.5)' }}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-yellow-200 font-bold mb-1">{item.title}</p>
                <p className="text-yellow-700 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 로그인 버튼 */}
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            className="px-10 py-4 rounded-xl font-bold text-lg transition hover:scale-105"
            style={{ backgroundColor: '#8B5E3C', color: '#f5e6c8', boxShadow: '0 0 20px rgba(139, 94, 60, 0.5)' }}
          >
            Google로 시작하기
          </a>
        </div>

        {/* 하단 */}
        <footer className="text-center py-4 text-yellow-900 text-xs border-t border-yellow-900/20">
          짭 림토체스 · 비공식 팬 사이트
        </footer>
      </main>
    );
  }

return (
  <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a0f0a' }}>
    {/* 상단 네비게이션 */}
    <nav className="flex items-center justify-between px-8 py-4 border-b border-yellow-900/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-yellow-800 flex items-center justify-center">
          <span className="text-yellow-200 font-bold text-sm">LR</span>
        </div>
        <span className="text-yellow-200 font-bold text-xl">짭 림토체스</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-yellow-600 text-sm">{user.nickName}님</span>
        <button
          onClick={() => setShowProfileModal(true)}
          className="text-xs text-yellow-800 hover:text-yellow-600 border border-yellow-900 px-3 py-1 rounded"
        >
          프로필 수정
        </button>
      </div>
    </nav>

    <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
      {/* 환영 메시지 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#f5e6c8' }}>
          안녕하세요, {user.nickName}님
        </h1>
        <p className="text-yellow-800 text-sm">랜덤 인격 가챠와 함께 거던 런</p>
      </div>

      {/* 메뉴 버튼 */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <Link
          href="/games/new"
          className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border border-yellow-900/50 hover:border-yellow-700 transition"
          style={{ backgroundColor: 'rgba(60, 30, 10, 0.6)' }}
        >
          <span className="text-3xl">🎲</span>
          <span className="text-yellow-200 font-bold">새 게임 시작</span>
        </Link>
        <Link
          href="/identity"
          className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border border-yellow-900/50 hover:border-yellow-700 transition"
          style={{ backgroundColor: 'rgba(60, 30, 10, 0.6)' }}
        >
          <span className="text-3xl">👤</span>
          <span className="text-yellow-200 font-bold">인격 관리</span>
          <span className="text-yellow-800 text-xs">보유 인격 등록/수정</span>
        </Link>
      </div>

      {/* 게임 기록 */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#f5e6c8' }}>
          게임 기록
        </h2>
        {games.length === 0 ? (
          <div className="text-center py-12 border border-yellow-900/30 rounded-xl"
            style={{ backgroundColor: 'rgba(60, 30, 10, 0.3)' }}>
            <p className="text-yellow-800 text-4xl mb-3">🎴</p>
            <p className="text-yellow-700 text-sm">아직 게임 기록이 없어요</p>
            <p className="text-yellow-900 text-xs mt-1">새 게임을 시작해보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {games.map((game) => (
              <div
                key={game.id}
                className="border border-yellow-900/40 rounded-xl p-4 flex items-center justify-between hover:border-yellow-700/50 transition"
                style={{ backgroundColor: 'rgba(60, 30, 10, 0.4)' }}
              >
                <div>
                  <p className="font-semibold" style={{ color: '#f5e6c8' }}>{game.title}</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    {statusLabel[game.status]} · {game.currentFloor}층 ·{" "}
                    {new Date(game.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {game.status === "PAUSE" && (
                    <Link
                      href={`/games/${game.id}`}
                      className="text-xs font-bold px-3 py-2 rounded-lg"
                      style={{ backgroundColor: '#8B5E3C', color: '#f5e6c8' }}
                    >
                      이어하기
                    </Link>
                  )}
                  <Link
                    href={`/games/${game.id}/summary`}
                    className="text-xs px-3 py-2 rounded-lg border border-yellow-900/50 text-yellow-700 hover:border-yellow-700"
                  >
                    기록 보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>

    <footer className="text-center py-4 text-yellow-900 text-xs border-t border-yellow-900/20">
      짭 림토체스 · 비공식 팬 사이트
    </footer>

    {/* 프로필 수정 모달 */}
    {showProfileModal && (
      <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        onClick={() => setShowProfileModal(false)}
      >
        <div
          className="rounded-2xl p-6 w-full max-w-sm shadow-xl border border-yellow-900/50"
          style={{ backgroundColor: '#2C1A0E' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#f5e6c8' }}>프로필 수정</h2>
            <button
              onClick={() => setShowProfileModal(false)}
              className="text-yellow-800 hover:text-yellow-600 text-xl"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-yellow-700 mb-2">닉네임</p>
          <input
            type="text"
            value={nickName}
            onChange={(e) => setNickName(e.target.value)}
            className="w-full mb-4 px-4 py-2 rounded-lg border border-yellow-900/50 text-yellow-200"
            style={{ backgroundColor: '#1a0f0a' }}
          />

          <button
            onClick={handleUpdateProfile}
            disabled={saving}
            className="w-full py-2 rounded-lg font-bold disabled:opacity-40"
            style={{ backgroundColor: '#8B5E3C', color: '#f5e6c8' }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    )}
  </main>
);
}