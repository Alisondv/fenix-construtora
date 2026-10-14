const { NOME_COOKIE } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  res.setHeader('Set-Cookie', `${NOME_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
  return res.status(200).json({ ok: true });
};
