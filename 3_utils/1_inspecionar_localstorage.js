(function inspecionarLocalStorage() {
    // ============================================================
    //  Prefixos de chave usados pelos scripts de conclusão
    // ============================================================
    //  conclusao_curso_<curso>          -> 1_concluir_curso.js
    //  check_conclusao_<curso>          -> 2_check_conclusao.js
    //  check_course_completion_<curso>  -> 3_check_course_completion.js
    const PREFIXOS = [
        'conclusao_curso_',
        'check_conclusao_',
        'check_course_completion_',
    ];

    const bytes = str => new Blob([str || '']).size;
    const fmt = n => n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;

    // ============================================================
    //  Coleta as chaves que casam com algum prefixo
    // ============================================================
    const achados = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const prefixo = PREFIXOS.find(p => key.startsWith(p));
        if (!prefixo) continue;

        const raw = localStorage.getItem(key);
        const curso = key.slice(prefixo.length) || '(sem id)';

        let parsed = null, ok = true;
        try { parsed = JSON.parse(raw); } catch (e) { ok = false; }

        achados.push({ key, prefixo, curso, raw, parsed, ok, tamanho: bytes(raw) });
    }

    // ============================================================
    //  Relatório
    // ============================================================
    console.log(`\n══════════════ LIXO NO LOCALSTORAGE (scripts de conclusão) ══════════════`);
    console.log(`🔑 Total de chaves no localStorage : ${localStorage.length}`);
    console.log(`🎯 Chaves dos scripts encontradas  : ${achados.length}`);

    if (achados.length === 0) {
        console.log(`\n✨ Nada encontrado. localStorage limpo desses scripts.`);
        return;
    }

    const totalBytes = achados.reduce((s, a) => s + a.tamanho, 0);
    console.log(`💾 Espaço ocupado por elas         : ${fmt(totalBytes)}`);

    // Agrupa por prefixo para leitura
    for (const prefixo of PREFIXOS) {
        const grupo = achados.filter(a => a.prefixo === prefixo);
        if (!grupo.length) continue;

        console.groupCollapsed(`📦 ${prefixo}*  (${grupo.length})`);
        grupo.forEach(a => {
            // tenta extrair um resuminho útil dependendo do formato
            let resumo = '';
            if (a.ok && a.parsed && typeof a.parsed === 'object') {
                if (a.parsed.encontrados) {
                    // formato do 1_concluir_curso.js
                    const f = a.parsed.feitos || {};
                    resumo = `encontrados: ${a.parsed.encontrados.length}, e-mails c/ marcações: ${Object.keys(f).length}`;
                } else {
                    // formato dos checks (estado[email] = {...})
                    resumo = `e-mails: ${Object.keys(a.parsed).length}`;
                }
            } else if (!a.ok) {
                resumo = '⚠️ JSON inválido';
            }
            console.log(`  • curso=${a.curso} — ${fmt(a.tamanho)}${resumo ? ' — ' + resumo : ''}`);
            console.log(`     chave: "${a.key}"`);
        });
        console.groupEnd();
    }

    // ============================================================
    //  Comandos prontos para limpar
    // ============================================================
    console.log(`\n──────────────── COMO LIMPAR ────────────────`);
    console.log(`▶ Remover UMA chave específica:`);
    achados.forEach(a => console.log(`   localStorage.removeItem('${a.key}');`));

    console.log(`\n▶ Remover TODAS as ${achados.length} de uma vez (cole e rode):`);
    const todas = achados.map(a => a.key);
    console.log(`   ${JSON.stringify(todas)}.forEach(k => localStorage.removeItem(k));`);

    // Expõe para inspeção / limpeza programática
    window.__lsLixo = {
        achados,
        chaves: todas,
        limparTudo: () => {
            todas.forEach(k => localStorage.removeItem(k));
            console.log(`🧹 ${todas.length} chave(s) removida(s).`);
        }
    };
    console.log(`\nℹ️ Atalho: rode  window.__lsLixo.limparTudo()  para apagar todas agora.`);
})();
