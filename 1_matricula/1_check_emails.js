const pageEmails = new Set(
  [...document.querySelectorAll('td.cell.c2')]
    .map(td => td.textContent.trim().toLowerCase())
    .filter(e => e.includes('@'))
);

const mailList = new Set([
  //fulano.de.tal@123.com
]);

const ausentes = [...mailList].filter(e => !pageEmails.has(e));
const extras   = [...pageEmails].filter(e => !mailList.has(e));

console.log(`📋 Emails na página: ${pageEmails.size}`);
console.log(`📋 Emails na sua lista: ${mailList.size}`);
console.log(`\n❌ Na sua lista mas NÃO na página (${ausentes.length}):`, ausentes);
// console.log(`\n➕ Na página mas NÃO na sua lista (${extras.length}):`, extras);
