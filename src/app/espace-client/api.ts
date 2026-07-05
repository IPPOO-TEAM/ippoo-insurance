import { apiFetch, apiOrQueue, API_BASE } from "./supabaseClient";
import { publicAnonKey } from "../../../utils/supabase/info";

export type BroadcastStats = {
  in_app: number;
  push: number;
  email: number;
  sms: number;
  opted_out: number;
  no_phone?: number;
  no_email?: number;
  sms_failed?: number;
  email_failed?: number;
  push_failed?: number;
};

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  memberNumber?: string;
  cardActive?: boolean;
  cardIssuedAt?: string;
  createdAt: string;
  type?: "informel" | "particulier" | "salarie" | string;
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  profession?: string | null;
  companyName?: string | null;
  ifu?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  country?: string | null;
  countryDial?: string | null;
  department?: string | null;
  city?: string | null;
  quartier?: string | null;
  avatarPath?: string | null;
  avatarUrl?: string | null;
  avatarUpdatedAt?: string | null;
  enrolledBy?: string | null;
  enrolledByUid?: string | null;
  enrolledAt?: string | null;
  enrolledSource?: string | null;
  referralCode?: string | null;
  // Champs métier collectés au wizard d'inscription, éditables ensuite
  sousProfil?: string[] | null;
  nationality?: string | null;
  address?: string | null;
  activite?: string | null;
  secteur?: string | null;
  entreprise?: string | null;
  statutPro?: string | null;
  couverture?: string[] | null;
  couvertureAutre?: string | null;
  formule?: string | null;
  documentsDeclares?: string[] | null;
  documentAutre?: string | null;
}
export interface BillingItem { kind: "insurance" | "account_fee" | "card_fee"; label: string; contractId?: string; perDay?: number; days?: number; amount: number; }
export interface Billing { items: BillingItem[]; total: number; perInsurance: number; accountFee: number; cardFee: number; activeCount: number; cycle: string; }
export interface Contract { id: string; product: string; status: "active" | "expired" | "pending"; startDate: string; endDate: string; premium: number; currency: string; frequency: string; autoDebit?: boolean; nextBillingDate?: string | null; lastPaidAt?: string; }
export interface ClaimAttachment { path: string; name: string; size: number; }
export interface Claim { id: string; contractId: string | null; type: string; description: string; amount: number; status: "soumis" | "en_cours" | "en_examen" | "valide" | "rejete" | "regle"; createdAt: string; attachments?: ClaimAttachment[]; assignedTo?: string | null; assignedAt?: string | null; adminNote?: string; decidedAt?: string; decidedBy?: string; }
export interface Payment { id: string; contractId: string | null; amount: number; currency: string; method: string; status: "confirme" | "en_attente" | "echec" | "rembourse" | "annule"; createdAt: string; purpose?: "cotisation" | "renewal" | "card_activation" | "monthly_premium"; confirmedAt?: string; label?: string; refundedAt?: string; refundReason?: string; refundedBy?: string; }
export interface Beneficiary { id: string; name: string; relation: string; birthDate: string | null; createdAt: string; }
export interface Document { id: string; name: string; type: string; category: string; size: number; createdAt: string; }
export interface Notification { id: string; title: string; body: string; type: "info" | "success" | "warn"; read: boolean; createdAt: string; }
export type NotifChannel = "in_app" | "push" | "email" | "sms";
export type NotifTypeKey = "upcoming" | "pending" | "failed" | "renewal" | "broadcast" | "claim" | "payment" | "system";
export interface NotifPrefs {
  channels: Record<NotifChannel, boolean>;
  types: Record<NotifTypeKey, boolean>;
}
export interface MessageAttachment { name: string; mime: string; size: number; path: string; }
export interface Message { id: string; from: "user" | "conseiller"; author: string; body: string; createdAt: string; read: boolean; attachment?: MessageAttachment; replyToId?: string; editedAt?: string; deletedAt?: string; }
export interface Settings { lang: string; notifySms: boolean; notifyEmail: boolean; }
export type KycType = "identite" | "adresse" | "revenu";
export type KycStatus = "pending" | "valide" | "rejete";
export interface KycDoc { path: string; name: string; size: number; url?: string | null; }
export interface KycRequest {
  id: string;
  type: KycType;
  status: KycStatus;
  fields: Record<string, string>;
  docs: KycDoc[];
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decidedByMatricule?: string;
  note?: string;
}
export interface KycBundle { current: KycRequest | null; history: KycRequest[]; }

export const api = {
  me: (token: string) => apiFetch<{ profile: Profile | null }>("/me", { token }),
  updateMe: async (token: string, updates: Partial<Profile>): Promise<{ profile: Profile | null; queued?: boolean }> => {
    const r = await apiOrQueue<{ profile: Profile | null }>("/me", {
      method: "PUT",
      body: updates,
      token,
      label: "Mise à jour du profil",
      optimistic: { profile: null },
    });
    return { ...r.data, queued: r.queued };
  },
  contracts: (token: string) => apiFetch<{ contracts: Contract[] }>("/contracts", { token }),
  claims: (token: string) => apiFetch<{ claims: Claim[] }>("/claims", { token }),
  createClaim: (token: string, input: { contractId?: string; type: string; description: string; amount?: number; beneficiaryId?: string }) => apiFetch<{ claim: Claim }>("/claims", { method: "POST", body: input, token }),
  payments: (token: string, opts: { limit?: number; before?: string } = {}) => {
    const qs = new URLSearchParams();
    if (opts.limit) qs.set("limit", String(opts.limit));
    if (opts.before) qs.set("before", opts.before);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<{ payments: Payment[]; nextBefore: string | null; total: number }>(`/payments${suffix}`, { token });
  },
  createPayment: (token: string, input: { contractId?: string; amount: number; method?: string }) => apiFetch<{ payment: Payment }>("/payments", { method: "POST", body: input, token }),
  initiatePayment: (
    token: string,
    input: { contractId?: string; amount: number; phone?: string; purpose?: "cotisation" | "renewal" | "card_activation" | "monthly_premium"; paymentId?: string },
  ) =>
    apiFetch<{
      payment: Payment & { mode: "kkiapay" | "mock"; purpose?: string };
      kkiapay: { publicKey: string; sandbox: boolean };
    }>("/payments/initiate", { method: "POST", body: input, token }),
  setAutoDebit: (token: string, contractId: string, enabled: boolean) =>
    apiFetch<{ contract: Contract }>(`/contracts/${contractId}/auto-debit`, { method: "PATCH", body: { enabled }, token }),
  adminRunBilling: (adminToken: string) =>
    apiFetch<{ ok: true; cycleKey: string; generated: number; skipped: number }>("/admin/billing/run", { method: "POST", adminToken }),
  adminBackfillBeneficiaries: (adminToken: string) =>
    apiFetch<{ ok: true; scanned: number; migrated: number; skipped: number }>("/admin/maintenance/backfill-beneficiaries", { method: "POST", adminToken }),
  adminRunReminders: (adminToken: string) =>
    apiFetch<{
      ok: true;
      scanned: number;
      sent: number;
      fanout: { push: number; email: number; sms: number; opted_out_type: number };
    }>("/admin/reminders/run", { method: "POST", adminToken }),
  getNotifPrefs: (token: string) =>
    apiFetch<{ prefs: NotifPrefs }>("/me/notif-prefs", { token }),
  updateNotifPrefs: (token: string, patch: Partial<NotifPrefs>) =>
    apiFetch<{ prefs: NotifPrefs }>("/me/notif-prefs", { method: "PATCH", body: patch, token }),
  confirmPaymentMock: (token: string, id: string) =>
    apiFetch<{ payment: Payment }>(`/payments/${id}/confirm-mock`, { method: "POST", token }),
  getPayment: (token: string, id: string) =>
    apiFetch<{ payment: Payment }>(`/payments/${id}`, { token }),
  beneficiaries: (token: string) => apiFetch<{ beneficiaries: Beneficiary[] }>("/beneficiaries", { token }),
  createBeneficiary: async (token: string, input: { name: string; relation: string; birthDate?: string }): Promise<{ beneficiary: Beneficiary; queued?: boolean }> => {
    const optimistic: Beneficiary = {
      id: `local_${Date.now()}`,
      name: input.name,
      relation: input.relation,
      birthDate: input.birthDate ?? null,
      createdAt: new Date().toISOString(),
    };
    const r = await apiOrQueue<{ beneficiary: Beneficiary }>("/beneficiaries", {
      method: "POST",
      body: input,
      token,
      label: `Ajouter bénéficiaire ${input.name}`,
      optimistic: { beneficiary: optimistic },
    });
    return { ...r.data, queued: r.queued };
  },
  deleteBeneficiary: async (token: string, id: string): Promise<{ ok: true; queued?: boolean }> => {
    const r = await apiOrQueue<{ ok: true }>(`/beneficiaries/${id}`, {
      method: "DELETE",
      token,
      label: "Supprimer bénéficiaire",
      optimistic: { ok: true },
    });
    return { ...r.data, queued: r.queued };
  },
  documents: (token: string) => apiFetch<{ documents: Document[] }>("/documents", { token }),
  // SLA public (C7) — pas de token requis, l'apiFetch joint déjà le publicAnonKey.
  slaPublic: () => apiFetch<{ online: number; etaLabel: string; etaMinutes: number; generatedAt: string }>("/sla/public"),
  // P10 — Signature CGU/ARS horodatée. Doit être appelé juste après le signup
  // (et lors de toute mise à jour de version des CGU) pour stocker une preuve
  // côté serveur (timestamp + IP + user-agent).
  recordConsents: (token: string, items: Array<{ type: "cgu" | "confidentialite" | "traitement" | "ars" | "marketing"; version: string; granted?: boolean }>) =>
    apiFetch<{ ok: true; stored: number; total: number }>("/consents", { method: "POST", token, body: { items } }),
  consents: (token: string) =>
    apiFetch<{ consents: Array<{ type: string; version: string; granted: boolean; at: string; ip: string; userAgent: string }> }>("/consents", { token }),
  notifications: (token: string) => apiFetch<{ notifications: Notification[] }>("/notifications", { token }),
  markNotificationsRead: (token: string) => apiFetch<{ ok: true }>("/notifications/read", { method: "POST", token }),
  messages: (token: string) => apiFetch<{ messages: Message[] }>("/messages", { token }),
  sendMessage: async (token: string, content: string, replyToId?: string): Promise<{ messages: Message[]; queued?: boolean }> => {
    const body = { content, ...(replyToId ? { replyToId } : {}) };
    const optimistic: Message = {
      id: `local_${Date.now()}`,
      from: "user",
      content,
      createdAt: new Date().toISOString(),
      ...(replyToId ? { replyToId } : {}),
    } as Message;
    const r = await apiOrQueue<{ messages: Message[] }>("/messages", {
      method: "POST", body, token,
      label: "Envoyer un message",
      optimistic: { messages: [optimistic] },
    });
    return { ...r.data, queued: r.queued };
  },
  editMessage: (token: string, id: string, content: string) => apiFetch<{ message: Message }>(`/messages/${id}`, { method: "PATCH", body: { content }, token }),
  deleteMessage: (token: string, id: string) => apiFetch<{ message: Message }>(`/messages/${id}`, { method: "DELETE", token }),
  markMessagesRead: (token: string) => apiFetch<{ ok: true; marked: number }>("/messages/read", { method: "POST", token }),
  sendMessageAttachment: async (token: string, file: File, caption?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (caption) form.append("caption", caption);
    const res = await fetch(`${API_BASE}/messages/attachment`, {
      method: "POST",
      headers: { Authorization: `Bearer ${publicAnonKey}`, ...(token ? { "X-User-Token": token } : {}) },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data as { message: Message };
  },
  messageAttachmentUrl: (token: string, path: string) =>
    apiFetch<{ url: string; expiresIn: number }>(`/messages/attachment-url?path=${encodeURIComponent(path)}`, { token }),
  uploadAvatar: async (token: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/profile/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${publicAnonKey}`, ...(token ? { "X-User-Token": token } : {}) },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data as { profile: Profile };
  },
  deleteAvatar: (token: string) =>
    apiFetch<{ profile: Profile }>("/profile/avatar", { method: "DELETE", token }),
  subscribe: (token: string, input: { product: string; premium: number; frequency?: string }) => apiFetch<{ contract: Contract }>("/subscribe", { method: "POST", body: input, token }),
  settings: (token: string) => apiFetch<{ settings: Settings }>("/settings", { token }),
  updateSettings: (token: string, updates: Partial<Settings>) => apiFetch<{ settings: Settings }>("/settings", { method: "PUT", body: updates, token }),
  changePassword: (token: string, newPassword: string) => apiFetch<{ ok: true }>("/change-password", { method: "POST", body: { newPassword }, token }),
  uploadClaimAttachment: async (token: string, claimId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/claims/${claimId}/attachments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        ...(token ? { "X-User-Token": token } : {}),
      },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data as { ok: true; attachment: ClaimAttachment };
  },
  claimAttachmentUrl: (token: string, path: string) =>
    apiFetch<{ url: string }>(`/claims/attachments/url?path=${encodeURIComponent(path)}`, { token }),
  getKyc: (token: string) => apiFetch<KycBundle>("/kyc", { token }),
  submitKyc: (token: string, input: { type: KycType; fields: Record<string, string>; docs: KycDoc[] }) =>
    apiFetch<{ kyc: KycRequest }>("/kyc", { method: "POST", body: input, token }),
  remindKyc: (token: string) =>
    apiFetch<{ kyc: KycRequest }>("/kyc/remind", { method: "POST", token }),
  uploadKycDoc: async (token: string, file: File): Promise<KycDoc> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/kyc/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        ...(token ? { "X-User-Token": token } : {}),
      },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data as KycDoc;
  },
  kycDocUrl: (token: string, path: string) =>
    apiFetch<{ url: string }>(`/kyc/url?path=${encodeURIComponent(path)}`, { token }),
  checkRenewals: (token: string) =>
    apiFetch<{ pushed: number }>("/contracts/check-renewals", { method: "POST", token }),
  referral: (token: string) =>
    apiFetch<{ code: string; count: number }>("/referral", { token }),
  audit: (token: string) =>
    apiFetch<{ entries: { id: string; action: string; meta: Record<string, any>; at: string }[] }>("/audit", { token }),
  requestAccountDeletion: (token: string) =>
    apiFetch<{ ok: true; scheduledFor: string }>("/account/delete", { method: "POST", token }),
  cancelAccountDeletion: (token: string) =>
    apiFetch<{ ok: true }>("/account/delete", { method: "DELETE", token }),
  deleteAccountNow: (token: string) =>
    apiFetch<{ ok: true }>("/account/delete-now", { method: "POST", token }),
  exportAccountData: (token: string) =>
    apiFetch<Record<string, any>>("/account/export", { token }),
  renewContract: (token: string, id: string, phone?: string) =>
    apiFetch<{ payment: Payment & { mode: "kkiapay" | "mock" }; kkiapay: { publicKey: string; sandbox: boolean } }>(
      `/contracts/${id}/renew`, { method: "POST", body: { phone }, token },
    ),
  qrToken: (token: string) =>
    apiFetch<{ token: string; memberNumber: string }>("/me/qr-token", { token }),
  billing: (token: string) =>
    apiFetch<Billing>("/billing", { token }),
  activateMemberCard: (token: string, phone?: string) =>
    apiFetch<{ profile: Profile; payment: (Payment & { mode: "kkiapay" | "mock" }) | null; kkiapay?: { publicKey: string; sandbox: boolean } }>(
      "/member-card/activate", { method: "POST", body: { phone }, token },
    ),
  qrLogin: (qrToken: string) =>
    apiFetch<{ email: string; tokenHash: string; actionLink: string }>("/auth/qr-login", {
      method: "POST", body: { token: qrToken },
    }),
  webauthnRegisterOptions: (token: string) =>
    apiFetch<any>("/auth/webauthn/register/options", { method: "POST", token }),
  webauthnRegisterVerify: (token: string, response: any) =>
    apiFetch<{ ok: true }>("/auth/webauthn/register/verify", { method: "POST", body: { response }, token }),
  webauthnLoginOptions: (email: string) =>
    apiFetch<any>("/auth/webauthn/login/options", { method: "POST", body: { email } }),
  webauthnLoginVerify: (email: string, response: any) =>
    apiFetch<{ email: string; tokenHash: string }>("/auth/webauthn/login/verify", {
      method: "POST", body: { email, response },
    }),
  webauthnStatus: (token: string) =>
    apiFetch<{ count: number; devices: { id: string; createdAt: string }[] }>("/auth/webauthn/status", { token }),
  webauthnRemove: (token: string, credId: string) =>
    apiFetch<{ ok: true }>(`/auth/webauthn/${encodeURIComponent(credId)}`, { method: "DELETE", token }),
  adminLogin: (username: string, password: string) =>
    apiFetch<{ token?: string; username?: string; role?: "superadmin" | "operator" | "support"; expiresAt?: number; requires2FA?: boolean; challenge?: string }>("/admin/login", {
      method: "POST", body: { username, password },
    }),
  adminLogin2fa: (challenge: string, code: string) =>
    apiFetch<{ token: string; username: string; role: "superadmin" | "operator" | "support"; expiresAt: number }>("/admin/login/2fa", {
      method: "POST", body: { challenge, code },
    }),
  adminCheck: (adminToken: string) =>
    apiFetch<{ admin: boolean; username?: string; role?: string; error?: string }>("/admin/check", { adminToken }),
  adminClaims: (adminToken: string) =>
    apiFetch<{ claims: (Claim & { userId: string; userEmail: string; userName: string; memberNumber: string; adminNote?: string; decidedAt?: string; decidedBy?: string })[] }>("/admin/claims", { adminToken }),
  adminUpdateClaimStatus: (adminToken: string, userId: string, claimId: string, status: Claim["status"], note?: string) =>
    apiFetch<{ claim: Claim }>(`/admin/claims/${userId}/${claimId}/status`, {
      method: "POST", body: { status, note }, adminToken,
    }),
  adminBulkUpdateClaims: (adminToken: string, items: { userId: string; claimId: string }[], status: Claim["status"], note?: string) =>
    apiFetch<{ updated: number; errors: { userId: string; claimId: string; error: string }[] }>(`/admin/claims/bulk-status`, {
      method: "POST", body: { items, status, note }, adminToken,
    }),
  adminStats: (adminToken: string) =>
    apiFetch<{
      users: number;
      contractsActive: number;
      claims: { total: number; pending: number };
      revenue: number;
      revenueLast24h: number;
      timeseries: { days: string[]; revenue: number[]; signups: number[] };
      breakdown: {
        claimsByStatus: Record<string, number>;
        revenueByMethod: Record<string, number>;
        productMix: Record<string, number>;
        membersByDept: Record<string, number>;
      };
      alerts?: {
        paymentsStale2d: number;
        claimsStale48h: number;
        kycStale24h: number;
        agentsOffline4h: number;
      };
    }>("/admin/stats", { adminToken }),
  adminMembers: (adminToken: string) =>
    apiFetch<{ members: AdminMember[] }>("/admin/members", { adminToken }),
  adminRemindersHistory: (adminToken: string) =>
    apiFetch<{
      history: Array<{
        at: string;
        triggeredBy: string;
        scanned: number;
        sent: number;
        fanout: { push: number; email: number; sms: number; opted_out_type: number };
      }>;
    }>("/admin/reminders/history", { adminToken }),
  adminRebalancePortfolios: (adminToken: string, dryRun = false) =>
    apiFetch<{
      rebalanced: number;
      candidates: number;
      assignments: { userId: string; matricule: string }[];
      dryRun: boolean;
    }>(`/admin/portfolios/rebalance${dryRun ? "?dryRun=1" : ""}`, { method: "POST", adminToken }),

  adminPortfolios: (adminToken: string) =>
    apiFetch<{
      portfolios: Array<{ matricule: string; name: string; clients: number; payments: number; lastPaymentAt: string | null }>;
      unassignedPayments: number;
    }>("/admin/portfolios", { adminToken }),

  adminAgentsPresence: (adminToken: string) =>
    apiFetch<{
      agents: Array<{
        userId: string;
        matricule: string | null;
        email: string;
        name: string;
        status: string;
        effective: "online" | "online_stale" | "paused" | "offline";
        at: string;
        ageSec: number | null;
      }>;
      staleAfterSec: number;
    }>("/admin/agents/presence", { adminToken }),
  adminMember: (adminToken: string, uid: string) =>
    apiFetch<{
      profile: Profile & { suspended?: boolean };
      contracts: Contract[];
      claims: Claim[];
      payments: Payment[];
      beneficiaries: Beneficiary[];
      notifications: Notification[];
      settings: Settings | null;
      audit: { id: string; action: string; meta: Record<string, any>; at: string }[];
      documents: { id: string; name: string; kind?: string; createdAt: string; size?: number }[];
    }>(`/admin/member/${uid}`, { adminToken }),
  adminExportMember: (adminToken: string, uid: string) =>
    apiFetch<any>(`/admin/member/${uid}/export`, { adminToken }),
  adminSuspend: (adminToken: string, uid: string, suspended: boolean, reason?: string) =>
    apiFetch<{ ok: true; suspended: boolean; suspension: { reason: string; by: string; at: string } | null }>(`/admin/member/${uid}/suspend`, {
      method: "POST", body: { suspended, reason: reason ?? "" }, adminToken,
    }),
  adminContracts: (adminToken: string) =>
    apiFetch<{ contracts: (Contract & { userId: string; userEmail: string; userName: string })[] }>("/admin/contracts", { adminToken }),
  adminToggleContractAutoDebit: (adminToken: string, userId: string, contractId: string, enabled: boolean) =>
    apiFetch<{ contract: Contract; unchanged?: boolean }>(`/admin/contracts/${userId}/${contractId}/auto-debit`, {
      method: "PATCH", body: { enabled }, adminToken,
    }),
  adminPayments: (adminToken: string, opts: { limit?: number; before?: string; stats?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (opts.limit) qs.set("limit", String(opts.limit));
    if (opts.before) qs.set("before", opts.before);
    if (opts.stats) qs.set("stats", "1");
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<{
      payments: (Payment & { userId: string; userEmail: string; userName: string })[];
      nextBefore: string | null;
      total: number;
      stats?: { perAgent: { matricule: string; count: number }[]; unassigned: number };
    }>(`/admin/payments${suffix}`, { adminToken });
  },
  adminPaymentProviders: (adminToken: string) =>
    apiFetch<{ providers: { id: string; name: string; configured: boolean; webhookConfigured: boolean; supports: string[] }[] }>("/admin/payments/providers", { adminToken }),
  adminSendInvoice: (adminToken: string, userId: string, paymentId: string) =>
    apiFetch<{ ok: true }>(`/admin/payments/${userId}/${paymentId}/send-invoice`, { method: "POST", adminToken }),
  adminRefundPayment: (adminToken: string, userId: string, paymentId: string, action: "rembourse" | "annule", reason: string) =>
    apiFetch<{ payment: Payment }>(`/admin/payments/${userId}/${paymentId}/refund`, {
      method: "POST", body: { action, reason }, adminToken,
    }),
  adminListAgents: (adminToken: string) =>
    apiFetch<{ agents: { id: string; email: string; name: string; phone: string; matricule: string | null; createdAt: string; lastSignInAt: string | null; banned: boolean; presence: "online" | "online_stale" | "paused" | "offline" }[] }>(`/admin/agents`, { adminToken }),
  adminCreateAgent: (adminToken: string, body: { email: string; password: string; name: string; phone?: string }) =>
    apiFetch<{ agent: { id: string; email: string; name: string; phone: string; matricule: string | null } }>(`/admin/agents`, {
      method: "POST", body, adminToken,
    }),
  adminUpdateAgent: (adminToken: string, userId: string, body: { name?: string; phone?: string; banned?: boolean; password?: string }) =>
    apiFetch<{ agent: { id: string } }>(`/admin/agents/${userId}`, { method: "PATCH", body, adminToken }),
  adminDeleteAgent: (adminToken: string, userId: string) =>
    apiFetch<{ ok: true }>(`/admin/agents/${userId}`, { method: "DELETE", adminToken }),
  adminKycList: (adminToken: string) =>
    apiFetch<{ pending: any[]; decided: any[] }>("/admin/kyc", { adminToken }),
  adminKycDecide: (adminToken: string, userId: string, kycId: string, decision: "valide" | "rejete", note?: string) =>
    apiFetch<{ kyc: any }>(`/admin/kyc/${userId}/${kycId}/decision`, { method: "POST", body: { decision, note }, adminToken }),
  adminReassignClaim: (adminToken: string, userId: string, claimId: string, matricule: string) =>
    apiFetch<{ claim: any }>(`/admin/claims/${userId}/${claimId}/reassign`, { method: "POST", body: { matricule }, adminToken }),
  adminSetEnroller: (adminToken: string, userId: string, matricule: string) =>
    apiFetch<{ ok: true; enrolledBy: string | null; previous: string | null }>(`/admin/members/${userId}/enroller`, { method: "PATCH", body: { matricule }, adminToken }),
  adminDownloadAccountingCsv: async (adminToken: string, opts: { month?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (opts.from && opts.to) { qs.set("from", opts.from); qs.set("to", opts.to); }
    else if (opts.month) qs.set("month", opts.month);
    const res = await fetch(`${API_BASE}/admin/export/accounting?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${publicAnonKey}`, "X-Admin-Token": adminToken },
    });
    if (!res.ok) throw new Error(`Export comptable: HTTP ${res.status}`);
    return await res.blob();
  },
  adminDownloadAgentsPerfCsv: async (adminToken: string, days = 30) => {
    const res = await fetch(`${API_BASE}/admin/agents/performance?days=${days}&format=csv`, {
      headers: { Authorization: `Bearer ${publicAnonKey}`, "X-Admin-Token": adminToken },
    });
    if (!res.ok) throw new Error(`Export perf: HTTP ${res.status}`);
    return await res.blob();
  },
  adminDownloadCommissionsCsv: async (adminToken: string, opts: { month?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (opts.from && opts.to) { qs.set("from", opts.from); qs.set("to", opts.to); }
    else if (opts.month) qs.set("month", opts.month);
    const res = await fetch(`${API_BASE}/admin/export/commissions?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${publicAnonKey}`, "X-Admin-Token": adminToken },
    });
    if (!res.ok) throw new Error(`Export commissions: HTTP ${res.status}`);
    return await res.blob();
  },
  adminDownloadEnrollmentsCsv: async (adminToken: string, opts: { matricule?: string; since?: string } = {}) => {
    const qs = new URLSearchParams();
    if (opts.matricule) qs.set("matricule", opts.matricule);
    if (opts.since) qs.set("since", opts.since);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await fetch(`${API_BASE}/admin/export/enrollments${suffix}`, {
      headers: { Authorization: `Bearer ${publicAnonKey}`, "X-Admin-Token": adminToken },
    });
    if (!res.ok) throw new Error(`Export filleuls: HTTP ${res.status}`);
    return await res.blob();
  },
  adminRotateHmac: (adminToken: string) =>
    apiFetch<{ ok: true; rotated: boolean; sessionsInvalidated: boolean; message: string }>("/admin/security/rotate-hmac", { method: "POST", adminToken }),
  adminDispatchSweep: (adminToken: string, hours = 4) =>
    apiFetch<{ ok: true; hours: number; onlineCount: number; offlineMatricules: string[]; reassigned: number; conversations: number; claims: number; reason?: string }>("/admin/dispatch/sweep", { method: "POST", body: { hours }, adminToken }),
  adminKpi: (adminToken: string) =>
    apiFetch<{
      generatedAt: string;
      months: string[];
      revenueByMonth: number[];
      subsByMonth: number[];
      churnByMonth: number[];
      topProducts: { product: string; revenue: number }[];
      summary: {
        currentMonthRevenue: number; previousMonthRevenue: number; momGrowth: number | null;
        activeContracts: number; cancelledTotal: number; churnRate: number;
        totalUsers: number; usersWithContract: number;
        totalQuotes: number; conversionRate: number | null;
        assistedSubscriptions: number;
      };
    }>("/admin/kpi", { adminToken }),
  adminAgentsPerformance: (adminToken: string, days = 30) =>
    apiFetch<{
      generatedAt: string; days: number; since: string;
      agents: {
        matricule: string; userId: string; name: string; email: string;
        claims: { decided: number; validated: number; rejected: number; settled: number };
        contracts: { subscribed: number; renewed: number; cancelled: number };
        kyc: { decided: number; validated: number; rejected: number };
        payments: { amount: number; count: number };
        messages: { sent: number; avgResponseSec: number | null };
        enrollments: { total: number; window: number };
      }[];
    }>(`/admin/agents/performance?days=${days}`, { adminToken }),
  adminWalletStatus: (adminToken: string) =>
    apiFetch<{ google: { configured: boolean }; apple: { configured: boolean; reason?: string } }>("/admin/wallet/status", { adminToken }),
  adminBroadcast: (adminToken: string, input: {
    title: string; body: string; type?: "info" | "success" | "warn";
    channels?: ("in_app" | "push" | "email" | "sms")[];
    audience?: { kind: "all" | "active" | "department"; value?: string };
  }) =>
    apiFetch<{ ok: true; recipients: number; stats: BroadcastStats }>("/admin/broadcast", { method: "POST", body: input, adminToken }),
  adminBroadcastHistory: (adminToken: string) =>
    apiFetch<{
      entries: { id: string; title: string; body: string; type: string; channels: string[]; audience: any; stats: BroadcastStats; recipients: number; at: string; by: string }[];
      channels: { in_app: boolean; push: boolean; email: boolean; sms: boolean };
    }>("/admin/broadcast/history", { adminToken }),
  adminBroadcastAudience: (adminToken: string) =>
    apiFetch<{ total: number; active: number; byDepartment: Record<string, number> }>("/admin/broadcast/audience", { adminToken }),
  adminConversations: (adminToken: string, opts?: { q?: string; status?: string; mine?: boolean }) => {
    const qs = new URLSearchParams();
    if (opts?.q) qs.set("q", opts.q);
    if (opts?.status) qs.set("status", opts.status);
    if (opts?.mine) qs.set("mine", "1");
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<{ conversations: { userId: string; userEmail: string; userName: string; memberNumber: string; lastMessage: string; lastAt: string; lastFrom: string; unread: number; total: number; status: "ouvert"|"en_cours"|"resolu"; assignee: string|null; tags: string[] }[] }>(`/admin/messages${suffix}`, { adminToken });
  },
  adminUpdateConversationMeta: (adminToken: string, uid: string, patch: { status?: "ouvert"|"en_cours"|"resolu"; assignee?: string|null; tags?: string[] }) =>
    apiFetch<{ meta: { status: string; assignee: string|null; tags: string[]; updatedAt: string } }>(`/admin/messages/${uid}/meta`, { method: "PATCH", body: patch, adminToken }),
  adminConversation: (adminToken: string, uid: string) =>
    apiFetch<{ messages: { id: string; from: string; author: string; body: string; createdAt: string; read: boolean }[] }>(`/admin/messages/${uid}`, { adminToken }),
  adminReplyMessage: (adminToken: string, uid: string, content: string, replyToId?: string) =>
    apiFetch<{ message: { id: string; from: string; author: string; body: string; createdAt: string; read: boolean; replyToId?: string } }>(`/admin/messages/${uid}`, { method: "POST", body: { content, ...(replyToId ? { replyToId } : {}) }, adminToken }),
  adminEditMessage: (adminToken: string, uid: string, id: string, content: string) =>
    apiFetch<{ message: Message }>(`/admin/messages/${uid}/${id}`, { method: "PATCH", body: { content }, adminToken }),
  adminDeleteMessage: (adminToken: string, uid: string, id: string) =>
    apiFetch<{ message: Message }>(`/admin/messages/${uid}/${id}`, { method: "DELETE", adminToken }),
  adminMarkConversationRead: (adminToken: string, uid: string) =>
    apiFetch<{ ok: true; marked: number }>(`/admin/messages/${uid}/read`, { method: "POST", adminToken }),
  adminSendAttachment: async (adminToken: string, uid: string, file: File, caption?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (caption) form.append("caption", caption);
    const res = await fetch(`${API_BASE}/admin/messages/${uid}/attachment`, {
      method: "POST",
      headers: { Authorization: `Bearer ${publicAnonKey}`, "X-Admin-Token": adminToken },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data as { message: { id: string; from: string; author: string; body: string; createdAt: string; read: boolean; attachment?: MessageAttachment } };
  },
  adminMessageAttachmentUrl: (adminToken: string, path: string) =>
    apiFetch<{ url: string; expiresIn: number }>(`/messages/attachment-url?path=${encodeURIComponent(path)}`, { adminToken }),
  adminUploadMedia: async (adminToken: string, file: File, folder = "misc") => {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const res = await fetch(`${API_BASE}/admin/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${publicAnonKey}`, "X-Admin-Token": adminToken },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data as { url: string; path: string; name: string; size: number };
  },
  adminAuditRecent: (adminToken: string) =>
    apiFetch<{ entries: { id: string; action: string; meta: Record<string, any>; at: string; userId: string; userEmail: string; userName: string }[] }>("/admin/audit/recent", { adminToken }),
  adminAuditAdmins: (adminToken: string) =>
    apiFetch<{ entries: { id: string; username: string; role: string; action: string; meta: Record<string, any>; ip: string; ua: string; at: string }[] }>("/admin/audit/admins", { adminToken }),
  // D1 — PSP webhooks observability
  adminWebhooks: (adminToken: string, opts: { filter?: "all" | "failed" | "ok"; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (opts.filter) qs.set("filter", opts.filter);
    if (opts.limit) qs.set("limit", String(opts.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<{ events: { id: string; provider: string; status: "ok" | "failed" | "skipped"; reason?: string; path: string; method: string; receivedAt: string; bytes: number; httpStatus?: number; replayedAt?: string; replayedBy?: string }[] }>(`/admin/webhooks${suffix}`, { adminToken });
  },
  adminWebhookDetail: (adminToken: string, id: string) =>
    apiFetch<{ event: { id: string; provider: string; status: string; reason?: string; path: string; method: string; receivedAt: string; bytes: number; httpStatus?: number; headers: Record<string, string>; body: string; replayedAt?: string; replayedBy?: string } }>(`/admin/webhooks/${id}`, { adminToken }),
  adminWebhookReplay: (adminToken: string, id: string) =>
    apiFetch<{ ok: true; httpStatus: number }>(`/admin/webhooks/${id}/replay`, { method: "POST", adminToken }),

  // D2 — Payment reconciliation
  adminReconcile: (adminToken: string, olderMin = 10) =>
    apiFetch<{ pending: { userId: string; userEmail: string; userName: string; payment: Payment }[] }>(`/admin/payments/reconcile?olderMin=${olderMin}`, { adminToken }),
  adminForceConfirmPayment: (adminToken: string, userId: string, paymentId: string, motif: string) =>
    apiFetch<{ payment: Payment }>(`/admin/payments/${userId}/${paymentId}/force-confirm`, { method: "POST", body: { motif }, adminToken }),

  // D3 — Admin roles CRUD (superadmin)
  adminRoles: (adminToken: string) =>
    apiFetch<{ roles: { username: string; role: "superadmin" | "operator" | "support"; createdAt: string; createdBy: string }[] }>("/admin/roles", { adminToken }),
  adminAddRole: (adminToken: string, username: string, role: "superadmin" | "operator" | "support", password: string) =>
    apiFetch<{ ok: true }>("/admin/roles", { method: "POST", body: { username, role, password }, adminToken }),
  adminRemoveRole: (adminToken: string, username: string) =>
    apiFetch<{ ok: true }>(`/admin/roles/${encodeURIComponent(username)}`, { method: "DELETE", adminToken }),

  // D4 — System health
  adminSystemHealth: (adminToken: string) =>
    apiFetch<{
      generatedAt: string;
      db: { ok: boolean; latencyMs: number };
      integrations: { resend: boolean; termii: boolean; vapid: boolean; adminTotp: boolean };
      psp: { kkiapay: boolean; cinetpay: boolean; fedapay: boolean; momo: boolean };
      crons: { name: string; lastRunAt: string | null; lastOk: boolean | null }[];
      webhooks: { total: number; failed24h: number; ok24h: number };
    }>("/admin/system/health", { adminToken }),

  // D5 — Sidebar badges
  adminBadgeCounts: (adminToken: string) =>
    apiFetch<{ openClaims: number; pendingKyc: number; openConversations: number; failedWebhooks: number }>("/admin/badges/counts", { adminToken }),

  // D6 — Global search
  adminSearch: (adminToken: string, q: string) =>
    apiFetch<{ results: { kind: "member" | "agent" | "payment" | "claim"; id: string; label: string; sub?: string; href: string }[] }>(`/admin/search?q=${encodeURIComponent(q)}`, { adminToken }),

  // D8 — Incident ack
  adminAckIncident: (adminToken: string, incidentId: string, note?: string) =>
    apiFetch<{ ok: true; ack: { by: string; at: string; note?: string } }>(`/admin/incidents/${encodeURIComponent(incidentId)}/ack`, { method: "POST", body: { note }, adminToken }),
  adminIncidentAcks: (adminToken: string) =>
    apiFetch<{ acks: Record<string, { by: string; at: string; note?: string }> }>("/admin/incidents/acks", { adminToken }),

  // D9 — Admin sessions
  adminSessions: (adminToken: string) =>
    apiFetch<{ sessions: { jti: string; username: string; role: string; ip: string; ua: string; createdAt: string; current: boolean }[] }>("/admin/sessions", { adminToken }),
  adminRevokeSession: (adminToken: string, jti: string) =>
    apiFetch<{ ok: true }>(`/admin/sessions/${encodeURIComponent(jti)}/revoke`, { method: "POST", adminToken }),
  adminLogout: (adminToken: string) =>
    apiFetch<{ ok: true }>("/admin/logout", { method: "POST", adminToken }),

  // D10 — Rate limit
  adminRateLimitStatus: (adminToken: string) =>
    apiFetch<{ buckets: { key: string; hits: number; windowSec: number; remaining: number; resetAt: string }[] }>("/admin/rate-limit/status", { adminToken }),
  adminRateLimitClear: (adminToken: string, key: string) =>
    apiFetch<{ ok: true }>("/admin/rate-limit/clear", { method: "POST", body: { key }, adminToken }),

  // Santé de la base normalisée (Phase 2) — vérifie chaque table attendue.
  adminDbHealth: (adminToken: string) =>
    apiFetch<{
      tables: { table: string; exists: boolean; rows: number | null; realtimeExpected: boolean; realtimeOk: boolean; error: string | null }[];
      summary: { total: number; missing: number; realtimeMissing: number; totalRows: number };
      instance: string | null;
    }>("/admin/db-health", { adminToken }),

  // D11 — Audit chain verification
  adminVerifyAuditChain: (adminToken: string) =>
    apiFetch<{ ok: boolean; total: number; brokenAt: number | null; tip: string }>("/admin/audit/verify-chain", { adminToken }),

  // D12 — RGPD erase
  adminEraseUser: (adminToken: string, userId: string, confirm: string) =>
    apiFetch<{ ok: true; erased: number }>(`/admin/users/${userId}/erase`, { method: "POST", body: { confirm }, adminToken }),

  promos: () => apiFetch<{ promos: Promo[] }>("/promos"),
  adminUpdatePromos: (adminToken: string, promos: Promo[]) =>
    apiFetch<{ ok: true; promos: Promo[] }>("/admin/promos", { method: "PUT", body: { promos }, adminToken }),
  partners: () => apiFetch<{ partners: Partner[] }>("/partners"),
  adminUpdatePartners: (adminToken: string, partners: Partner[]) =>
    apiFetch<{ ok: true; partners: Partner[] }>("/admin/partners", { method: "PUT", body: { partners }, adminToken }),
  site: () => apiFetch<{ site: SiteContent }>("/site"),
  adminUpdateSite: (adminToken: string, site: Partial<SiteContent>) =>
    apiFetch<{ ok: true; site: SiteContent }>("/admin/site", { method: "PUT", body: site, adminToken }),
  // Tarifs optionnels : si la route n'est pas (encore) déployée, on échoue en
  // silence et la plateforme retombe sur les valeurs par défaut (pas d'erreur
  // visible). silent évite le bruit console sur un 404 attendu.
  pricing: () => apiFetch<{ pricing: PricingMap }>("/pricing", { silent: true }),
  adminUpdatePricing: (adminToken: string, pricing: PricingMap) =>
    apiFetch<{ ok: true; pricing: PricingMap }>("/admin/pricing", { method: "PUT", body: { pricing }, adminToken }),
  // Health & uptime
  health: () => apiFetch<{
    status: "ok" | "degraded";
    kv: boolean;
    integrations: { kkiapay: boolean; kkiapaySandbox: boolean; resend: boolean; termii: boolean; vapid: boolean; adminTotp: boolean };
    serverTime: string;
    latencyMs: number;
    rev: string;
  }>("/health"),
  // Web Push
  pushVapid: () => apiFetch<{ publicKey: string | null }>("/push/vapid-public"),
  pushSync: (token: string, subscription: any) =>
    apiFetch<{ ok: true }>("/push/subscribe", { method: "POST", body: { subscription }, token }),
  pushRemove: (token: string, endpoint: string) =>
    apiFetch<{ ok: true }>("/push/unsubscribe", { method: "POST", body: { endpoint }, token }),
  // Wallet
  walletGoogle: (token: string) =>
    apiFetch<{ saveUrl: string | null; configured: boolean }>("/wallet/google", { token }),
  walletAppleUrl: (token: string) => `${API_BASE}/wallet/apple?t=${encodeURIComponent(token)}`,
};

export interface SiteContent {
  brandName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutShort: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  linkedin: string;
}

export interface Partner {
  id: string;
  name: string;
  kind: "clinique" | "pharmacie" | "hopital";
  address: string;
  city: string;
  phone: string;
  lat: number;
  lng: number;
  hours: string;
}

export interface Promo {
  id: string;
  image: string;
  alt: string;
  to?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  theme?: "light" | "dark";
  active?: boolean;
}

// Overrides de tarification éditables depuis le back office, fusionnés
// par-dessus les valeurs statiques (productCatalog.ts / productDetails.ts).
export interface PricingFormule {
  nom: string;
  cotisation: string;
  description: string;
  highlight?: boolean;
}
export interface PricingGarantie {
  risque: string;
  priseEnCharge: string;
  plafond: string;
  franchise: string;
}
export interface ProductPricing {
  premium?: number;
  frequency?: string;
  delaiCarence?: string;
  formules?: PricingFormule[];
  garanties?: PricingGarantie[];
  // Champs « offre » éditables / création d'offres depuis le back office.
  name?: string;
  shortName?: string;
  category?: "assurance" | "assistance";
  icon?: string;        // nom d'icône lucide (ex. "Shield")
  color?: string;       // couleur accent
  soft?: string;        // couleur douce (fond)
  image?: string;       // URL image
  desc?: string;        // description courte
  perks?: string[];     // points clés
  hidden?: boolean;     // masquer l'offre sur la plateforme
  added?: boolean;      // offre créée depuis l'admin (hors catalogue statique)
}
export type PricingMap = Record<string, ProductPricing>;

export interface AdminMember {
  id: string;
  email: string;
  name: string;
  phone: string;
  memberNumber: string;
  createdAt: string | null;
  suspended: boolean;
  activeContracts: number;
  pendingClaims: number;
  revenue: number;
  enrolledBy?: string | null;
  enrolledAt?: string | null;
  enrolledSource?: string | null;
}
