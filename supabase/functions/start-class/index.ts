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
    // Verify auth
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

    // User-scoped client for auth verification
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tutorUserId = claimsData.user.id;

    // Parse body
    const { student_user_id } = await req.json();
    if (!student_user_id || typeof student_user_id !== "string") {
      return new Response(JSON.stringify({ error: "student_user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client to bypass RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is a tutor
    const { data: tutor } = await adminClient
      .from("tutors")
      .select("id, user_id")
      .eq("user_id", tutorUserId)
      .maybeSingle();

    if (!tutor) {
      return new Response(JSON.stringify({ error: "Only tutors can start classes" }), {
        status: 403,
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

    // Generate Jitsi room
    const roomId = crypto.randomUUID();
    const meetingUrl = `https://meet.jit.si/yoututor-class-${roomId}`;

    // Insert notification for the student
    await adminClient.from("notifications").insert({
      user_id: student_user_id,
      type: "class_starting",
      title: "Class is Starting! 📚",
      message: `${tutorName} has started a class. Click to join now!`,
      action_url: meetingUrl,
    });

    // Find or create conversation
    let conversationId: string;

    const { data: existingConvo } = await adminClient
      .from("conversations")
      .select("id")
      .or(
        `and(student_user_id.eq.${student_user_id},tutor_user_id.eq.${tutorUserId}),and(student_user_id.eq.${tutorUserId},tutor_user_id.eq.${student_user_id})`
      )
      .maybeSingle();

    if (existingConvo) {
      conversationId = existingConvo.id;
    } else {
      const { data: newConvo, error: convoErr } = await adminClient
        .from("conversations")
        .insert({
          student_user_id: student_user_id,
          tutor_user_id: tutorUserId,
        })
        .select("id")
        .single();

      if (convoErr || !newConvo) {
        console.error("Failed to create conversation:", convoErr);
        return new Response(JSON.stringify({ error: "Failed to create conversation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      conversationId = newConvo.id;
    }

    // Send chat message with the class link
    const messageContent = `📚 Class has started!\n\nJoin here: ${meetingUrl}`;

    await adminClient.from("messages").insert({
      conversation_id: conversationId,
      sender_id: tutorUserId,
      content: messageContent,
    });

    // Update conversation last_message
    await adminClient
      .from("conversations")
      .update({
        last_message: messageContent,
        last_message_at: new Date().toISOString(),
        student_unread_count: 1,
      })
      .eq("id", conversationId);

    return new Response(
      JSON.stringify({ meeting_url: meetingUrl, success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("start-class error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
