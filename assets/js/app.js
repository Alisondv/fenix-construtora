/**
 * FÊNIX CONSTRUTORA — JS v5
 * 1. Menu mobile tela cheia
 * 2. Máscara telefone
 * 3. Formulário
 * 4. Download das fotos da galeria
 * 5. Fotos enviadas pelo admin (mural dinâmico)
 */

/* 1. MENU MOBILE */
(function () {
  const botaoAbrir   = document.getElementById('botao-menu-mobile');
  const botaoFechar  = document.getElementById('botao-fechar-menu');
  const overlay      = document.getElementById('menu-mobile-overlay');
  const linksMenu    = overlay?.querySelectorAll('.menu-mobile__link');

  if (!botaoAbrir || !overlay) return;

  function abrirMenu() {
    overlay.classList.add('aberto');
    document.body.style.overflow = 'hidden';
    botaoAbrir.setAttribute('aria-expanded', 'true');
    botaoFechar?.focus();
  }

  function fecharMenu() {
    overlay.classList.remove('aberto');
    document.body.style.overflow = '';
    botaoAbrir.setAttribute('aria-expanded', 'false');
    botaoAbrir.focus();
  }

  botaoAbrir.addEventListener('click', abrirMenu);
  botaoFechar?.addEventListener('click', fecharMenu);

  linksMenu?.forEach(link => link.addEventListener('click', fecharMenu));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) fecharMenu();
  });

  /* Fechar menu ao redimensionar para desktop */
  window.matchMedia('(min-width: 761px)').addEventListener('change', (e) => {
    if (e.matches && !overlay.hidden) fecharMenu();
  });
})();

/* 2. MÁSCARA TELEFONE */
(function () {
  const campo = document.getElementById('campo-telefone-cliente');
  if (!campo) return;
  campo.addEventListener('input', (e) => {
    let d = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 10) {
      e.target.value = d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      e.target.value = d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    }
  });
})();

/* 3. FORMULÁRIO — envia dados via WhatsApp */
(function () {
  const formulario   = document.getElementById('formulario-orcamento');
  const botaoEnviar  = document.getElementById('botao-enviar-formulario');
  const textoNoBotao = document.getElementById('texto-botao-enviar');
  if (!formulario) return;

  /* Número WhatsApp da Fênix Construtora */
  const numeroWhatsApp = '5516996289719';

  /* Mapa de valores legíveis para o select de serviços */
  const nomesServicos = {
    'construcao-casas':  'Construção de Casas',
    'terraplanagem':     'Terraplanagem',
    'pavimentacao':      'Pavimentação',
    'galerias-drenagem': 'Galerias de Drenagem',
    'agua-potavel':      'Água Potável',
    'redes-esgoto':      'Redes de Esgoto',
    'guias-sarjetas':    'Guias e Sarjetas',
    'outro':             'Outro / Não sei ainda',
  };

  const regras = {
    'campo-nome-cliente':      { ok: v => v.trim().length >= 3,                  msg: 'Informe seu nome completo.' },
    'campo-email-cliente':     { ok: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'E-mail inválido.' },
    'campo-telefone-cliente':  { ok: v => v.replace(/\D/g,'').length >= 10,      msg: 'Informe o telefone com DDD.' },
    'campo-servico-interesse': { ok: v => v !== '',                               msg: 'Selecione um serviço.' },
    'campo-mensagem-projeto':  { ok: v => v.trim().length >= 10,                 msg: 'Descreva brevemente o projeto.' },
  };

  function marcarErro(id, mensagem) {
    const elementoCampo = document.getElementById(id);
    if (!elementoCampo) return;
    elementoCampo.style.borderColor = '#c0392b';
    const containerCampo = elementoCampo.closest('.campo');
    let elementoErro = containerCampo?.querySelector('.campo__erro');
    if (!elementoErro) {
      elementoErro = document.createElement('p');
      elementoErro.className = 'campo__erro';
      containerCampo?.appendChild(elementoErro);
    }
    elementoErro.textContent = mensagem;
  }

  function limparErro(id) {
    const elementoCampo = document.getElementById(id);
    if (!elementoCampo) return;
    elementoCampo.style.borderColor = '';
    elementoCampo.closest('.campo')?.querySelector('.campo__erro')?.remove();
  }

  function validarFormulario() {
    let formularioValido = true;
    Object.entries(regras).forEach(([id, { ok: funcaoValidadora, msg: mensagemErro }]) => {
      const elementoCampo = document.getElementById(id);
      if (!elementoCampo) return;
      if (!funcaoValidadora(elementoCampo.value)) {
        marcarErro(id, mensagemErro);
        formularioValido = false;
      } else {
        limparErro(id);
      }
    });
    return formularioValido;
  }

  function montarMensagemWhatsApp(dadosFormulario) {
    const nomeServico = nomesServicos[dadosFormulario.servicoInteresse] || dadosFormulario.servicoInteresse;
    const linhas = [
      '📋 *Solicitação de Orçamento*',
      '',
      `*Nome:* ${dadosFormulario.nomeCliente}`,
      `*Telefone:* ${dadosFormulario.telefoneCliente}`,
      `*E-mail:* ${dadosFormulario.emailCliente}`,
      `*Serviço:* ${nomeServico}`,
      '',
      `*Descrição do projeto:*`,
      dadosFormulario.mensagemProjeto,
    ];
    return linhas.join('\n');
  }

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const dadosFormulario = {
      nomeCliente:       document.getElementById('campo-nome-cliente').value.trim(),
      telefoneCliente:   document.getElementById('campo-telefone-cliente').value.trim(),
      emailCliente:      document.getElementById('campo-email-cliente').value.trim(),
      servicoInteresse:  document.getElementById('campo-servico-interesse').value,
      mensagemProjeto:   document.getElementById('campo-mensagem-projeto').value.trim(),
    };

    const mensagemCodificada = encodeURIComponent(montarMensagemWhatsApp(dadosFormulario));
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;

    /* Feedback visual antes de abrir o WhatsApp */
    botaoEnviar.disabled = true;
    textoNoBotao.textContent = 'Abrindo WhatsApp…';

    window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');

    /* Restaurar botão após 3 segundos */
    setTimeout(() => {
      botaoEnviar.disabled = false;
      textoNoBotao.textContent = 'Solicitar Orçamento Gratuito';
    }, 3000);
  });
})();

/* 4. DOWNLOAD DAS FOTOS DA GALERIA */
(function () {
  const botaoBaixarTodas = document.getElementById('botao-baixar-todas-fotos');
  const textoBotaoBaixarTodas = document.getElementById('texto-botao-baixar-todas');
  if (!botaoBaixarTodas) return;

  /* Baixa um blob usando um link temporário */
  function dispararDownload(blobUrl, nomeArquivo) {
    const linkTemporario = document.createElement('a');
    linkTemporario.href = blobUrl;
    linkTemporario.download = nomeArquivo;
    document.body.appendChild(linkTemporario);
    linkTemporario.click();
    linkTemporario.remove();
  }

  botaoBaixarTodas.addEventListener('click', async () => {
    /* Consultado no momento do clique (não no carregamento da página) para
       incluir também as fotos enviadas pelo admin, adicionadas de forma
       assíncrona pela seção 5 abaixo. */
    const linksFoto = document.querySelectorAll('.galeria__download');
    if (!linksFoto.length) return;

    if (typeof JSZip === 'undefined') {
      window.alert('Não foi possível carregar o compactador de arquivos. Verifique sua conexão e tente novamente.');
      return;
    }

    botaoBaixarTodas.disabled = true;
    textoBotaoBaixarTodas.textContent = 'Preparando arquivo…';

    try {
      const pacoteZip = new JSZip();

      await Promise.all(Array.from(linksFoto).map(async (link) => {
        const resposta = await fetch(link.getAttribute('href'));
        if (!resposta.ok) throw new Error(`Falha ao buscar ${link.getAttribute('href')}`);
        const blobFoto = await resposta.blob();
        pacoteZip.file(link.getAttribute('download'), blobFoto);
      }));

      const blobZip = await pacoteZip.generateAsync({ type: 'blob' });
      const urlZip = URL.createObjectURL(blobZip);
      dispararDownload(urlZip, 'fotos-fenix-construtora.zip');
      URL.revokeObjectURL(urlZip);
    } catch (erro) {
      console.error('Erro ao gerar o arquivo com as fotos:', erro);
      window.alert('Não foi possível baixar as fotos agora. Tente novamente em alguns instantes.');
    } finally {
      botaoBaixarTodas.disabled = false;
      textoBotaoBaixarTodas.textContent = 'Baixar todas as fotos';
    }
  });
})();

/* 5. FOTOS ENVIADAS PELO ADMIN (mural dinâmico) */
(function () {
  const grade = document.querySelector('.galeria__grade');
  if (!grade) return;

  fetch('/api/fotos')
    .then((resposta) => (resposta.ok ? resposta.json() : { fotos: [] }))
    .then((dados) => {
      (dados.fotos || []).forEach((foto) => {
        const nomeArquivoDownload = `fenix-${(foto.nomeArquivo || 'foto-galeria').replace(/[^a-z0-9.-]+/gi, '-')}`;
        const urlDownload = `/api/baixar?url=${encodeURIComponent(foto.url)}&nome=${encodeURIComponent(nomeArquivoDownload)}`;

        const figura = document.createElement('figure');
        figura.className = 'galeria__item';

        const media = document.createElement('div');
        media.className = 'galeria__media';

        const imagem = document.createElement('img');
        imagem.src = foto.url;
        imagem.alt = foto.descricao || 'Foto da obra enviada pela equipe';
        imagem.className = 'galeria__foto';
        imagem.loading = 'lazy';

        const linkDownload = document.createElement('a');
        linkDownload.href = urlDownload;
        linkDownload.download = nomeArquivoDownload;
        linkDownload.className = 'galeria__download';
        linkDownload.setAttribute('aria-label', 'Baixar foto');
        linkDownload.title = 'Baixar foto';
        linkDownload.innerHTML =
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>';

        media.append(imagem, linkDownload);

        const legenda = document.createElement('figcaption');
        legenda.className = 'galeria__cap';

        const categoria = document.createElement('span');
        categoria.className = 'galeria__cat';
        categoria.textContent = 'Enviada pela equipe';

        const descricao = document.createElement('span');
        descricao.className = 'galeria__desc-foto';
        descricao.textContent = foto.descricao || 'Foto da obra';

        legenda.append(categoria, descricao);
        figura.append(media, legenda);
        grade.appendChild(figura);
      });
    })
    .catch((erro) => console.error('Não foi possível carregar as fotos adicionais da galeria:', erro));
})();