const { put } = require('@vercel/blob');
const { sessaoValida } = require('./_auth');
const { codificarDescricao } = require('./_galeria');

const TAMANHO_MAXIMO_BYTES = 6 * 1024 * 1024; // 6MB já decodificado (a imagem chega bem menor que isso)
const EXTENSAO_POR_TIPO = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  if (!sessaoValida(req)) {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }

  const { imagemBase64, descricao } = req.body || {};
  if (typeof imagemBase64 !== 'string') {
    return res.status(400).json({ erro: 'Nenhuma imagem enviada' });
  }

  const correspondencia = imagemBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!correspondencia) {
    return res.status(400).json({ erro: 'Formato de imagem não suportado. Envie JPG, PNG ou WEBP.' });
  }

  const [, tipoMime, dadosBase64] = correspondencia;
  const bufferImagem = Buffer.from(dadosBase64, 'base64');

  if (bufferImagem.length > TAMANHO_MAXIMO_BYTES) {
    return res.status(413).json({ erro: 'Imagem muito grande. Tente novamente com outra foto.' });
  }

  const extensao = EXTENSAO_POR_TIPO[tipoMime];
  const descricaoCodificada = codificarDescricao(descricao);
  const identificador = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const pathname = `galeria/${identificador}${descricaoCodificada ? `~${descricaoCodificada}` : ''}.${extensao}`;

  try {
    const blob = await put(pathname, bufferImagem, {
      access: 'public',
      contentType: tipoMime,
      addRandomSuffix: false,
    });
    return res.status(200).json({ ok: true, url: blob.url });
  } catch (erro) {
    console.error('Erro ao enviar foto para o Vercel Blob:', erro);
    return res.status(500).json({ erro: 'Não foi possível enviar a foto agora. Tente novamente.' });
  }
};
