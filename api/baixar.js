/**
 * Proxy de download: busca a foto no Vercel Blob e devolve pelo próprio
 * domínio do site, com Content-Disposition. Isso é necessário porque
 * navegadores modernos ignoram o atributo "download" em links que apontam
 * para outro domínio — sem este proxy, o clique abriria a foto em vez de
 * baixá-la.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { url, nome } = req.query;
  if (typeof url !== 'string') {
    return res.status(400).json({ erro: 'URL não informada' });
  }

  let urlValidada;
  try {
    urlValidada = new URL(url);
  } catch {
    return res.status(400).json({ erro: 'URL inválida' });
  }

  const hostnameAutorizado =
    urlValidada.protocol === 'https:' && urlValidada.hostname.endsWith('.public.blob.vercel-storage.com');
  if (!hostnameAutorizado) {
    return res.status(400).json({ erro: 'URL não autorizada' });
  }

  try {
    const respostaOrigem = await fetch(urlValidada);
    if (!respostaOrigem.ok) {
      return res.status(502).json({ erro: 'Não foi possível buscar a foto' });
    }

    const buffer = Buffer.from(await respostaOrigem.arrayBuffer());
    const nomeArquivo = (typeof nome === 'string' && nome ? nome : 'foto-fenix-construtora.jpg').replace(
      /["\r\n]/g,
      ''
    );

    res.setHeader('Content-Type', respostaOrigem.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(buffer);
  } catch (erro) {
    console.error('Erro ao baixar foto:', erro);
    return res.status(500).json({ erro: 'Erro ao baixar a foto' });
  }
};
