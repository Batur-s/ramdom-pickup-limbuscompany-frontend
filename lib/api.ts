const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function getToken() {
  const match = document.cookie.match(/accessToken=([^;]+)/);
  return match ? match[1] : null;
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message ?? "API Error");
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// 타입
export type UserIdentity = {
  userIdentityId: string;
  identityId: string;
  sinnerId: string;
  syncGrade: number;
  identity: {
    id: string;
    name: string;
    tier: string;
    grade: number;
    sinnerId: string;
    imageUrl: string | null;
  };
};

export type AllIdentity = {
  id: string;
  name: string;
  tier: string;
  grade: number;
  sinnerId: string;
  imageUrl: string | null;
};

export type Sinner = { id: string; name: string; imageUrl: string | null };

export type Game = {
  id: string;
  title: string;
  status: string;
  currentFloor: number;
  createdAt: string;
};

// 게임
export const gamesApi = {
  create: (body: {
    title?: string;
    deck: { sinnerId: string; userIdentityId: string }[];
  }) => apiClient("/game", { method: "POST", body: JSON.stringify(body) }),

  getDeck: (gameId: string) => apiClient(`/game/${gameId}/deck`),

  getStages: (gameId: string, difficulty: "NORMAL" | "HARD") =>
    apiClient(`/game/${gameId}/stages?difficulty=${difficulty}`),

  selectStage: (
    gameId: string,
    body: { stageId: string; difficulty: "NORMAL" | "HARD" },
  ) =>
    apiClient(`/game/${gameId}/stages`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createReroll: (gameId: string) =>
    apiClient(`/game/${gameId}/reroll`, { method: "POST" }),

  applyReroll: (
    gameId: string,
    rerollId: string,
    body: { selectUserIdentityId: string },
  ) =>
    apiClient(`/game/${gameId}/${rerollId}/apply`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  advance: (gameId: string) =>
    apiClient(`/game/${gameId}/advance`, { method: "PATCH" }),

  updateStatus: (
    gameId: string,
    body: { status: "CLEAR" | "FAILURE" | "PAUSE" },
  ) =>
    apiClient(`/game/${gameId}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  getSummary: (gameId: string) => apiClient(`/game/${gameId}/summary`),

  getAll: () => apiClient<{ items: Game[] }>("/game"),
};

// 유저
export const authApi = {
  me: () =>
    apiClient<{
      id: string;
      email: string;
      nickName: string;
      isNewUser: boolean;
      createdAt: string;
    }>("/user"),
  updateMe: (body: { nickName: string }) =>
    apiClient("/user", { method: "PATCH", body: JSON.stringify(body) }),
};

// identity
export const identityApi = {
  getMyIdentities: () => apiClient<{ items: UserIdentity[] }>("/identity"),
  postIdentities: (identityIds: string[]) =>
    apiClient("/identity", {
      method: "POST",
      body: JSON.stringify({ identityIds }),
    }),
  getAll: () => apiClient<{ items: AllIdentity[] }>("/identity/all"),

  updateSyncGrade: (userIdentityId: string, syncGrade: number) =>
    apiClient(`/identity/${userIdentityId}/sync-grade`, {
      method: "PATCH",
      body: JSON.stringify({ syncGrade }),
    }),

  deleteIdentity: (userIdentityId: string) =>
    apiClient(`/identity/${userIdentityId}`, { method: "DELETE" }),
};

// sinner
export const sinnersApi = {
  getAll: () => apiClient<{ items: Sinner[] }>("/sinner"),
};
