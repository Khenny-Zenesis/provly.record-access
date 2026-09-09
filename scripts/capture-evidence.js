const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright-core");

const BASE = "http://localhost:3003";
const EXE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = path.join(__dirname, "..", "provly.evidence-4");

const ACCOUNT_A = { email: "evidence_a@provly.local", password: "password123" };
const ACCOUNT_B = { email: "evidence_b@provly.local", password: "password123" };

fs.mkdirSync(OUT, { recursive: true });

function shot(page, name, opts = {}) {
  return page.screenshot({ path: path.join(OUT, name), fullPage: true, ...opts });
}

async function signup(context, email, password) {
  const r = await context.request.post(`${BASE}/api/auth/signup`, {
    data: { email, password },
  });
  if (r.status() === 409) {
    const s = await context.request.post(`${BASE}/api/auth/signin`, {
      data: { email, password },
    });
    console.log(`  signin ${email} -> ${s.status()}`);
    return s.status();
  }
  console.log(`  signup ${email} -> ${r.status()}`);
  return r.status();
}

async function readFirstPublicId(page) {
  const href = await page.locator("a.card").first().getAttribute("href");
  return href ? href.split("/").pop() : null;
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ============================ ACCOUNT A ============================
  console.log("--- Account A ---");
  const ctxA = await browser.newContext();
  await signup(ctxA, ACCOUNT_A.email, ACCOUNT_A.password);
  const pageA = await ctxA.newPage();

  // 01 genuine empty state
  await pageA.goto(`${BASE}/records`);
  await pageA.waitForSelector(".empty-state", { timeout: 8000 });
  await pageA.waitForTimeout(400);
  await shot(pageA, "01-empty-state-A.png");
  console.log("  01 empty state captured");

  // 02 create form
  await pageA.goto(`${BASE}/records/new`);
  await pageA.waitForSelector("input[name=title]", { timeout: 8000 });
  await pageA.waitForTimeout(300);
  await shot(pageA, "02-create-form.png");
  console.log("  02 create form captured");

  // 03 create via UI -> list shows the record
  await pageA.fill("input[name=title]", "Kitchen refit");
  await pageA.fill("textarea[name=notes]", "Removal and re-fit of the client kitchen. Downpipe inspection in progress.");
  // Status defaults to OPEN (radio group) — no selection needed.
  await Promise.all([
    pageA.waitForURL("**/records", { timeout: 8000 }),
    pageA.click("button[type=submit]"),
  ]);
  await pageA.waitForSelector(".card", { timeout: 8000 });
  await pageA.waitForTimeout(400);
  await shot(pageA, "03-list-after-create.png");
  const aPublicId = await readFirstPublicId(pageA);
  console.log(`  03 list after create captured (publicId=${aPublicId})`);

  // 04 URL state: open
  await pageA.goto(`${BASE}/records?view=open`);
  await pageA.waitForSelector(".segmented-control", { timeout: 8000 });
  await pageA.waitForTimeout(300);
  await shot(pageA, "04-url-state-open.png");
  console.log("  04 view=open captured");

  // 05 URL state: closed (empty filtered result)
  await pageA.goto(`${BASE}/records?view=closed`);
  await pageA.waitForSelector(".empty-state", { timeout: 8000 });
  await pageA.waitForTimeout(300);
  await shot(pageA, "05-url-state-closed-empty.png");
  console.log("  05 view=closed captured");

  // 06 invalid URL state handled safely
  await pageA.goto(`${BASE}/records?view=DROP%20TABLE`);
  await pageA.waitForSelector(".segmented-control", { timeout: 8000 });
  await pageA.waitForTimeout(300);
  await shot(pageA, "06-invalid-url-state-safe.png");
  console.log("  06 invalid view captured");

  // 07 record detail
  await pageA.goto(`${BASE}/records/${aPublicId}`);
  await pageA.waitForSelector(".card", { timeout: 8000 });
  await pageA.waitForTimeout(300);
  await shot(pageA, "07-record-detail.png");
  console.log("  07 detail captured");

  // 08 delete confirmation
  await pageA.getByRole("button", { name: "Delete record" }).first().click();
  await pageA.waitForTimeout(400);
  await shot(pageA, "08-delete-confirm.png");
  console.log("  08 delete confirm captured");

  // 09 confirm delete -> list empty again
  await pageA.getByRole("button", { name: "Confirm delete" }).click();
  await pageA.waitForURL("**/records", { timeout: 8000 });
  await pageA.waitForSelector(".empty-state", { timeout: 8000 });
  await pageA.waitForTimeout(400);
  await shot(pageA, "09-empty-after-delete.png");
  console.log("  09 after delete captured");

  await ctxA.close();

  // ============================ ACCOUNT B ============================
  console.log("--- Account B ---");
  const ctxB = await browser.newContext();
  await signup(ctxB, ACCOUNT_B.email, ACCOUNT_B.password);
  const pageB = await ctxB.newPage();

  // create one record for B so the list differs from A's
  const createdB = await ctxB.request.post(`${BASE}/api/records`, {
    data: { title: "Roof replacement", notes: "Strip and re-slate south elevation.", status: "CLOSED" },
  });
  console.log(`  B create -> ${createdB.status()}`);
  const bRecord = (await createdB.json()).record;
  const bPublicId = bRecord.publicId;

  await pageB.goto(`${BASE}/records`);
  await pageB.waitForSelector(".card", { timeout: 8000 });
  await pageB.waitForTimeout(400);
  await shot(pageB, "10-userB-list.png");
  console.log(`  10 user B list captured (publicId=${bPublicId})`);
  await ctxB.close();

  // ============================ CROSS-USER (as A) ============================
  console.log("--- Cross-user as A ---");
  const ctxA2 = await browser.newContext();
  await signup(ctxA2, ACCOUNT_A.email, ACCOUNT_A.password);
  const pageA2 = await ctxA2.newPage();

  // page-level: A opens B's detail URL -> not-found page, NO B data
  const p403 = await ctxA2.request.get(`${BASE}/api/records/${bPublicId}`);
  const p403body = await p403.text();
  fs.writeFileSync(path.join(OUT, "11-cross-user-403-response.txt"), `GET /api/records/${bPublicId} -> ${p403.status()}\n${p403body}\n`);
  await pageA2.goto(`${BASE}/records/${bPublicId}`);
  await pageA2.waitForTimeout(600);
  await shot(pageA2, "11-cross-user-A-accesses-B.png");
  console.log(`  11 A accessing B record -> page captured, API ${p403.status()} saved`);
  await ctxA2.close();

  // ============================ 401 (no session) ============================
  console.log("--- 401 no session ---");
  const ctxN = await browser.newContext();
  const r401 = await ctxN.request.get(`${BASE}/api/records`);
  fs.writeFileSync(path.join(OUT, "12-unauth-401-response.txt"), `GET /api/records (no session) -> ${r401.status()}\n${await r401.text()}\n`);
  console.log(`  12 401 response saved (${r401.status()})`);
  await ctxN.close();

  await browser.close();
  console.log("\nAll captures complete.");
})().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
