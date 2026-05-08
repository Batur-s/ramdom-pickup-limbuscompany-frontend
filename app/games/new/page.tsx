"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  identityApi,
  gamesApi,
  sinnersApi,
  UserIdentity,
  Sinner,
} from "@/lib/api";

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
  const [selected, setSelected] = useState<Map<string, UserIdentity>>(
    new Map(),
  );
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

  function getSinnerName(sinnerId: string) {
    return sinners.find((s) => s.id === sinnerId)?.name ?? sinnerId;
  }

  function getSinnerImageUrl(sinnerId: string) {
    return sinners.find((s) => s.id === sinnerId)?.imageUrl ?? null;
  }

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
      const res = (await gamesApi.create({ title, deck })) as {
        gameId: string;
      };
      router.push(`/games/${res.gameId}`);
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </main>
    );
  }

  const grouped = groupBySinner(identities);
  const modalItems = modalSinnerId ? (grouped.get(modalSinnerId) ?? []) : [];
  const selectedInModal = modalSinnerId
    ? selected.get(modalSinnerId)
    : undefined;
  const modalSinner = sinners.find((s) => s.id === modalSinnerId);

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">새 게임 시작</h1>
        <p className="text-gray-500 text-sm">
          덱 선택: <span className="font-bold text-black">{selected.size}</span>{" "}
          / 12
        </p>
      </div>

      <input
        type="text"
        placeholder="게임 제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border px-4 py-2 rounded mb-8 w-full max-w-md"
      />

      {/* sinner 아이콘 목록 */}
      <div className="grid grid-cols-6 gap-6 max-w-3xl mb-8">
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
                <div
                  className={`w-24 h-24 rounded-full overflow-hidden border-2 transition ${
                    isSelected
                      ? "border-blue-400"
                      : "border-gray-200 group-hover:border-gray-400"
                  }`}
                >
                  {sinner.imageUrl ? (
                    <img
                      src={sinner.imageUrl}
                      alt={sinner.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-400">
                        {sinner.name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600">{sinner.name}</p>
              </button>

              {/* 선택된 identity */}
              {isSelected && selectedItem && (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs text-blue-600 font-medium text-center leading-tight">
                    {selectedItem.identity.name}
                  </p>
                  <button
                    onClick={() => deselect(sinner.id)}
                    className="text-xs text-red-400 hover:text-red-600"
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
        className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-40"
      >
        게임 생성 ({selected.size}/12)
      </button>

      {/* 모달 */}
      {modalSinnerId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setModalSinnerId(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              {modalSinner?.imageUrl && (
                <img
                  src={modalSinner.imageUrl}
                  alt={modalSinner.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <h2 className="text-lg font-bold">
                {modalSinner?.name} 인격 선택
              </h2>
              <button
                onClick={() => setModalSinnerId(null)}
                className="ml-auto text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {modalItems.map((item) => {
                const isThisSelected =
                  selectedInModal?.userIdentityId === item.userIdentityId;
                return (
                  <button
                    key={item.userIdentityId}
                    onClick={() => toggleSelect(item)}
                    className={`border rounded-xl overflow-hidden text-left transition ${
                      isThisSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="w-full aspect-square bg-gray-100">
                      {item.identity.imageUrl ? (
                        <img
                          src={item.identity.imageUrl}
                          alt={item.identity.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-gray-400">No img</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="font-medium text-xs leading-tight">
                        {item.identity.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Tier: {item.identity.tier}
                      </p>
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
