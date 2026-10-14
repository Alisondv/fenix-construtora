/**
 * Helper de autenticação compartilhado pelas funções da API.
 * Arquivos com "_" no início não se tornam rotas na Vercel — este módulo
 * só é usado internamente pelos outros arquivos de api/.
 */
const crypto = require('crypto');

const NOME_COOKIE = 'sessao_admin';
const DURACAO_SESSAO_MS = 1000 * 60 * 60 * 4; // 4 horas

function assinar(valor, segredo) {
  return crypto.createHmac('sha256', segredo).update(valor).digest('hex');
}

/** Cria um token "validade.assinatura" sem precisar de banco de dados. */
function criarTokenSessao() {
  const segredo = process.env.SESSAO_SEGREDO;
  if (!segredo) throw new Error('SESSAO_SEGREDO não configurado nas variáveis de ambiente');
  const expiraEm = String(Date.now() + DURACAO_SESSAO_MS);
  return `${expiraEm}.${assinar(expiraEm, segredo)}`;
}

function obterCookie(req, nome) {
  const cabecalho = req.headers.cookie || '';
  for (const parte of cabecalho.split(';')) {
    const [chave, ...resto] = parte.trim().split('=');
    if (chave === nome) return decodeURIComponent(resto.join('='));
  }
  return null;
}

/** Verifica a assinatura do token e se ele ainda não expirou. */
function sessaoValida(req) {
  const segredo = process.env.SESSAO_SEGREDO;
  const token = obterCookie(req, NOME_COOKIE);
  if (!segredo || !token) return false;

  const [expiraEm, assinatura] = token.split('.');
  if (!expiraEm || !assinatura) return false;

  const esperada = assinar(expiraEm, segredo);
  const bufAtual = Buffer.from(assinatura);
  const bufEsperada = Buffer.from(esperada);
  if (bufAtual.length !== bufEsperada.length) return false;
  if (!crypto.timingSafeEqual(bufAtual, bufEsperada)) return false;

  return Date.now() < Number(expiraEm);
}

module.exports = { NOME_COOKIE, DURACAO_SESSAO_MS, criarTokenSessao, sessaoValida };
