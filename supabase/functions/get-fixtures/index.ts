// supabase/functions/get-fixtures/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const FOOTBALL_DATA_API = 'https://api.football-data.org/v4'
const API_KEY = Deno.env.get('FOOTBALL_DATA_KEY') || '5ac44b9e7ae64f30891be70bacd04900'

serve(async (req) => {
    try {
        const url = new URL(req.url)
        const competition = url.searchParams.get('competition') || 'PL'
        const limit = parseInt(url.searchParams.get('limit') || '20')

        const apiUrl = `${FOOTBALL_DATA_API}/competitions/${competition}/matches?status=SCHEDULED&limit=${limit}`

        const response = await fetch(apiUrl, {
            headers: {
                'X-Auth-Token': API_KEY
            }
        })

        if (!response.ok) {
            console.error('API error:', response.status)
            return new Response(
                JSON.stringify({ error: 'Failed to fetch fixtures' }),
                { status: response.status }
            )
        }

        const data = await response.json()
        const matches = data.matches || []

        return new Response(
            JSON.stringify({
                matches: matches,
                total: matches.length,
                competition: competition
            }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        )
    }
})