import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin",
};

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildRejectEmailHtml({
  recipientName,
  tutorName,
  reason,
}: {
  recipientName: string;
  tutorName: string;
  reason: string | null;
}) {
  const safeRecipient = escapeHtml(recipientName);
  const safeTutor = escapeHtml(tutorName);
  const safeReason = reason ? escapeHtml(reason) : null;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#7C3AED,#6D28D9);padding:32px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">Your-Tutor</h1>
    <p style="color:#e2d6f8;margin:8px 0 0;font-size:14px;">Learn from anywhere</p>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:20px;">Demo Request Update</h2>
    <p style="color:#4a4a68;font-size:15px;line-height:1.6;">Hi ${safeRecipient},</p>
    <p style="color:#4a4a68;font-size:15px;line-height:1.6;">Unfortunately, ${safeTutor} was unable to accept your demo request at this time.</p>
    ${safeReason ? `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border-radius:8px;margin:24px 0;padding:20px;">
      <tr><td style="padding:8px 20px;"><span style="color:#dc2626;font-weight:bold;">Reason</span><br><span style="color:#1a1a2e;">${safeReason}</span></td></tr>
    </table>` : ""}
    <p style="color:#4a4a68;font-size:14px;">Don't worry — there are many other great tutors available!</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 0;">
      <a href="https://yourtutorishere.lovable.app/dashboard/student/find-tutors" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">🔍 Find Another Tutor</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f4f4f7;padding:24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">© Your-Tutor — Connecting students with expert tutors across Pakistan</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { booking_id, reason } = body;

    // Validate
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "Missing required field: booking_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isValidUUID(booking_id)) {
      return new Response(JSON.stringify({ error: "Invalid booking_id format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedReason = reason
      ? String(reason).replace(/<[^>]*>/g, "").trim().slice(0, 500)
      : null;

    // Fetch booking
    const { data: booking, error: bookingErr } = await adminClient
      .from("demo_bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is the tutor
    if (booking.tutor_id !== userId) {
      return new Response(JSON.stringify({ error: "Only the tutor can reject this request" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify status is pending
    if (booking.status !== "pending") {
      return new Response(JSON.stringify({ error: "This booking is not in pending status" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update booking
    const { error: updateErr } = await adminClient
      .from("demo_bookings")
      .update({
        status: "rejected",
        rejected_reason: sanitizedReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking_id);

    if (updateErr) throw updateErr;

    // Fetch profiles
    const [studentRes, tutorRes] = await Promise.all([
      adminClient.from("profiles").select("first_name, last_name, email").eq("user_id", booking.student_id).single(),
      adminClient.from("profiles").select("first_name, last_name, email").eq("user_id", userId).single(),
    ]);

    const studentName = studentRes.data ? `${studentRes.data.first_name} ${studentRes.data.last_name}`.trim() : "Student";
    const tutorName = tutorRes.data ? `${tutorRes.data.first_name} ${tutorRes.data.last_name}`.trim() : "Tutor";

    // Notifications
    await Promise.allSettled([
      adminClient.from("notifications").insert({
        user_id: booking.student_id,
        type: "demo_rejected",
        title: "Demo Request Update",
        message: `${tutorName} was unable to accept your demo request.${sanitizedReason ? ` Reason: ${sanitizedReason}` : ""} Find another tutor to continue learning!`,
        related_booking_id: booking_id,
        action_url: "/dashboard/student/find-tutors",
      }),
    ]);

    // Email to student
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && studentRes.data?.email) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Your-Tutor <onboarding@resend.dev>",
          to: studentRes.data.email,
          subject: "Demo Request Update — Your-Tutor",
          html: buildRejectEmailHtml({
            recipientName: studentName,
            tutorName,
            reason: sanitizedReason,
          }),
        }),
      }).catch(() => {});
    }

    return new Response(JSON.stringify({
      success: true,
      booking_id,
      status: "rejected",
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("reject-demo error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
