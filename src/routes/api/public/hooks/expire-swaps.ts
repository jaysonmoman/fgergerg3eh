import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Periodic sweep: mark pending_deposit swaps past expires_at as expired.
// Called by pg_cron. No auth required (public hook, idempotent, no PII).
export const Route = createFileRoute("/api/public/hooks/expire-swaps")({
  server: {
    handlers: {
      POST: async () => {
        const { data, error } = await supabaseAdmin
          .from("swap_requests")
          .update({ status: "expired" })
          .eq("status", "pending_deposit")
          .lt("expires_at", new Date().toISOString())
          .select("id");
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        return Response.json({ ok: true, expired: data?.length ?? 0 });
      },
    },
  },
});
