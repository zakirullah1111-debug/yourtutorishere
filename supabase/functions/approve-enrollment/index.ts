import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tutorUserId = userData.user.id;

    const { enrollment_id, action } = await req.json();
    if (!enrollment_id || !action || !["approve", "reject"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "enrollment_id and action (approve/reject) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is the tutor for this enrollment
    const { data: enrollment } = await adminClient
      .from("enrollment_requests")
      .select("*, tutors!inner(id, user_id)")
      .eq("id", enrollment_id)
      .single();

    if (!enrollment) {
      return new Response(JSON.stringify({ error: "Enrollment request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The join syntax returns tutors as an object
    const tutorRecord = (enrollment as any).tutors;
    if (tutorRecord.user_id !== tutorUserId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (enrollment.status !== "pending") {
      return new Response(JSON.stringify({ error: "Request already processed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get tutor profile name
    const { data: tutorProfile } = await adminClient
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", tutorUserId)
      .single();
    const tutorName = tutorProfile
      ? `${tutorProfile.first_name} ${tutorProfile.last_name}`.trim()
      : "Your tutor";

    if (action === "approve") {
      // Update enrollment status
      await adminClient
        .from("enrollment_requests")
        .update({ status: "approved" })
        .eq("id", enrollment_id);

      // Check if student record exists
      const { data: existingStudent } = await adminClient
        .from("students")
        .select("id")
        .eq("user_id", enrollment.student_user_id)
        .maybeSingle();

      if (existingStudent) {
        // Update assigned_tutor_id
        await adminClient
          .from("students")
          .update({
            assigned_tutor_id: enrollment.tutor_id,
            primary_subject: enrollment.subject,
            current_class: enrollment.current_class,
            education_board: enrollment.education_board,
          })
          .eq("id", existingStudent.id);
      } else {
        // Create student record
        await adminClient.from("students").insert({
          user_id: enrollment.student_user_id,
          assigned_tutor_id: enrollment.tutor_id,
          primary_subject: enrollment.subject,
          current_class: enrollment.current_class,
          education_board: enrollment.education_board,
        });
      }

      // Notify student of approval
      await adminClient.from("notifications").insert({
        user_id: enrollment.student_user_id,
        type: "enrollment_approved",
        title: "Enrollment Approved! 🎉",
        message: `${tutorName} has approved your enrollment for ${enrollment.subject}. You can now take classes!`,
      });
    } else {
      // Reject
      await adminClient
        .from("enrollment_requests")
        .update({ status: "rejected" })
        .eq("id", enrollment_id);

      await adminClient.from("notifications").insert({
        user_id: enrollment.student_user_id,
        type: "enrollment_rejected",
        title: "Enrollment Update",
        message: `${tutorName} was unable to accept your enrollment for ${enrollment.subject} at this time.`,
      });
    }

    return new Response(
      JSON.stringify({ success: true, action }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("approve-enrollment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
