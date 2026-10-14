const { list } = require('@vercel/blob');
const { decodificarNomeArquivo } = require('./_galeria');

/** Rota pública: lista as fotos enviadas pelo admin para a galeria do site exibir. */
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const { blobs } = await list({ prefix: 'galeria/' });

    const fotos = blobs
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .map((blob) => {
        const { nomeArquivo, categoria, descricao } = decodificarNomeArquivo(blob.pathname);
        return { url: blob.url, nomeArquivo, categoria, descricao };
      });

    res.setHeader('Cache-Control', 'public, max-age=30');
    return res.status(200).json({ fotos });
  } catch (erro) {
    console.error('Erro ao listar fotos da galeria:', erro);
    return res.status(500).json({ erro: 'Não foi possível carregar as fotos' });
  }
};
