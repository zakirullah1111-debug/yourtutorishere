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

function buildRequestEmailHtml({
  recipientName,
  mainMessage,
  studentName,
  requestMessage,
  ctaUrl,
  ctaLabel,
  footerNote,
}: {
  recipientName: string;
  mainMessage: string;
  studentName: string;
  requestMessage: string | null;
  ctaUrl: string;
  ctaLabel: string;
  footerNote: string;
}) {
  const safeRecipient = escapeHtml(recipientName);
  const safeStudent = escapeHtml(studentName);
  const safeMessage = requestMessage ? escapeHtml(requestMessage) : null;

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
    <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:20px;">📩 ${mainMessage}</h2>
    <p style="color:#4a4a68;font-size:15px;line-height:1.6;">Hi ${safeRecipient},</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f6ff;border-radius:8px;margin:24px 0;padding:20px;">
      <tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">🎓 Student</span><br><span style="color:#1a1a2e;">${safeStudent}</span></td></tr>
      ${safeMessage ? `<tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">💬 Message</span><br><span style="color:#1a1a2e;">${safeMessage}</span></td></tr>` : ""}
    </table>
    <p style="color:#4a4a68;font-size:14px;">${footerNote}</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 0;">
      <a href="https://yourtutorishere.lovable.app${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">${ctaLabel}</a>
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
    const { tutor_id, message } = body;

    // Validate
    if (!tutor_id) {
      return new Response(JSON.stringify({ error: "Missing required field: tutor_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isValidUUID(tutor_id)) {
      return new Response(JSON.stringify({ error: "Invalid tutor_id format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (tutor_id === userId) {
      return new Response(JSON.stringify({ error: "Cannot request a demo with yourself" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize message
    const sanitizedMessage = message
      ? String(message).replace(/<[^>]*>/g, "").trim().slice(0, 1000)
      : null;

    // Check no existing pending/confirmed booking between these users
    const { data: existing } = await adminClient
      .from("demo_bookings")
      .select("id, status")
      .eq("student_id", userId)
      .eq("tutor_id", tutor_id)
      .in("status", ["pending", "confirmed"]);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({
        error: "duplicate_request",
        message: "You already have a pending or confirmed session with this tutor.",
      }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profiles
    const [studentRes, tutorRes] = await Promise.all([
      adminClient.from("profiles").select("first_name, last_name, email").eq("user_id", userId).single(),
      adminClient.from("profiles").select("first_name, last_name, email").eq("user_id", tutor_id).single(),
    ]);

    if (!studentRes.data) {
      return new Response(JSON.stringify({ error: "Student profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!tutorRes.data) {
      return new Response(JSON.stringify({ error: "Tutor not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const studentName = `${studentRes.data.first_name} ${studentRes.data.last_name}`.trim();
    const tutorName = `${tutorRes.data.first_name} ${tutorRes.data.last_name}`.trim();

    // Insert booking with status='pending', no date/time/url
    // We need placeholder values for required NOT NULL columns
    const { data: booking, error: bookingErr } = await adminClient
      .from("demo_bookings")
      .insert({
        student_id: userId,
        tutor_id: tutor_id,
        status: "pending",
        request_message: sanitizedMessage,
        // Placeholder values for NOT NULL columns - will be set on approval
        scheduled_date: "1970-01-01",
        scheduled_time: "00:00:00",
        end_time: "00:30:00",
        meeting_room_id: "pending",
        meeting_url: "pending",
      })
      .select("id")
      .single();

    if (bookingErr) throw bookingErr;

    // Notifications
    await Promise.allSettled([
      adminClient.from("notifications").insert({
        user_id: tutor_id,
        type: "demo_requested",
        title: "New Demo Request! 📩",
        message: `${studentName} has requested a free demo session with you.`,
        related_booking_id: booking.id,
        action_url: "/dashboard/tutor/bookings",
      }),
      adminClient.from("notifications").insert({
        user_id: userId,
        type: "request_sent",
        title: "Demo Request Sent! ✅",
        message: `Your demo request has been sent to ${tutorName}. You'll be notified when they respond.`,
        related_booking_id: booking.id,
        action_url: "/dashboard/student/bookings",
      }),
    ]);

    // Emails
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      Promise.allSettled([
        tutorRes.data.email ? fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Your-Tutor <onboarding@resend.dev>",
            to: tutorRes.data.email,
            subject: "📩 New Demo Request — Your-Tutor",
            html: buildRequestEmailHtml({
              recipientName: tutorName,
              mainMessage: "New Demo Request!",
              studentName,
              requestMessage: sanitizedMessage,
              ctaUrl: "/dashboard/tutor/bookings",
              ctaLabel: "Review Request",
              footerNote: "Please review and respond to this request at your earliest convenience.",
            }),
          }),
        }).catch(() => {}) : Promise.resolve(),
        studentRes.data.email ? fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Your-Tutor <onboarding@resend.dev>",
            to: studentRes.data.email,
            subject: "✅ Demo Request Sent — Your-Tutor",
            html: buildRequestEmailHtml({
              recipientName: studentName,
              mainMessage: "Request Sent!",
              studentName: tutorName,
              requestMessage: sanitizedMessage,
              ctaUrl: "/dashboard/student/bookings",
              ctaLabel: "View My Sessions",
              footerNote: `Your demo request has been sent to ${escapeHtml(tutorName)}. You'll receive a notification once they respond.`,
            }),
          }),
        }).catch(() => {}) : Promise.resolve(),
      ]);
    }

    return new Response(JSON.stringify({
      success: true,
      booking_id: booking.id,
      status: "pending",
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("request-demo error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
