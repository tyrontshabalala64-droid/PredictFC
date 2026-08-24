import { supabase } from '../lib/supabase';

const YOCO_PUBLIC_KEY = process.env.REACT_APP_YOCO_PUBLIC_KEY;

// Initialize the Yoco SDK (This only needs to run once)
let yocoInstance = null;

const getYoco = () => {
  if (!yocoInstance) {
    if (typeof window.Yoco === 'undefined') {
      console.warn("Yoco SDK script hasn't loaded yet.");
      return null;
    }
    yocoInstance = new window.Yoco({
      key: YOCO_PUBLIC_KEY
    });
  }
  return yocoInstance;
};

export async function initiateYocoPayment({
  amount,
  currency = 'ZAR',
  email,
  fullName,
  userId,
  communityId = null,
  type = 'community', // 'community' or 'premium'
  metadata = {}
}) {
  try {
    // 1. Create a pending payment record in Supabase
    const platformFee = amount * 0.30;
    const creatorEarnings = amount * 0.70;

    const { data: payment, error } = await supabase
      .from('subscription_payments')
      .insert({
        user_id: userId,
        community_id: communityId,
        amount: amount,
        currency: currency,
        platform_fee: platformFee,
        creator_earnings: creatorEarnings,
        type: type,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Get the Yoco checkout instance
    const yoco = getYoco();
    if (!yoco) {
      throw new Error("Yoco SDK not loaded. Please ensure the script is added to index.html");
    }

    // 3. Open the Yoco Checkout Modal
    yoco.checkout({
      amount: Math.round(amount * 100), // Yoco expects cents (R50.00 = 5000)
      currency: currency,
      customer: {
        email: email,
        fullName: fullName || email
      },
      metadata: {
        payment_id: payment.id,
        user_id: userId,
        community_id: communityId,
        type: type,
        ...metadata
      },
      onSuccess: async (result) => {
        console.log('Payment successful:', result);
        // Call your verification endpoint (we'll set this up next)
        // await verifyYocoPayment(result.id, payment.id);
        window.location.href = `/payment/success?payment_id=${payment.id}`;
      },
      onClose: () => {
        console.log('Payment modal closed');
      }
    });

    return { success: true, paymentId: payment.id };

  } catch (error) {
    console.error('Yoco payment error:', error);
    return { success: false, error: error.message };
  }
}