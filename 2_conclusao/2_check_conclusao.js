(function checkConclusao() {
    // ============================================================
    //  Lista de e-mails a VERIFICAR
    // ============================================================
    const emailsLista = [
        //fulano.de.tal@123.com
    ];

    // ============================================================
    //  Config
    // ============================================================
    const curso = new URLSearchParams(location.search).get('course') || 'x';
    const STORAGE_KEY = `check_conclusao_${curso}`;

    const alvos = new Set(emailsLista.map(e => e.trim().toLowerCase()).filter(Boolean));

    // Carrega estado acumulado de páginas anteriores
    const estado = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // estado[email] = { concluidas: N, total: N }

    const emailDaLinha = tr => {
        const td = tr.querySelector('td:nth-child(2)');
        return td ? td.textContent.trim().toLowerCase() : '';
    };

    // Escaneia página atual
    const linhas = document.querySelectorAll('#completion-progress tbody tr, table.generaltable tbody tr');
    let vistosNestaPagina = 0;

    for (const tr of linhas) {
        const email = emailDaLinha(tr);
        if (!alvos.has(email)) continue;
        vistosNestaPagina++;

        const celulas = tr.querySelectorAll('td.completion-progresscell a.changecompl');
        let total = 0, concluidas = 0;

        for (const a of celulas) {
            total++;
            const img = a.querySelector('img');
            if (!img) continue;
            const alt = img.getAttribute('alt') || '';
            const src = img.getAttribute('src') || '';
            const completo = !alt.includes('Not completed') && !src.endsWith('completion-manual-n');
            if (completo) concluidas++;
        }

        // Merge: se o mesmo email aparecer em mais de uma página (não deveria, mas por segurança soma)
        const prev = estado[email] || { concluidas: 0, total: 0 };
        estado[email] = {
            concluidas: prev.concluidas + concluidas,
            total: prev.total + total
        };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));

    // ============================================================
    //  Relatório
    // ============================================================
    const vistos     = Object.keys(estado);
    const completos  = vistos.filter(e => estado[e].total > 0 && estado[e].concluidas === estado[e].total);
    const parciais   = vistos.filter(e => estado[e].total > 0 && estado[e].concluidas < estado[e].total && estado[e].concluidas > 0);
    const vazios     = vistos.filter(e => estado[e].total > 0 && estado[e].concluidas === 0);
    const naoVistos  = [...alvos].filter(e => !estado[e]);

    console.log(`\n══════════════ CHECK CONCLUSÃO (acumulado até esta página) ══════════════`);
    console.log(`📄 E-mails vistos nesta página: ${vistosNestaPagina}`);
    console.log(`📊 Total acumulado verificado: ${vistos.length}/${alvos.size}`);
    console.log(`✅ Completos (todas as atividades): ${completos.length}`);
    console.log(`⚠️  Parciais (algumas pendentes):   ${parciais.length}`);
    console.log(`❌ Nenhuma marcada (tudo vazio):    ${vazios.length}`);
    console.log(`👻 Ainda não apareceram:            ${naoVistos.length}`);

    if (parciais.length) {
        console.groupCollapsed(`⚠️  PARCIAIS (${parciais.length})`);
        parciais.forEach(e => {
            const { concluidas, total } = estado[e];
            console.warn(`  ${e} — ${concluidas}/${total}`);
        });
        console.groupEnd();
    }

    if (vazios.length) {
        console.groupCollapsed(`❌ VAZIOS (${vazios.length})`);
        vazios.forEach(e => console.error(`  ${e} — 0/${estado[e].total}`));
        console.groupEnd();
    }

    if (naoVistos.length) {
        console.groupCollapsed(`👻 NÃO VISTOS — vá para a próxima página (${naoVistos.length})`);
        naoVistos.forEach(e => console.log(`  ${e}`));
        console.groupEnd();
    }

    if (naoVistos.length === 0 && parciais.length === 0 && vazios.length === 0) {
        console.log(`\n🎉 Todos os ${alvos.size} e-mails foram verificados e estão 100% concluídos!`);
    }

    console.log(`\nℹ️  Para zerar o acompanhamento: localStorage.removeItem('${STORAGE_KEY}')`);

    // Expõe no window para inspeção manual se precisar
    window.__check = { estado, completos, parciais, vazios, naoVistos };
})();
