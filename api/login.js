const crypto = require('crypto');
const { criarTokenSessao, DURACAO_SESSAO_MS, NOME_COOKIE } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const senhaEsperada = process.env.ADMIN_SENHA;
  if (!senhaEsperada) {
    return res.status(500).json({ erro: 'Senha de administrador não configurada no servidor' });
  }

  const { senha } = req.body || {};
  if (typeof senha !== 'string' || !senha) {
    return res.status(400).json({ erro: 'Informe a senha' });
  }

  const bufEnviado = Buffer.from(senha);
  const bufEsperado = Buffer.from(senhaEsperada);
  const senhaCorreta =
    bufEnviado.length === bufEsperado.length && crypto.timingSafeEqual(bufEnviado, bufEsperado);

  if (!senhaCorreta) {
    // pequeno atraso para dificultar tentativas automatizadas de adivinhar a senha
    await new Promise((resolve) => setTimeout(resolve, 500));
    return res.status(401).json({ erro: 'Senha incorreta' });
  }

  const token = criarTokenSessao();
  const maxAgeSegundos = Math.floor(DURACAO_SESSAO_MS / 1000);
  res.setHeader(
    'Set-Cookie',
    `${NOME_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSegundos}`
  );
  return res.status(200).json({ ok: true });
};
