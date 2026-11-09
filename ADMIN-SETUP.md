# Ciel Africa — One-Click Admin Publishing (Setup)

Your admin at **cielafrica.com/admin** can save changes two ways:

- **Before setup:** clicking **Save** downloads the updated file; you upload it to your repo. (Works out of the box.)
- **After this setup:** clicking **Save** publishes straight to your repo and the change goes live in ~30 seconds. No downloads.

Do these **4 steps once**. You'll need your GitHub and Vercel accounts.

> ⚠️ Never paste your GitHub token into a chat, email, or the website. Put it only into GitHub and Vercel as described below.

---

## Step 1 — Create a GitHub token (fine-grained)

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens** → **Generate new token**.
2. Name it something like `ciel-admin`.
3. **Resource owner:** your account (Lornna08).
4. **Repository access:** *Only select repositories* → choose **cielafrica**.
5. **Permissions → Repository permissions → Contents:** set to **Read and write**.
6. Generate the token and **copy it** (you'll only see it once).

## Step 2 — Add the token to Vercel

1. Go to **Vercel → your cielafrica project → Settings → Environment Variables**.
2. Add a variable:
   - **Name:** `GITHUB_TOKEN`
   - **Value:** *(paste the token from Step 1)*
   - **Environments:** Production (and Preview if you want)
3. Save.

## Step 3 — Set the admin password (server-side)

Add another environment variable in the same place:

- **Name:** `ADMIN_PASSWORD`
- **Value:** *(choose a strong password — this is what you'll type to log into /admin and to publish)*

> The password in the page code (`assets/js/admin.js`, `PASS`) is only the first gate. The **real** check that lets a change reach your repo is `ADMIN_PASSWORD` on the server. Make them the same so login and publish use one password, or keep the page one simpler and the server one strong.

## Step 4 — Redeploy

Vercel usually redeploys automatically when you add env vars. If not, push any commit (or hit **Redeploy** in Vercel). Done.

---

## How to use it

1. Open **cielafrica.com/admin**, log in.
2. Edit prices / products / templates / work / team.
3. Click **Save** (per tab) or **Save all files**.
4. It publishes to your repo → Vercel deploys → live in ~30 seconds.

If publishing ever fails (e.g. token expired), Save automatically falls back to **downloading** the file so you never lose work — fix the token and try again.

## Optional settings

The function defaults to repo `Lornna08/cielafrica`, branch `main`. To change, add env vars:
- `GITHUB_REPO` (e.g. `owner/repo`)
- `GITHUB_BRANCH` (e.g. `master`)

## Security notes

- The GitHub token lives **only** in Vercel's encrypted env vars — never in the public page.
- The function only ever writes these four files: `data/products.js`, `data/templates.js`, `data/work.js`, `data/team.js`. Nothing else can be written, even if someone tampers with the request.
- Keep the `/admin` URL and your password private. For stronger protection later, you can add Vercel password protection or a proper login — ask and I'll set it up.
