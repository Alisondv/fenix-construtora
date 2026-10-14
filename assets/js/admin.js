/**
 * ÁREA ADMINISTRATIVA — login e upload de fotos do mural.
 */
(function () {
  const telaLogin = document.getElementById('tela-login');
  const telaPainel = document.getElementById('tela-painel');
  const formularioLogin = document.getElementById('formulario-login');
  const campoSenha = document.getElementById('campo-senha-admin');
  const erroLogin = document.getElementById('erro-login');
  const botaoSair = document.getElementById('botao-sair');

  const formularioUpload = document.getElementById('formulario-upload');
  const campoArquivo = document.getElementById('campo-arquivo-foto');
  const campoCategoria = document.getElementById('campo-categoria-foto');
  const campoDescricao = document.getElementById('campo-descricao-foto');
  const previewImagem = document.getElementById('preview-imagem');
  const erroUpload = document.getElementById('erro-upload');
  const sucessoUpload = document.getElementById('sucesso-upload');
  const botaoEnviarFoto = document.getElementById('botao-enviar-foto');
  const textoBotaoEnviar = document.getElementById('texto-botao-enviar-foto');
  const listaFotos = document.getElementById('lista-fotos-enviadas');
  const erroFotos = document.getElementById('erro-fotos');

  const LARGURA_MAXIMA_PX = 1600;
  const QUALIDADE_JPEG = 0.82;

  function mostrarPainel() {
    telaLogin.hidden = true;
    telaPainel.hidden = false;
    carregarFotos();
  }

  function mostrarLogin() {
    telaPainel.hidden = true;
    telaLogin.hidden = false;
  }

  async function verificarSessao() {
    try {
      const resposta = await fetch('/api/sessao');
      const dados = await resposta.json();
      dados.autenticado ? mostrarPainel() : mostrarLogin();
    } catch {
      mostrarLogin();
    }
  }

  formularioLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erroLogin.textContent = '';
    try {
      const resposta = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: campoSenha.value }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        erroLogin.textContent = dados.erro || 'Não foi possível entrar.';
        return;
      }
      campoSenha.value = '';
      mostrarPainel();
    } catch {
      erroLogin.textContent = 'Erro de conexão. Tente novamente.';
    }
  });

  botaoSair.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    mostrarLogin();
  });

  /** Redimensiona e comprime a imagem no navegador antes de enviar. */
  function prepararImagem(arquivo) {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
      leitor.onload = () => {
        const imagem = new Image();
        imagem.onerror = () => reject(new Error('Arquivo não é uma imagem válida.'));
        imagem.onload = () => {
          const fator = Math.min(1, LARGURA_MAXIMA_PX / imagem.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(imagem.width * fator);
          canvas.height = Math.round(imagem.height * fator);
          canvas.getContext('2d').drawImage(imagem, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', QUALIDADE_JPEG));
        };
        imagem.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  campoArquivo.addEventListener('change', async () => {
    erroUpload.textContent = '';
    const arquivo = campoArquivo.files?.[0];
    if (!arquivo) {
      previewImagem.hidden = true;
      return;
    }
    try {
      previewImagem.src = await prepararImagem(arquivo);
      previewImagem.hidden = false;
    } catch (erro) {
      erroUpload.textContent = erro.message;
    }
  });

  let temporizadorSucesso;

  function mostrarSucessoEnvio() {
    sucessoUpload.hidden = false;
    clearTimeout(temporizadorSucesso);
    temporizadorSucesso = setTimeout(() => {
      sucessoUpload.hidden = true;
    }, 4000);
  }

  formularioUpload.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erroUpload.textContent = '';
    sucessoUpload.hidden = true;

    const arquivo = campoArquivo.files?.[0];
    if (!arquivo) {
      erroUpload.textContent = 'Selecione uma foto.';
      return;
    }

    botaoEnviarFoto.disabled = true;
    textoBotaoEnviar.textContent = 'Enviando…';

    try {
      const imagemBase64 = await prepararImagem(arquivo);
      const resposta = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagemBase64,
          categoria: campoCategoria.value.trim(),
          descricao: campoDescricao.value.trim(),
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        erroUpload.textContent = dados.erro || 'Não foi possível enviar a foto.';
        return;
      }
      formularioUpload.reset();
      previewImagem.hidden = true;
      await carregarFotos();
      mostrarSucessoEnvio();
    } catch {
      erroUpload.textContent = 'Erro de conexão. Tente novamente.';
    } finally {
      botaoEnviarFoto.disabled = false;
      textoBotaoEnviar.textContent = 'Enviar foto';
    }
  });

  async function carregarFotos() {
    listaFotos.innerHTML = '<p>Carregando fotos…</p>';
    erroFotos.textContent = '';
    try {
      // cache-busting: o painel precisa sempre da lista mais recente (ex.: logo após excluir),
      // enquanto a galeria pública pode usar a resposta em cache normalmente.
      const resposta = await fetch(`/api/fotos?t=${Date.now()}`, { cache: 'no-store' });
      const dados = await resposta.json();
      const fotos = dados.fotos || [];

      listaFotos.innerHTML = '';
      if (!fotos.length) {
        listaFotos.innerHTML = '<p>Nenhuma foto enviada ainda.</p>';
        return;
      }

      fotos.forEach((foto) => {
        const item = document.createElement('div');
        item.className = 'admin__foto-item';

        const imagem = document.createElement('img');
        imagem.src = foto.url;
        imagem.alt = foto.descricao || 'Foto do mural';

        const categoria = document.createElement('p');
        categoria.className = 'galeria__cat';
        categoria.textContent = foto.categoria || 'Enviada pela equipe';

        const descricao = document.createElement('p');
        descricao.textContent = foto.descricao || '(sem descrição)';

        const botaoExcluir = document.createElement('button');
        botaoExcluir.type = 'button';
        botaoExcluir.className = 'btn btn--borda admin__botao-excluir';
        botaoExcluir.textContent = 'Excluir';
        botaoExcluir.addEventListener('click', async () => {
          if (!window.confirm('Excluir esta foto do mural?')) return;
          botaoExcluir.disabled = true;
          erroFotos.textContent = '';
          try {
            const resposta = await fetch('/api/excluir', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: foto.url }),
            });
            const dados = await resposta.json().catch(() => ({}));
            if (!resposta.ok) {
              erroFotos.textContent = dados.erro || 'Não foi possível excluir a foto.';
              botaoExcluir.disabled = false;
              return;
            }
            await carregarFotos();
          } catch {
            erroFotos.textContent = 'Erro de conexão. Tente novamente.';
            botaoExcluir.disabled = false;
          }
        });

        item.append(imagem, categoria, descricao, botaoExcluir);
        listaFotos.appendChild(item);
      });
    } catch {
      listaFotos.innerHTML = '<p>Não foi possível carregar as fotos.</p>';
    }
  }

  verificarSessao();
})();
