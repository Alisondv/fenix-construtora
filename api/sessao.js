const { sessaoValida } = require('./_auth');

/** Usada pela página /admin.html para saber, ao carregar, se já existe login válido. */
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  return res.status(200).json({ autenticado: sessaoValida(req) });
};
