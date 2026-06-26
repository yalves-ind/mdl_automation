# Moodle Automation — Matrícula e Conclusão

Conjunto de scripts de **console do navegador** (DevTools) para automatizar tarefas repetitivas de gestão de turmas no Moodle: conferência de e-mails, matrícula em massa, marcação de atividades como concluídas e validação de conclusão de curso/trilha.

> ⚠️ **Importante:** estes scripts são executados **manualmente** no Console do navegador (F12 → aba *Console*), com a página correta do Moodle já aberta. Não há instalação, build ou dependências.

---

## ⚠️ Aviso sobre dados pessoais (LGPD)

Os scripts trabalham com **listas de e-mails de alunos**. Antes de usar, você cola os e-mails reais na variável de lista no topo de cada script (atualmente vazia).

**Nunca commite e-mails reais!**

---

## Pré-requisitos

- Acesso de administrador/gestor ao Moodle.
- Navegador com DevTools (Chrome, Edge, Firefox).
- A página correta do Moodle aberta para cada etapa (ver tabela abaixo).

## Como executar um script

1. Abra a página indicada do Moodle.
2. Pressione `F12` e vá até a aba **Console**.
3. Abra o arquivo `.js` desejado, **preencha a lista de e-mails** no topo (`emailsLista` / `emailsListaV` / `mailList`).
4. Cole o conteúdo inteiro no Console e pressione `Enter`.
5. Leia o resumo impresso no próprio Console.

---

## Fluxo de trabalho completo

A ordem das pastas e dos arquivos reflete a sequência do processo:

### 1. Matrícula — pasta [`1_matricula/`](1_matricula/)

| Passo | Script | Onde rodar | O que faz |
|-------|--------|-----------|-----------|
| 1.1 | [`1_check_emails.js`](1_matricula/1_check_emails.js) | Relatório/listagem de alunos do curso | Compara os e-mails que aparecem na página com a sua lista. Mostra quem está **na sua lista mas não na página** (ainda não matriculados). |
| 1.2 | [`2_matricula_alunos.js`](1_matricula/2_matricula_alunos.js) | Pop-up **"Enrol users"** aberto | Para cada e-mail da lista, busca no autocomplete e seleciona o usuário. Ao final, **confira a seleção e clique manualmente** em *"Enrol selected users and cohorts"*. |
| 1.3 | [`1_check_emails.js`](1_matricula/1_check_emails.js) | Relatório/listagem de alunos (de novo) | Roda novamente para confirmar que ninguém ficou de fora da matrícula. |

### 2. Conclusão — pasta [`2_conclusao/`](2_conclusao/)

| Passo | Script | Onde rodar | O que faz |
|-------|--------|-----------|-----------|
| 2.1 | [`1_concluir_curso.js`](2_conclusao/1_concluir_curso.js) | Tela de **conclusão manual de atividades** (completion report editável) | Marca os checkboxes das atividades **incompletas** para os e-mails-alvo. Possui trava de segurança: **só marca como concluído, nunca desmarca**. Acumula estado entre páginas (rode em cada página da paginação). |
| 2.2 | [`2_check_conclusao.js`](2_conclusao/2_check_conclusao.js) | Mesma tela de conclusão de atividades | Verifica se todas as atividades foram marcadas corretamente, seguindo as mesmas regras do script anterior. Classifica em **completos / parciais / vazios / não vistos**. |
| 2.3 | [`3_check_course_completion.js`](2_conclusao/3_check_course_completion.js) | Report de **Course completion** (ou da trilha) | Validação final: confirma que as aulas/cursos (no caso das trilhas) estão todos marcados e que o **curso aparece como completo**. |

---

## Observações técnicas

- **Estado acumulado entre páginas:** os scripts de conclusão (`2.1`, `2.2`, `2.3`) salvam progresso no `localStorage`, com chave por curso (`course=` da URL). Isso permite rodar página a página na paginação do Moodle sem perder o que já foi processado.
- **Resetar o acompanhamento:** cada script imprime no Console o comando exato para limpar seu estado, por ex.:
  ```js
  localStorage.removeItem('check_conclusao_<idDoCurso>')
  ```
- **Resultados expostos no `window`** para inspeção manual: `window.__resultadoMatricula`, `window.__conclusao`, `window.__check`, `window.__checkCourse`.
- Os scripts dependem da **estrutura de DOM/classes do Moodle** (ex.: `td.completion-progresscell`, `a.changecompl`, `#completion-progress`). Mudanças de tema/versão do Moodle podem exigir ajustes nos seletores.

---

## Estrutura do repositório

```
mdl_automation/
├── .gitignore
├── README.md
├── 1_matricula/
│   ├── 1_check_emails.js       # confere quem falta matricular
│   └── 2_matricula_alunos.js   # seleciona alunos no pop-up de matrícula
└── 2_conclusao/
    ├── 1_concluir_curso.js          # marca atividades como concluídas
    ├── 2_check_conclusao.js         # valida marcação das atividades
    └── 3_check_course_completion.js # valida conclusão do curso/trilha
```
