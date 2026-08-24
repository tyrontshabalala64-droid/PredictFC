import { supabase } from '../lib/supabase'

// Use your actual Flutterwave public key here
// You'll get this from your Flutterwave dashboard under "API Keys"
const FLW_PUBLIC_KEY = process.env.REACT_APP_FLW_PUBLIC_KEY

export function initiateFlutterwavePayment({
  amount,
  currency = 'ZAR',
  email,
  phone,
  fullName,
  userId,
  metadata,
  onSuccess,
  onClose
}) {
  // This function will be called by your React component
  // It triggers the Flutterwave modal
  const config = {
    public_key: FLW_PUBLIC_KEY,
    tx_ref: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount: amount,
    currency: currency,
    payment_options: 'card, banktransfer, ussd',
    customer: {
      email: email,
      phone_number: phone || '',
      name: fullName || email,
    },
    customizations: {
      title: 'PredictFC',
      description: 'Payment for subscription',
      logo: 'https://your-app-url.com/logo.png', // Optional
    },
    meta: {
      user_id: userId,
      ...metadata,
    },
    callback: async (response) => {
      // This runs when payment is successful
      console.log('Payment successful:', response)
      if (onSuccess) onSuccess(response)
    },
    onclose: () => {
      // This runs when user closes the modal
      if (onClose) onClose()
    },
  }

  // Load Flutterwave script and initialize
  const script = document.createElement('script')
  script.src = 'https://checkout.flutterwave.com/v3.js'
  script.onload = () => {
    window.FlutterwaveCheckout(config)
  }
  document.body.appendChild(script)
}

// ============================================
// BACKEND HELPER (to verify payment & save to DB)
// ============================================
export async function verifyAndSavePayment(transactionId, userId, type = 'community', communityId = null) {
  try {
    // 1. Verify the transaction with Flutterwave (optional, but recommended)
    // You'll need your secret key for this:
    // const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    //   headers: { Authorization: `Bearer ${process.env.REACT_APP_FLW_SECRET_KEY}` }
    // })
    // const data = await response.json()
    // if (data.data.status !== 'successful') throw new Error('Payment failed')

    // 2. Save to your database
    const paymentData = {
      user_id: userId,
      amount: amount, // You'll pass this from the frontend
      currency: 'ZAR',
      type: type,
      status: 'success',
      transaction_id: transactionId,
      expires_at: type === 'premium' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        : null,
      community_id: communityId || null,
    }

    const { data, error } = await supabase
      .from('subscription_payments')
      .insert(paymentData)
      .select()
      .single()

    if (error) throw error
    return { success: true, payment: data }
  } catch (error) {
    console.error('Payment verification error:', error)
    return { success: false, error: error.message }
  }
}