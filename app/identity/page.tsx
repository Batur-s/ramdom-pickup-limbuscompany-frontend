'use client';

import { useEffect, useState } from 'react';
import { identityApi, sinnersApi, UserIdentity, Sinner, AllIdentity } from '@/lib/api';
import Link from 'next/link';

function groupBySinner(identities: AllIdentity[]) {
  const map = new Map<string, AllIdentity[]>();
  for (const item of identities) {
    const list = map.get(item.sinnerId) ?? [];
    list.push(item);
    map.set(item.sinnerId, list);
  }
  return map;
}

export default function IdentityPage() {
  const [sinners, setSinners] = useState<Sinner[]>([]);
  const [allIdentities, setAllIdentities] = useState<AllIdentity[]>([]);
  const [myIdentities, setMyIdentities] = useState<UserIdentity[]>([]);
  const [modalSinnerId, setModalSinnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      sinnersApi.getAll(),
      identityApi.getMyIdentities(),
      identityApi.getAll(),
    ])
      .then(([sinnerRes, myRes, allRes]) => {
        setSinners(sinnerRes.items);
        setMyIdentities(myRes.items);
        setAllIdentities(allRes.items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(identityId: string) {
    setSaving(true);
    try {
      const owned = myIdentities.find((m) => m.identityId === identityId);
      if (owned) {
        await identityApi.deleteIdentity(owned.userIdentityId);
      } else {
        await identityApi.postIdentities([identityId]);
      }
      const myRes = await identityApi.getMyIdentities();
      setMyIdentities(myRes.items);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncGrade(userIdentityId: string, syncGrade: number) {
    try {
      await identityApi.updateSyncGrade(userIdentityId, syncGrade);
      const myRes = await identityApi.getMyIdentities();
      setMyIdentities(myRes.items);
    } catch (e: any) {
      alert(e.message);
    }
  }

  function getOwned(identityId: string) {
    return myIdentities.find((m) => m.identityId === identityId);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </main>
    );
  }

  const grouped = groupBySinner(allIdentities);
  const modalItems = modalSinnerId ? (grouped.get(modalSinnerId) ?? []) : [];
  const modalSinner = sinners.find((s) => s.id === modalSinnerId);

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">인격 관리</h1>
        <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
          ← 메인으로
        </Link>
      </div>

      <p className="text-gray-500 text-sm mb-6">
        아이콘을 클릭해서 보유한 인격을 등록하거나 해제해요.
      </p>

      {/* sinner 아이콘 목록 */}
      <div className="grid grid-cols-6 gap-6 max-w-3xl mb-8">
        {sinners.map((sinner) => {
          const items = grouped.get(sinner.id) ?? [];
          const ownedCount = items.filter((i) => getOwned(i.id)).length;

          return (
            <button
              key={sinner.id}
              onClick={() => items.length > 0 && setModalSinnerId(sinner.id)}
              disabled={items.length === 0}
              className="flex flex-col items-center gap-2 group disabled:opacity-40"
            >
              <div className={`w-24 h-24 rounded-full overflow-hidden border-2 transition ${
                ownedCount > 0
                  ? 'border-blue-400'
                  : 'border-gray-200 group-hover:border-gray-400'
              }`}>
                {sinner.imageUrl ? (
                  <img
                    src={sinner.imageUrl}
                    alt={sinner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-400">{sinner.name[0]}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600">{sinner.name}</p>
            </button>
          );
        })}
      </div>

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
                {modalSinner?.name} 인격 목록
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
                const owned = getOwned(item.id);
                return (
                  <div
                    key={item.id}
                    className={`border rounded-xl overflow-hidden transition ${
                      owned ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {/* 이미지 + 등록 토글 */}
                    <button
                      onClick={() => !saving && handleToggle(item.id)}
                      disabled={saving}
                      className="w-full"
                    >
                      <div className="w-full aspect-square bg-gray-100">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-gray-400">No img</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-left">
                        <p className="font-medium text-xs leading-tight">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-1">Tier: {item.tier}</p>
                        <p className={`text-xs mt-1 font-medium ${owned ? 'text-blue-500' : 'text-gray-300'}`}>
                          {owned ? '✓ 보유중' : '미보유'}
                        </p>
                      </div>
                    </button>

                    {/* 동기화 등급 - 보유중일 때만 표시 */}
                    {owned && (
                      <div className="px-2 pb-2">
                        <p className="text-xs text-gray-500 mb-1">동기화 등급</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((grade) => (
                            <button
                              key={grade}
                              onClick={() => handleSyncGrade(owned.userIdentityId, grade)}
                              className={`w-6 h-6 rounded text-xs font-bold transition ${
                                owned.syncGrade === grade
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {grade}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}