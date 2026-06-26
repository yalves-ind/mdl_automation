(async function rodarCadastroV() {
    // ============================================================
    //  Lista de e-mails a matricular
    // ============================================================
    const emailsListaV = [
       //fulano.de.tal@123.com
    ];

    // ============================================================
    //  Configurações
    // ============================================================
    const TIMEOUT_SUGESTOES = 6000; // espera máx. pela busca do Moodle (ms)
    const INTERVALO_POLL = 150;     // intervalo entre verificações (ms)
    const PAUSA_APOS_CLIQUE = 300;  // espera após selecionar (ms)
    const PAUSA_ENTRE_EMAILS = 400; // espera entre um e-mail e outro (ms)

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // Espera uma condição virar "truthy" ou estoura o timeout
    async function aguardar(cond, timeout = TIMEOUT_SUGESTOES) {
        const inicio = Date.now();
        while (Date.now() - inicio < timeout) {
            const r = cond();
            if (r) return r;
            await sleep(INTERVALO_POLL);
        }
        return null;
    }

    // ============================================================
    //  Localiza o campo "Select users" (1º autocomplete da tela;
    //  o 2º é "Select cohorts")
    // ============================================================
    const campoBusca = document.querySelector('input[data-fieldtype="autocomplete"]');
    if (!campoBusca) {
        console.error("❌ Campo de busca (autocomplete) não encontrado na tela!");
        return;
    }
    // id da lista de sugestões, extraído do próprio campo
    const idSugestoes = (campoBusca.getAttribute('aria-owns') || '').split(' ')[0]
        || campoBusca.getAttribute('list');

    // ============================================================
    //  Totalizadores
    // ============================================================
    const sucesso = [];      // selecionados com sucesso
    const naoEncontrados = []; // nenhuma sugestão correspondente
    const duplicados = [];   // e-mails repetidos na lista

    // Normaliza e remove duplicados, registrando-os
    const vistos = new Set();
    const fila = [];
    for (const bruto of emailsListaV) {
        const email = (bruto || '').trim().toLowerCase();
        if (!email) continue;
        if (vistos.has(email)) {
            duplicados.push(email);
            continue;
        }
        vistos.add(email);
        fila.push(email);
    }

    console.log(`🚀 Iniciando cadastro para ${fila.length} e-mail(s) único(s)` +
        (duplicados.length ? ` (${duplicados.length} duplicado(s) ignorado(s))` : '') + '.');

    // ============================================================
    //  Loop principal
    // ============================================================
    for (let i = 0; i < fila.length; i++) {
        const email = fila[i];
        const tag = `[${i + 1}/${fila.length}] ${email}`;
        console.log(`🔎 ${tag} — buscando...`);

        // "Digita" o e-mail
        campoBusca.focus();
        campoBusca.value = email;
        campoBusca.dispatchEvent(new Event('input', { bubbles: true }));
        campoBusca.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));

        // Só clica numa opção VISÍVEL cujo texto contenha o e-mail
        const opcao = await aguardar(() => {
            const lista = document.getElementById(idSugestoes);
            if (!lista) return null;
            return Array.from(lista.querySelectorAll('[role="option"]'))
                .filter(li => li.offsetParent !== null) // só visíveis
                .find(li => li.textContent.toLowerCase().includes(email)) || null;
        });

        if (opcao) {
            opcao.click();
            await sleep(PAUSA_APOS_CLIQUE);
            sucesso.push(email);
            console.log(`✅ ${tag} — selecionado: "${opcao.textContent.trim()}"`);
        } else {
            naoEncontrados.push(email);
            console.warn(`⚠️ ${tag} — nenhuma sugestão correspondente encontrada.`);
            // limpa o campo para não atrapalhar o próximo
            campoBusca.value = '';
            campoBusca.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await sleep(PAUSA_ENTRE_EMAILS);
    }

    // ============================================================
    //  Resumo / totalizadores
    // ============================================================
    console.log("══════════════ RESUMO ══════════════");
    console.log(`📋 Total na lista ......... ${emailsListaV.length}`);
    console.log(`🔁 Duplicados ignorados ... ${duplicados.length}`);
    console.log(`✅ Adicionados ............ ${sucesso.length}`);
    console.log(`⚠️  Não encontrados ........ ${naoEncontrados.length}`);
    if (naoEncontrados.length) console.warn("   → Não encontrados:", naoEncontrados);
    if (duplicados.length) console.warn("   → Duplicados:", duplicados);
    console.log("═════════════════════════════════════");
    console.log("👉 Confira a seleção na tela e clique em 'Enrol selected users and cohorts'.");

    // Disponibiliza o resultado para inspeção manual no console, se quiser
    window.__resultadoMatricula = { sucesso, naoEncontrados, duplicados };
})();
