import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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

function buildEmailHtml({
  recipientName,
  mainMessage,
  formattedDate,
  formattedTime,
  formattedEndTime,
  otherPartyName,
  otherPartyRole,
  meetingUrl,
  dashboardUrl,
  dashboardLabel,
  noteText,
}: {
  recipientName: string;
  mainMessage: string;
  formattedDate: string;
  formattedTime: string;
  formattedEndTime: string;
  otherPartyName: string;
  otherPartyRole: string;
  meetingUrl: string;
  dashboardUrl: string;
  dashboardLabel: string;
  noteText: string;
}) {
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
    <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:20px;">Session Confirmed! 🎉</h2>
    <p style="color:#4a4a68;font-size:15px;line-height:1.6;">Hi ${recipientName}, ${mainMessage}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f6ff;border-radius:8px;margin:24px 0;padding:20px;">
      <tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">📅 Date</span><br><span style="color:#1a1a2e;">${formattedDate}</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">⏰ Time</span><br><span style="color:#1a1a2e;">${formattedTime} – ${formattedEndTime} (PKT)</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">${otherPartyRole}</span><br><span style="color:#1a1a2e;">${otherPartyName}</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">⏱ Duration</span><br><span style="color:#1a1a2e;">30 minutes</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#7C3AED;font-weight:bold;">💰 Cost</span><br><span style="color:#1a1a2e;">Free</span></td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0;">
      <a href="${meetingUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">🎥 Join Video Session</a>
    </td></tr></table>
    <div style="background-color:#fff8e1;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#b8860b;font-size:13px;margin:0;">⚠️ ${noteText}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0;">
      <a href="https://yourtutorishere.lovable.app${dashboardUrl}" style="display:inline-block;border:2px solid #7C3AED;color:#7C3AED;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:14px;">${dashboardLabel}</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f4f4f7;padding:24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">© Your-Tutor — Connecting students with expert tutors across Pakistan<br>If you didn't book this session, please contact us immediately.</p>
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
    // Step 1 — Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Service role client for cross-user inserts
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { tutor_id, scheduled_date, scheduled_time } = await req.json();

    // Step 2 — Fetch tutor data
    const { data: tutor, error: tutorErr } = await adminClient
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("user_id", tutor_id)
      .single();

    if (tutorErr || !tutor) {
      return new Response(JSON.stringify({ error: "Tutor not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tutorName = `${tutor.first_name} ${tutor.last_name}`.trim();

    // Step 3 — Fetch student data
    const { data: student, error: studentErr } = await adminClient
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("user_id", userId)
      .single();

    if (studentErr || !student) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const studentName = `${student.first_name} ${student.last_name}`.trim();

    // Step 4 — Check slot availability
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
        JSON.stringify({
          error: "slot_taken",
          message: "This slot was just booked by someone else. Please choose another time.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 5 — Generate meeting room
    const roomId = `yoututor-${crypto.randomUUID()}`;
    const meetingUrl = `https://meet.jit.si/${roomId}`;

    // Step 6 — Calculate end time
    const endTime = addMinutes(scheduled_time, 30);

    // Step 7 — Insert booking
    const { data: booking, error: bookingErr } = await adminClient
      .from("demo_bookings")
      .insert({
        student_id: userId,
        tutor_id: tutor_id,
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
          JSON.stringify({
            error: "slot_taken",
            message: "This slot was just booked by someone else. Please choose another time.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw bookingErr;
    }

    // Step 8 — Format display values
    const formattedDate = formatDate(scheduled_date);
    const formattedTime = formatTime(scheduled_time);
    const formattedEndTime = formatTime(endTime.slice(0, 5));

    // Step 9 — Notification for student
    await adminClient.from("notifications").insert({
      user_id: userId,
      type: "booking_confirmed",
      title: "Demo Session Confirmed! 🎉",
      message: `Your session with ${tutorName} on ${formattedDate} at ${formattedTime} is confirmed.`,
      related_booking_id: booking.id,
      action_url: "/dashboard/student/bookings",
    });

    // Step 10 — Notification for tutor
    await adminClient.from("notifications").insert({
      user_id: tutor_id,
      type: "booking_confirmed",
      title: "New Session Booked! 📅",
      message: `${studentName} booked a demo on ${formattedDate} at ${formattedTime}.`,
      related_booking_id: booking.id,
      action_url: "/dashboard/tutor/bookings",
    });

    // Step 11 — Email to student
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Your-Tutor <onboarding@resend.dev>",
            to: student.email,
            subject: "✅ Demo Session Confirmed — Your-Tutor",
            html: buildEmailHtml({
              recipientName: studentName,
              mainMessage: "your demo session has been successfully booked.",
              formattedDate,
              formattedTime,
              formattedEndTime,
              otherPartyName: tutorName,
              otherPartyRole: "👨‍🏫 Tutor",
              meetingUrl,
              dashboardUrl: "/dashboard/student/bookings",
              dashboardLabel: "View My Sessions",
              noteText:
                "The Join button activates 15 minutes before your session. You can also find this link anytime in your dashboard under My Sessions.",
            }),
          }),
        });
      } catch (e) {
        console.error("Failed to send student email:", e);
      }
    }

    // Step 12 — Email to tutor
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Your-Tutor <onboarding@resend.dev>",
            to: tutor.email,
            subject: "📅 New Demo Session Booked — Your-Tutor",
            html: buildEmailHtml({
              recipientName: tutorName,
              mainMessage: `${studentName} has booked a demo session with you.`,
              formattedDate,
              formattedTime,
              formattedEndTime,
              otherPartyName: studentName,
              otherPartyRole: "🎓 Student",
              meetingUrl,
              dashboardUrl: "/dashboard/tutor/bookings",
              dashboardLabel: "View My Schedule",
              noteText: "Be ready 5 minutes before your session starts.",
            }),
          }),
        });
      } catch (e) {
        console.error("Failed to send tutor email:", e);
      }
    }

    // Step 13 — Return success
    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        meeting_url: meetingUrl,
        status: "confirmed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-booking error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
