 import { supabase } from '../lib/supabase'

// ✅ YOUR PERMANENT YOCO LINKS
const YOCO_SETUP_FEE_LINK = "https://pay.yoco.com/r/RMXwEp"; // R100 Creation Fee
const YOCO_PREMIUM_LINK = "https://pay.yoco.com/r/yEPoZO";   // R60 Premium Subscription

// ✅ YOUR LIVE DEPLOYMENT URL (Replace with your actual Netlify URL if different)
const RETURN_URL = "https://predictfc.netlify.app/payment/success";

export async function initiatePayment({
  amount,
  email,
  fullName,
  userId,
  communityId = null,
  type = 'setup_fee', // 'setup_fee' or 'premium'
}) {
  try {
    // 1. Calculate fees (30% platform fee for setup, 10% for premium)
    const platformFee = type === 'setup_fee' ? amount * 0.30 : amount * 0.10;
    const creatorEarnings = type === 'setup_fee' ? amount * 0.70 : amount * 0.90;

    // 2. Create pending record in Supabase
    const { data: payment, error } = await supabase
      .from('subscription_payments')
      .insert({
        user_id: userId,
        community_id: communityId,
        amount: amount,
        currency: 'ZAR',
        platform_fee: platformFee,
        creator_earnings: creatorEarnings,
        type: type === 'setup_fee' ? 'community' : 'premium',
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Choose the correct link based on what the user is buying
    const targetUrl = type === 'setup_fee' ? YOCO_SETUP_FEE_LINK : YOCO_PREMIUM_LINK;
    
    // 4. Build the final URL with payment_id + return_url
    const checkoutUrl = `${targetUrl}?payment_id=${payment.id}&return_url=${encodeURIComponent(RETURN_URL)}`;

    // 5. Redirect the user to Yoco
    window.location.href = checkoutUrl;

    return { success: true, paymentId: payment.id };

  } catch (error) {
    console.error('Payment error:', error);
    return { success: false, error: error.message };
  }
}