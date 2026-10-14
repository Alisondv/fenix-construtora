/**
 * Helper compartilhado para guardar categoria + descrição da foto dentro do
 * nome do arquivo (evita precisar de um banco de dados só para isso).
 */
const CATEGORIA_PADRAO = 'Enviada pela equipe';

function codificarMeta(categoria, descricao) {
  const categoriaLimpa = String(categoria || '').trim().slice(0, 40) || CATEGORIA_PADRAO;
  const descricaoLimpa = String(descricao || '').trim().slice(0, 80);
  const json = JSON.stringify({ c: categoriaLimpa, d: descricaoLimpa });
  return Buffer.from(json, 'utf8').toString('base64url');
}

function decodificarNomeArquivo(pathname) {
  const nomeArquivo = pathname.split('/').pop() || '';
  const indicePonto = nomeArquivo.lastIndexOf('.');
  const semExtensao = indicePonto === -1 ? nomeArquivo : nomeArquivo.slice(0, indicePonto);
  const extensao = indicePonto === -1 ? '' : nomeArquivo.slice(indicePonto + 1);
  const [, metaCodificada] = semExtensao.split('~');

  let categoria = CATEGORIA_PADRAO;
  let descricao = '';

  if (metaCodificada) {
    let decodificado = '';
    try {
      decodificado = Buffer.from(metaCodificada, 'base64url').toString('utf8');
    } catch {
      decodificado = '';
    }

    // Formato novo: JSON com categoria (c) e descrição (d).
    // Formato antigo (fotos enviadas antes desse campo existir): texto puro, só a descrição.
    try {
      const dados = JSON.parse(decodificado);
      if (dados && typeof dados === 'object') {
        categoria = typeof dados.c === 'string' && dados.c ? dados.c : CATEGORIA_PADRAO;
        descricao = typeof dados.d === 'string' ? dados.d : '';
      } else {
        descricao = decodificado;
      }
    } catch {
      descricao = decodificado;
    }
  }

  return { nomeArquivo, extensao, categoria, descricao };
}

module.exports = { CATEGORIA_PADRAO, codificarMeta, decodificarNomeArquivo };
