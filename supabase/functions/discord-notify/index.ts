Deno.serve(async () => {
  console.log("🔥 INICIOU")

  try {
    const webhook = "https://discordapp.com/api/webhooks/1494071476188348487/0xAisZWH6i547zNGaGSUBvOiVKPfHek2FGMzuE4WAk6UXibIEVHl_7kLjgID7yu5Il3N"

    const res = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: "🚀 TESTE DIRETO SUPABASE"
      })
    })

    console.log("STATUS:", res.status)

    const text = await res.text()
    console.log("RESPOSTA:", text)

    return new Response("ok")

  } catch (err) {
    console.error("💥 ERRO:", err)
    return new Response("erro")
  }
})