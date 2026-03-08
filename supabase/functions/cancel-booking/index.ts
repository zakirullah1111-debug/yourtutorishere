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

function buildCancelEmailHtml({
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
    <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:20px;">Session Cancelled ❌</h2>
    <p style="color:#4a4a68;font-size:15px;line-height:1.6;">Hi ${recipientName}, ${mainMessage}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border-radius:8px;margin:24px 0;padding:20px;">
      <tr><td style="padding:8px 20px;"><span style="color:#dc2626;font-weight:bold;">📅 Date</span><br><span style="color:#1a1a2e;">${formattedDate}</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#dc2626;font-weight:bold;">⏰ Time</span><br><span style="color:#1a1a2e;">${formattedTime} – ${formattedEndTime} (PKT)</span></td></tr>
      <tr><td style="padding:8px 20px;"><span style="color:#dc2626;font-weight:bold;">${otherPartyRole}</span><br><span style="color:#1a1a2e;">${otherPartyName}</span></td></tr>
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

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { booking_id, reason } = await req.json();

    // Step 2 — Fetch booking with user details
    const { data: booking, error: bookingErr } = await adminClient
      .from("demo_bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch student and tutor profiles
    const [studentRes, tutorRes] = await Promise.all([
      adminClient.from("profiles").select("first_name, last_name, email").eq("user_id", booking.student_id).single(),
      adminClient.from("profiles").select("first_name, last_name, email").eq("user_id", booking.tutor_id).single(),
    ]);

    const studentProfile = studentRes.data;
    const tutorProfile = tutorRes.data;
    const studentName = studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}`.trim() : "Student";
    const tutorName = tutorProfile ? `${tutorProfile.first_name} ${tutorProfile.last_name}`.trim() : "Tutor";

    // Step 3 — Verify ownership
    if (booking.student_id !== userId) {
      return new Response(
        JSON.stringify({ error: "You can only cancel your own bookings." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4 — Verify cancellable
    if (booking.status !== "confirmed") {
      return new Response(
        JSON.stringify({ error: "This booking cannot be cancelled." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sessionDatetime = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);
    if (sessionDatetime < new Date()) {
      return new Response(
        JSON.stringify({ error: "Cannot cancel a session that has already passed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 5 — Update booking
    const { error: updateErr } = await adminClient
      .from("demo_bookings")
      .update({
        status: "cancelled_by_student",
        cancellation_reason: reason || null,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking_id);

    if (updateErr) throw updateErr;

    // Step 6 — Format display values
    const formattedDate = formatDate(booking.scheduled_date);
    const timeStr = booking.scheduled_time.slice(0, 5);
    const formattedTime = formatTime(timeStr);
    const formattedEndTime = formatTime(booking.end_time.slice(0, 5));

    // Step 7 — Notification for student
    await adminClient.from("notifications").insert({
      user_id: booking.student_id,
      type: "booking_cancelled",
      title: "Session Cancelled",
      message: `Your session with ${tutorName} on ${formattedDate} at ${formattedTime} has been cancelled.`,
      related_booking_id: booking_id,
      action_url: "/dashboard/student/bookings",
    });

    // Step 8 — Notification for tutor
    await adminClient.from("notifications").insert({
      user_id: booking.tutor_id,
      type: "booking_cancelled",
      title: "Session Cancelled by Student",
      message: `${studentName} cancelled their demo session scheduled for ${formattedDate} at ${formattedTime}.`,
      related_booking_id: booking_id,
      action_url: "/dashboard/tutor/bookings",
    });

    // Step 9 — Email to student
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && studentProfile?.email) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Your-Tutor <onboarding@resend.dev>",
            to: studentProfile.email,
            subject: "❌ Session Cancelled — Your-Tutor",
            html: buildCancelEmailHtml({
              recipientName: studentName,
              mainMessage: "your session has been cancelled.",
              formattedDate,
              formattedTime,
              formattedEndTime,
              otherPartyName: tutorName,
              otherPartyRole: "👨‍🏫 Tutor",
              ctaUrl: "/dashboard/student/find-tutors",
              ctaLabel: "Book Another Session",
              footerNote: "We hope to see you back soon!",
            }),
          }),
        });
      } catch (e) {
        console.error("Failed to send student cancel email:", e);
      }
    }

    // Step 10 — Email to tutor
    if (resendKey && tutorProfile?.email) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Your-Tutor <onboarding@resend.dev>",
            to: tutorProfile.email,
            subject: "📋 Session Cancelled — Your-Tutor",
            html: buildCancelEmailHtml({
              recipientName: tutorName,
              mainMessage: `${studentName} has cancelled their session.`,
              formattedDate,
              formattedTime,
              formattedEndTime,
              otherPartyName: studentName,
              otherPartyRole: "🎓 Student",
              ctaUrl: "/dashboard/tutor/bookings",
              ctaLabel: "View Your Schedule",
              footerNote: "This time slot is now available for other students.",
            }),
          }),
        });
      } catch (e) {
        console.error("Failed to send tutor cancel email:", e);
      }
    }

    // Step 11 — Return success
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("cancel-booking error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
