(async function concluirCursoV() {
    // ============================================================
    //  Lista de e-mails a CONCLUIR (mesma turma da matrícula)
    // ============================================================
    const emailsListaV = [
        //fulano.de.tal@123.com
    ];

    // (Opcional) Restringir a atividades específicas pelo NOME exato da coluna.
    // Deixe [] para marcar TODAS as atividades incompletas.
    // Ex.: ["Data Fundamentals", "SQL for data analysis"]
    const atividadesAlvo = [];

    // ============================================================
    //  Config
    // ============================================================
    const TIMEOUT = 8000;  // espera máx. pelo modal / AJAX (ms)
    const POLL = 120;
    const MAX_ITER = 3000; // trava de segurança contra loop infinito
    const curso = new URLSearchParams(location.search).get('course') || 'x';
    const STORAGE_KEY = `conclusao_curso_${curso}`;

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    async function aguardar(cond, timeout = TIMEOUT) {
        const ini = Date.now();
        while (Date.now() - ini < timeout) {
            const r = cond();
            if (r) return r;
            await sleep(POLL);
        }
        return null;
    }

    // Normaliza alvos (trim + lowercase)
    const alvos = new Set(emailsListaV.map(e => (e || '').trim().toLowerCase()).filter(Boolean));
    if (alvos.size === 0) {
        console.error("❌ emailsListaV está vazio. Preencha a lista de e-mails.");
        return;
    }
    const atividadesSet = new Set(atividadesAlvo.map(a => a.trim().toLowerCase()).filter(Boolean));

    // Estado acumulado entre páginas (sobrevive à navegação)
    const estado = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"feitos":{},"encontrados":[]}');
    const encontradosSet = new Set(estado.encontrados);
    const salvarEstado = () => localStorage.setItem(STORAGE_KEY,
        JSON.stringify({ feitos: estado.feitos, encontrados: [...encontradosSet] }));

    const pulados = new Set(); // células canceladas/com erro, para não repetir nesta execução

    // E-mail de uma linha = 2ª coluna (1ª é o <th> do nome)
    const emailDaLinha = tr => {
        const td = tr.querySelector('td:nth-child(2)');
        return td ? td.textContent.trim().toLowerCase() : '';
    };

    // Próxima atividade INCOMPLETA de um e-mail-alvo (re-escaneia o DOM a cada chamada)
    function proximoPendente() {
        const linhas = document.querySelectorAll('#completion-progress tbody tr, table.generaltable tbody tr');
        for (const tr of linhas) {
            const email = emailDaLinha(tr);
            if (!alvos.has(email)) continue;
            encontradosSet.add(email); // achei esse e-mail nesta página
            for (const a of tr.querySelectorAll('td.completion-progresscell a.changecompl')) {
                const id = a.getAttribute('data-changecompl');
                if (pulados.has(id)) continue;
                const img = a.querySelector('img');
                if (!img) continue;
                const alt = img.getAttribute('alt') || '';
                const src = img.getAttribute('src') || '';
                // só caixas vazias ("Not completed")
                const incompleto = alt.includes('Not completed') || src.endsWith('completion-manual-n');
                if (!incompleto) continue;
                // filtro opcional por nome de atividade
                if (atividadesSet.size) {
                    const nome = (a.getAttribute('data-activityname') || '').trim().toLowerCase();
                    if (!atividadesSet.has(nome)) continue;
                }
                return { a, id, email, atividade: a.getAttribute('data-activityname') || '?' };
            }
        }
        return null;
    }

    // Modal aberto + botão salvar + texto do corpo
    function infoModal() {
        const modal = document.querySelector('.modal.show');
        if (!modal) return null;
        const save = Array.from(modal.querySelectorAll('button, .btn'))
            .find(b => /save changes|salvar/i.test(b.textContent || ''));
        return { modal, save, texto: modal.textContent || '' };
    }
    const clicarCancel = modal => {
        const c = Array.from(modal.querySelectorAll('button, .btn'))
            .find(b => /cancel|cancelar/i.test(b.textContent || ''));
        if (c) c.click();
    };

    console.log(`🚀 Conclusão (página atual). Alvos: ${alvos.size} e-mail(s).` +
        (atividadesSet.size ? ` Atividades: ${[...atividadesSet].join(', ')}.` : ' Todas as atividades.'));

    let marcados = 0, abortados = 0, iter = 0;

    while (iter++ < MAX_ITER) {
        const pend = proximoPendente();
        if (!pend) break;

        pend.a.click(); // abre o modal de confirmação

        const m = await aguardar(() => {
            const info = infoModal();
            return (info && info.save) ? info : null;
        });

        if (!m) {
            console.warn(`⚠️ Modal não abriu para ${pend.email} / "${pend.atividade}". Pulando.`);
            pulados.add(pend.id); abortados++;
            continue;
        }

        // SEGURANÇA: só salva se o modal for para marcar COMO CONCLUÍDO.
        // Se aparecer "Not completed", o clique iria DESMARCAR → cancela.
        if (/not completed/i.test(m.texto)) {
            console.warn(`🛑 Modal pediria DESMARCAR ${pend.email}/"${pend.atividade}". Cancelando por segurança.`);
            clicarCancel(m.modal);
            pulados.add(pend.id); abortados++;
            await aguardar(() => !document.querySelector('.modal.show'));
            continue;
        }

        m.save.click();
        await aguardar(() => !document.querySelector('.modal.show')); // espera o AJAX fechar o modal
        await sleep(300); // settle do ícone

        marcados++;
        estado.feitos[pend.email] = (estado.feitos[pend.email] || 0) + 1;
        encontradosSet.add(pend.email);
        salvarEstado();
        // console.log(`✅ ${pend.email} — "${pend.atividade}" marcada como concluída (${marcados} nesta página).`);
    }

    salvarEstado();
    const faltam = [...alvos].filter(e => !encontradosSet.has(e));

    console.log("══════════════ RESUMO (página atual) ══════════════");
    console.log(`✅ Atividades marcadas nesta página .. ${marcados}`);
    if (abortados) console.warn(`🛑 Puladas (segurança/erro) ......... ${abortados}`);
    console.log(`👥 E-mails-alvo já vistos (todas pgs) . ${encontradosSet.size}/${alvos.size}`);
    if (faltam.length) {
        console.warn("➡️  Ainda NÃO apareceram (devem estar em outras páginas):", faltam);
        console.log("👉 Vá para a PRÓXIMA página (») e rode o script de novo.");
    } else {
        console.log("🎉 Todos os e-mails-alvo já foram encontrados em alguma página!");
        console.log(`ℹ️ Para zerar o acompanhamento: localStorage.removeItem('${STORAGE_KEY}')`);
    }
    window.__conclusao = { feitos: estado.feitos, encontrados: [...encontradosSet], faltam };
})();
