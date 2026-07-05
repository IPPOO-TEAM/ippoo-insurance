import { apiFetch, API_BASE } from "../espace-client/supabaseClient";
import { publicAnonKey } from "../../../utils/supabase/info";

export type AgentConversation = {
  userId: string;
  userEmail: string;
  userName: string;
  avatarUrl?: string | null;
  memberNumber: string;
  lastMessage: string;
  lastAt: string;
  lastFrom: "user" | "conseiller" | string;
  unread: number;
  total: number;
  status: "ouvert" | "en_cours" | "resolu" | string;
  assignee: string | null;
  tags: string[];
};

export type AgentMessage = {
  id: string;
  from: "user" | "conseiller";
  author?: string;
  body: string;
  createdAt: string;
  read?: boolean;
  readAt?: string;
  attachment?: { name: string; size: number; signedUrl?: string };
  replyToId?: string;
};

export type AgentMe = { id: string; username: string; email: string; matricule: string };

export type AgentTwoFactor = { enrolled: boolean; verified: boolean; required: boolean };

const TWOFA_STORAGE_KEY = "ippoo:agent:2fa:token:v1";
export function getStoredAgent2FAToken(): string | null {
  try { return sessionStorage.getItem(TWOFA_STORAGE_KEY); } catch { return null; }
}
export function setStoredAgent2FAToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TWOFA_STORAGE_KEY, token);
    else sessionStorage.removeItem(TWOFA_STORAGE_KEY);
  } catch { /* quota / private mode */ }
}

export type AgentClaim = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  memberNumber: string;
  type: string;
  description?: string;
  amount?: number;
  status: "soumis" | "en_cours" | "en_examen" | "valide" | "rejete" | "regle" | string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  adminNote?: string;
  attachments?: { name: string; url?: string }[];
  assignedTo?: string | null;
  assignedAt?: string | null;
  assignedBy?: string | null;
};

export type AgentTemplate = { id: string; title: string; body: string; updatedAt: string };

export type AgentTask = {
  id: string;
  title: string;
  dueAt: string | null;
  userId: string | null;
  done: boolean;
  createdAt: string;
  completedAt: string | null;
};

export type AgentKyc = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  memberNumber: string;
  type: "identite" | "adresse" | "revenu" | string;
  status: "pending" | "valide" | "rejete";
  fields: Record<string, string>;
  docs: { name: string; url?: string }[];
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decidedByMatricule?: string;
  note?: string;
  lock?: {
    agentId: string;
    agentMatricule: string;
    agentName: string;
    lockedAt: string;
    expiresAt: string;
    lockedByMe: boolean;
  } | null;
};

export type Customer360 = {
  profile: any;
  contracts: any[];
  claims: any[];
  payments: any[];
  beneficiaries: any[];
  documents: any[];
  lastMessages: AgentMessage[];
  conversationMeta: { status: string; assignee: string | null; tags: string[] };
  settings: any;
  unreadNotifications: number;
};

export const agentApi = {
  signup: (input: { code: string; email: string; password: string; name: string; phone?: string }) =>
    apiFetch<{ agent: AgentMe }>("/agent/signup", { method: "POST", body: input }),

  me: (token: string) =>
    apiFetch<{ isAgent: boolean; agent?: AgentMe; error?: string; twoFactor?: AgentTwoFactor }>("/agent/me", { token, silent: true }),

  twoFactor: {
    status: (token: string) =>
      apiFetch<{ enrolled: boolean; pending: boolean; enabledAt: string | null }>("/agent/2fa", { token }),
    enroll: (token: string) =>
      apiFetch<{ secret: string; otpauth: string }>("/agent/2fa/enroll", { method: "POST", token }),
    activate: (token: string, code: string) =>
      apiFetch<{ ok: true; twoFactorToken: string }>("/agent/2fa/activate", { method: "POST", token, body: { code } }),
    verify: (token: string, code: string) =>
      apiFetch<{ twoFactorToken: string }>("/agent/2fa/verify", { method: "POST", token, body: { code } }),
    disable: (token: string, code: string) =>
      apiFetch<{ ok: true }>("/agent/2fa/disable", { method: "POST", token, body: { code } }),
  },

  listNotifs: (token: string) =>
    apiFetch<{
      notifs: { id: string; type: string; title: string; body?: string; url?: string; createdAt: string; read: boolean }[];
      unread: number;
    }>("/agent/notifs", { token }),
  markNotifRead: (token: string, id: string) =>
    apiFetch<{ ok: true }>(`/agent/notifs/${id}/read`, { method: "POST", token }),
  markAllNotifsRead: (token: string) =>
    apiFetch<{ ok: true }>("/agent/notifs/read-all", { method: "POST", token }),

  getProfile: (token: string) =>
    apiFetch<{ profile: { displayName: string; phone: string; avatarUrl: string; signature: string; updatedAt?: string } }>(
      "/agent/profile",
      { token },
    ),
  updateProfile: (token: string, patch: { displayName?: string; phone?: string; avatarUrl?: string; signature?: string }) =>
    apiFetch<{ profile: { displayName: string; phone: string; avatarUrl: string; signature: string; updatedAt: string } }>(
      "/agent/profile",
      { method: "PATCH", token, body: patch },
    ),

  search: (token: string, q: string) =>
    apiFetch<{ results: { userId: string; name: string; email: string; phone: string; memberNumber: string; city: string }[] }>(
      `/agent/search?q=${encodeURIComponent(q)}`,
      { token },
    ),

  dashboard: (token: string) =>
    apiFetch<{
      generatedAt: string;
      portfolioSize: number;
      mine: {
        unreadMessages: number;
        claimsOpen: number;
        kycPending: number;
        paymentsPending: number;
        paidTodayAmount: number;
        contractsToday: number;
        contractsBySelfToday: number;
      };
      all: {
        unreadMessages: number;
        openConversations: number;
        claimsOpen: number;
        kycPending: number;
        paymentsPending: number;
        paidTodayAmount: number;
        contractsToday: number;
      };
    }>("/agent/dashboard", { token }),

  performance: (token: string, days: 7 | 30 | 90 = 30) =>
    apiFetch<{
      agent: { matricule: string; name: string };
      days: number;
      since: string;
      generatedAt: string;
      claims: { decided: number; validated: number; rejected: number; settled: number };
      contracts: { subscribed: number; renewed: number; cancelled: number };
      kyc: { decided: number; validated: number; rejected: number };
      payments: { recorded: number; amount: number };
      messages: { sent: number; avgResponseSec: number | null };
    }>(`/agent/me/performance?days=${days}`, { token }),

  getPresence: (token: string) =>
    apiFetch<{ presence: { status: "online" | "paused"; at: string } | null }>("/agent/presence", { token }),
  setPresence: (token: string, online: boolean, opts: { silent?: boolean } = {}) =>
    apiFetch<{ presence: { status: "online" | "paused"; at: string } }>("/agent/presence", {
      method: "POST",
      token,
      body: { online },
      silent: opts.silent,
    }),

  recordManualPayment: (token: string, uid: string, input: { amount: number; method: "cash" | "agence" | "virement" | "carte"; contractId?: string; note?: string }) =>
    apiFetch<{ payment: any }>(`/agent/payments/${uid}`, { method: "POST", token, body: input }),

  subscribeForUser: (token: string, uid: string, input: { product: string; frequency: "mensuel" | "trimestriel" | "annuel"; note?: string }) =>
    apiFetch<{ contract: any }>(`/agent/subscribe/${uid}`, { method: "POST", token, body: input }),

  updateClientProfile: (token: string, uid: string, patch: Partial<Record<"name" | "phone" | "address" | "city" | "department" | "country" | "birthDate" | "gender" | "profession", string>>) =>
    apiFetch<{ profile: any }>(`/agent/customer/${uid}/profile`, { method: "PATCH", token, body: patch }),

  contractAction: (token: string, uid: string, contractId: string, action: "renew" | "cancel", reason?: string) =>
    apiFetch<{ contract: any }>(`/agent/contracts/${uid}/${contractId}/${action}`, {
      method: "POST", token, body: { reason: reason ?? "" },
    }),

  uploadCustomerDocument: async (token: string, uid: string, file: File, label: string, kind: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("label", label);
    form.append("kind", kind);
    const res = await fetch(
      `${API_BASE}/agent/customer/${uid}/documents`,
      { method: "POST", headers: { Authorization: `Bearer ${token}`, apikey: publicAnonKey }, body: form },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json as { document: any };
  },
  customerDocumentUrl: (token: string, uid: string, path: string) =>
    apiFetch<{ url: string }>(`/agent/customer/${uid}/documents/url?path=${encodeURIComponent(path)}`, { token }),
  deleteCustomerDocument: (token: string, uid: string, docId: string) =>
    apiFetch<{ ok: true }>(`/agent/customer/${uid}/documents/${docId}`, { method: "DELETE", token }),

  addCustomerBeneficiary: (token: string, uid: string, input: { name: string; relation: string; birthDate?: string | null }) =>
    apiFetch<{ beneficiary: any }>(`/agent/customer/${uid}/beneficiaries`, { method: "POST", token, body: input }),
  updateCustomerBeneficiary: (token: string, uid: string, id: string, patch: { name?: string; relation?: string; birthDate?: string | null }) =>
    apiFetch<{ beneficiary: any }>(`/agent/customer/${uid}/beneficiaries/${id}`, { method: "PATCH", token, body: patch }),
  deleteCustomerBeneficiary: (token: string, uid: string, id: string) =>
    apiFetch<{ ok: true }>(`/agent/customer/${uid}/beneficiaries/${id}`, { method: "DELETE", token }),

  listNotes: (token: string, uid: string) =>
    apiFetch<{ notes: { id: string; text: string; authorMatricule: string; authorName: string; createdAt: string }[] }>(
      `/agent/notes/${uid}`,
      { token },
    ),
  addNote: (token: string, uid: string, text: string) =>
    apiFetch<{ note: { id: string; text: string; authorMatricule: string; authorName: string; createdAt: string } }>(
      `/agent/notes/${uid}`,
      { method: "POST", token, body: { text } },
    ),
  deleteNote: (token: string, uid: string, noteId: string) =>
    apiFetch<{ ok: true }>(`/agent/notes/${uid}/${noteId}`, { method: "DELETE", token }),

  peers: (token: string) =>
    apiFetch<{ peers: { matricule: string; userId: string; name: string }[] }>("/agent/peers", { token }),

  portfolio: (token: string) =>
    apiFetch<{
      clients: {
        userId: string;
        userEmail: string;
        userName: string;
        memberNumber: string;
        lastMessageAt: string | null;
        lastMessagePreview: string;
        enrolledBy?: string | null;
        enrolledAt?: string | null;
        enrolledSource?: string | null;
        assigned?: boolean;
      }[];
    }>("/agent/portfolio", { token }),

  conversations: (token: string, opts: { q?: string; status?: string; mine?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (opts.q) qs.set("q", opts.q);
    if (opts.status) qs.set("status", opts.status);
    if (opts.mine) qs.set("mine", "1");
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<{ conversations: AgentConversation[]; me: { id: string; username: string } }>(
      `/agent/messages${suffix}`,
      { token },
    );
  },

  conversation: (token: string, uid: string) =>
    apiFetch<{ messages: AgentMessage[] }>(`/agent/messages/${uid}`, { token }),

  reply: (token: string, uid: string, content: string, replyToId?: string) =>
    apiFetch<{ message: AgentMessage }>(`/agent/messages/${uid}`, {
      method: "POST",
      token,
      body: { content, replyToId },
    }),

  claims: (token: string) =>
    apiFetch<{ claims: AgentClaim[] }>("/agent/claims", { token }),

  createClient: (token: string, input: { email: string; name: string; phone?: string; password: string }) =>
    apiFetch<{ ok: true; userId: string; memberNumber: string; email: string }>("/agent/clients", { method: "POST", body: input, token }),

  payments: (token: string, opts: { limit?: number; before?: string; mine?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (opts.limit) qs.set("limit", String(opts.limit));
    if (opts.before) qs.set("before", opts.before);
    if (opts.mine) qs.set("mine", "1");
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<{
      payments: Array<{
        id: string;
        contractId: string | null;
        amount: number;
        currency?: string;
        method: string;
        status: "confirme" | "en_attente" | "echec" | string;
        createdAt: string;
        userId: string;
        userEmail: string;
        userName: string;
        memberNumber?: string;
        inPortfolio?: boolean;
      }>;
      nextBefore: string | null;
      total: number;
      portfolio?: { in: number; out: number };
    }>(`/agent/payments${suffix}`, { token });
  },

  updateClaimStatus: (token: string, userId: string, claimId: string, status: string, note?: string) =>
    apiFetch<{ claim: AgentClaim }>(`/agent/claims/${userId}/${claimId}/status`, {
      method: "POST",
      token,
      body: { status, note: note ?? "" },
    }),

  assignClaimToMe: (token: string, userId: string, claimId: string) =>
    apiFetch<{ claim: AgentClaim }>(`/agent/claims/${userId}/${claimId}/assign-me`, {
      method: "POST",
      token,
    }),

  reassignClaimTo: (token: string, userId: string, claimId: string, matricule: string, reason?: string) =>
    apiFetch<{ claim: AgentClaim }>(`/agent/claims/${userId}/${claimId}/reassign-to`, {
      method: "POST",
      token,
      body: { matricule, reason: reason ?? "" },
    }),

  uploadClaimAttachment: async (token: string, userId: string, claimId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      `${API_BASE}/agent/claims/${userId}/${claimId}/attachment`,
      { method: "POST", headers: { Authorization: `Bearer ${token}`, apikey: publicAnonKey }, body: form },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    return json as { ok: true; attachment: { path: string; name: string; size: number; addedBy: string; addedAt: string } };
  },
  claimAttachmentUrl: (token: string, userId: string, path: string) =>
    apiFetch<{ url: string }>(`/agent/claims/attachment-url?userId=${encodeURIComponent(userId)}&path=${encodeURIComponent(path)}`, { token }),

  customer360: (token: string, uid: string) =>
    apiFetch<Customer360>(`/agent/customer/${uid}`, { token }),

  listTasks: (token: string) =>
    apiFetch<{ tasks: AgentTask[] }>("/agent/tasks", { token }),
  createTask: (token: string, input: { title: string; dueAt?: string | null; userId?: string | null }) =>
    apiFetch<{ task: AgentTask }>("/agent/tasks", { method: "POST", token, body: input }),
  updateTask: (token: string, id: string, patch: { title?: string; dueAt?: string | null; done?: boolean }) =>
    apiFetch<{ task: AgentTask }>(`/agent/tasks/${id}`, { method: "PATCH", token, body: patch }),
  deleteTask: (token: string, id: string) =>
    apiFetch<{ ok: true }>(`/agent/tasks/${id}`, { method: "DELETE", token }),

  listTemplates: (token: string) =>
    apiFetch<{ templates: AgentTemplate[] }>("/agent/templates", { token }),
  createTemplate: (token: string, title: string, body: string) =>
    apiFetch<{ template: AgentTemplate }>("/agent/templates", { method: "POST", token, body: { title, body } }),
  updateTemplate: (token: string, id: string, patch: { title?: string; body?: string }) =>
    apiFetch<{ template: AgentTemplate }>(`/agent/templates/${id}`, { method: "PATCH", token, body: patch }),
  deleteTemplate: (token: string, id: string) =>
    apiFetch<{ ok: true }>(`/agent/templates/${id}`, { method: "DELETE", token }),

  kycQueue: (token: string) =>
    apiFetch<{ pending: AgentKyc[]; decided: AgentKyc[] }>("/agent/kyc", { token }),

  kycDecide: (token: string, userId: string, kycId: string, decision: "valide" | "rejete", note?: string) =>
    apiFetch<{ kyc: AgentKyc }>(`/agent/kyc/${userId}/${kycId}/decision`, {
      method: "POST",
      token,
      body: { decision, note: note ?? "" },
    }),

  kycLock: (token: string, userId: string, kycId: string, opts?: { force?: boolean; release?: boolean }) =>
    apiFetch<{ lock: AgentKyc["lock"] | null }>(`/agent/kyc/${userId}/${kycId}/lock`, {
      method: "POST",
      token,
      body: { force: !!opts?.force, release: !!opts?.release },
    }),

  updateMeta: (
    token: string,
    uid: string,
    patch: { status?: string; assignee?: string | null; tags?: string[]; claim?: boolean; release?: boolean },
  ) =>
    apiFetch<{ meta: { status: string; assignee: string | null; tags: string[]; updatedAt: string } }>(
      `/agent/messages/${uid}/meta`,
      { method: "PATCH", token, body: patch },
    ),
};
