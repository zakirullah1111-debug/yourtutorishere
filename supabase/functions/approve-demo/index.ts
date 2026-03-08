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

function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

function isValidTime(str: string): boolean {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(str);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMins = h * 60 + m + mins;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}:00`;
}

function buildApproveEmailHtml({
  recipientName,
  mainMessage,
  formattedDate,
  formattedTime,
  formattedEndTime,
  otherPartyName,
  otherPartyRole,
  ctaUrl,
  ctaLabel,
  footerNote,
}: {
  recipientName: string;
  mainMessage: string;
  formattedDate: string;
  formattedTime: string;
  formattedEndTime: string;
  otherPartyName: string;
  otherPartyRole: string;
  ctaUrl: string;
  ctaLabel: string;
  footerNote: string;
}) {
  const safeRecipient = escapeHtml(recipientName);
  const safeOtherParty = escapeHtml(otherPartyName);

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
    <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:20px;">${mainMessage}</h2>
    <p style="color:#4a4a68;font-size:15px;line-height:1.6;">Hi ${safeRecipient},</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border-radius:8px;margin:24px 0;padding:20px;">
      <tr><td style="padding:8px 20px;"><span style="color:#16a34a;font-weight:bold;">📅 Date</span><br><span style="color:#1a1a2e;">${formattedDate}</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#16a34a;font-weight:bold;">⏰ Time</span><br><span style="color:#1a1a2e;">${formattedTime} – ${formattedEndTime} (PKT)</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#16a34a;font-weight:bold;">${otherPartyRole}</span><br><span style="color:#1a1a2e;">${safeOtherParty}</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#16a34a;font-weight:bold;">⏱ Duration</span><br><span style="color:#1a1a2e;">30 minutes</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#16a34a;font-weight:bold;">💰 Cost</span><br><span style="color:#1a1a2e;">Free</span></td></tr>
    </table>
    <div style="background-color:#fff8e1;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#b8860b;font-size:13px;margin:0;">⚠️ ${footerNote}</p>
    </div>
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
    const { booking_id, scheduled_date, scheduled_time } = body;

    // Validate inputs
    if (!booking_id || !scheduled_date || !scheduled_time) {
      return new Response(JSON.stringify({ error: "Missing required fields: booking_id, scheduled_date, scheduled_time" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isValidUUID(booking_id)) {
      return new Response(JSON.stringify({ error: "Invalid booking_id format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isValidDate(scheduled_date)) {
      return new Response(JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isValidTime(scheduled_time)) {
      return new Response(JSON.stringify({ error: "Invalid time format. Use HH:MM" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent approving in the past
    const bookingDate = new Date(`${scheduled_date}T${scheduled_time}`);
    if (bookingDate < new Date()) {
      return new Response(JSON.stringify({ error: "Cannot schedule a session in the past" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      return new Response(JSON.stringify({ error: "Only the tutor can approve this request" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify status is pending
    if (booking.status !== "pending") {
      return new Response(JSON.stringify({ error: "This booking is not in pending status" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check slot not already booked
    const timeWithSeconds = scheduled_time.length === 5 ? scheduled_time + ":00" : scheduled_time;
    const { data: slotConflict } = await adminClient
      .from("demo_bookings")
      .select("id")
      .eq("tutor_id", userId)
      .eq("scheduled_date", scheduled_date)
      .eq("scheduled_time", timeWithSeconds)
      .eq("status", "confirmed")
      .maybeSingle();

    if (slotConflict) {
      return new Response(JSON.stringify({
        error: "slot_taken",
        message: "This time slot is already booked. Please choose another time.",
      }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate Jitsi room
    const roomId = `yoututor-${crypto.randomUUID()}`;
    const meetingUrl = `https://meet.jit.si/${roomId}`;
    const endTime = addMinutes(scheduled_time, 30);

    // Update booking
    const { error: updateErr } = await adminClient
      .from("demo_bookings")
      .update({
        status: "confirmed",
        scheduled_date,
        scheduled_time: timeWithSeconds,
        end_time: endTime,
        meeting_room_id: roomId,
        meeting_url: meetingUrl,
        tutor_approved_at: new Date().toISOString(),
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

    const formattedDate = formatDate(scheduled_date);
    const formattedTime = formatTime(scheduled_time);
    const formattedEndTime = formatTime(endTime.slice(0, 5));

    // Notifications
    await Promise.allSettled([
      adminClient.from("notifications").insert({
        user_id: booking.student_id,
        type: "demo_approved",
        title: "Demo Approved! 🎉",
        message: `Your demo with ${tutorName} is confirmed for ${formattedDate} at ${formattedTime}! Session link will arrive at session time.`,
        related_booking_id: booking_id,
        action_url: "/dashboard/student/bookings",
      }),
      adminClient.from("notifications").insert({
        user_id: userId,
        type: "demo_approved",
        title: "Session Confirmed! ✅",
        message: `Demo with ${studentName} confirmed for ${formattedDate} at ${formattedTime}.`,
        related_booking_id: booking_id,
        action_url: "/dashboard/tutor/bookings",
      }),
    ]);

    // Emails (DO NOT send meeting_url)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      Promise.allSettled([
        studentRes.data?.email ? fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Your-Tutor <onboarding@resend.dev>",
            to: studentRes.data.email,
            subject: "✅ Demo Approved — Your-Tutor",
            html: buildApproveEmailHtml({
              recipientName: studentName,
              mainMessage: "Demo Approved! 🎉",
              formattedDate, formattedTime, formattedEndTime,
              otherPartyName: tutorName, otherPartyRole: "👨‍🏫 Tutor",
              ctaUrl: "/dashboard/student/bookings",
              ctaLabel: "View My Sessions",
              footerNote: "Session link will arrive at session time. The Join button activates 15 minutes before your session.",
            }),
          }),
        }).catch(() => {}) : Promise.resolve(),
        tutorRes.data?.email ? fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Your-Tutor <onboarding@resend.dev>",
            to: tutorRes.data.email,
            subject: "📅 Session Confirmed — Your-Tutor",
            html: buildApproveEmailHtml({
              recipientName: tutorName,
              mainMessage: "Session Confirmed! ✅",
              formattedDate, formattedTime, formattedEndTime,
              otherPartyName: studentName, otherPartyRole: "🎓 Student",
              ctaUrl: "/dashboard/tutor/bookings",
              ctaLabel: "View My Schedule",
              footerNote: "Be ready 5 minutes before your session starts.",
            }),
          }),
        }).catch(() => {}) : Promise.resolve(),
      ]);
    }

    return new Response(JSON.stringify({
      success: true,
      booking_id,
      status: "confirmed",
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("approve-demo error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
