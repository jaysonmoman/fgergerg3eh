import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CURRENCIES = ["BTC", "ETH", "LTC", "XMR", "SOL", "DOGE", "BCH", "USDT"] as const;
const PAYOUT_KINDS = ["crypto", "fiat", "item"] as const;

const createSwapSchema = z.object({
  from_currency: z.enum(CURRENCIES),
  to_currency: z.string().min(2).max(32),
  from_amount: z.number().positive().max(1_000_000),
  destination_address: z.string().min(1).max(500),
  rate: z.number().positive().optional(),
  payout_kind: z.enum(PAYOUT_KINDS).default("crypto"),
  subject: z.string().max(280).optional(),
  payout_details: z.record(z.string(), z.unknown()).optional(),
});

// Demo deposit address — real implementation would derive a unique address
// from an HD wallet held in a multisig signing service. Operator can override
// via env var OPERATOR_LTC_ADDRESS / OPERATOR_BTC_ADDRESS / etc.
function getOperatorAddress(currency: string): string {
  const envKey = `OPERATOR_${currency}_ADDRESS`;
  return (
    process.env[envKey] ||
    `DEMO_${currency}_ESCROW_ADDRESS_REPLACE_VIA_OPERATOR_WALLET`
  );
}

export const createSwapRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSwapSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.payout_kind === "crypto" && data.from_currency === data.to_currency) {
      throw new Error("From and To currencies must differ");
    }

    const deposit_address = getOperatorAddress(data.from_currency);
    const to_amount = data.rate ? data.from_amount * data.rate : null;

    const { data: row, error } = await supabase
      .from("swap_requests")
      .insert({
        user_id: userId,
        swap_type: "user",
        from_currency: data.from_currency,
        to_currency: data.to_currency,
        from_amount: data.from_amount,
        to_amount,
        rate: data.rate ?? null,
        destination_address: data.destination_address,
        deposit_address,
        status: "pending_deposit",
        payout_kind: data.payout_kind,
        subject: data.subject ?? null,
        payout_details: (data.payout_details ?? null) as never,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { swap: row };
  });

// Owner edits the subject / payout_details on an active swap so the exchanger
// sees what the deposit is actually for (e.g. "iPhone 15 Pro · serial 123",
// "INR ₹40,000 via UPI bharatpe@okhdfc").
export const updateSwapSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      subject: z.string().max(280).optional(),
      payout_details: z.record(z.string(), z.unknown()).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = {};
    if (data.subject !== undefined) patch.subject = data.subject;
    if (data.payout_details !== undefined) patch.payout_details = data.payout_details;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabase
      .from("swap_requests")
      .update(patch as never)
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Owner cancels a pending_deposit swap before sending funds.
export const cancelSwap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("swap_requests")
      .update({ status: "expired" })
      .eq("id", data.id)
      .eq("user_id", userId)
      .eq("status", "pending_deposit")
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Swap can no longer be cancelled");
    return { swap: updated };
  });

// Public: last N completed swaps, anonymised, for the homepage ticker.
export const listRecentCompleted = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await supabaseAdmin
      .from("swap_requests")
      .select("from_currency,to_currency,from_amount,to_amount,created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(8);
    return { recent: data ?? [] };
  });

// User updates their own profile preferences (display_name + jsonb prefs blob).
export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      display_name: z.string().min(1).max(80).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = {};
    if (data.display_name !== undefined) patch.display_name = data.display_name;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabase
      .from("profiles")
      .update(patch as never)
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMySwaps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    // auto-expire stale pending
    await supabase
      .from("swap_requests")
      .update({ status: "expired" })
      .eq("status", "pending_deposit")
      .lt("expires_at", new Date().toISOString());

    const { data, error } = await supabase
      .from("swap_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { swaps: data ?? [] };
  });

export const getSwap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("swap_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Swap not found");
    return { swap: row };
  });

// User submits the deposit txid they sent — server records it and (best-effort)
// verifies on-chain via a public explorer for supported chains.
export const submitDepositTxid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), txid: z.string().min(8).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error: e1 } = await supabase
      .from("swap_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (e1 || !row) throw new Error("Swap not found");
    if (row.user_id !== userId) throw new Error("Not your swap");
    if (row.status !== "pending_deposit") throw new Error("Swap is not awaiting deposit");

    // Best-effort on-chain verification via Blockchair (no API key needed for light use)
    let verified = false;
    try {
      const chain =
        row.from_currency === "BTC"
          ? "bitcoin"
          : row.from_currency === "LTC"
            ? "litecoin"
            : row.from_currency === "DOGE"
              ? "dogecoin"
              : row.from_currency === "BCH"
                ? "bitcoin-cash"
                : row.from_currency === "ETH"
                  ? "ethereum"
                  : null;
      if (chain) {
        const r = await fetch(
          `https://api.blockchair.com/${chain}/dashboards/transaction/${encodeURIComponent(data.txid)}`,
        );
        if (r.ok) {
          const j = (await r.json()) as { data?: Record<string, unknown> };
          verified = !!j.data && Object.keys(j.data).length > 0;
        }
      }
    } catch (err) {
      console.error("on-chain verify failed", err);
    }

    const { data: updated, error } = await supabase
      .from("swap_requests")
      .update({
        deposit_txid: data.txid,
        status: verified ? "escrowed" : "pending_deposit",
        notes: verified ? null : "Deposit txid submitted, awaiting confirmations",
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { swap: updated, verified };
  });

// Exchanger claims an open swap from the order book
export const claimSwap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      exchanger_payout_address: z.string().min(8).max(200),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: hasRole } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "exchanger",
    });
    if (!hasRole) throw new Error("Exchanger role required");

    const { data: updated, error } = await supabase
      .from("swap_requests")
      .update({
        exchanger_id: userId,
        exchanger_payout_address: data.exchanger_payout_address,
        status: "claimed",
      })
      .eq("id", data.id)
      .in("status", ["escrowed", "admin_pending"])
      .is("exchanger_id", null)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Swap is no longer available");
    return { swap: updated };
  });

// Exchanger reports that they've sent payout to user; server verifies
export const submitPayoutTxid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), payout_txid: z.string().min(8).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error: e1 } = await supabase
      .from("swap_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (e1 || !row) throw new Error("Swap not found");
    if (row.exchanger_id !== userId) throw new Error("Not your claim");
    if (row.status !== "claimed") throw new Error("Swap not in claimed state");

    let verified = false;
    try {
      const chain =
        row.to_currency === "BTC"
          ? "bitcoin"
          : row.to_currency === "LTC"
            ? "litecoin"
            : row.to_currency === "DOGE"
              ? "dogecoin"
              : row.to_currency === "BCH"
                ? "bitcoin-cash"
                : row.to_currency === "ETH"
                  ? "ethereum"
                  : null;
      if (chain) {
        const r = await fetch(
          `https://api.blockchair.com/${chain}/dashboards/transaction/${encodeURIComponent(data.payout_txid)}`,
        );
        if (r.ok) {
          const j = (await r.json()) as { data?: Record<string, unknown> };
          verified = !!j.data && Object.keys(j.data).length > 0;
        }
      }
    } catch (err) {
      console.error("payout verify failed", err);
    }

    // Check the auto_payouts toggle to decide whether to auto-complete.
    let autoPayouts = false;
    try {
      const { data: setting } = await supabaseAdmin
        .from("app_settings")
        .select("value")
        .eq("key", "auto_payouts_enabled")
        .maybeSingle();
      autoPayouts = setting?.value === true;
    } catch (err) {
      console.error("auto_payouts read failed", err);
    }

    // Admin swaps always auto-complete. User swaps require either:
    //  - auto-payouts ON + verified payout, or
    //  - an admin clicking "Release Funds" (handled by adminReleaseFunds).
    const newStatus =
      row.swap_type === "admin"
        ? "completed"
        : verified && autoPayouts
          ? "completed"
          : "fulfilled";

    const { data: updated, error } = await supabase
      .from("swap_requests")
      .update({ payout_txid: data.payout_txid, status: newStatus })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { swap: updated, verified, autoPayouts };
  });

// Admin manually releases funds for a `fulfilled` swap (auto-payouts OFF path).
export const adminReleaseFunds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admin role required");
    const { data: updated, error } = await supabase
      .from("swap_requests")
      .update({ status: "completed" })
      .eq("id", data.id)
      .eq("status", "fulfilled")
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Swap is not in fulfilled state");
    return { swap: updated };
  });

// Admin freezes a swap into a disputed state — locks out user + exchanger writes.
export const adminDisputeSwap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admin role required");
    const { data: updated, error } = await supabase
      .from("swap_requests")
      .update({ status: "disputed" as never, notes: data.reason ?? "Frozen by admin pending arbitration" })
      .eq("id", data.id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Swap not found");
    return { swap: updated };
  });

// Admin resolves a disputed (or any) swap: refund | release | sweep
// - refund:  status -> refunded (user gets deposit back, off-chain action by operator)
// - release: status -> completed (exchanger gets paid, user got their leg)
// - sweep:   status -> completed, notes 'SWEPT' (operator pockets the escrow on confirmed fraud)
export const adminResolveSwap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      action: z.enum(["refund", "release", "sweep"]),
      note: z.string().max(500).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admin role required");
    const next =
      data.action === "refund" ? "refunded" :
      data.action === "release" ? "completed" :
      "completed";
    const noteTag =
      data.action === "sweep" ? `SWEPT by admin · ${data.note ?? "fraud confirmed"}` :
      data.action === "refund" ? `REFUNDED by admin · ${data.note ?? ""}` :
      `RELEASED by admin · ${data.note ?? ""}`;
    const { data: updated, error } = await supabase
      .from("swap_requests")
      .update({ status: next as never, notes: noteTag })
      .eq("id", data.id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Swap not found");
    return { swap: updated };
  });

// Admin-only app settings get/set
export const getAppSetting = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) =>
    z.object({ key: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admin role required");
    const { data: row } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", data.key)
      .maybeSingle();
    return { value: row?.value ?? null };
  });


export const setAppSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      key: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
      value: z.unknown(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admin role required");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({
        key: data.key,
        value: data.value as never,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin posts a swap without pre-depositing funds
export const adminPostSwap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      from_currency: z.enum(CURRENCIES),
      to_currency: z.enum(CURRENCIES),
      from_amount: z.number().positive(),
      to_amount: z.number().positive(),
      destination_address: z.string().min(8).max(200),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin role required");

    const { data: row, error } = await supabase
      .from("swap_requests")
      .insert({
        user_id: userId,
        swap_type: "admin",
        from_currency: data.from_currency,
        to_currency: data.to_currency,
        from_amount: data.from_amount,
        to_amount: data.to_amount,
        rate: data.to_amount / data.from_amount,
        destination_address: data.destination_address,
        status: "admin_pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { swap: row };
  });

// Order book for exchangers
export const listOrderbook = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isExchanger } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "exchanger",
    });
    if (!isExchanger) throw new Error("Exchanger role required");
    const { data, error } = await supabase
      .from("swap_requests")
      .select("*")
      .in("status", ["escrowed", "admin_pending", "claimed", "fulfilled"])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { swaps: data ?? [] };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { roles: (data ?? []).map((r) => r.role) };
  });

// Admin assigns a role to a user (used to bootstrap exchangers)
export const adminGrantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      email: z.string().email(),
      role: z.enum(["admin", "exchanger", "user"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin role required");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (!profile) throw new Error("No user with that email");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: profile.id, role: data.role }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Bootstrap: any signed-in user can claim the first admin slot if no admin exists.
// After the first admin exists, only admins can grant roles.
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Admin already exists");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
