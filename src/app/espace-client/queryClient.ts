import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const qk = {
  me: ["me"] as const,
  contracts: ["contracts"] as const,
  claims: ["claims"] as const,
  payments: ["payments"] as const,
  beneficiaries: ["beneficiaries"] as const,
  documents: ["documents"] as const,
  notifications: ["notifications"] as const,
  messages: ["messages"] as const,
  settings: ["settings"] as const,
  billing: ["billing"] as const,
  referral: ["referral"] as const,
  audit: ["audit"] as const,
  adminClaims: ["admin", "claims"] as const,
  adminStats: ["admin", "stats"] as const,
  adminMembers: ["admin", "members"] as const,
  adminMember: (uid: string) => ["admin", "member", uid] as const,
  adminContracts: ["admin", "contracts"] as const,
  adminPayments: ["admin", "payments"] as const,
  adminAuditRecent: ["admin", "audit", "recent"] as const,
};

// Tunable cache windows per resource (in ms). Refs of truth change rarely;
// chat-like resources need to feel live.
export const cacheConfig = {
  longLived: { staleTime: 5 * 60_000, gcTime: 30 * 60_000 },
  live: { staleTime: 15_000, gcTime: 5 * 60_000 },
} as const;
