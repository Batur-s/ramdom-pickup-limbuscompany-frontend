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
    // URL에서 토큰 추출
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // 쿠키에 저장
      document.cookie = `accessToken=${token}; path=/; max-age=3600; SameSite=None; Secure`;
      // URL에서 토큰 제거
      window.history.replaceState({}, "", "/");
    }

    authApi
      .me()
      .then((u) => {
        setUser(u);
        return gamesApi.getAll() as Promise<{ items: Game[] }>;
      })
      .then((res) => setGames(res.items))
      .catch((e) => {
        console.error("에러:", e);
        setUser(null); // 에러 시 로딩 해제
      })
      .finally(() => {
        console.log("로딩 완료");
        setLoading(false);
      });
  }, []);

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
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-bold">림버스 런 트래커</h1>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
        >
          Google로 로그인
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">안녕하세요, {user.nickName}님</h1>
        <button
          onClick={() => setShowProfileModal(true)}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          프로필 수정
        </button>
      </div>

      {/* 메뉴 */}
      <div className="flex gap-3 mb-10">
        <Link
          href="/games/new"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
        >
          새 게임 시작
        </Link>
        <Link
          href="/identity"
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200"
        >
          인격 관리
        </Link>
      </div>

      {/* 게임 목록 */}
      <section>
        <h2 className="text-lg font-semibold mb-4">게임 기록</h2>
        {games.length === 0 ? (
          <p className="text-gray-400 text-sm">아직 게임 기록이 없어요.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {games.map((game) => (
              <div
                key={game.id}
                className="border rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{game.title}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {statusLabel[game.status]} · {game.currentFloor}층 ·{" "}
                    {new Date(game.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {game.status === "PAUSE" && (
                    <Link
                      href={`/games/${game.id}`}
                      className="text-sm bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500"
                    >
                      이어하기
                    </Link>
                  )}
                  <Link
                    href={`/games/${game.id}/summary`}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                  >
                    기록 보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 프로필 수정 모달 */}
      {showProfileModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">프로필 수정</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-2">닉네임</p>
            <input
              type="text"
              value={nickName}
              onChange={(e) => setNickName(e.target.value)}
              className="border px-4 py-2 rounded w-full mb-4"
            />

            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg w-full hover:bg-blue-600 disabled:opacity-40"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
