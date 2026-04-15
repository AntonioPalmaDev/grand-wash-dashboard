import { corsHeaders } from '@supabase/supabase-js/cors'

const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1494024002782494840/HZm1DMIJc-0OEipxSQ-_mOoz_S89mwfGn94wASHPkr4w2TIKjFfJTdQ6SraOYFdxjxCx'

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, nome, responsavel } = await req.json()
    const now = formatDate(new Date())

    let content = ''

    if (type === 'novo_usuario') {
      content = `👤 **Novo usuário cadastrado**\nNome: ${nome}\nData: ${now}`
    } else if (type === 'nova_operacao') {
      content = `⚙️ **Nova operação criada**\nResponsável: ${responsavel}\nData: ${now}`
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (!discordRes.ok) {
      const errText = await discordRes.text()
      console.error('Discord webhook error:', discordRes.status, errText)
      return new Response(JSON.stringify({ error: 'Discord webhook failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
