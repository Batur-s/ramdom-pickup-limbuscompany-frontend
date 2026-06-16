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
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a0f0a' }}>
        <p className="text-yellow-700">로딩 중...</p>
      </main>
    );
  }

  const grouped = groupBySinner(allIdentities);
  const modalItems = modalSinnerId ? (grouped.get(modalSinnerId) ?? []) : [];
  const modalSinner = sinners.find((s) => s.id === modalSinnerId);

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a0f0a' }}>
      {/* 네비게이션 */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-yellow-900/30">
        <Link href="/" className="text-yellow-800 hover:text-yellow-600 text-sm">
          ← 메인으로
        </Link>
        <span className="text-yellow-700 text-sm">인격 관리</span>
      </nav>

      <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#f5e6c8' }}>인격 관리</h1>
        <p className="text-yellow-800 text-sm mb-8">
          아이콘을 클릭해서 보유한 인격을 등록하거나 해제해요.
        </p>

        {/* sinner 아이콘 목록 */}
        <div className="grid grid-cols-4 gap-6 mb-8 md:grid-cols-6">
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
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition ${
                  ownedCount > 0
                    ? 'border-yellow-400'
                    : 'border-yellow-900/50 group-hover:border-yellow-700'
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
            );
          })}
        </div>
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
                {modalSinner?.name} 인격 목록
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
                const owned = getOwned(item.id);
                return (
                  <div
                    key={item.id}
                    className={`border rounded-xl overflow-hidden transition ${
                      owned ? 'border-yellow-400' : 'border-yellow-900/50'
                    }`}
                    style={{ backgroundColor: owned ? 'rgba(139,94,60,0.3)' : 'rgba(26,15,10,0.8)' }}
                  >
                    <button
                      onClick={() => !saving && handleToggle(item.id)}
                      disabled={saving}
                      className="w-full"
                    >
                      <div className="w-full aspect-square bg-yellow-900/20">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-yellow-800">No img</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-left">
                        <p className="font-medium text-xs leading-tight" style={{ color: '#f5e6c8' }}>
                          {item.name}
                        </p>
                        <p className="text-xs text-yellow-800 mt-1">Tier: {item.tier}</p>
                        <p className={`text-xs mt-1 font-medium ${owned ? 'text-yellow-400' : 'text-yellow-900'}`}>
                          {owned ? '✓ 보유중' : '미보유'}
                        </p>
                      </div>
                    </button>

                    {owned && (
                      <div className="px-2 pb-2">
                        <p className="text-xs text-yellow-800 mb-1">동기화 등급</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((grade) => (
                            <button
                              key={grade}
                              onClick={() => handleSyncGrade(owned.userIdentityId, grade)}
                              className={`w-6 h-6 rounded text-xs font-bold transition ${
                                owned.syncGrade === grade
                                  ? 'text-white'
                                  : 'text-yellow-800 hover:text-yellow-600'
                              }`}
                              style={{
                                backgroundColor: owned.syncGrade === grade ? '#8B5E3C' : 'rgba(60,30,10,0.5)'
                              }}
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