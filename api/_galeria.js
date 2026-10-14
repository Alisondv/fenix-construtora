/**
 * Helper compartilhado para guardar a descrição da foto dentro do nome do
 * arquivo (evita precisar de um banco de dados só para isso).
 */
function codificarDescricao(texto) {
  const limpo = String(texto || '').trim().slice(0, 80);
  if (!limpo) return '';
  return Buffer.from(limpo, 'utf8').toString('base64url');
}

function decodificarNomeArquivo(pathname) {
  const nomeArquivo = pathname.split('/').pop() || '';
  const indicePonto = nomeArquivo.lastIndexOf('.');
  const semExtensao = indicePonto === -1 ? nomeArquivo : nomeArquivo.slice(0, indicePonto);
  const extensao = indicePonto === -1 ? '' : nomeArquivo.slice(indicePonto + 1);
  const [, descCodificada] = semExtensao.split('~');

  let descricao = '';
  if (descCodificada) {
    try {
      descricao = Buffer.from(descCodificada, 'base64url').toString('utf8');
    } catch {
      descricao = '';
    }
  }

  return { nomeArquivo, extensao, descricao };
}

module.exports = { codificarDescricao, decodificarNomeArquivo };
