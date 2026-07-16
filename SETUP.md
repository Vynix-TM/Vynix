# Vynix site — setup checklist

The code is done, but a few things only exist in the Firebase console, not in files. Do these once:

## 1. Serve over http(s), not file://
Firebase's modular SDK (and ES module imports) won't run if you just double-click `index.html`.
Use any static server, e.g.:
```
npx serve .
```
or the VS Code "Live Server" extension. Then open it at `http://localhost:...`.

## 2. Enable sign-in methods
Firebase console → **Authentication → Sign-in method**:
- Enable **Email/Password**
- Enable **Google** (pick a support email when prompted)
- Enable **Anonymous** — this is what lets visitors use `messages.html` to chat without creating an account

## 3. Add your local/deployed domain as authorized
Firebase console → **Authentication → Settings → Authorized domains** — add `localhost` (usually already there) and whatever domain you deploy to. Google sign-in will fail with a popup error otherwise.

## 4. Create the Firestore database
Firebase console → **Firestore Database → Create database** (production mode is fine — the rules below replace the defaults).

## 5. Paste the security rules
Firebase console → **Firestore Database → Rules** → paste the contents of `firestore.rules` from this folder → **Publish**.
Firebase console → **Storage → Rules** → paste the contents of `storage.rules` → **Publish**. (If you haven't set up Storage yet, **Storage → Get started** first — needed for chat images.)

These are what actually restrict things — e.g. only leaders can accept/decline or read chats — enforced server-side no matter what the frontend code does.

## 6. Add Herko and Whisky's emails as leaders
Leader access is controlled by email, and now lives in **two** places that must match:
1. `app.js` → the `LEADER_EMAILS` array (near the bottom, under `// ================= LEADERS =================`).
2. `firestore.rules` → inside the `isLeader()` function near the top (used everywhere else in the file, so this is now a single edit instead of four).

Add Herko's and Whisky's emails to both (uncomment the placeholder lines, fill in the real address), then re-publish the Firestore rules (step 5). `leomh312@gmail.com` is already wired up.

Anyone not on the list who opens `leader.html`/`leaders.html` will see "Access denied" even with the right code — and anyone on the list in `app.js` but missing from `firestore.rules` will get past the gate but hit permission errors when the dashboard tries to load data.

## 7. Change the leader access code
Open `app.js` and change `LEADER_ACCESS_CODE` from the placeholder to something only your leaders know. This is a light UX gate (keeps the page out of casual view) — the real protection is steps 5–6.

## 8. Try each flow end to end
**Team join:**
1. `index.html` → **Join the team** → redirects to `signin.html` since you're not signed in.
2. Create an account or sign in with Google → redirected to `join.html`.
3. Fill out and submit — check Firestore console, a doc should appear in `teamRequests`.
4. `signin.html` → status shows **Pending review**.
5. `leader.html` → code → sign in as a leader → **Join requests** tab → accept/decline → applicant sees the update live.

**Client leads:**
1. `services.html` → fill out the quote form → doc appears in `clientInquiries`.
2. `leader.html` → **Client inquiries** tab → mark contacted/closed.

**Chat:**
1. `messages.html` → enter name/email + first message → starts a thread (works with no account, via anonymous sign-in).
2. `leader.html` → **Messages** tab → the conversation appears → reply or send an image.
3. Back on `messages.html` (same browser), the leader's reply appears live.

## Data model reference
`teamRequests/{id}`
```
uid, fullName, email, role, experience, skills, message,
status: "pending" | "accepted" | "declined",
createdAt, updatedAt
```

`clientInquiries/{id}` — leads from `services.html`. No sign-in needed to submit one.
```
name, email, business, projectType, budget, timeline, message,
status: "new" | "contacted" | "closed",
createdAt, updatedAt
```

`conversations/{id}` — one per chat thread, started from `messages.html`.
```
clientUid, clientName, clientEmail, participants: [clientUid],
lastMessage, lastMessageAt, createdAt
```
`conversations/{id}/messages/{id}` — subcollection:
```
senderId, senderType: "client" | "leader", senderLabel,
type: "text" | "image", text, imageUrl, createdAt
```

Storage path for chat images: `chatImages/{conversationId}/{timestamp}_{filename}`.

## Pricing (edit anytime in services.html)
- Starter — 5 000 DA — one page
- Business — 40 000 DA+ — up to 5 pages
- Custom — quote based on what the client describes
- Domain is bought by the client; Vynix builds and hosts on it
- Accepted payment: Flexi, CCP — Visa listed as "coming soon"

## Where things live
- `index.html` — homepage, links to everything else
- `join.html` — team join-request form (sign-in required)
- `signin.html` — auth + "my request status" account view
- `services.html` — public page for customers: pricing packages + quote-request form, no sign-in needed
- `messages.html` — public chat page for customers (anonymous sign-in, text + images)
- `leader.html` — linked from the homepage footer, code-gated dashboard with three tabs: join requests, client inquiries, messages
- `leaders.html` — identical to `leader.html` but not linked anywhere on the site; share the URL directly with Leo MH, Herko, and Whisky
- `app.js` — shared Firebase config + all the helper functions
- `styles.css` — shared design system for every page
- `firestore.rules` / `storage.rules` — paste into the Firebase console, not used directly by the site
