// supabase/functions/send-renewal-emails/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // 1. Find all premium subscriptions that expired yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const { data: expiredSubscriptions, error } = await supabase
    .from("subscription_payments")
    .select(`
      id,
      user_id,
      amount,
      profiles:user_id (
        email,
        full_name,
        username
      )
    `)
    .eq("type", "premium")
    .eq("status", "success")
    .lt("expires_at", new Date().toISOString())
    .eq("status", "success");

  if (error) {
    console.error("Error fetching expired subscriptions:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
    return new Response(JSON.stringify({ message: "No expired subscriptions found" }), {
      status: 200,
    });
  }

  // 2. Send renewal emails
  const emailPromises = expiredSubscriptions.map(async (sub) => {
    const email = sub.profiles?.email;
    const name = sub.profiles?.full_name || sub.profiles?.username || "PredictFC User";

    if (!email) {
      console.warn(`No email found for user ${sub.user_id}`);
      return;
    }

    const renewalLink = `${Deno.env.get("PUBLIC_SITE_URL")}/subscribe?renew=true&user_id=${sub.user_id}`;

    // Send email using Supabase's built-in email service or your own SMTP
    const { error: emailError } = await supabase.auth.admin.sendRawEmail({
      email: email,
      subject: "Your PredictFC Premium has expired — Renew now!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Your Premium Subscription Has Expired</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your PredictFC Premium subscription expired on <strong>${yesterdayStr}</strong>.</p>
          <p>You've lost access to the Leaderboard and AI predictions.</p>
          <p>To regain full access, please renew your subscription:</p>
          <p>
            <a href="${renewalLink}" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Renew Now — R40/month
            </a>
          </p>
          <p style="color: #888;">If you have any questions, contact us at support@predictfc.com.</p>
          <p>— The PredictFC Team</p>
        </div>
      `,
    });

    if (emailError) {
      console.error(`Error sending email to ${email}:`, emailError);
    }

    // Update the payment record to mark it as expired (optional)
    await supabase
      .from("subscription_payments")
      .update({ status: "expired" })
      .eq("id", sub.id);
  });

  await Promise.all(emailPromises);

  return new Response(
    JSON.stringify({
      message: `Sent renewal emails to ${emailPromises.length} users`,
    }),
    { status: 200 }
  );
});