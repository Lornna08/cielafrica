# C-Ledger — Double-entry accounting by Ciel Africa

C-Ledger is a double-entry accounting workspace for small and growing organisations. It has a general ledger, journals, a chart of accounts, invoicing and receivables, bills and payables, expense claims, banking and transfers, bank reconciliation with CSV import, financial reports, closing periods, roles, and an audit trail.

| Path | What it is |
| --- | --- |
| `index.html` | Public product website (`/c-ledger`). It has the hero, product overview, general-ledger showcase, workflows, reconciliation, reports, security, live preview, deployment, pricing (request a quote), FAQ and contact. |
| `demo.html` | The interactive demo (`/c-ledger/demo`). This is the full application running on twelve months of sample books, with no sign-up. |

Everything is static: plain HTML, CSS and JavaScript, with no build step and no server code. The demo stores its data in the browser's `localStorage`.

## Running locally

```bash
# from the repository root
python3 -m http.server 8000
# open http://localhost:8000/c-ledger/ and http://localhost:8000/c-ledger/demo.html

# accounting engine tests (Node 18+)
node --test c-ledger/tests/accounting.test.js
```

## Folder layout

```
c-ledger/
  index.html             product website
  demo.html              application shell (loads the scripts below in order)
  css/site.css           product website styles
  css/app.css            application design system (tokens, themes, components, responsive rules)
  js/engine.js           pure accounting engine — no DOM, also runs in Node
  js/seed.js             deterministic sample-books generator (runs real operations through the engine)
  js/store.js            persistence, act() wrapper, reporting periods, current user / role
  js/ui.js               formatting, icons, components, modals/drawers, tables, SVG charts
  js/app.js              shell: demo bar, sidebar, top bar, router, search, notifications, help
  js/pages-overview.js   dashboard
  js/pages-ledger.js     general ledger, journals, journal editor, chart of accounts, account detail
  js/pages-sales.js      invoices, receipts, customers, suppliers, contact statements
  js/pages-purchases.js  bills, bill payments, expenses and approvals
  js/pages-banking.js    banking, transfers, reconciliation workspace and CSV import
  js/pages-reports.js    report index and report viewer (print, CSV)
  js/pages-admin.js      team, roles & permissions, audit trail, settings, periods, data
  tests/accounting.test.js
  img/                   favicon and screenshots used on the product website
```

## Data model (summary)

All money is stored as **integer cents** (KES), and all dates are ISO `YYYY-MM-DD` strings.

- **accounts**: code, name, type (`asset`, `liability`, `equity`, `income`, `expense`), sub-type, parent, status (`active` or `archived`), system flag.
- **journals**: number, date, kind, description, status (`draft`, `posted` or `reversed`), lines `[{accountId, debit, credit, memo}]`, source link (invoice, bill, expense, receipt, payment, transfer or statement), and `reverses` / `reversedBy` links.
- **invoices / bills**: contact, dates, lines (quantity, price, discount %, tax rate, account), status, and the journal ids for the document and each payment.
- **expenses**: claimant, payee, category account, paying account, gross amount, tax rate, receipt metadata, and status (`submitted`, `approved` or `rejected`).
- **contacts**: customers and suppliers, with payment terms.
- **recs**: bank reconciliations, holding the statement lines, matches, statement balances and status.
- **periods**: closed months. **audit**: actor, action, entity and time.

## Accounting rules the engine enforces

- A journal can be posted only when total debits equal total credits, the total is greater than zero, and every line names one active account with a debit or a credit (never both).
- **Balances and reports use posted lines only.** Drafts never affect the books.
- Posted entries are immutable. They are corrected with `reverse(id, date, reason)`, which posts a linked mirror entry. Source documents are reversed by voiding them, which reverses their journals.
- Nothing can post into a **closed period**. Reopening a period requires permission, takes a reason, and is audited.
- **Invoice issue:** Dr Accounts Receivable / Cr revenue (net of discount) / Cr VAT payable. **Receipt:** Dr bank / Cr Accounts Receivable. An overpayment is blocked unless it is explicitly recorded as customer credit.
- **Bill:** draft, then approved, then posted. Posting is Dr expense + Dr VAT / Cr Accounts Payable. **Payment:** Dr Accounts Payable / Cr bank.
- **Approved expense:** Dr category (net) + Dr VAT / Cr paying account (gross). VAT is backed out of the gross amount.
- **Transfer:** Dr destination / Cr source. Transfers are excluded from cash-flow activities.
- **Reconciliation** completes only when every statement line is matched or recorded, the opening balance plus the statement movements equals the closing balance, and the difference is zero.
- The **balance sheet** adds computed retained earnings and current-year earnings, so assets always equal liabilities plus equity. `integrity()` re-checks this, along with the trial balance and the control accounts.
- **Idempotency keys** on receipts and payments stop a double-click from posting twice.
- **Permissions** are checked inside the engine, not only hidden in the UI. Roles are owner, accountant, finance manager, bookkeeper, approver and read-only viewer.

## Demo behaviour

- The banner reads "You're exploring the C-Ledger demo. Changes affect sample data only."
- **Reset demo** asks for confirmation, then regenerates the sample books.
- The sample books are generated relative to *today*, so the data always looks current.
- Saved data lives in `localStorage` under the key `cledger:demo:v1`. An untouched demo refreshes after 12 hours. A demo you have changed is kept for 30 days.
- Team members, the company (Kilele Design Studio Ltd), customers, suppliers and every amount are fictional.
- Attachments store file metadata only. No email is ever sent, and no bank or M-Pesa connection exists in the demo.
- You can switch roles under Team → Roles & permissions to see what each role can and cannot do.

## Production deployment — what changes

`localStorage` is **not** production storage. A real deployment by Ciel Africa adds:

1. **A server and database**, for example PostgreSQL. Posting runs in a transaction with row-level locking and unique journal numbering.
2. **Authentication**: user accounts, sessions or SSO, password policy, 2FA, and role assignment stored on the server. All permission checks are repeated on the server.
3. **An immutable audit log** written by the server, plus backups and point-in-time recovery.
4. **File storage** for attachments, with virus scanning.
5. **Integrations** (quoted): bank or M-Pesa statement feeds, email delivery for invoices and statements, and payroll.
6. **Multi-company and multi-currency**, if needed. The demo is a single company in KES.

The engine (`js/engine.js`) has no DOM dependencies, so the same rules can run server-side in Node.

## Tests

`tests/accounting.test.js` (15 tests, run with `node:test`) covers:

- journal validation, and draft versus posted entries
- normal balances and reversals
- invoice VAT and discount rounding, receipts, overpayments and voiding
- bills and payments, expense approval and permissions
- transfers and closed periods
- reconciliation and CSV parsing
- report identities (A = L + E, cash flow ties to bank)
- account safeguards
- integrity of the seeded books across several dates

## Editing the product website

- Prices are quote-based on purpose. To publish a fixed price, add it to the pricing card in `index.html` and set `price` on `tpl-cledger` in `data/templates.js`.
- Screenshots live in `img/shots/`. The `d-*` files are desktop shots at 2× and the `m-*` files are 390 px phone shots at 2×. When a screenshot changes, bump its `?v=` in `index.html`.
