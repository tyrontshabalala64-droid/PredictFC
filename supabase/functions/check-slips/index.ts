// supabase/functions/check-slips/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get all pending slips
        const { data: slips } = await supabase
            .from('slips')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(50)

        let updated = 0

        for (const slip of slips || []) {
            // Check each slip
            const result = await checkSlipResult(slip)
            if (result.status !== 'pending') {
                updated++
            }
        }

        return new Response(JSON.stringify({
            success: true,
            total: slips?.length || 0,
            updated
        }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})