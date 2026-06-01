import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Periodic sweep: mark pending_deposit swaps past expires_at as expired.
// Called by pg_cron with the project anon key in the `apikey` header.
export const Route = createFileRoute("/api/public/hooks/expire-swaps")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? request.headers.get("x-cron-key");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
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

