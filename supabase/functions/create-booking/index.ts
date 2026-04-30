import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin",
};

/* ── helpers ──────────────────────────────────────────── */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${Math.floor(total / 60) % 24}`.padStart(2, "0") + ":" + `${total % 60}`.padStart(2, "0") + ":00";
}

function isValidUUID(s: string)  { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s); }
function isValidDate(s: string)  { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)); }
function isValidTime(s: string)  { return /^\d{2}:\d{2}(:\d{2})?$/.test(s); }
function esc(s: string)          { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function buildEmail({
  recipientName, mainMessage, formattedDate, formattedTime, formattedEndTime,
  otherPartyName, otherPartyRole, meetingUrl, dashboardUrl, dashboardLabel, noteText,
}: {
  recipientName: string; mainMessage: string; formattedDate: string;
  formattedTime: string; formattedEndTime: string; otherPartyName: string;
  otherPartyRole: string; meetingUrl: string; dashboardUrl: string;
  dashboardLabel: string; noteText: string;
}) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#7C3AED,#6D28D9);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">⚡ Studypulse</h1>
    <p style="color:#e2d6f8;margin:6px 0 0;font-size:13px;">Pakistan's smartest tutoring platform</p>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:20px;">Session Confirmed! 🎉</h2>
    <p style="color:#4a4a68;font-size:15px;line-height:1.6;">Hi ${esc(recipientName)}, ${mainMessage}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6ff;border-radius:12px;margin:24px 0;padding:20px;">
      <tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">📅 Date</span><br><span style="color:#1a1a2e;">${formattedDate}</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">⏰ Time</span><br><span style="color:#1a1a2e;">${formattedTime} – ${formattedEndTime} (PKT)</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">${otherPartyRole}</span><br><span style="color:#1a1a2e;">${esc(otherPartyName)}</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">⏱ Duration</span><br><span style="color:#1a1a2e;">30 minutes</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">💰 Cost</span><br><span style="color:#1a1a2e;font-weight:bold;color:#16a34a;">Free Demo ✓</span></td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0;">
      <a href="${meetingUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:bold;font-size:16px;">🎥 Join Video Session</a>
    </td></tr></table>
    <div style="background:#fff8e1;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="color:#b8860b;font-size:13px;margin:0;">⚠️ ${noteText}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0;">
      <a href="https://studypulse.pk${dashboardUrl}" style="display:inline-block;border:2px solid #7C3AED;color:#7C3AED;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:bold;font-size:14px;">${dashboardLabel}</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#f4f4f7;padding:24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">© Studypulse — Pakistan's smartest tutoring platform<br>
    Questions? <a href="mailto:hello@studypulse.pk" style="color:#7C3AED;">hello@studypulse.pk</a><br><br>
    If you didn't book this session, please contact us immediately.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/* ── main handler ─────────────────────────────────────── */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    /* auth */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient  = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    /* parse body */
    const body = await req.json();
    const { tutor_id, scheduled_date, scheduled_time } = body;

    /* validate */
    if (!tutor_id || !scheduled_date || !scheduled_time) {
      return new Response(JSON.stringify({ error: "Missing required fields: tutor_id, scheduled_date, scheduled_time" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!isValidUUID(tutor_id))        return new Response(JSON.stringify({ error: "Invalid tutor_id format" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!isValidDate(scheduled_date))  return new Response(JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!isValidTime(scheduled_time))  return new Response(JSON.stringify({ error: "Invalid time format. Use HH:MM" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (tutor_id === userId)           return new Response(JSON.stringify({ error: "Cannot book a session with yourself" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const bookingDt = new Date(`${scheduled_date}T${scheduled_time}`);
    if (bookingDt < new Date()) {
      return new Response(JSON.stringify({ error: "Cannot book a session in the past" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    /* ── DEMO LIMIT CHECK (max 3 per student, platform-wide) ── */
    const { count: demoCount, error: countErr } = await adminClient
      .from("demo_bookings")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .in("status", ["confirmed", "completed", "pending"]);

    if (countErr) throw countErr;

    if ((demoCount ?? 0) >= 3) {
      return new Response(
        JSON.stringify({
          error: "demo_limit_reached",
          message: "You've used all 3 free demo sessions. Please enroll in a paid course to continue learning.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /* fetch tutor + student profiles */
    const [{ data: tutor }, { data: student }] = await Promise.all([
      adminClient.from("profiles").select("first_name,last_name,email").eq("user_id", tutor_id).single(),
      adminClient.from("profiles").select("first_name,last_name,email").eq("user_id", userId).single(),
    ]);

    if (!tutor)   return new Response(JSON.stringify({ error: "Tutor not found" }),   { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!student) return new Response(JSON.stringify({ error: "Student not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const tutorName   = `${tutor.first_name} ${tutor.last_name}`.trim();
    const studentName = `${student.first_name} ${student.last_name}`.trim();

    /* check slot not already taken */
    const { data: existing } = await adminClient
      .from("demo_bookings")
      .select("id")
      .eq("tutor_id", tutor_id)
      .eq("scheduled_date", scheduled_date)
      .eq("scheduled_time", scheduled_time + ":00")
      .eq("status", "confirmed")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "slot_taken", message: "This slot was just booked. Please choose another time." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /* create room + booking */
    const roomId     = `studypulse-${crypto.randomUUID()}`;
    const meetingUrl = `https://meet.jit.si/${roomId}`;
    const endTime    = addMinutes(scheduled_time, 30);

    const { data: booking, error: bookingErr } = await adminClient
      .from("demo_bookings")
      .insert({
        student_id: userId, tutor_id,
        scheduled_date,
        scheduled_time: scheduled_time + ":00",
        end_time: endTime,
        status: "confirmed",
        meeting_room_id: roomId,
        meeting_url: meetingUrl,
      })
      .select("id")
      .single();

    if (bookingErr) {
      if (bookingErr.message?.includes("no_double_booking") || bookingErr.code === "23505") {
        return new Response(
          JSON.stringify({ error: "slot_taken", message: "This slot was just booked. Please choose another time." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw bookingErr;
    }

    /* format display values */
    const formattedDate    = formatDate(scheduled_date);
    const formattedTime    = formatTime(scheduled_time);
    const formattedEndTime = formatTime(endTime.slice(0, 5));

    /* remaining demos for student */
    const demosRemaining = Math.max(0, 3 - ((demoCount ?? 0) + 1));

    /* notifications (non-blocking) */
    await Promise.allSettled([
      adminClient.from("notifications").insert({
        user_id: userId, type: "booking_confirmed",
        title: "Demo Session Confirmed! 🎉",
        message: `Your session with ${tutorName} on ${formattedDate} at ${formattedTime} is confirmed.${demosRemaining > 0 ? ` You have ${demosRemaining} free demo${demosRemaining > 1 ? "s" : ""} remaining.` : " This was your last free demo."}`,
        related_booking_id: booking.id,
        action_url: "/dashboard/student/bookings",
      }),
      adminClient.from("notifications").insert({
        user_id: tutor_id, type: "booking_confirmed",
        title: "New Demo Session Booked! 📅",
        message: `${studentName} booked a demo on ${formattedDate} at ${formattedTime}.`,
        related_booking_id: booking.id,
        action_url: "/dashboard/tutor/bookings",
      }),
    ]);

    /* emails (non-blocking) */
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      Promise.allSettled([
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Studypulse <hello@studypulse.pk>",
            to: student.email,
            subject: "✅ Demo Session Confirmed — Studypulse",
            html: buildEmail({
              recipientName: studentName,
              mainMessage: "your demo session has been successfully booked.",
              formattedDate, formattedTime, formattedEndTime,
              otherPartyName: tutorName, otherPartyRole: "👨‍🏫 Tutor",
              meetingUrl,
              dashboardUrl: "/dashboard/student/bookings",
              dashboardLabel: "View My Sessions",
              noteText: `The Join button activates 15 minutes before your session. ${demosRemaining > 0 ? `You have ${demosRemaining} free demo${demosRemaining > 1 ? "s" : ""} remaining.` : "This was your last free demo — consider enrolling in a course!"}`,
            }),
          }),
        }).catch(() => {}),
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Studypulse <hello@studypulse.pk>",
            to: tutor.email,
            subject: "📅 New Demo Session Booked — Studypulse",
            html: buildEmail({
              recipientName: tutorName,
              mainMessage: `${studentName} has booked a demo session with you.`,
              formattedDate, formattedTime, formattedEndTime,
              otherPartyName: studentName, otherPartyRole: "🎓 Student",
              meetingUrl,
              dashboardUrl: "/dashboard/tutor/bookings",
              dashboardLabel: "View My Schedule",
              noteText: "Be ready 5 minutes before your session starts.",
            }),
          }),
        }).catch(() => {}),
      ]);
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        meeting_url: meetingUrl,
        status: "confirmed",
        demos_remaining: demosRemaining,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("create-booking error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
