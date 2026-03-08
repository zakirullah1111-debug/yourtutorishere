import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin",
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
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

    // Find confirmed bookings where session time has arrived and link not yet sent
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 8);

    // Get bookings where user is student or tutor, confirmed, not link-sent, and session time has arrived
    const { data: bookings } = await adminClient
      .from("demo_bookings")
      .select("id, student_id, tutor_id, scheduled_date, scheduled_time, end_time, meeting_url, session_link_sent")
      .eq("status", "confirmed")
      .eq("session_link_sent", false)
      .or(`student_id.eq.${userId},tutor_id.eq.${userId}`);

    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ sent: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter to bookings where session time has arrived (within 15 min window)
    const readyBookings = bookings.filter(b => {
      if (b.scheduled_date > todayStr) return false;
      if (b.scheduled_date < todayStr) return true; // past date, should have been sent
      // Same day — check if scheduled_time <= currentTime + 15min buffer
      const [h, m] = b.scheduled_time.split(":").map(Number);
      const sessionMins = h * 60 + m;
      const [nowH, nowM] = currentTime.split(":").map(Number);
      const nowMins = nowH * 60 + nowM;
      return nowMins >= sessionMins - 15; // 15 min before session
    });

    if (readyBookings.length === 0) {
      return new Response(JSON.stringify({ sent: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sentIds: string[] = [];
    const resendKey = Deno.env.get("RESEND_API_KEY");

    for (const b of readyBookings) {
      // Mark as sent first to prevent duplicates
      await adminClient
        .from("demo_bookings")
        .update({ session_link_sent: true })
        .eq("id", b.id);

      // Get profiles
      const [studentRes, tutorRes] = await Promise.all([
        adminClient.from("profiles").select("first_name, last_name, email").eq("user_id", b.student_id).single(),
        adminClient.from("profiles").select("first_name, last_name, email").eq("user_id", b.tutor_id).single(),
      ]);

      const studentName = studentRes.data ? `${studentRes.data.first_name} ${studentRes.data.last_name}`.trim() : "Student";
      const tutorName = tutorRes.data ? `${tutorRes.data.first_name} ${tutorRes.data.last_name}`.trim() : "Tutor";

      const formatTime12 = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
      };

      // In-app notifications with meeting URL
      await Promise.allSettled([
        adminClient.from("notifications").insert({
          user_id: b.student_id,
          type: "session_starting",
          title: "Your Demo Session is Starting! 🎥",
          message: `Your demo session with ${escapeHtml(tutorName)} is starting now. Click to join!`,
          related_booking_id: b.id,
          action_url: b.meeting_url,
        }),
        adminClient.from("notifications").insert({
          user_id: b.tutor_id,
          type: "session_starting",
          title: "Demo Session Starting! 🎥",
          message: `Your demo session with ${escapeHtml(studentName)} is starting now. Click to join!`,
          related_booking_id: b.id,
          action_url: b.meeting_url,
        }),
      ]);

      // Emails with meeting link
      if (resendKey) {
        const emailHtml = (recipientName: string, otherName: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#7C3AED,#6D28D9);padding:32px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">Your-Tutor</h1>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:20px;">🎥 Your Session is Starting!</h2>
    <p style="color:#4a4a68;font-size:15px;">Hi ${escapeHtml(recipientName)},</p>
    <p style="color:#4a4a68;font-size:15px;">Your demo session with ${escapeHtml(otherName)} is ready. Click below to join:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 0;">
      <a href="${b.meeting_url}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;font-size:18px;">🚀 Join Now</a>
    </td></tr></table>
    <p style="color:#999;font-size:12px;">Session time: ${formatTime12(b.scheduled_time)} PKT</p>
  </td></tr>
  <tr><td style="background-color:#f4f4f7;padding:24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">© Your-Tutor</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

        await Promise.allSettled([
          studentRes.data?.email ? fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Your-Tutor <onboarding@resend.dev>",
              to: studentRes.data.email,
              subject: "🎥 Your Demo Session is Starting — Join Now!",
              html: emailHtml(studentName, tutorName),
            }),
          }).catch(() => {}) : Promise.resolve(),
          tutorRes.data?.email ? fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Your-Tutor <onboarding@resend.dev>",
              to: tutorRes.data.email,
              subject: "🎥 Demo Session Starting — Join Now!",
              html: emailHtml(tutorName, studentName),
            }),
          }).catch(() => {}) : Promise.resolve(),
        ]);
      }

      sentIds.push(b.id);
    }

    return new Response(JSON.stringify({ sent: sentIds }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-session-link error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
