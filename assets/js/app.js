/**
 * FÊNIX CONSTRUTORA — JS v5
 * 1. Menu mobile tela cheia
 * 2. Máscara telefone
 * 3. Formulário
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