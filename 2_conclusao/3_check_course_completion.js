(function checkCourseCompletion() {
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
    const STORAGE_KEY = `check_course_completion_${curso}`;

    const alvos = new Set(emailsLista.map(e => e.trim().toLowerCase()).filter(Boolean));

    // Carrega estado acumulado de páginas anteriores
    const estado = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // estado[email] = { concluidas: N, total: N, cursoCompleto: bool }

    const emailDaLinha = tr => {
        const td = tr.querySelector('td:nth-child(2)');
        return td ? td.textContent.trim().toLowerCase() : '';
    };

    // Escaneia página atual
    const linhas = document.querySelectorAll('#completion-progress tbody tr');
    let vistosNestaPagina = 0;

    for (const tr of linhas) {
        const email = emailDaLinha(tr);
        if (!alvos.has(email)) continue;
        vistosNestaPagina++;

        const celulas = tr.querySelectorAll('td.completion-progresscell');
        let total = 0, concluidas = 0, cursoCompleto = false;

        celulas.forEach((td, idx) => {
            total++;
            const img = td.querySelector('img');
            if (!img) return;
            const src = img.getAttribute('src') || '';
            const alt = img.getAttribute('alt') || '';
            const completo = src.endsWith('completion-auto-y') || src.endsWith('completion-manual-y');

            if (completo) {
                concluidas++;
                // última coluna costuma ser "Course complete"
                if (idx === celulas.length - 1) cursoCompleto = true;
            }
        });

        estado[email] = { concluidas, total, cursoCompleto };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));

    // ============================================================
    //  Relatório
    // ============================================================
    const vistos    = Object.keys(estado);
    const completos = vistos.filter(e => estado[e].cursoCompleto);
    const parciais  = vistos.filter(e => !estado[e].cursoCompleto && estado[e].concluidas > 0);
    const vazios    = vistos.filter(e => estado[e].concluidas === 0 && estado[e].total > 0);
    const naoVistos = [...alvos].filter(e => !estado[e]);

    console.log(`\n══════════════ COURSE COMPLETION CHECK (acumulado até esta página) ══════════════`);
    console.log(`📄 E-mails vistos nesta página : ${vistosNestaPagina}`);
    console.log(`📊 Total acumulado verificado  : ${vistos.length}/${alvos.size}`);
    console.log(`✅ Curso completo               : ${completos.length}`);
    console.log(`⚠️  Parciais (critérios faltando): ${parciais.length}`);
    console.log(`❌ Nenhum critério marcado      : ${vazios.length}`);
    console.log(`👻 Ainda não apareceram         : ${naoVistos.length}`);

    if (parciais.length) {
        console.groupCollapsed(`⚠️  PARCIAIS (${parciais.length})`);
        parciais.forEach(e => {
            const { concluidas, total } = estado[e];
            console.warn(`  ${e} — ${concluidas}/${total} critérios`);
        });
        console.groupEnd();
    }

    if (vazios.length) {
        console.groupCollapsed(`❌ VAZIOS (${vazios.length})`);
        vazios.forEach(e => console.error(`  ${e} — 0/${estado[e].total} critérios`));
        console.groupEnd();
    }

    if (naoVistos.length) {
        console.groupCollapsed(`👻 NÃO VISTOS — vá para a próxima página (${naoVistos.length})`);
        naoVistos.forEach(e => console.log(`  ${e}`));
        console.groupEnd();
    }

    if (naoVistos.length === 0 && parciais.length === 0 && vazios.length === 0) {
        console.log(`\n🎉 Todos os ${alvos.size} e-mails estão com o curso completo!`);
    }

    console.log(`\nℹ️  Para zerar: localStorage.removeItem('${STORAGE_KEY}')`);

    window.__checkCourse = { estado, completos, parciais, vazios, naoVistos };
})();
