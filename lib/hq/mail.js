/* ============================================================
   CIEL ADMIN — real business email (hello@ and lorna@cielafrica.com)
   Reads the actual mailboxes over IMAP and sends over SMTP at the
   mail provider (Truehost App Suite). Nothing is copied into another
   database: Ciel Admin shows what is in the mailbox.
   Vercel environment variables (set by the owner, never in code):
     MAIL_IMAP_HOST, MAIL_IMAP_PORT (993)   incoming server
     MAIL_SMTP_HOST, MAIL_SMTP_PORT (465)   outgoing server
     MAIL_HELLO_PASSWORD                    password of hello@cielafrica.com
     MAIL_LORNA_PASSWORD                    password of lorna@cielafrica.com
   ============================================================ */
/* lorna@ is the real mailbox; hello@ is an alias delivered into it. Sending "from hello@" signs in
   as lorna@ and sends with hello@ as the From address (unless hello@ gets its own password). */
const ACCOUNTS = {
  lorna: { id: 'lorna', email: 'lorna@cielafrica.com', name: 'Lorna · Ciel Africa', env: 'MAIL_LORNA_PASSWORD' },
  hello: { id: 'hello', email: 'hello@cielafrica.com', name: 'Ciel Africa', env: 'MAIL_HELLO_PASSWORD', aliasOf: 'lorna' }
};
const login = a => (a.aliasOf && process.env.MAIL_HELLO_OWN_MAILBOX !== '1' ? ACCOUNTS[a.aliasOf] : a);
const err = (status, code, message) => Object.assign(new Error(message), { status, code });
const hostOk = () => !!(process.env.MAIL_IMAP_HOST && process.env.MAIL_SMTP_HOST);
function account(id) { const a = ACCOUNTS[id]; if (!a) throw err(400, 'acct', 'Unknown mailbox.'); const l = login(a); if (!hostOk() || !process.env[l.env]) throw err(503, 'mail-setup', a.email + ' isn’t connected yet. Add its settings in Vercel (see Setup).'); return a; }
function configured() { return Object.values(ACCOUNTS).map(a => ({ id: a.id, email: a.email, alias: login(a) !== a, mailbox: login(a).id, configured: hostOk() && !!process.env[login(a).env] })); }

async function withImap(id, fn) {
  const a = login(account(id)), { ImapFlow } = require('imapflow');
  const c = new ImapFlow({ host: process.env.MAIL_IMAP_HOST, port: +(process.env.MAIL_IMAP_PORT || 993), secure: (process.env.MAIL_IMAP_PORT || '993') === '993', auth: { user: a.email, pass: process.env[a.env] }, logger: false, socketTimeout: 20000, greetingTimeout: 10000, connectionTimeout: 10000 });
  try { await c.connect(); }
  catch (e) { throw err(502, 'imap', 'Couldn’t sign in to ' + a.email + (e && e.authenticationFailed ? ': wrong password.' : ': ' + ((e && (e.responseText || e.message)) || 'connection failed') + '.')); }
  try { return await fn(c, a); } finally { try { await c.logout(); } catch (e) { } }
}
/* folders by role, so "Sent", "Trash" etc. work whatever the provider calls them */
async function folders(c) {
  const list = await c.list(), byUse = {};
  list.forEach(f => { if (f.specialUse) byUse[f.specialUse] = f.path; });
  const find = (use, re) => byUse[use] || (list.find(f => re.test(f.path)) || {}).path;
  return { all: list.map(f => ({ path: f.path, name: f.name, use: f.specialUse || null })), sent: find('\\Sent', /^(INBOX[./])?sent/i), trash: find('\\Trash', /^(INBOX[./])?(trash|deleted)/i), archive: find('\\Archive', /^(INBOX[./])?archive/i), drafts: find('\\Drafts', /^(INBOX[./])?drafts?/i), junk: find('\\Junk', /^(INBOX[./])?(spam|junk)/i) };
}
const addr = l => (l || []).map(x => ({ name: x.name || '', address: x.address || '' }));
function summary(m, acct, folder) {
  const e = m.envelope || {};
  return { acct, folder, uid: m.uid, subject: e.subject || '(no subject)', from: addr(e.from), to: addr(e.to), date: (e.date || m.internalDate || new Date()).valueOf(), seen: m.flags ? m.flags.has('\\Seen') : true, flagged: m.flags ? m.flags.has('\\Flagged') : false, attachments: hasAtt(m.bodyStructure), messageId: e.messageId || '' };
}
/* a short preview line from the first few KB of the message (best effort, never fails) */
function snippet(src) {
  try {
    let t = src.toString('utf8'), i = t.indexOf('\r\n\r\n'); if (i < 0) i = t.indexOf('\n\n'); t = t.slice(i + 2);
    const parts = t.split(/\r?\n--[^\r\n]+\r?\n/);
    let best = '';
    for (const p of parts) {
      const hdrEnd = p.search(/\r?\n\r?\n/), head = hdrEnd >= 0 && /content-type/i.test(p.slice(0, hdrEnd)) ? p.slice(0, hdrEnd) : '', body = head ? p.slice(hdrEnd).trim() : p.trim();
      if (head && !/text\/(plain|html)/i.test(head)) continue;
      if (/base64/i.test(head)) { try { best = Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8'); } catch (e) { continue; } }
      else best = /quoted-printable/i.test(head) || /=\r?\n|=[0-9A-F]{2}/.test(body) ? body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) : body;
      if (best) break;
    }
    best = best.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    if (/^[A-Za-z0-9+/=]{60,}$/.test(best.split(' ')[0] || '')) return '';
    return best.slice(0, 140);
  } catch (e) { return ''; }
}
function hasAtt(s) { if (!s) return false; if (s.disposition === 'attachment') return true; return (s.childNodes || []).some(hasAtt); }

async function list(id, folder, page, q, to) {
  folder = folder || 'INBOX'; page = Math.max(0, +page || 0);
  return withImap(id, async c => {
    const lock = await c.getMailboxLock(folder);
    try {
      const st = c.mailbox; let uids;
      const crit = q ? { or: [{ subject: q }, { from: q }, { to: q }, { body: q }] } : { all: true };
      if (to) crit.to = to;
      uids = (await c.search(crit, { uid: true })) || [];
      uids.sort((a, b) => b - a);
      const pageUids = uids.slice(page * 30, page * 30 + 30), out = [];
      if (pageUids.length) for await (const m of c.fetch(pageUids, { uid: true, envelope: true, flags: true, bodyStructure: true, internalDate: true, source: { start: 0, maxLength: 6000 } }, { uid: true })) { const x = summary(m, id, folder); x.snippet = m.source ? snippet(m.source) : ''; out.push(x); }
      out.sort((a, b) => b.date - a.date);
      return { items: out, total: uids.length, unseen: st.unseen || 0, page };
    } finally { lock.release(); }
  });
}
async function unread() {
  const out = {};
  for (const a of configured().filter(x => x.configured && !x.alias)) {
    try { out[a.id] = await withImap(a.id, async c => (await c.status('INBOX', { unseen: true, messages: true, uidNext: true }))); } catch (e) { out[a.id] = { error: e.message }; }
  }
  return out;
}
async function read(id, folder, uid) {
  return withImap(id, async c => {
    const lock = await c.getMailboxLock(folder || 'INBOX');
    try {
      const m = await c.fetchOne(String(uid), { source: true, envelope: true, flags: true, bodyStructure: true, uid: true }, { uid: true });
      if (!m) throw err(404, 'missing', 'That email no longer exists.');
      const { simpleParser } = require('mailparser'), p = await simpleParser(m.source);
      if (!m.flags.has('\\Seen')) await c.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
      return Object.assign(summary(m, id, folder), { seen: true, cc: addr(p.cc && p.cc.value), replyTo: addr(p.replyTo && p.replyTo.value), html: p.html || null, text: p.text || '', references: p.references || [], attachments: (p.attachments || []).map((x, i) => ({ i, name: x.filename || 'attachment-' + (i + 1), type: x.contentType, size: x.size })) });
    } finally { lock.release(); }
  });
}
async function attachment(id, folder, uid, i) {
  return withImap(id, async c => {
    const lock = await c.getMailboxLock(folder || 'INBOX');
    try {
      const m = await c.fetchOne(String(uid), { source: true }, { uid: true }); if (!m) throw err(404, 'missing', 'Not found.');
      const p = await require('mailparser').simpleParser(m.source), a = (p.attachments || [])[+i]; if (!a) throw err(404, 'missing', 'Attachment not found.');
      return { buf: a.content, type: a.contentType || 'application/octet-stream', name: a.filename || 'attachment' };
    } finally { lock.release(); }
  });
}
/** op: read | unread | star | unstar | archive | trash | spam */
async function act(id, folder, uids, op) {
  return withImap(id, async c => {
    const f = await folders(c), lock = await c.getMailboxLock(folder || 'INBOX'), set = uids.map(String).join(',');
    try {
      if (op === 'read') await c.messageFlagsAdd(set, ['\\Seen'], { uid: true });
      else if (op === 'unread') await c.messageFlagsRemove(set, ['\\Seen'], { uid: true });
      else if (op === 'star') await c.messageFlagsAdd(set, ['\\Flagged'], { uid: true });
      else if (op === 'unstar') await c.messageFlagsRemove(set, ['\\Flagged'], { uid: true });
      else {
        const to = op === 'archive' ? f.archive : op === 'spam' ? f.junk : f.trash;
        if (!to) throw err(409, 'folder', 'This mailbox has no ' + op + ' folder.');
        if ((folder || 'INBOX') === to && op === 'trash') { await c.messageFlagsAdd(set, ['\\Deleted'], { uid: true }); await c.messageDelete(set, { uid: true }); }
        else await c.messageMove(set, to, { uid: true });
      }
      return { ok: true };
    } finally { lock.release(); }
  });
}
async function folderList(id) { return withImap(id, async c => { const f = await folders(c); return f; }); }

/** m = { acct, to, cc, bcc, subject, html, text, inReplyTo, references, attachments:[{name,type,data(base64)}] } */
async function send(m) {
  const a = account(m.acct), l = login(a), nodemailer = require('nodemailer');
  const t = nodemailer.createTransport({ host: process.env.MAIL_SMTP_HOST, port: +(process.env.MAIL_SMTP_PORT || 465), secure: (process.env.MAIL_SMTP_PORT || '465') === '465', requireTLS: (process.env.MAIL_SMTP_PORT || '465') !== '465', auth: { user: l.email, pass: process.env[l.env] }, connectionTimeout: 10000 });
  const msg = { from: { name: a.name, address: a.email }, to: m.to, cc: m.cc || undefined, bcc: m.bcc || undefined, subject: m.subject || '', text: m.text || undefined, html: m.html || undefined, inReplyTo: m.inReplyTo || undefined, references: m.references && m.references.length ? m.references : undefined,
    attachments: (m.attachments || []).map(x => ({ filename: x.name, contentType: x.type, content: Buffer.from(x.data, 'base64') })) };
  if (l !== a) msg.envelope = { from: l.email, to: [].concat(m.to, m.cc || [], m.bcc || []) }; /* alias: the server sees the real login as sender */
  let info; try { info = await t.sendMail(msg); } catch (e) { throw err(502, 'smtp', 'Sending failed: ' + ((e && (e.response || e.message)) || 'unknown error')); }
  /* keep a copy in the mailbox's Sent folder, like a normal mail app */
  let saved = false;
  try {
    const MailComposer = require('nodemailer/lib/mail-composer'), raw = await new MailComposer(Object.assign({}, msg, { messageId: info.messageId, date: new Date() })).compile().build();
    await withImap(m.acct, async c => { const f = await folders(c); if (f.sent) { await c.append(f.sent, raw, ['\\Seen']); saved = true; } });
  } catch (e) { console.error('[mail] sent copy', e && e.message); }
  return { ok: true, messageId: info.messageId, savedToSent: saved };
}
module.exports = { ACCOUNTS, configured, list, unread, read, attachment, act, send, folderList };
