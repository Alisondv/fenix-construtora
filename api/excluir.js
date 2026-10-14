const { del } = require('@vercel/blob');
const { sessaoValida } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  if (!sessaoValida(req)) {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }

  const { url } = req.body || {};
  if (typeof url !== 'string' || !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
    return res.status(400).json({ erro: 'URL inválida' });
  }

  try {
    await del(url);
    return res.status(200).json({ ok: true });
  } catch (erro) {
    console.error('Erro ao excluir foto:', erro);
    return res.status(500).json({ erro: 'Não foi possível excluir a foto' });
  }
};
