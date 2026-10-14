/**
 * Controle de tentativas de login. Guarda o estado num arquivo pequeno no
 * Vercel Blob (fora do prefixo "galeria/", então nunca aparece no site nem
 * no painel) já que as funções da Vercel não mantêm memória entre chamadas.
 *
 * Para desbloquear manualmente: apague o arquivo "seguranca/estado-login.json"
 * pela dashboard do Vercel Blob.
 */
const { put, list } = require('@vercel/blob');

const PREFIXO = 'seguranca/';
const CAMINHO_ESTADO = `${PREFIXO}estado-login.json`;
const LIMITE_TENTATIVAS = 3;

async function lerEstado() {
  try {
    const { blobs } = await list({ prefix: PREFIXO });
    const blob = blobs.find((b) => b.pathname === CAMINHO_ESTADO);
    if (!blob) return { tentativas: 0, bloqueado: false };

    const resposta = await fetch(blob.url, { cache: 'no-store' });
    if (!resposta.ok) return { tentativas: 0, bloqueado: false };

    const dados = await resposta.json();
    return {
      tentativas: Number(dados.tentativas) || 0,
      bloqueado: Boolean(dados.bloqueado),
    };
  } catch {
    // Se o Blob estiver indisponível, falha "aberto": não trava o login.
    return { tentativas: 0, bloqueado: false };
  }
}

async function salvarEstado(estado) {
  await put(CAMINHO_ESTADO, JSON.stringify(estado), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

function obterIp(req) {
  const encaminhado = req.headers['x-forwarded-for'];
  if (typeof encaminhado === 'string' && encaminhado) return encaminhado.split(',')[0].trim();
  return req.socket?.remoteAddress || 'desconhecido';
}

module.exports = { lerEstado, salvarEstado, obterIp, LIMITE_TENTATIVAS };
