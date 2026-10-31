'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/* ---------- Defaults (values from the PDF sample) ---------- */
const D = {
  co: 'Imperial Law Associates Pvt. Ltd.', vat: '606519175',
  addr: 'Anamnagar-29, Kathmandu 44600, Nepal', web: 'www.lawimperial.com',
  cl: 'Dalfin A.I Solutions Pvt Ltd', cladd: 'Imadole-07, Lalitpur', clvat: '610141977',
  fy: '2082/083', beg: '2082-04-01', end: '2083-03-32',
  open: -1000.23, a: 192407.20, b: 0, c: 0, d: 0, e: 0, f: 0,
  rec: 230873, paid: 16339, tdsc: 2885.91, tdsu: 0,
  sname: 'Bikash Adhikari', sdept: 'Account and Finance', phone: '9712037082', date: '2083-04-20',
  v: { lh: 14.5, sh: 13, st: 25, sx: 28, sy: -7 }
};
const FY = ['2081/082', '2082/083', '2083/084', '2084/085', '2085/086'];
const VAT = 0.13;
const G = [
  ['Our organisation', [['co', 'Company name'], ['vat', 'VAT/PAN No'], ['addr', 'Address'], ['web', 'Email / Website']]],
  ['Client', [['cl', 'Name'], ['cladd', 'Address'], ['clvat', 'VAT/PAN No']]],
  ['Period', [['fy', 'Fiscal year', 'sel'], ['beg', 'Begins (BS)'], ['end', 'Ends (BS)']]],
  ['Opening balance', [['open', 'Amount (Dr = +, Cr = −)', 'num']]],
  ['Sales', [['a', 'Taxable sales (A)', 'num'], ['b', 'Exempt sales (B)', 'num'], ['c', 'Taxable sales return (C)', 'num']]],
  ['Purchase', [['d', 'Taxable purchase (D)', 'num'], ['e', 'Exempt purchase (E)', 'num'], ['f', 'Purchase return (F)', 'num']]],
  ['Payments', [['rec', 'Money received during the year', 'num'], ['paid', 'Money paid during the year', 'num'], ['tdsc', 'TDS deducted by client', 'num'], ['tdsu', 'TDS deducted by us', 'num']]],
  ['Signing authority', [['sname', 'Name'], ['sdept', 'Department'], ['phone', 'Contact / WhatsApp'], ['date', 'Preparation date (BS)']]]
];
const IM = [['logo', 'Logo', 'imgLogo'], ['sig', 'Signature', 'imgSig'], ['stamp', 'Stamp', 'imgStamp']];
const SL = [['lh', 'Logo height', 8, 30], ['sh', 'Signature height', 6, 40], ['st', 'Stamp height', 10, 45], ['sx', 'Signature position, left', 0, 90], ['sy', 'Signature position, up/down', -20, 15]];

/* ---------- State (saved in this browser) ---------- */
const KEY = 'balance-letter.v2';
let S = JSON.parse(JSON.stringify(D)), IMG = { ...DEF };
try {
  const z = JSON.parse(localStorage.getItem(KEY));
  if (z) { S = { ...S, ...z.S, v: { ...D.v, ...z.S.v } }; IMG = { ...IMG, ...z.IMG }; }
} catch (e) { }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ S, IMG })); } catch (e) { } };

/* ---------- Excel formulas, same as the 'Letter' sheet ---------- */
const n = k => +S[k] || 0;
function calc() {
  const r = {};
  r.vs = n('a') * VAT;                         // E20  =E19*0.13
  r.vsr = n('c') * VAT;                        // E23  =E22*0.13
  r.rs = n('a') + n('b') - n('c');             // E24  =E19+E21-E22
  r.vp = n('d') * VAT;                         // E26  =E25*0.13
  r.vpr = n('f') * VAT;                        // E29  =E28*0.13
  r.rp = n('d') + n('e') - n('f');             // E30  =E25+E27-E28
  const recv = n('a') + r.vs + n('b') - n('c') - r.vsr - n('rec') - n('tdsc');          // I24 Net Receivable
  const pay = -n('d') - r.vp - n('e') + n('f') + r.vpr + n('paid') - n('tdsu');         // I25 Net Payable
  r.close = n('open') + recv + pay;            // I28 = opening + (I24 + I25)
  return r;
}
const r2 = x => Math.round(x * 100) / 100;
const num = x => Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const amt = x => { x = r2(x); return x === 0 ? '-' : x < 0 ? `(${num(x)})` : num(x); };      // accounting format
const bal = x => (r2(x) < 0 ? 'Cr. ' : 'Dr. ') + num(x);                                   // "Dr. "#,##0.00;"Cr. "#,##0.00
const drcr = x => (x = r2(x)) < 0 ? 'CR.' : x > 0 ? 'DR.' : '(DR/CR)';

/* ---------- Draw the letter ---------- */
const row = (l, t, v, cls = '', dc = '') =>
  `<tr class="${cls}"><td><span class="n">${esc(l)}</span>${t}</td><td class="c">${dc}</td><td class="m">${v}</td></tr>`;

function draw() {
  const r = calc();
  document.querySelectorAll('[data-b]').forEach(e => e.textContent = S[e.dataset.b]);
  $('.vat').textContent = 'VAT No: ' + S.vat;
  $('.date').textContent = 'Date(BS): ' + S.date;
  $('.sub').textContent = 'Subject: Confirmation of Transactions Detail for Finalization of Tax Return ' + S.fy;
  $('#intro').textContent = `We hereby request you to confirm the transactions carried out with your organization during the fiscal year ${S.fy}, covering the period from BS ${S.beg} to BS ${S.end}.`;
  $('#tbl').innerHTML =
    '<tr><th>Particulars</th><th class="c">DR/CR</th><th class="m">Amount (Rs)</th></tr>' +
    row(`Opening Balance as on BS ${S.beg}`, '', bal(n('open')), 'b', drcr(n('open'))) +
    row('Taxable Sales', '(A)', amt(n('a'))) + row('Vat on Sales', '', amt(r.vs)) +
    row('Exempt Sales', '(B)', amt(n('b'))) + row('Taxable Sales Return', '(C)', amt(n('c'))) +
    row('Vat on Sales Return', '', amt(r.vsr)) +
    row('Reportable Sales as per Annexure 13 (A+B-C)', '', amt(r.rs), 't') +
    row('Taxable Purchase', '(D)', amt(n('d'))) + row('Vat on Purchase', '', amt(r.vp)) +
    row('Exempt Purchase', '(E)', amt(n('e'))) + row('Purchase Return', '(F)', amt(n('f'))) +
    row('Vat on Purchase Return', '', amt(r.vpr)) +
    row('Reportable Purchase as per Annexure 13 (D+E-F)', '', amt(r.rp), 't') +
    row('Money Received during the Year', '', amt(n('rec'))) + row('Money Paid during the Year', '', amt(n('paid'))) +
    row('TDS Deducted by Party', '', amt(n('tdsc'))) + row('TDS Deducted by Us', '', amt(n('tdsu'))) +
    row(`Closing Balance as on BS ${S.end}`, '', bal(r.close), 't', drcr(r.close));
  save(); fit();
}

/* Keep the letter on ONE A4 page: shrink the font until it fits. */
function fit() {
  const s = $('#sheet'), c = $('#in'), cs = getComputedStyle(s);
  const lim = s.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let fs = 12; s.style.fontSize = fs + 'pt';
  while (c.offsetHeight > lim && fs > 5) { fs -= 0.1; s.style.fontSize = fs.toFixed(1) + 'pt'; }
}

/* ---------- Input panel ---------- */
const field = (k, l, ty) => ty === 'sel'
  ? `<label>${l}<select data-k="${k}">${[...new Set([...FY, S[k]])].map(y => `<option${y == S[k] ? ' selected' : ''}>${y}</option>`).join('')}</select></label>`
  : `<label${k === 'open' ? ' class="hl"' : ''}>${l}<input data-k="${k}" ${ty === 'num' ? 'type="number" step="0.01"' : ''} value="${esc(S[k])}"></label>`;

function build() {
  $('#panel').innerHTML =
    G.map(([t, f]) => `<fieldset><legend>${t}</legend>${f.map(x => field(...x)).join('')}</fieldset>`).join('') +
    `<fieldset><legend>Logo, signature and stamp</legend>` +
    IM.map(([k, l]) => `<div class="img"><span>${l}</span><label class="btn">Upload<input type="file" accept="image/*" data-up="${k}" hidden></label><button type="button" data-rm="${k}">Remove</button></div>`).join('') +
    SL.map(([k, l, a, b]) => `<label>${l}<input type="range" class="rg" min="${a}" max="${b}" step="0.5" data-v="${k}" value="${S.v[k]}"></label>`).join('') +
    `</fieldset>`;
}
const panel = $('#panel');
panel.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.k) { S[t.dataset.k] = t.type === 'number' ? (t.value === '' ? 0 : +t.value) : t.value; draw(); }
  else if (t.dataset.v) { S.v[t.dataset.v] = +t.value; css(); save(); fit(); }
});
panel.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.up && t.files[0]) {
    const fr = new FileReader();
    fr.onload = () => { IMG[t.dataset.up] = fr.result; pics(); save(); };
    fr.readAsDataURL(t.files[0]); t.value = '';
  }
});
panel.addEventListener('click', e => { const k = e.target.dataset.rm; if (k) { IMG[k] = ''; pics(); save(); } });

const css = () => Object.entries(S.v).forEach(([k, v]) => document.documentElement.style.setProperty('--' + k, v + 'mm'));
const pics = () => { IM.forEach(([k, , id]) => { const el = $('#' + id); IMG[k] ? el.src = IMG[k] : el.removeAttribute('src'); }); fit(); };

/* ---------- Print ---------- */
const title = () => document.title = `Balance Confirmation - ${S.cl} - ${S.fy}`;
$('#bPrint').onclick = () => { title(); fit(); window.print(); };
window.addEventListener('beforeprint', () => { title(); fit(); });
$('#bReset').onclick = () => {
  if (!confirm('Reset all fields and images to the defaults?')) return;
  try { localStorage.removeItem(KEY); } catch (e) { }
  S = JSON.parse(JSON.stringify(D)); IMG = { ...DEF }; build(); css(); pics(); draw();
};

/* ---------- Email ---------- */
const dlg = $('#dlg');
const defMsg = () => `Dear Sir/Madam,\n\nPlease find attached our balance confirmation letter for the fiscal year ${S.fy} (BS ${S.beg} to BS ${S.end}). Kindly verify, sign, stamp and return it within seven (7) days.\n\nThanks & Regards,\n${S.sname}\n${S.sdept}, ${S.co}\n${S.phone}`;
$('#bMail').onclick = () => {
  if (!$('#mSub').value) $('#mSub').value = `Balance Confirmation - ${S.co} - FY ${S.fy}`;
  $('#mMsg').value = defMsg();
  dlg.showModal();
};
$('#mClose').onclick = () => dlg.close();

$('#mOpen').onclick = () => {
  const r = calc();
  const body = `${$('#mMsg').value}\n\n--- Summary ---\nOpening balance: ${bal(n('open'))}\nReportable sales: ${amt(r.rs)}\nReportable purchase: ${amt(r.rp)}\nMoney received: ${amt(n('rec'))}\nMoney paid: ${amt(n('paid'))}\nClosing balance: ${bal(r.close)}\n\n(Attach the signed PDF: use Print > Save as PDF.)`;
  location.href = `mailto:${encodeURIComponent($('#mTo').value)}?cc=${encodeURIComponent($('#mCc').value)}&subject=${encodeURIComponent($('#mSub').value)}&body=${encodeURIComponent(body)}`;
};

/* Copy the letter with inline styles so e-mail clients render it like the page. */
function mailHTML() {
  const s = $('#sheet'), c = s.cloneNode(true);
  const a = [s, ...s.querySelectorAll('*')], b = [c, ...c.querySelectorAll('*')];
  const P = ['font-family', 'font-size', 'font-weight', 'color', 'text-align', 'text-decoration-line', 'vertical-align', 'line-height', 'width', 'height', 'background-color'];
  ['top', 'right', 'bottom', 'left'].forEach(x => { ['width', 'style', 'color'].forEach(y => P.push(`border-${x}-${y}`)); P.push('padding-' + x, 'margin-' + x); });
  a.forEach((o, i) => { const cs = getComputedStyle(o); b[i].style.cssText = P.map(p => `${p}:${cs.getPropertyValue(p)}`).join(';'); });
  c.style.height = 'auto'; c.style.overflow = 'visible';
  c.querySelector('table').style.borderCollapse = 'collapse';
  const ids = { imgLogo: 'logo', imgSig: 'sig', imgStamp: 'stamp' };
  b.forEach(e => { if (e.tagName === 'IMG') { const k = ids[e.id]; IMG[k] ? e.src = `cid:${k}@letter` : e.remove(); } });
  const msg = esc($('#mMsg').value).replace(/\n/g, '<br>');
  return `<!doctype html><html><body style="margin:0;font-family:Arial,sans-serif"><p style="font-size:14px;margin:0 0 16px">${msg}</p>${c.outerHTML}</body></html>`;
}
$('#mEml').onclick = () => {
  const B = '=_letter_' + Date.now(), b64 = s => btoa(unescape(encodeURIComponent(s))), wrap = s => s.replace(/(.{76})/g, '$1\r\n');
  const m = ['X-Unsent: 1', `To: ${$('#mTo').value}`, `Cc: ${$('#mCc').value}`, `Subject: =?UTF-8?B?${b64($('#mSub').value)}?=`,
    'MIME-Version: 1.0', `Content-Type: multipart/related; type="text/html"; boundary="${B}"`, '',
    `--${B}`, 'Content-Type: text/html; charset=utf-8', 'Content-Transfer-Encoding: base64', '', wrap(b64(mailHTML()))];
  ['logo', 'sig', 'stamp'].filter(k => IMG[k]).forEach(k => {
    const [h, d] = IMG[k].split(',');
    m.push(`--${B}`, `Content-Type: ${h.match(/:(.*?);/)[1]}; name="${k}"`, 'Content-Transfer-Encoding: base64',
      `Content-ID: <${k}@letter>`, `Content-Disposition: inline; filename="${k}"`, '', wrap(d));
  });
  m.push(`--${B}--`, '');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([m.join('\r\n')], { type: 'message/rfc822' }));
  a.download = `Balance-Confirmation-${S.fy.replace('/', '-')}.eml`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

/* ---------- Start ---------- */
build(); css(); pics(); draw();
if (document.fonts) document.fonts.ready.then(fit);
