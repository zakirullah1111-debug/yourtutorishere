

# In-Platform Class System — Plan

## Overview

When a tutor clicks "Start Class" next to a student, the system generates a Jitsi video room, sends the student an in-app notification and a chat message containing the join link.

## What Changes

### 1. New Edge Function: `start-class`

Creates a new `supabase/functions/start-class/index.ts` that:
- Accepts `{ student_user_id: string }` in the request body
- Verifies the caller is a tutor (checks `tutors` table)
- Generates a unique Jitsi room URL: `https://meet.jit.si/yoututor-class-{uuid}`
- Creates an in-app notification for the student with type `class_starting`, including the meeting URL as `action_url`
- Finds or creates a conversation between the tutor and student, then inserts a chat message with the class link
- Returns the meeting URL to the tutor so they can auto-join

Config: Add `[functions.start-class]` with `verify_jwt = false` to `supabase/config.toml`.

### 2. Update MyStudents Page

In `src/pages/dashboard/tutor/MyStudents.tsx`:
- Add `userId` field to the `Student` interface (carry `student.user_id` through from the fetch)
- Add a "Start Class" button (with `Video` icon) in the actions column for both desktop table and mobile cards
- On click: call `supabase.functions.invoke("start-class", { body: { student_user_id } })`, then auto-open the returned Jitsi URL in a new tab
- Show loading state on the button while the call is in progress
- Show toast on success/error

### 3. Student-Side: Join Class Popup

Reuse the existing `JoinSessionPopup` component and `useSessionLinkDelivery` hook — the hook already listens for realtime notification inserts. We just need to:
- In `useSessionLinkDelivery.tsx`, extend the realtime listener to also handle the new `class_starting` notification type (currently only handles `session_starting`)
- The popup will show "Your Class is Live!" with a "Join Now" button

### 4. Student Notification Bell

The existing `NotificationBell` component already renders all notifications from the `notifications` table — the new `class_starting` type will appear automatically with the correct title/message.

## Technical Details

**Edge function flow:**
```text
Tutor clicks "Start Class"
  → POST /start-class { student_user_id }
  → Verify JWT, confirm caller is a tutor
  → Generate Jitsi URL
  → INSERT notification (type: class_starting)
  → Find/create conversation → INSERT message with link
  → Return { meeting_url } to tutor
  → Tutor's browser opens Jitsi in new tab
  → Student sees popup + chat message in real-time
```

**Files to create:**
- `supabase/functions/start-class/index.ts`

**Files to modify:**
- `supabase/config.toml` — add function config block
- `src/pages/dashboard/tutor/MyStudents.tsx` — add userId to Student, add Start Class button
- `src/hooks/useSessionLinkDelivery.tsx` — handle `class_starting` notification type

