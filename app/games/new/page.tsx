"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { identityApi, gamesApi, sinnersApi, UserIdentity, Sinner } from "@/lib/api";
import Link from "next/link";

function groupBySinner(identities: UserIdentity[]) {
  const map = new Map<string, UserIdentity[]>();
  for (const item of identities) {
    const list = map.get(item.sinnerId) ?? [];
    list.push(item);
    map.set(item.sinnerId, list);
  }
  return map;
}

export default function NewGamePage() {
  const router = useRouter();
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [sinners, setSinners] = useState<Sinner[]>([]);
  const [selected, setSelected] = useState<Map<string, UserIdentity>>(new Map());
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalSinnerId, setModalSinnerId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([identityApi.getMyIdentities(), sinnersApi.getAll()])
      .then(([identityRes, sinnerRes]) => {
        setIdentities(identityRes.items);
        setSinners(sinnerRes.items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function toggleSelect(item: UserIdentity) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.size >= 12 && !next.has(item.sinnerId)) return prev;
      next.set(item.sinnerId, item);
      return next;
    });
    setModalSinnerId(null);
  }

  function deselect(sinnerId: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(sinnerId);
      return next;
    });
  }

  async function handleCreate() {
    if (selected.size !== 12) return alert("12개를 선택해주세요");
    if (!title.trim()) return alert("게임 제목을 입력해주세요");

    const deck = Array.from(selected.values()).map((i) => ({
      sinnerId: i.sinnerId,
      userIdentityId: i.userIdentityId,
    }));

    try {
      const res = (await gamesApi.create({ title, deck })) as { gameId: string };
      router.push(`/games/${res.gameId}`);
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a0f0a' }}>
        <p className="text-yellow-700">로딩 중...</p>
      </main>
    );
  }

  const grouped = groupBySinner(identities);
  const modalItems = modalSinnerId ? (grouped.get(modalSinnerId) ?? []) : [];
  const selectedInModal = modalSinnerId ? selected.get(modalSinnerId) : undefined;
  const modalSinner = sinners.find((s) => s.id === modalSinnerId);

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a0f0a' }}>
      {/* 네비게이션 */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-yellow-900/30">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-yellow-800 hover:text-yellow-600 text-sm">← 메인으로</Link>
        </div>
        <p style={{ color: '#f5e6c8' }} className="text-sm font-bold">
          덱 선택: <span className="text-yellow-400">{selected.size}</span> / 12
        </p>
      </nav>

      <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#f5e6c8' }}>새 게임 시작</h1>

        <input
          type="text"
          placeholder="게임 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-lg border border-yellow-900/50 mb-8 text-yellow-200"
          style={{ backgroundColor: '#2C1A0E' }}
        />

        {/* sinner 아이콘 목록 */}
        <div className="grid grid-cols-4 md:grid-cols-6 gap-6 mb-8">
          {sinners.map((sinner) => {
            const items = grouped.get(sinner.id) ?? [];
            const selectedItem = selected.get(sinner.id);
            const isSelected = !!selectedItem;
            const hasIdentities = items.length > 0;

            return (
              <div key={sinner.id} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => hasIdentities && setModalSinnerId(sinner.id)}
                  disabled={!hasIdentities}
                  className="flex flex-col items-center gap-2 group disabled:opacity-40"
                >
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition ${
                    isSelected ? 'border-yellow-400' : 'border-yellow-900/50 group-hover:border-yellow-700'
                  }`}>
                    {sinner.imageUrl ? (
                      <img src={sinner.imageUrl} alt={sinner.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-yellow-900/30 flex items-center justify-center">
                        <span className="text-xs text-yellow-700">{sinner.name[0]}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-yellow-700">{sinner.name}</p>
                </button>

                {isSelected && selectedItem && (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs text-yellow-400 font-medium text-center leading-tight">
                      {selectedItem.identity.name}
                    </p>
                    <button
                      onClick={() => deselect(sinner.id)}
                      className="text-xs text-red-700 hover:text-red-500"
                    >
                      ✕ 해제
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleCreate}
          disabled={selected.size !== 12}
          className="px-8 py-3 rounded-lg font-bold disabled:opacity-40 transition hover:scale-105"
          style={{ backgroundColor: '#8B5E3C', color: '#f5e6c8' }}
        >
          게임 생성 ({selected.size}/12)
        </button>
      </div>

      {/* 모달 */}
      {modalSinnerId && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setModalSinnerId(null)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-lg shadow-xl border border-yellow-900/50"
            style={{ backgroundColor: '#2C1A0E' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              {modalSinner?.imageUrl && (
                <img src={modalSinner.imageUrl} alt={modalSinner.name} className="w-10 h-10 rounded-full object-cover" />
              )}
              <h2 className="text-lg font-bold" style={{ color: '#f5e6c8' }}>
                {modalSinner?.name} 인격 선택
              </h2>
              <button
                onClick={() => setModalSinnerId(null)}
                className="ml-auto text-yellow-800 hover:text-yellow-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {modalItems.map((item) => {
                const isThisSelected = selectedInModal?.userIdentityId === item.userIdentityId;
                return (
                  <button
                    key={item.userIdentityId}
                    onClick={() => toggleSelect(item)}
                    className={`border rounded-xl overflow-hidden text-left transition ${
                      isThisSelected
                        ? 'border-yellow-400'
                        : 'border-yellow-900/50 hover:border-yellow-700'
                    }`}
                    style={{ backgroundColor: isThisSelected ? 'rgba(139,94,60,0.3)' : 'rgba(26,15,10,0.8)' }}
                  >
                    <div className="w-full aspect-square bg-yellow-900/20">
                      {item.identity.imageUrl ? (
                        <img src={item.identity.imageUrl} alt={item.identity.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-yellow-800">No img</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="font-medium text-xs leading-tight" style={{ color: '#f5e6c8' }}>
                        {item.identity.name}
                      </p>
                      <p className="text-xs text-yellow-800 mt-1">Tier: {item.identity.tier}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}