async function enviarNotificacao(nomeResponsavel) {
  const webhookUrl = "https://discord.com/api/webhooks/1494071476188348487/0xAisZWH6i547zNGaGSUBvOiVKPfHek2FGMzuE4WAk6UXibIEVHl_7kLjgID7yu5Il3N";

  const mensagem = {
    content: `🚀 Nova operação criada por **${nomeResponsavel}** às ${new Date().toLocaleString()}`
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(mensagem)
  });
}if (novaOperacao) {
  await enviarNotificacao(nomeResponsavel);
}const mensagem = {
  embeds: [
    {
      title: "📢 Nova Operação",
      description: `Criada por **${nomeResponsavel}**`,
      color: 5814783,
      footer: {
        text: `Data: ${new Date().toLocaleString()}`
      }
    }
  ]
};