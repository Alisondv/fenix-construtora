const crypto = require('crypto');
const { criarTokenSessao, DURACAO_SESSAO_MS, NOME_COOKIE } = require('./_auth');
const { lerEstado, salvarEstado, obterIp, LIMITE_TENTATIVAS } = require('./_bloqueio');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const ip = obterIp(req);

  const senhaEsperada = process.env.ADMIN_SENHA;
  if (!senhaEsperada) {
    return res.status(500).json({ erro: 'Senha de administrador não configurada no servidor' });
  }

  const estado = await lerEstado();
  if (estado.bloqueado) {
    console.warn(`[login] tentativa com acesso já bloqueado — IP ${ip}`);
    return res.status(423).json({
      erro: 'Acesso bloqueado após várias tentativas incorretas. Contate o responsável pelo site.',
    });
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
    const novasTentativas = estado.tentativas + 1;
    const vaiBloquear = novasTentativas >= LIMITE_TENTATIVAS;

    try {
      await salvarEstado({ tentativas: novasTentativas, bloqueado: vaiBloquear });
    } catch (erro) {
      console.error('Não foi possível salvar o estado de bloqueio:', erro);
    }

    console.warn(
      `[login] tentativa incorreta ${novasTentativas}/${LIMITE_TENTATIVAS} — IP ${ip}` +
        (vaiBloquear ? ' — ACESSO BLOQUEADO AGORA' : '')
    );

    // pequeno atraso para dificultar tentativas automatizadas de adivinhar a senha
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (vaiBloquear) {
      return res.status(423).json({
        erro: 'Senha incorreta. Limite de tentativas atingido — acesso bloqueado. Contate o responsável pelo site.',
      });
    }
    return res.status(401).json({ erro: 'Senha incorreta' });
  }

  console.log(`[login] acesso liberado — IP ${ip}`);
  if (estado.tentativas > 0) {
    try {
      await salvarEstado({ tentativas: 0, bloqueado: false });
    } catch (erro) {
      console.error('Não foi possível zerar o estado de bloqueio:', erro);
    }
  }

  const token = criarTokenSessao();
  const maxAgeSegundos = Math.floor(DURACAO_SESSAO_MS / 1000);
  res.setHeader(
    'Set-Cookie',
    `${NOME_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSegundos}`
  );
  return res.status(200).json({ ok: true });
};
