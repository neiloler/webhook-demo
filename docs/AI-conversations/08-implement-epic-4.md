# Implement Epic 4

## User

Let's implement Epic 4 from its plan file.


## Assistant

I’ll find the Epic 4 plan and read the surrounding project shape first, then I’ll turn it into code and run the tight checks the repo gives us.

## Assistant

I found the Epic 4 plan at `docs/epics/004-frontend-dashboard-and-user-admin.md`. I’m reading that plus the current frontend/backend contracts so the implementation matches what’s already here instead of inventing a second app shape.

## Assistant

The backend is already past the original “future dependency” point: most Epic 5 CRUD/list routes exist. I’m checking the missing pieces now, especially summary and manual recovery, because the Epic 4 UI needs those actions to actually do something.

## Assistant

I’ve got the work split now: frontend auth/login/dashboard/settings, plus a small backend recovery layer so the retry/replay buttons are real. The existing backend is pleasantly close; the main backend gap is that delivery attempts are currently hard-coded as attempt `1`, which needs to become a proper sequence before retries can exist.

## Assistant

I’m going to patch the backend first: attempt numbering, summary counts, and the three recovery routes (`delivery retry`, `event reprocess`, `subscription retry`). After that the dashboard can call stable endpoints instead of carrying placeholder buttons.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/webhook-routes.ts
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/webhook-routes.ts
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/webhook-routes.ts
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/webhook-routes.ts
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/webhook-routes.ts
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/webhook-routes.ts
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/webhook-routes.ts
```

## Assistant

Backend typecheck is green after the recovery routes. I’m moving to the frontend: typed API client first, then the reusable action buttons and protected routes.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/frontend/lib/webhook-api.ts
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/frontend/components/action-button.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/frontend/components/protected-screen.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/frontend/app/login/page.tsx
```

## Assistant

The login route and shared frontend utilities are in place. Next I’m replacing the old sanity-check homepage with the actual dashboard: auth gate, polling, tables, inline create/edit forms, and row actions.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
D /Users/neiloler/dev/webhook-demo/frontend/app/page.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/frontend/app/page.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/app/page.tsx
```

## Assistant

The dashboard file is in; I’m adding the account settings route now. Then I’ll let TypeScript tell me where the rough edges are, because a page this stateful usually has one or two tiny places that want exactness.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/frontend/app/settings/account/page.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/app/settings/account/page.tsx
```

## Assistant

Frontend typecheck is green too. I’m running the production builds next, then I’ll start the app and look at the actual page in the in-app browser so we catch layout/runtime issues that TypeScript can’t see.

## Assistant

Both production builds passed. I’m starting the local backend and frontend now for a quick browser pass; if the default frontend port is free, the app will be at `http://localhost:3000`.

## Assistant

There are already local servers on the expected ports: backend on `4000`, frontend on `3000`. I stopped my duplicate backend attempt and I’ll use the existing dev server for the browser check.

## Assistant

I’m connecting to the in-app browser now and checking the unauthenticated flow first: `/` should resolve to the login screen without showing dashboard data.

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Open local app",
  "timeout_ms": 30000,
  "code": "if (!globalThis.agent) {\n  const { setupAtlasRuntime } = await import('/Users/neiloler/.codex/plugins/cache/openai-bundled/browser-use/0.1.0-alpha2/scripts/browser-client.mjs');\n  await setupAtlasRuntime({ globals: globalThis });\n}\nif (!globalThis.browser) {\n  globalThis.browser = await agent.browsers.get('iab');\n}\nawait browser.nameSession('🔎 Epic 4 dashboard');\nif (typeof tab === 'undefined' || !tab) {\n  globalThis.tab = await browser.tabs.new();\n}\nawait tab.goto('http://localhost:3000/');\nawait tab.playwright.waitForLoadState({ state: 'domcontentloaded', timeoutMs: 10000 });\nconsole.log('url', await tab.url());\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 4000));"
}
```

Output:
```text
{
  type: 'object',
  value: `{"selectedBrowser":{"capabilities":{"browser":[{"id":"visibility","description":"Use to show or hide the browser to the user, and to determine the browser's current visibility. Prefer keeping browser work in the background unless the user asks to see it or live viewing is useful.","docs":"Before using this capability, read docs/capabilities/browser/visibility.md in plugin output or references/capabilities/browser/visibility.md in skill output."},{"id":"viewport","description":"Controls an explicit browser viewport override for responsive or device-size testing. Use it when a task calls for specific dimensions or breakpoint validation; otherwise leave it unset so the browser uses its normal 1280x720 viewport. Reset temporary overrides before finishing unless the user asked to keep them.","docs":"Before using this capability, read docs/capabilities/browser/viewport.md in plugin output or references/capabilities/browser/viewport.md in skill output."}],"tab":[]},"id":"-7067-4449-909d-1535bf739403","name":"Codex In-app Browser","type":"iab"}}`
}
url http://localhost:3000/
- main:
  - paragraph: Loading session
  - paragraph: Resolving your dashboard access.
- button "Open Next.js Dev Tools":
- alert
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Check login redirect",
  "timeout_ms": 30000,
  "code": "await tab.playwright.waitForURL('http://localhost:3000/login', { timeoutMs: 10000, waitUntil: 'domcontentloaded' });\nconsole.log('url', await tab.url());\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 5000));"
}
```

Output:
```text
url http://localhost:3000/login
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Webhook Demo" [level=1]
  - paragraph: Sign in to manage ingest endpoints, subscriptions, and delivery recovery.
  - generic: Sign in
  - generic: Email
  - textbox "Email"
  - generic: Password
  - textbox "Password"
  - button "Sign in":
    - generic: Sign in
  - paragraph
  - paragraph: "Backend: http://localhost:4000"
  - button "Need an account?"
```

## Assistant

The unauthenticated redirect is behaving: `/` lands on `/login` and shows only the auth form. I’m going to create a throwaway local account and exercise the dashboard create/edit surface next.

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Create local account",
  "timeout_ms": 30000,
  "code": "let snapshot = await tab.playwright.domSnapshot();\nconst needAccountButton = tab.playwright.getByRole('button', { name: 'Need an account?', exact: true });\nconsole.log('need account count', await needAccountButton.count());\nawait needAccountButton.click({ timeoutMs: 5000 });\nsnapshot = await tab.playwright.domSnapshot();\nconsole.log(snapshot.slice(0, 3000));\nconst email = `codex-epic4-${Date.now()}@example.test`;\nconst nameBox = tab.playwright.getByLabel('Name', { exact: true });\nconst emailBox = tab.playwright.getByLabel('Email', { exact: true });\nconst passwordBox = tab.playwright.getByLabel('Password', { exact: true });\nconsole.log('fields', await nameBox.count(), await emailBox.count(), await passwordBox.count());\nawait nameBox.fill('Codex Epic 4', { timeoutMs: 5000 });\nawait emailBox.fill(email, { timeoutMs: 5000 });\nawait passwordBox.fill('local-password-123', { timeoutMs: 5000 });\nconst createButton = tab.playwright.getByRole('button', { name: 'Create account', exact: true });\nconsole.log('create count', await createButton.count(), email);\nawait createButton.click({ timeoutMs: 10000 });\nawait tab.playwright.waitForURL('http://localhost:3000/', { timeoutMs: 15000, waitUntil: 'domcontentloaded' });\nconsole.log('url', await tab.url());\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 6000));"
}
```

Output:
```text
Browser Use encountered an error interacting with this webpage's clipboard: Failed to execute 'setRangeText' on 'HTMLInputElement': The input element's type ('email') does not support selection.
locator.fill failed for selector internal:label="Email"s
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Inspect signup form",
  "timeout_ms": 30000,
  "code": "console.log('url', await tab.url());\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 5000));"
}
```

Output:
```text
url http://localhost:3000/login
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Webhook Demo" [level=1]
  - paragraph: Sign in to manage ingest endpoints, subscriptions, and delivery recovery.
  - generic: Create account
  - generic: Name
  - textbox "Name": Codex Epic 4
  - generic: Email
  - textbox "Email" [active]
  - generic: Password
  - textbox "Password"
  - button "Create account":
    - generic: Create account
  - paragraph
  - paragraph: "Backend: http://localhost:4000"
  - button "Have an account?"
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Finish signup",
  "timeout_ms": 30000,
  "code": "const emailValue = `codex-epic4-${Date.now()}@example.test`;\nconst emailBox2 = tab.playwright.getByLabel('Email', { exact: true });\nconst passwordBox2 = tab.playwright.getByLabel('Password', { exact: true });\nconsole.log('field counts', await emailBox2.count(), await passwordBox2.count(), emailValue);\nawait emailBox2.type(emailValue, { timeoutMs: 5000 });\nawait passwordBox2.type('local-password-123', { timeoutMs: 5000 });\nconst createButton2 = tab.playwright.getByRole('button', { name: 'Create account', exact: true });\nconsole.log('create count', await createButton2.count());\nawait createButton2.click({ timeoutMs: 10000 });\nawait tab.playwright.waitForURL('http://localhost:3000/', { timeoutMs: 15000, waitUntil: 'domcontentloaded' });\nconsole.log('url', await tab.url());\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 9000));"
}
```

Output:
```text
Browser Use encountered an error interacting with this webpage's clipboard: Failed to execute 'setRangeText' on 'HTMLInputElement': The input element's type ('email') does not support selection.
locator.type failed for selector internal:label="Email"s
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Visible DOM signup",
  "timeout_ms": 30000,
  "code": "const dom = await tab.dom_cua.get_visible_dom();\nconsole.log(JSON.stringify(dom).slice(0, 6000));"
}
```

Output:
```text
"<button node_id=112 aria-label=\"Open Next.js Dev Tools\" />\n<input node_id=16 name=\"name\" value=\"Local User\" required=\"true\">Codex Epic 4</input>\n<input node_id=18 name=\"email\" type=\"email\" required=\"true\" />\n<input node_id=154 name=\"password\" type=\"password\" required=\"true\" />\n<button node_id=11 title=\"Create account\" type=\"submit\">Create account</button>\n<button node_id=15 type=\"button\">Have an account?</button>"
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Type via browser",
  "timeout_ms": 30000,
  "code": "const emailValue2 = `codex-epic4-${Date.now()}@example.test`;\nawait tab.dom_cua.click({ node_id: '18' });\nawait tab.dom_cua.type({ text: emailValue2 });\nawait tab.dom_cua.click({ node_id: '154' });\nawait tab.dom_cua.type({ text: 'local-password-123' });\nconsole.log('typed', emailValue2);\nconsole.log(JSON.stringify(await tab.dom_cua.get_visible_dom()).slice(0, 6000));"
}
```

Output:
```text
Browser Use encountered an error interacting with this webpage's clipboard: Failed to execute 'setRangeText' on 'HTMLInputElement': The input element's type ('email') does not support selection.
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Signup screenshot",
  "timeout_ms": 30000,
  "code": "await display(await tab.playwright.screenshot({ fullPage: false }));"
}
```

Output:
```text
{"type":"image","data":"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","mimeType":"image/jpeg","_meta":{"codex/imageDetail":"original"}}
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Type with keyboard",
  "timeout_ms": 30000,
  "code": "const emailValue3 = `codex-epic4-${Date.now()}@example.test`;\nawait tab.cua.click({ x: 469, y: 362 });\nawait tab.cua.type({ text: emailValue3 });\nawait tab.cua.click({ x: 464, y: 437 });\nawait tab.cua.type({ text: 'local-password-123' });\nconsole.log('typed', emailValue3);\nawait display(await tab.playwright.screenshot({ fullPage: false }));"
}
```

Output:
```text
Browser Use encountered an error interacting with this webpage's clipboard: Failed to execute 'setRangeText' on 'HTMLInputElement': The input element's type ('email') does not support selection.
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Try keypress char",
  "timeout_ms": 30000,
  "code": "await tab.cua.click({ x: 469, y: 362 });\nawait tab.cua.keypress({ keys: ['a'] });\nawait tab.cua.keypress({ keys: ['b'] });\nawait tab.cua.keypress({ keys: ['c'] });\nawait display(await tab.playwright.screenshot({ fullPage: false }));"
}
```

Output:
```text
{"type":"image","data":"iVBORw0KGgoAAAANSUhEUgAABJAAAAKRCAIAAACEPsThAAAQAElEQVR4nOzdBYAUZR/H8bm97jvgjo6ju6W7U1IlFBRQUFGwMTGwCUVBukW6u7u7u4878jq33v/twLJccYj6zi7fj+f67DOxs7Ph/OY/M+tiNBoVAAAAAID2uCgAAAAAAE0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAHNbChQtn/fWXNBo1atS3X79UQ38bOXLbtm3SqFK1yocffpRq6IQJE9auWSONrt26tW/fXsma0aNGbd68WRo/D/25QIGCWRx5+IgRefPmVf5zYWFhAwcMkEb1GtXfffe9x5r22rVr77377sqVK6TdsmUrtTMwW2C+vPlKlSrVqlUrTy8vBQAAPDECGwCHlS1bNjVRnD17Jm1gGz16VGhoqDS2bt36/vsf6HQ626GTJk44duyYNF7p9YqSZUePHVUf8YvBg7M+8pBvv1X+HxISEtQF8PBwVx5TRESEOq2wNqx8fHwHDBwga9XZ2VkBAABPQKcAgIOqVq2a2jh37lx4eLjtoAsXLqhpTcTGxpw8edJ26N27d9W0JmrVqq0gU3ktJKRZe2SVfjtkSOfOnSQTKgAA4AkQ2AA4LE9Pz6bNmqntXbt22Q7asWP7Q3e3P3R39+57I9eoUdPPz09BxmQNnzx1Wv6uh4WdOHlq2vQZPXr0VAetX7fuu+/+P8VDAAAcBodEAnBkTRo3UU9F275tq+2paOrJY1abNm169bXXrHfVc9tEs+bNbEe7devWli1brl276uXpVbxEiSpVqvj4+CgZSE5OPnjw4JHDh9093Bs2aJi/QAElY0ajceOGDadOnfL08qpevXqpUqXSPZjQbDbv27f3xIkTN2/eDA4OLl269DPPVMtonhEREfK8rl654uTkJI/eoEGDgIAAJQuuXbu2d+9etd2kSRNfX18la/JZyHrOnj37iBHDpefXX37p0qVrmTJlUj0Lyc+nTp2USmbhwkXkWZQoUSLVrDZt3BgRGenv59eocWNZno0bN5w/d75wkcKdOnX29vaWEeLi4rZu3XL40GEvL68aNWtUqlTZxcXlH1wJAABoBIENgCOrW6+e2li/fr2102QyLV+2XLEU0FxdXbZu3bpx40aDwWDd4pfspDZk+9461c8///TN11/bzjwoKOinn4d26tQp7ePeunnznYEDd+3aae0pWrTorNlzihcvnnbk69evd+/WVdKatads2bIrVq5KFS0ktzz/XGfrsZrWMefNX5AnT55U8/zllxFffP55qs7vvvu+/1tvKZkKCwtr1bLl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KDNXhzZr1nTTpo3WQbGxD+ZfqWKFCePH20as8ePGtW7VSgY1atjgh++/T05OVvtlbvIox48fV+9GRkbKXWvdTOZTv17dHdu3d+zQQZ1WfcRZs/4qX76cNNasWS3jT548WQEAAI+PwAYAD2zftk1uX+rRw7azUqVKJ0+dXrJ0mbQNBuOtW7f+GD16+PBhRYoUKVWylF6vf+nFF4cNGypDO3TseP78+a5du8ydO0exVJx69ughY/r6+vXp0ycgIEDan376iQwqXbqMdf5NmjT19vLKZD62MpmnCA0Nbda06YQJEwIDA5999lnJUW1at968eZMMkgD2YveU+d+4caNjp07h4eEDBw748ccf1Al/+OH7d94ZKGO2aNHi5MmTQ4Z888brr0sJUQbdjYiQp2w9IlSW85aFelfms3///u7du8XERAcFBe3Zs0ce8fLly7ly5Spbtqz1CebOnVsBAACPj8AGAPdIkpHAExIS4uvrm2pQfgvbnk2bt2zbvuPjTz6ZPXvWunVre/Z8edfuPdOnz1i/IaW+9PZbb0myio2NrVW7Vt9+/Xbt3v3LryM3b9kqg+bPmye3r/XtO2bsWGl8+9134ydMCClcOJP52D5uJvMU33z9tUSpjz/+RGYy869Zc+fNl84llkrdnDmzZf61atc+d/7CtGnT9+0/IJ2LFi6UJHbh/Pkh33wjz1oGzZu/4MLFSyVLlpIS2bp165Ss+fKrr9euW3/23PlGjRrL3Z07dzRo0HDmzL+k3axZc3mCkgMVAADw+LisPwDck5CQILfe3t6PHFNiT9WqVdX2vr175bZwkcJr1661jhATEyOlJykrffjhR1KSOnfu3MWLF48dOyqD1GqVi0vqr9/M52PtkViVyTy3b0+pEL7z7rvqyC1btgy/ccPHx9c6/48//tjZ2VkaefPmDQu/oUbTAwdSwlv//m9JWUwanp6egwYNevnlngf272/WrJmSBc8995zcygJI7W7DhvXnz51XAADAP4HABgD3FCxYUALMsWPHJLlJaMlkzBzZs1vbR44ckdvBX3yRapyrV69K0Br1++9Dhnwjuct2kJOTU9p5Zj4f256M5hkXFycRLigoyMvLy9qvpjXr/AsVLGQdZC0knjx5Um5DCodYBxUsVMgyyWEla6yPmD1bNsVyORYFAAD8EzgkEgDukcxTt25daax/+FBASUG5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n/J37du3r2fPHqk6b926nUkYW7169fjx4wYMHOjr66s8jh9++H706NHnzp0bO3acAsBOOLu46pOTCWyA/eKQSAC4R6/XOztnaTfWyJEjJa19882Qs2fP3blzd8GChUePHu3Xr6/yf3Ly5ClZDOufTpfZd/v3338fGnr9cdOa1PEkrSkA7I2Li7MENgWA3SKwAUAKo9Goc3LKylGCiYmJX3315YABA954441s2bJJT/369YcOHbpu3bpLly6p48yYMUOqZ40aNfzmm69v3LhhnfbIkSMDBrxdrVq1vn1fu3nzprXfbDZPnz69a9cutWrVHDRo0O3bt6Vz0qRJbdq0VidPTk7uKM5zIgAAEABJREFU0aPH119/pWTN8ePHmzdvtnPnTlkMmednn30WGhqqDpo7d84bb7yutuPi4oYO/blVq5ayqBLkEhIS0p2bwWB4++2327Vr16plKwWAXdHpnA1GowLAbhHYACCFyWRy0mXpK/HkyZNy26lTZ9vOzp2fCw+/UaBAAWn/8ssISWX58uWXhLNo0aLnnuscY/kpJIlzbdu2OX78xCuvvCIRSMaxTv7rr78MHDigVKlSXbt2W7582fPPPyflvueee+7y5csffzxIRhg16nfpf/HFF5WskSS2b9++Ll1eKFCg4AsvdFm5coWkwdjYWBkUFha+d+9exRLD+vTpPWHChAYNGrZv32HMmD9ee/XVdOc2btw4WZLvvvteAWBv1B1RZrNJAWCfOIcNAFJIjSuLF+E4duyo3BYrVsy2Uz2zXxrx8fHffPPN559/PnDgO3K3Xbv2VapUltj20ksvTZs21dPTc/78+f7+/oryulTqVq1apVjClUwycuRv3bt3l7sNGzasX7/e5s2bmzRpMmbMmGeffXbKlClDhgz56aefChcuku4iNW7cyHr2nYw/ePCXavv119+Qep00WrVqVaNG9TVr1nTs2NE61Y4dO6RnxYqV1atXl7sVK1bctm1bUlKSu/tDP2wgUe3zzz8bPnxErly5FAB2SL6gzGblMS8zBEArCGwAkCJlSyZrV7729U25RogEs3SvUHLs2DHFkprUu4UKFapTp86BA/slsB04cLBJk6aWtJaiZctWamA7fvy43K5fv06dVnX69GkJbLVr15Gq2nvvvSvzeeWVXhkt0quvvma9cklISIi1v2nTpmpD4mWJEiWOHDls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","mimeType":"image/jpeg","_meta":{"codex/imageDetail":"original"}}
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Type email rest",
  "timeout_ms": 30000,
  "code": "const typeChars = async (text) => {\n  for (const char of text) {\n    if (char === '@') {\n      await tab.cua.keypress({ keys: ['Shift', '2'] });\n    } else {\n      await tab.cua.keypress({ keys: [char] });\n    }\n  }\n};\nconst suffix = `${Date.now()}@example.test`;\nawait typeChars(suffix);\nawait tab.cua.click({ x: 464, y: 437 });\nawait typeChars('local-password-123');\nawait display(await tab.playwright.screenshot({ fullPage: false }));"
}
```

Output:
```text
{"type":"image","data":"iVBORw0KGgoAAAANSUhEUgAABJAAAAKRCAIAAACEPsThAAAQAElEQVR4nOzdBWAUZ7uG4cnGPQESHIK7U9zdvWihRYqVYjVoS2kLLbRY0eIOxd3d3d09JEAg7nbe3YFliZEUTv9JuK/D2f/bb2RnZjfbeeadmbWIjo5WAAAAAADaY6EAAAAAADSJwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABSLPWrl277J9/pFGrVq1evXvHGTp50qRDhw5Jo0zZMt9++12cobNnz965Y4c0OnTs2KJFCyV5pk2dun//fmmMGTsmR46cyRx5/IQJWbNmVf5zXl5eAwcMkEb5CuUHD/4qRdM+evToq8GDt27dIu2GDRupna7pXLNlzVaoUKFGjRrZ2tkpAADgnRHYAKRZ6dKlUxPFzZs34ge2adOmenp6SuPgwYNff/2NTqczHTp3zuxLly5Jo2u3rkqyXbx0UX3Fn4YPT/7II3/7TflfCA0NVRfAxsZaSSFfX191WmFsGDk4OA4YOEC2qrm5uQIAAN6BTgGANKpcuXJq49atW97e3qaD7ty5o6Y1ERQUePXqVdOhL168UNOaqFSpsoIkZTWQkGbskU3628iRbdq0lkyoAACAd0BgA5Bm2dra1q1XT20fO3bMdNCRI4ffeHr4jafHj78cuUKFik5OTgoSJ1v46rXr8u+xl9eVq9cWLlrcpcun6qDdu3b9/vv/pngIAECawSmRANKyOrXrqJeiHT500PRSNPXiMaN9+/Z93rOn8al6bZuoV7+e6WjPnj07cODAo0cP7Wzt8hcoUKZMGQcHByURERERZ8+evXD+vLWNdc0aNbPnyKEkLjo6eu+ePdeuXbO1sytfvnyhQoUSPJkwNjb21KmTV65cefr0qbu7e+HChT/6qFxi8/T19ZX1evjggZmZmbx6jRo1XFxclGR49OjRyZMn1XadOnUcHR2V5MlmINs5ffr0EyaMl56Jf/3Vvn2HIkWKxFkLyc/Xrl2VSmbu3HlkLQoUKBBnVvv27vX183N2cqpVu7Ysz969e27fup07T+7WrdvY29vLCMHBwQcPHjh/7rydnV2FihVKlSptYWHxHjcCAAAaQWADkJZVrVZNbezevdvYGRMTs3nTZsVQQLO0tDh48ODevXujoqKMe/ySndSG7N8bpxoz5s8Rv/5qOnM3N7c/x4xt3bp1/Nd99vTpoIEDjx07auzJmzfvsuUr8ufPH3/kx48fd+rYQdKasado0aJbtm6LEy0kt7T9uI3xXE3jmKtWr8mSJUucef7114Sfhg2L0/n776P6ffmlkiQvL69GDRveu3dX2t2790j+DVdMDf/554cPH6xatUraq1etMg1s9+/f+7hNG9OVFW3bth0x8rfMmTMbe7p37ybxuGDBgiNGjuz6WdegoEC1f+yYscePH791+3anjh3VhVQ1btxkwcKFVlZWprP91xsBAADt4JRIAGmZVG/Ua6tu3bolUUTtlLSgBoAKktgqVlIM11xdvHBBHfr8+XM1FMmEJUuWUjtnz54dJ60phoJb188+XbRoYfzXlbxhmtbUBWjTurXMPP7ITZs0jhNgZAFat2olGdLYI5WiZk2bxElr6pgtmjfz8/Mz7Zw7d278oCK+/37owoULlMTJqzRv1lQNQm3atBk7bpwUppSU0+l0n3728mYt69atNZ1/yxYt4qysWLFiRf169UJDQuL0P3rkKenOmNaELNucOXNklU3Tmti8edOPP3xv2vOvNwIAAJpCYAOQlklyaN6iudo2XsZ2+NUVa2U/+uijch/F6TRewFa3bh215rZn9+7BgwYqhgi3YuVK7ydP7t1/MH7CX+po3337nTEKGkmWq1uv3o6duzwfe61ctUoqRYohbPTo0T3B5fyiX7/TZ87KbMeNG6/2nDx54vr162pbSoLt2raVyCft6tWrb9y0WZZhw8ZNVatWVQz5s327trGxserIu3buHDigv9oeO3bc1WvXr1y5OmbMWLWn3xdf7Nu7N8FlCA4Olkippqn6DRpMnzHzXe7xKFFZbchiq8sWHR3doX07dS26dPlU1tfXz//AgYPqWZ2ycf744484M5GoJmXM7Tt2PvJ8vGDhIjV7S+KSzStb7MbNWxcuXuzdp4868saNG40T/uuNAACA1hDYAKRxNWvUVBsHDxxQG8ad9YoVK5YvX0Ft7933stN4AVvtOnXUxtKlS9TGqtWrGzRoaGdnny5duh49enz99TeKIVSsWb06zotmzZp1zpy5UsFzdHSsX7/BwkWL1f7du3YFBQXFGblVq1ajRo3Oly+fzPbznj3VGCaMRb/bt2+r9TpJL/PmL5DMJstQo0aN+QsWqhnmyJEjd+++rDgtX7Fcbfw0fHjPXr1kSbJlz96rd+8ffvxR7V+2fJkST1hYWKeOHSQlKvobY1ZauCDu6YUp5WagttUCoEQ1WU7FsGH/mjhR1lcCYclSpRYtXqyuxfjx4ySaxpnP3Hnz5W1ycnJq2bJlz1fXGRYtWvT330dlypTJwyPXzz//rHZ6enoak/O/2wgAAGgQgQ1AGme8jG3Xrl3yGBUVtdcQ2GSnXxKFi4uLWuHZuWNHeHi4YijOvJyw6ssJ1eKbVMkkyZjOuX2HDmrDWAoz6tfvS9Mr0GTazp27qO3Lly/HGbl5i5amT1u1bqM2jD82cPbMGbUxcOCgDBkyGMeU5R8yZEiccQ4dPGgc2XS2xp/GPnL4iPKmiIjI7t267TFcuVeyZMnlK1a+l5+9trd/eUeWyMhIeTx/7pz6tFu37qY3CMmSJUujRg3VtuejR3FmUu6jj4ztOnXrqo1q1asbz9WU7NqmzcstZjzj9F9sBAAAtInABiCNy5w5s/GMRKnAXLp4Ub0mql69+uoI9V7d+v/cuXMvXrxQzwmU0o1QDCc3qr/YJv1Ojg6m/8qWKa1OGD+Dxb+5SKFChdTGxYsX4wzKbXghI+MtEyOjItXGmbMvw1ic2y0qJmcenj5z2nRpS5cpE+euiZaWltKpbgdZTdNBmzdv2rhxg9oeN368s7Oz8s6kkGi8zEwqh6ZrIaW8OFtyxYoV6iCpJZrORCpvptHRuEZ2tm/kSds3n/67jQAAgDYR2ACkfQ0avCzgnDlz2njDeuMdIKVcozZOHD9+5vTpV5O8jHMPHz546/wfP/aM02NaB1MZzw987Bl3ZAtLSyVJd++8TD5u7u5xBrm/6lHHefTwofo0a5as8edj7DSOFt8333yjVhrf0dWrV9SGrLiamuKEsQQ9ffpUeWfvvhEAANAObusPIO2TbPbXXxOkcfrU6QcP7qud5cuXVxulS78slB05ciQk9OWNCmvUfHnlW758r2tle/ftS3D+Tk5xS1L37t8v9Wq2KuM1Zmq5L0WKFSu2desWxXBPfGmbDrr/4GWeLF68uH5pX1X2bt68EX8+xs58+fLFGdSyZcudO3dJ7VEi6/DhP40e/YfybvbsfvnTCE2aNFUbxYoW275tmzRGjBxZpUqVBKcy1iHfxb/eCAAAaBCBDUDaV6HiyzuLnD139prhwrDq1asbz7WztrZu2LCRJKITJ44bb3pRufLLROHo6CgR69q1aw4OjqVKldbpknVigpTyJAKZ9hjv8l+kaFElhUq/Ovfy5ImTxvzzqueE6TgODg5Fixa9dOmSLPCLFy/UcxFVxrM9S5YsGf8StQULF+3ZvbuF4Y6a06ZOrVixUvPmzZV/a926db/9NlJtt2zVynQJha2NbZkyZZX/N/96IwAAoEGcEgkg7bOzs69uOO9x965d6tVNxttXqGrXrq0Yrn1SC1kVKlQ0vY5LDW9Sffpj9GjTqbZv35Ylc+ZPu3TesmVznFec+NdfF86fNz5dvWrVnlc/xp3gb2cnzfhzcBMmjDe9BE5eQq0cihIlSqoNWXi1of4UgdGggQPUhrG0aKRmy1q1aw8ZMlTt6dO79507d5SUe/LkybJ//unS+RP1ad169aq/OuPUuBZ//DHa9HTEqKio2rVqVata5Ycfvo/zg3L/2r/YCAAAaBMVNgAfhLp16+3fv9/4tNqrO0Cqqry6k/7Lkeu9Eed69e69fPlyCWyjRv3+9OnT+g3qZ8qY6ciRI0OGfCdD165d++mnn8V/xZYtW3Tv3qNQ4cJHDh+aMWOG2vnVV19bvu2KtfiyZMnSu0+f6X//Le0WzZvJbEuVLnXm9Jm5c+eoI3zRr1+mTJnUdp++fZctW6b/sYE1a8LDI9RCmSykmkWlTtin7xeJvdC33313+PChgwcPyuSffdpl+46dtra2SS/bzh07vvlaf+tF/4CAY0ePmf6etZub25QpU423c8yWLVuPHp/Pnj1LgnGjRo2+/PLLMmXLBPgHSOZUf07AxsbWyclJeR/eZSMAAKApBDYAHwRjnUcx7K8XM1zxZVSoUCFJFxIk1KfG+5GoChYsuH7DR0TdRQAAEABJREFUeqkCSXvOnNnyz3Ro585dahkKdKbatGmzatWq0aNHmXY2btzkx2HDlH9l1KjRT588kfghCxlntm3btv3tt9+NT/Ply7dh44ZahmvwNm/eJP9MR968eXPu3LkTexULC4vZc+aWKV1aos65c+d++P778RMmKG9jjKOmatWqNWv2HOOtVlR/jhnz4sVzWQvJdV99Ndh0kLwp48aPT+YZp2/1LhsBAABN4ZRIAB+EosWKqb/OrOjv4183zt3epQpUr/7L20Kq16rFmfyjj8pJuSnO77B5eOSaN3/B1GnT4r/cyN9+/+GHH017JNfNmj3b3Nw8/siJ1dwsLV73y4TTZ8wcMHCgcS3URR00aPDUaX/HyTlly360ddt29ffljCpUqLhj5y7TW6FYvtoIpguQOXPmpUuXqm2phm3btlVJNolnpcuU+fzznrv37Fm7bn2ctKYYAuGMmbNkmU3XQjFkzrPnzsW5n0oSEvtRb9O3NZkbAQAAjTOLjo5WAADJ4+Pj89jT00yn8/DwcHR0THrkqKiomzdvytdszpw53zpyMoWFhT18+DAgwN/FxTVbtmzW1tZJjPxEeHtLI1PmzO7xfhLgfygiIuLRo0e+vi8yZMiQPXuO91VYS5BmNwIAAMlBYAMAAAAAjeIaNgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI3SKQCQpoWHh1+/emX/nl2XL54PDgpSOyMjI1b+s/jO7VvKu3lf80kbZAuvXbUsNjZWSc08Hz64eeOa8q88feK9fPECf38/RQOCggLPnTkVFRWpvG+7d2w7euhA8sfX1GZJWnLe/ejoaNmwSa/OE2/vq5cvKnxFAHgfCGwA0jKvx55/jBi+YM6MPTu3LVkwd/Svw25cuyL9gQEBZ0+fvGbYo3oXKZ1PVFTUP4vmP7h/T0mLLp4/e/LY0bCwUOX/n+wxb9mwVvl/cOzIoTUr/lH+lYf3750/d8b78eMkxvn/W/I4nnh5rVi6yN/PX3nfjh4+cOLY4aTHMV3N5GwWjUjOux8eFiYb9sG9u0mMc/bUCRlHeX9fNQA+ZJwSCSAtW7tymZWV5YCvhzi7uPj5+U6fNH7Z4oU/jRydLn2Gn3/708raWnk3KZ1PTHS0pJqChYrkyOmhpDntOn3aqm1HKysr5f/f/bt3Ll+80KhZS0VLypSrUKxEqaQ/D9pc8hQZ+tOIt45juprJ2Sxp1fv6qgHwITMfPny4AgBp1IY1K0uUKlOidBlp29jY5itQKH36DO6ZMpubm0/483cX13Ru7hkV/eHwk+tXr9i2ZaPPs6dPvL337dlZsnRZ6R/7+6929vYH9u5ev3rl1SuXsmTN5ujoFOcljPM5eujAzq2bzS0sVv6zWOYQGBiQN38B0zFl3lMmjImIiLhy6cL1q1c+qlBJOq9dubRp/ZotG9Y9uH/XydlZZhVn/jLb7Vs2hoQEL5w768K5M5myZPV89HDh3Jm7tm2VZS1YuIhOpz9X4uaNayuWLJQxTx4/ojPTZcuRU502sUVKcHzFUBDYvH6NbI2Tx49lcHObN2NaxkyZ06VPL4OuXr4oi7p5w9prVy9nzJjJydklzqIeO3xwx9ZNZT4q/+jB/ZlTJ7llzCjbf+vG9Q8f3MtfoJCFhf4QYUxMzM5t8gorD+zbLa97cP9e2Sy58uSVQaGhIbI8MsmhA3uDg4Ny5sqtrtq9u7eXL120bfMGWX3ZQLJU61avOHH0sGxJeeMcHB1lCU0XI8H5JLFI4sypE+tWLZepXjz3iYqK9PP1rVKtpjpJBnf35UsW7ty2Raq1mbNktbWzUydJ8I2TSebMmFq0RElra5sEPzzxlzz+2imJkwqtlK02rFl1cP+ep97eefLmlzdX3uWtm9bLZlfHkVmdPH60WImSvi+eS20np0eu1cuXxl9+tZS0c/uWWzeu5/DIZWfol9qRTL5x3aqD+/Y8f/Ysd568Mn91O8i6LF+y4PzZM2XLVVi1bLF8COWzZPiAbVIUM6kbHz6wz8/3hbyVOp15nNWMjIgwbhZ5lUP798qm27Nru6xClqzZbWxskv6spmgT6Vdh03pZgL27d9y7cztn7tzyh68k+bec4LsfZ7YBAf6b1q3ZsGbF6ZPH5c9BDrvIFlY/eAn+XchW9Xz0oEbtusqrrwj5blkwe0a+AgXt7R3Uec6fPf3OrZuFihSLjY3Vb5N1q3dt2yJT5fTIbW0IeLLM8tHdunmDDJIvsWkTx8q6yJuoTr531/aNa1eXq1jZzMxMAZCmcUokgLSscLESp44flX/qlTyyg1WhclW1BPTixXPZCVMM526tXLZYZ25eoVIV2X+SyOH92FOdXMZZsXRRdHR08ZKlPB8+mD55QvwLtIzz8ffzu3Xz+tZN6woUKiL7grJrePjgPtMx7ezsK1SuIo1MmbOULV9BGtevXpYYFhIcXK5ipadPnsz5e4q8Spz5y2xlqU4cPVKlWg2JbXOmT/ln4VxJoYWLFpXdcdlpk3Ee3L83b+bfsjcvO4iZs2TbsHaVxIkkFimx8SMjI2ZOm3j+7OniJUtLDXDh7BmydkFBgYZFvbJo3uzYmJhKVaoFBvhPmzT+uY9P/EX18nykGK4blAmXLpgr+6+yB3/pwvl/Fs9Xx1mzYum+3TuzZc9RvEQpSW6XLpx78fy5YrguaM70qadPHCtavKTs1Mo4q5ctkf4Af39JC7LHX7NOPUsrqwVzZkjAK1CwkDq3ilWquWfMZLoMic0niUWSD8CqZUskKsgH4Mb1q+fOnFb71UkWzZkpIb902XLXrlyeOXViWGhoEm+cOklkRGRiH544S57g2imJk1xx5NCB4qVKSzzTn3T3zyLTza567vPM2+v1yYfLFi+Iv/zyFktwlU1RvWadZ8+e/D15fLTB7OlTTh47IlFWPmDyVyMpy7hSshmz5/BQY6Ec1FCX0/ABu7Fu9fL8BQrmzpvv0IF9SxfOk/44q2m6WbZuXLdl4zrXdOnlMybvwt+TxknATuKzmtJNtHDeLNlERYuVqFaj9r27d+TvRe1P7G85sXfflPxdzJo2SeKiLHPWbDmWLZpvHJScvwv1K8Ijdx5pyFZVO2Utbly7miVbdmlLwpTILUlMNq/McNqkcbKc6oTyt2lpaVm5Wg05JmBmppNcp04uCy+byDVdOtIa8CHglEgAaVnjZi2jo6PWrFwm/6TSUrFyVdnlijOOHFnPniNnz779pS1H1v8Y+cZ5B7Jz36HzZ4oh7K1dtVyKWnHqOXF83ufLdOkz1G3Q6Ncfh8gOWeWqNYyD7B0cZP67tm+tWr1WqbIfSY8cmJe9tD79B8tel2QnOaAuC9Ot1xfxZ9v7y4GS9/IXLCw1unoNG9eoXU8678sOqeFmBrJH3vLj9rJTLpVDpZryyw/f3rh+rWDhooktUmLjyz697G72+mKAbCuZMF269FKBUWeyce0qyT9dP+8jbZnD77/8uH/PzlZtOySxKeo1aiobXNFX1aLldaUhgfPMqZO16tavU7+RPJVM9ffkCerIsp/62PNR/6++kzQrT12cXeWlm7ZqIwUHedq0RWtZpAqVql65dNHJyVnqmeUrVr588YLsyMZ50cTmk9giKYYPgARI9QNQqWr1P0a88QGQQmizVh9LQ0ock8f/eeH8mXIVKifzjYv/4ZFyiumSq/eliLN2SuLu37sji1qvYRNpFyxURI4yKG8jOST+8t+/e8dcp2vT4RP5ABQrWUoWTFZEUqjUzbr27JMvf0EZX0pz169dNd6zpHnrtmXLV0zwJdp/8qmsl7qaUmiSOlWc1bx984Y6piQ3qalWrV6zYdMW8lSKdVJ9OnX8WNUatdQR4n9WE/wAJLG+tes20NXXSTpS9EV1Gym1RYSHq2ckJvi3nPS7r1L/Lnp+0d8jl362zi4ue3ftUAcl/+/C1tZO6uGnT51Q111NbqXKfCQlQdkmjZq1UMt6hYsWkz8KKcIXK1FKMfyNdOzSVZ2DfHQ3rlsthVOJuxJuZWNKHlYAfAAIbADSMidn508+6+Hz7KkcHZd6lFQbLp4/2+nT7sYR5Ni5HNqXg/HqUxtbW9kn83r8ul4h+09qI3fe/PLo7++XRGCTY+Gyu/lq/LxS60h80fSnt8leoERK9Ri5hYVlsZKljQfgTVlbW0tak4ar4by7dOlfnhImtQvfFy8UQxTMlTvPwX17vB57ypF72ZMLCQ5KYpESG18qbzK+mtZE0RIl1cAmx/vlYL+/n+/yxQtebbfIhw/uKUnKnSef2siTr4Dsu8fExDx6cF+eSvVG7c+e00NeTm2rt3DYv3un+vSxocj5xMsrb/4CMs7svycXKlq8UOGikjrU8yQTk9h8ElskSW7yAZAIrfbLds7pkVuKTsYZFjXsNwtJaA4Ojg/u3Stdtnwy37i3fnhSunZSgdmxdfO40SNkb1729dUTepMWf/klsJUsXfbYkUO/Df+hRKnS8i5LSU3RX3V2VxZGTWtCQpcaw1RqBEqQ1MTUhpT+JLA9fHDf+JGLQ/0AlH519qYsv/y7d/e2GtgS/KymdBPJp1dCneSoZ0+fSr6VntCwUDWwxX870mfIkPS7r5I1kmVQ05qQja8GtpT+XUi+kuwn6yuzkuRWpFhx+dNW06wss+eD19V1+cNUA5t6trBK3nEJbKdOHJdAK4VQGxvbPIYVAZDmEdgApH0Z3Nxr1W0g/7Zt3nBg7271ELU6KCZGf1qUmckuoJnujVOMzM1ffk/qdG8/9ch0V/KtpyrFGM56sja5G4GVlXVU5L+5Cbvs7S2eP9vO3l524IqVKKmeopnEIiU2fnRUVILjR0SEv+x5tRFKli5j3IaJMV4hZv5qnuqJXjqdefzFCw0LMZ1/1mzZ5J/kZ0tLq6E/jTi4f8+lC+cvXTi3eePagd8MleCR2IsmNp+Q4OAEFykqMkoeLU1ulGJh+cZ/Ga1eRUp1kGyK5L9xb/3wpHTtpLIqKffw/n2HD+zbt3tn3fqNatatryQp/vJLI4dHrq+GDNu3e4eU+I4fPSxhTEpMYWGhxgWOz8ws0ZhkfBMtLfSvFRERkdiY6h1ETTedtMPCwuLMRzH57KVoE8XGxk4a94ccg5A1ypw5i4ur66kTx4xD478db333VeHhYaZbxvgpSunfRd58BSRlnTx21Ewxkw9kxcr6+ph6Rqisr+lMjMHe9GtEPsb6Gt2JozVq17l66WKV6rU4HxL4QBDYAKRZT7y958/+WyohRYuXVHuyZM2m6Pcaw4zjyP6ik5OTlN0qVNJfXRYRHn7vzh0rK0vl/1Osok+JctRfItPNG9eNZ5rdunEto+FEvpSSw+2yFt/++Iu6y7vvVX0ppePLfrwUXjwfPsiaPYeiP2Hvktpvayu1B/vCRdpB8+AAABAASURBVIoZz/V64u2VPoObkkLZc3jI46ULZ6vX0t+MQcoIUtx7+dI5c8mObJPmreWF5GloSIjs3Mu+r7wjUiCt26Cx/JPxJ4//89zpU1Wq10zsJRKbj/GsvDhkJ1j2oW/duP6R4V0wlAEfmFu8jpR3bt9S78gSHBTk5+tboVLV9/jGpXTtJIpISapL956ynAvmzNi3Z6cENnlzZDMGBQY6OOpjjJenp7mFRRLLrxhuLRMdHdW6XUdpyyEMOZDh7fVY3v0Tx474+b5Qb6Dy9In3o4cPjOXQJKi3M5HG3Tv6E3SzGT48CVI/APJelClXQV19+SDFP6/1X28i2T7yr037TqXLllMMNzJRkvTWd//lYmfPKR8qPz9fFxdXRX8TlDtqf0r/LiRflatQ6ejhA1Kvkwlz59XXe7Mbbhgr74scOlEMmVPei0yJfJykRjdv5t9SG4+OiSlfqbIC4MNAYAOQZrlnzBgZGbl6+dKw0FDZAXr8+NHm9WtlP8l4mzWVVC02rF01e/qUnB65Lpw7I/v3/3+BTY7lS0SUQkHGjJkkFMle2p6d2zJlzpwnX4ELZ08/fHC/dZJXhSUmfYYMkhnu3r5l7+BwYO+uyLeV6RIbv2ChIhLkZFNIFAkPCzt76oRxEgm0e3Zul53RgoWLPrh3Z+2q5dVr1qnfuKmSEpIopESwfcumZ0+f2tvbSzwwDipQqLBsmRlTJzZr1Ub2g9euXOb92POHX34/dfLYlg3rGjdvKcXA84YbQkjZRDGcDiqloRvXr8q7aXrrzsTmk8RSlSlXXgpWWbJmzZU77+GD+4OCAp1dXt8Ac+fWTU7Ozk5Ozls3rZe6XJFiJQxb49+/caZLfv7s6QTX7t6d26dOHK3XqKnp9VpSn5w2cZyTs0ubdh3DI8IlmMnbp+hPAswlj/8snl+1eq1rVy+/ePHc9FTJBJd/1fIld27e+KTr5w4ODrcMvxMtI8i7I5tu7sy/mzRvKR/TFUsXhYWGqbdLTdqiebNatG5r+Fv7RzadWh0yXU3jmLIk2XPklD83iZSyIru2b5FyZYlSSb3EieNHkr+JnA2B6ua1qzk9cnt7eUoQVd4m6Xdflb9QYYlYkpSatGglXyYb164yDkrp34WkrAP7dssnX8Z6uczOLhJxVy1bLGFNNt2Rg/tlaI/e/dQ4F4dao9u1fatMEv+OsgDSKgIbgDRLjmf3G/j1onmz16xcpvZIha1z18/jjFahclULC4uTx4+eOXWiUOGiOXKG3755PcG5Kck40dFkfF38s8hk8vqNm23duO7alcvDR/5Rp37DkJDgPTu27dy2RfaV6zVsrFYeEp/pG8+kPqYuT7VadW5cv6be00+iqexxJnidj3GREhtfCg59+n+1Y+smiZQODo4dP+0mW0+dtk79RrKrKill+5aNiuEynlr13nIynulaG9udPu2+c+vmK4abbdRv1FR2XtV+eble/QYuWTBnznT9UsleaZcevWR5ZIdYds0laaujVaxctXDR4orhep7TJ4/PnzW9fMXKzVu3Nc4/sfkksUiNmrYI8PeXGKkYwkCRYsUfmdyrs1K1GuovIEvU7/RZd8m6hq2RsjfO9MNjuuSSQxJcu0sXz0s4adW2o+lMzM3N5R1ZumCueqcWedc++ayHNDxy5alao9aRA/sW3r6VK0/eEiVLe3u/vktkrboN4i+/5Kt5s6ZLjU4xXDnWtmNntSDZ84sBS+bPmT97hropen7RP+kLxhRDjVqijjqJzLxbzy/USUxX01jiFt16fbFw7kx1keToQOfuPTNmypTQFnv5WU3sA5DgJpKFkU0qI58/d0Yx3LFDPsnx/2ZN346k332VZMJPe/Retmi+ZDZ5WrdBI3nf1clT+nchxd4Mbu5SMyxn+FUPVffe/ST0/mO4+aSE6gaNmyaY1tRl/qhCRamwqadTAvhAmKlXFABAGhYVFeXv5yd7Y+YJ3VUvMjLC98UL493hx40eYW1t02/QN8r/m9jYWNnJM/4iljwNCPB3jvezZikVGBggs0r6HnpvHf+x5yOJcOo+99XLFyWw9ejzZe5Xdz6Q8f39fB2dnM2TcX/CBMkbIdOqJ++FBAePHP59jdp11dseqqSyFxEZEef37uQ9CgoMih9Ew8PDJWwnuDAJzicJ8iGRDGa6NW7fvCGZ9qshw5xdnIMCA+MXNN7ljTNd8vhrN3fG1JjYWCmzJDitvKhMq96Hxki9gYqFhWVCqxYZHBQcv3AUGhIiZTGpesXvl63h6PT2Tbdt04bjRw8N/+1P2XSxMbFqxS+x1YyzSGFhYUlcrRdHijaR7Nj4+frKyBYWyT0qHf/dT5Bsedns8Wf77n8XimGxA+Xj5OKa9FGhTetWHz9yaPjvfyb4XgNIk6iwAUj7ZAdLLSwkaPXypZcvnK/bsLEc+lbv313XcNP5/z+yQ2ZMa+rTd09rIvnhJLHxXzz3mTJhjEfuPJWrVpdkdWDvLjnen9Mjl2KyqO9yIpbs1079a6w0GjRpJnve6iVGhV79/IDK2sbG2vBLyqYsLa1c0yXwuqa3r4g7KKH5JEE+JIntr8uecYJr/S5vnOmSx1+7p0+8q9Wsk9i0CS6nziDB8WX546c1IR9C24TGN/1wJlOc9GiU2Bski+TgkIK8kaJNJKkpib/3RJbHIjlHOhIb5x3/LlSy2EnPxNvrsRxDOXLoQJVqNUhrwAfFfPjw4QoAfMDy5Mvv5+d3/Ojhc2dOBwYEVK5Wo1a9Bh/m7ddkTz1L1myXL56XrXH75vUMbu6ffd47OZWWZJKtmr9g4Qf37544cujShfMW5hYtP26fr0BBRZOCAgOuXL5YoVLl+GdU/r8zMytesnQScVQjvB57+vn5ljfcsOe/lko20Xt07Mihwwf2FSlavEmLVu9SygOQ6nBKJAC8JPUfbpMNAAA0hVMiAeAl0hoAANAaAhsAAAAAaBSBDQAAAAA0isAGAAAAABpFYAMAAAAAjSKwAQAAAIBGEdgAAAAAQKMIbAAAAACgUebDhw9XACCNGvv7rzqdbuvmDZvWra5SvaaZmdmh/XulvWvbFs9HD3J65La2tlbH1PevX7N966Z7d29nzZbdzt7etH/Pru1Pvb2zZM1uY2Nz9fLFBbNn5CtQ0N7eQR1n/uzpd27dLFSkWGhoyPYtGzesWXnowN7g4KCcuXLLq8dZjBKly0ybONbGxjZzlqzq5Ht3bd+4dnW5ipX5ITgAABCHTgGAtOvFi+cb1q6ytLSsXK2GRKZtm9Zv3bReklKZj8pfv3pl2qRx0dHRMtrWjeu2bFznmi591eo1Hz14MHn8nxK9TPuLlyx96cL5vyeNk36P3HlktqeOH1Vf4tnTJzeuXc2SLbvMas70qadPHCtavKTEuX27d65etiT+Yjg7u5iZ6SQHqoNiY2MP7N3tmi4daQ0AAMTHKZEA0jiJTx27dJVGeFjYwf17GzVrUaVaTXlauGixvydPuHLpQv6ChaVfolrDpi2kv0Tpsls2rAsOCtLpzE37y5arMOHP308dP1a1Rq2ChYucPnVC7VeTW6kyH0kCfOz5qP9X32XKnEV6XJxdd27f0rRVGzs7e9PFEBUrV924brXvi+cSBW/dvB4eHl6xSjUFAAAgHgIbgDQuV568auPRwwfyeOXSRc8HD4xDvR57qoGq9Efl1R4XF1c1Wd2+ecO03809o/y7d/e2BDbJV9euXJa2R648ktyKFCtubW394N5dGW3/7p3q+I8fe8rjEy8vdQGMi6EY0p0EtlMnjtdt0OjksSM2NrZ58uZXAAAA4uGUSABpnPFUQ/UsR3lqpnv5r2TpMhkzZQ4LC5V+48VsRvH7pR0WFiaNvPkKSMo6eezo/bt3QoKDK1bW18dCwwzzfzXzrNmyyfxtbG3jLIaQTn2N7sTRyMiIq5culufqNQAAkAgqbAA+FNlzeshjhUpVi5UoqRguHvP2epwpc5bAgADFUE8rU66CNKKiIo8fPVyiZJnsOTxM+yPCw594e1WuVkMxpK9yFSodPXzA0tLSzt4+d9580pkjZy6JcE2at1ZvWBIaEiKRzzVd+gQXRmp082b+fXDfnuiYmPKVKisAAAAJIbAB+FA4O7tky55j1bLFEtaksHbk4P4Tx4706N1P4lb2HDk3rF1lbmHhnjHTrm1brl29nL9AITf3jMZ+J2eXXdu3xERHlyhVVp2bpKwD+3bLHGrWqa/2FChUWEpwM6ZObNaqja2t3dqVy7wfe/7wy+/GIpsptUa3a/tWWSQX13SKIeBNnvDnR+Uq1qxbXwEAADAgsAH4gHTv3W/RvFn/LJovbXOdrkHjpmpxrFuvLxbOnbli6SJpS9GsXacuktbi9Ds5OXXu3jNjpkzqrKR0lsHN3efZUym1qT0ODo69+g1csmDOnOlT5anksS49eiWY1hRDje6jChWlwqaeTikiIiMC/f2fPXuqAAAAvGKm3tIaAD4c8r0XGODv7OIa58qxqKjIoMBAKaapP55m2h8WFiZ5LJnzDw8Lk/Tl6OiU9Gib1q0+fuTQ8N//tLCwNC6Yubm5AgAA8AoVNgAfHAlF6lmIcUhwSqzfwcFSSTZrGxv5l8QI3l6Pr16+eOTQgSrVahjTmrpgCgAAgAkCGwD81y5dOH/k4P4SJUvXbdhYAQAASBynRAIAAACARlFhAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAbgwxIdFRUVHR0TE6MAwIdNp9NZWFiYm5srADSMwAbggxAbGxscHBwaGiptS0tL2U1RAODDFh0dHRkZKd+Htra29vb2CgBNMpO/VQUA0jTJaQEBAXZ2dg4ODhxLBgBTktmCgoIiIiIcHR1tbGwUABpDYAOQxgUGBsruiKurK1ENABIjgc3X11cObFFqA7SGwAYgLZPDxlFRUenSpVMAAEmKiYl5/vy5FNnIbICmcBUHgDQrLCwsPDyctAYAyaHT6dKnT6+eHqkA0AwCG4A0KzAw0MXFRQEAJI9kNvnalMymANAMAhuAtCkkJMTSQAEAJJutrW1sbCxFNkA7CGwA0qawsDAuwwCAf8HOzla+QhUA2kBgA5A2yeFha2trBQCQQjY2tlTYAO3gh7MBpEHR0dHcxB8A/h35/oyKilIAaAMVNgBpUExMjE7H9xsA/EtmZmaxsbEKAA2gwgYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEbpFADAm44fOzb8p58qlC+XOVPGhg0bLF68KCoqSgEAAPjPEdgA4A0b1q+vXbvWuHFjL126ZGNjc/Cj1XQ6AAAQAElEQVTAgd69erVv1/a9ZzbJgQ72dpMnTVLSqDu3b8sKtmndSgEAAP8WgQ0AXjt65EjHjh2kMX3GjCdPnt69d//4iZP58uXbtm3btGlT44wcExMTHR1t2hMbG5vYnBMbFBMbk/yRUzTav1gYJdkvnfxpY2L+/QwBAACBDQBemzV7ljz++eeYTz7pbO/gIO0iRYrMnTdfGvPmzpXHmzdv5PLI+c03X/80bFjWLJm7dv1MOgMDA9VTKB0d7KtUrrRxwwbjDP39/WXMAvnzySCZUNrh4eHSP3BAfyncSeOH77+XfqnmJT0fU4nNUyVLKDNXh9arV3ffvr3GQUFBr+dfqmSJ2bNmmUasWTNnNm7USAbVqllj9KhRERERar/MTV7l8uXL6lM/Pz95aqybyXyqV6t65PDhVi1bqtOqr7hs2T/FixeTxo4d22X8efPmKQAAIOUIbADw2uFDh+Sxc5cupp2lSpW6eu36ho2bpB0VFf3s2bO/p00bP35cnjx5ChUsFBkZ2fmTT8aNGytDW7Zqdfv27Q4d2q9cuUIxVJw+7dJFxnR0dOrRo4eLi4u0f/jhexlUuHAR4/zr1Klrb2eXxHxMJTFP4enpWa9u3dmzZ7u6ujZr1kxyVJPGjffv3yeDJIB90kk//ydPnrRq3drb23vgwAF//DFanXD06FGDBg2UMRs0aHD16tWRI0f07dNHSogy6IWvr6yy8YxQWc5nBupTmc/p06c7deoYGBjg5uZ24sQJecX79+9nypSpaNGixhXMnDmzAgAAUo7ABgAvSZKRwJMrVy5HR8c4g7IbmPbs23/g0OEjQ7//fvnyZbt27fz008+OHT+xaNHi3Xv09aX+X34pySooKKhS5Uq9evc+dvz4XxMn7T9wUAatXrVKHnv26jV9xgxp/Pb777Nmz86VO3cS8zF93STmKUb8+qtEqaFDv5eZLP1n2cpVq6Vzg6FSt2LFcpl/pcqVb92+s3DholOnz0jnurVrJYnduX175IgRstYyaNXqNXfu3itYsJCUyHbt2qUkz8+//Lpz1+6bt27XqlVbnh49eqRGjZpLl/4j7Xr16ssKSg5UAABAynFbfwB4KTQ0VB7t7e3fOqbEnrJly6rtUydPymPuPLl37txpHCEwMFBKT1JW+vbb76QkdevWrbt37166dFEGqdUqC4u4X79Jz8fYI7EqiXkePqyvEA4aPFgduWHDht5Pnjg4OBrnP3ToUHNzc2lkzZrVy/uJGk3PnNGHt379vpSymDRsbW2HDBny2Wefnjl9ul69ekoyfPzxx/IoCyC1uz17dt++dVsBAADvA4ENAF7KmTOnBJhLly5JcpPQksSYGdKnN7YvXLggj8N/+inOOA8fPpSgNXXKlJEjR0juMh1kZmYWf55Jz8e0J7F5BgcHS4Rzc3Ozs7Mz9qtpzTh/j5wexkHGQuLVq1flMVfuXMZBOT08DJOcV5LH+Irp06VTDLdjUQAAwPvAKZEA8JJknqpVq0pj95unAkoKypwpY6mSJRKcKk+evPK4aNHiCxcumv4rVqzYyZMnv/vuWxsbm3nz558/f8HXz1/qWom9ehLzMR0tiXlKbVDSmlTbpP5mHN+YndT5P3nyJP4gj1we8vj48WPjoCfe3vKYN28+edTp9P+lCHqVDwMDAhQAAPBfIbABwGtt27aTx/bt2507d07tCQgIGNC/v5SzmjZtluAkH330kWI4qzB3njzyL1fu3EuXLj1w8KDknJs3b8igzz/v+fHHbfPkzfvg/n1PT0/jhGoQCg0Jfet8TF8u6XlWMQTOxYsXq09lLbJmyfzjDz9Iu1y5cvI4c9ZMdVBQUGChggUaNmwQERFRqlRp6Vkwf77U6BRDkJs5Uz9amTJl5DGvIelt2rxJnXD1mtVK8qiFxKDgIAUAAPxbnBIJAK+1+fjj23duj/j11yqVK+XLp3fw4EFJa0WLFv32u28TnOTjtm0l3kyYMP7e/XuScPbt3bdr187q1Wt89tlnpUvrA8/kyZMcHB3Cw8OnTX3jl9wqV64ijzNmTPcP8O/Vq3cS8zGdKul5fv31N2vXrPmy3xdHDh/OkSPHtGlTZeFLliypLueMGTNWLF/u88ynUqVKq1atkqTXsGFDKyurwoULd+r0yZIli6tXq9aoUaOjR48cPXq0YsWK9erXV/QhsIoyWpk8adKpkyddXV3Pn0/ueZI5PTxy5colSzJ40MCmzZrVrFlLAQAAKWQ+fPhwBQDSFqkRSZhJzu1D4qtSpUqmTJkiI6NOnTp58+ZNa2vrvn2/mPb3dCcnZxn64sXzmTNmFChQoHWbNur4tra2TZo2vXv3zob16/fs2XPnzp227dpNnTpNXj2DwcaNG3bv3r1/375PP/ssLDT06dOnQ4d+L3UzFxcXnbnu9KlTe/fuLVW61EcflUtsPqaLl/Q8ZcmrVqt65/btrVu3Hj58SBZ+7LjxnT75RCa0sbGR+d++fWvHjh0HDhzw8fHp07fvqFGjLSwspBTWoEEDPz+/M6dP7969y9/fX8acN2++epGbxK506dKdPXv2+vXr8tKTJk1euHBh9uzZPzUkyXFjx0qN7ntDEU/cuH599epVsg2rV68us82RPce1a9dkYSwtLBs3aaIASCWCgoLkyyfBC24B/MfMoqOjFQBIWyIjIwMC9D8LpryD0NDQ4OBgiSjJHD8qKurx48cSmaRmFaf/4cOH7m5u6i9xxyHZ0tfXVxKRcccosfkkf56K4UxO2d/KmDGjek9IU5KvvLy8ZJBEuDiDYmNj5aVlUPybWCqGsyiNtzBJkRcvXjg5OSU4TwDaJN8S7u7uBDZACwhsANKg9xLYAOCDRWADtIPjnQAAAACgUQQ2AAAAANAoAhsAAAAAaBSBDQAAAAA0isAGAAAAABpFYAMAAAAAjSKwAQAAAIBGEdgAAAAAQKMIbAAAAACgUQQ2AAAAANAoAhsAAAAAaBSBDQAAAAA0isAGAAAAABpFYAMAAAAAjSKwAQAAAIBGEdgAAAAAQKMIbAAAAACgUQQ2AAAAANAoAhsAAAAAaBSBDQAAAAA0isAGAAAAABpFYAMAAAAAjdIpAIBXtm3btnnz5rCwMGNPQECA9Ny+dUsBAAD4zxHYAOC1Nq1btWv78V8TJhh7Hjx4ID0rV65UAAAA/nMENgCIa+TIEdevX1MAAAD+1whsAPCGkiVLymO/L76IiYmJM0h6li37p3GjRsWKFmnRvPnu3bvV/pkzZtSqWWPv3j3Vq1WVf9u2bbt75077dm0L5M/XpUtnHx8fdbTY2Ni5c+ZIEa9smTIDB/T38vJSAAAAkkRgA4A3ODu7/PLrr0ePHl2wYEGcQbNnzerRvXtERHibNh/fv3+vebOmV65ckf5Hjx6dOHGiY4cOhQoVfvDgQdfPPq1Vq6b0582bb83q1f2/7KdO/vtvv/Xv/2VMTGzFihWXL19eo3q14OBgBQAAIHEENgB4g+Sxvn2/yJUr1/dDh3h7e5sOKl+hwl9/Tdy2fcfwn3+ePn2G9Bw+dMg4dPGSpdNnzFi8eElgYGCJEiWXLV+xafPmfPny7d27V4ZKnW3UqN+7deu2Zu3ayVOmzJo129PTc9WqVQoAAEDiuK0/AMRla2s7ZerUxo0affvtN99++52xv3jx4oEBAWP+/PPWrVvHjx+THj9/P9Oh8pgnb155rFChgjyamZmVLfvRP/8slfb58+flceXKldHR+jMtA4MC5fHq1SsKAABA4qiwAUACqlev0aXLp2tWr95nqI+phg4d0qBB/eXLl9nZ2bZo0TLOJDpdUt+okvSMowlnJ+euXbsVKlRYAQAASBwVNgBI2Mjfflu7ds2QIS8rbLGxsVMmT65UufK2bdslcR09cmTChPHJn1uJEiXkccDAgUOGDJVGSEjI5cuX1aIcAABAYqiwAUDC0qVLN2nyZONTMzOzokWL3rxxY8eOHZs3b+7Z83MlJTxy5ZKq3cgRIyTm7dy5s0f3bjVrVN+1a5cCAACQOAIbALzm6OhoZnJmY5s2H9epU9f4dNy48WFhYeqPazdv3sLYL1nO2H55YqRZ3DnLOMuWL2/ZqtWwH39s2aL5hg0bRo0a3bhxYwUAACBxZtHR0QoApC2RkZEBAQFubm7K+xYbG+vl5eXi4mJnZ6f8K1FRUc+ePcuYMWPS17wBwP+QfNG5u7ubHo0C8L/CNWwAkAKy+5IlSxblHVhYWGTOnFkBAABIBgIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgBIsZiYmOjoqJjomNjYWAUA/ltmOjOdztzCwoIftgY+BAQ2AEiuiIiI8LDQiPBwCWzm5uayx2SmsLcE4L8Wq8QaDhtFW5hbWNlYy/9ZWFoqANIoAhsAvF1YaGhISLDU0ywtLG3t7CWtKQDwvxYlIiP9Qn3lS8ne3sHK2loBkOYQ2AAgKZGRkUGBAbExsbInZMkxbABaYmFgo9hGREQEBvhbWFo5ODpyRAlIY3QKACARUlbzffHcwtzC3sGBtAZAs6ysJKo5KUrsi+c+4WFhCoA0hAobACQsOCgwLCzMwYHD1QBSBxsbWym4SaktJibG1s5OAZAmENgAIAGS1uQotb29AzdhA5CKWFhY2tk7BAcHKWaKrS2ZDUgLOCUSAOIKDQ0JCw2zI60BSIXMzc3t7OyDAgIiwsMVAKkfgQ0A3hAVFRXo729rZ0daA5BKSWaTL7GAAH9+KxJIAwhsAPCGoMAAG1tbrlsDkKpZWlpZWFgEBQYqAFI5AhsAvBYeHhYdHW1tbaMAQCpnY2MbFhoSFRWlAEjNCGwA8FpIcLC1Fb88CyAtMDMzs7K2ka81BUBqRmADgJeioiKjo6IsrawUAEgTrK2tpcjGlWxAqsZt/QHgpfCwcAurFPw6tr+//9GjR318fAoWLFi2bFklhZ48eXL27Nm6deu+y/Vy3t7e586djdNZv36DJO6Ysnfv3sOHDv3w448pvatKcHDwtGlTZebFixdXAKQG8mduaWkZHh5mY2OrAEidCGwA8FJERLhVsstrP/00bOrUqcanFStWXLRosaurq5Js58+f79Sp492795ycnJR/69SpU59+2iVO57NnPkmEse3bt8+aNXPAwIGOjo5KSowePWratGm3bt2aMWOmAiCVMLewjIyIILABqRenRALAS5GRkebmyTqMNWnSJElrI0aMvHnz1vPnL9asWXvx4sXevXsp/yNXr16TxTD+0+mS+m4fNWqUp+fjlKY1qeNJWlMApDYWFuYS2BQAqRaBDQD0oqOjdWZmyTlLMCws7Jdffh4wYEDfvn3TpUsnPdWrVx87duyuXbvu3bunjrN48WKpntWqVXPEiF+fPHlinPbChQsDBvQvV65cr149nz59auyPjY1dtGhRhw7tK1WqOGTIEB8fH+mcO3dukyaN1ckjIiK6dOny66+/99lBXwAAEABJREFUKMlz+fLl+vXrHT16VBZD5vnjjz96enqqg1auXNG3bx+1HRwcPHbsmEaNGsqiSpALDQ1NcG5RUVH9+/dv3rx5o4aNFACpik5nHhUdrQBItQhsAKAXExNjpkvWV+LVq1flsXXrNqadbdp87O39JEeOHNL+668JksqyZcsuCWfdunUff9wm0PBTSBLnmjZtcvnyla5du0oEknGMk0+c+NfAgQMKFSrUoUPHzZs3tW37sZT7Pv744/v37w8dOkRGmDp1ivR/8sknSvJIEjt16lT79u1y5MjZrl37rVu3SBoMCgqSQV5e3idPnlQMMaxHj+6zZ8+uUaNmixYtp0//u+fnnyc4t5kzZ8qS/P77KAVAaqMeiIqNjVEApE5cwwYAelLjSuZNOC5duiiP+fLlM+1Ur+yXRkhIyIgRI4YNGzZw4CB52rx5izJlSkts69y588KFC2xtbVevXu3s7KwofaRSt23bNsUQrmSSSZMmd+rUSZ7WrFmzevVq+/fvr1OnzvTp05s1azZ//vyRI0f++eefuXPnSXCRateuZbz6TsYfPvxntd2nT1+p10mjUaNGFSqU37FjR6tWrYxTHTlyRHq2bNlavnx5eVqyZMlDhw6Fh4dbW7/xwwYS1YYN+3H8+AmZMmVSAKRC8gUVG6uk8DZDALSCwAYAevo9meTd+drRUX+PEAlmCd6h5NKlS4ohNalPPTw8qlSpcubMaQlsZ86crVOnriGt6TVs2EgNbJcvX5bH3bt3qdOqrl+/LoGtcuUqUlX76qvBMp+uXbsltkiff97TeOeSXLlyGfvr1q2rNiReFihQ4MKF86aB7ezZs25ubmpaE9UM4s/822+/kXFk+RUAqRM39QdSNQIbAOiZ6XTJ/Kki9ab2V65cqVSpkrHz+fPnUp6qXLlysOE3au3s7I2DHBwcAgICpBEUFGRra2Pst7Z+mffUEyblELjxZiG9e/fJmzev6Yuam1skcSuR9u3bu7u7x++3sXn9crJIwW/+fq68rr29vZKkTZs27dq1a9CgwevXr5enW7ZukccGDRo2bdrUwoL/ggCpQ2xMjE7HVTBAasVfLwDomZubR8ck6xoPKXZJYWrkyBFhYWHGzokT/+rWrau1tXXRokXl6YkTJ9T+0NDQ06dPlypVWtqlS5c6fPhwVFSUOujUqdNqo1ixYvLYoUPH3wxGjhz56aef1qtXTzoPHjywePHiP/744/btWytWLFdSSF5abfj5+Z09e6ZYsTd+P61kyZL37t3z9vZWn969e0fiWWRkpOk4jx49ksA5a9bMgQMHyD+1Uxrh4eEKgNQgRtLaO/zYI4D/OY6PAoCeFLjMdebR0dFv/RlrOVC9dOk/devWadOmtaSsLFmybNy4YcGCBcOGDXM0aNSw0bfffmNpaeHunnHq1CmS2Ro31t9csXnz5nPmzPnhhx86dep05syZ2bNnqTOU4liDBg369ftiypSpefLkXrJk6YQJ47dv35EvX77PP/+8VatWPXp87uPzvE+fPhUrVsqePXv8Rdq/f1+6dOmNT6tXr642hg370c0tg5ub+7hxYyV31axZ03QqqQfKwvfo0f3773+ws7P9+utvfH1fyJKYjtPbwPi0U6eOMh9+hw1IRaKjo6iHA6kaf8AA8JKllVVUVKR5Mg5Fly5dev369X///Xf//l/KUym4jRs3Xspi6tAZM2d++WU/9Y6ORYoUWbZsea5cuRV9QKoyceIkKc1JVJNJfvzxRymmqZPMmjV7wID+7dq1VQynUI4fP6Fs2bKDBg2UsDdq1GjpHDRo0Jo1ayTUrV+/wXRJdDr9xXemmUrR18ruqY3Bgweri5EnT16p1MUJe66urmvWrJV5Nm3aRJ5KGXD58hXs2AFpjFT1raysFQCpllk0P80BIM2JjIwMCAiQUJSiqcLDw4KDguztHVIySbhkKhcXlwQHhYSESCiK0x8bG/vkyROpqsW/pEQW+/nz5wkOSqkTJ040bNjg3LnzMjdfX9+kb/Ao2yoiIiJDhgwKgDQnMMDfJV36lB6L8fLykm8PM+4sCWgAR1IB4CVra5tAf//knBVpMol1nJvgv3WQ7AAlFp8sLS3f+63zZRneOk/jHSYBpDGRkRHmFhZUzoFUjZuOAMBrtvb2EWnidho2NjZ58uRVfxoOwAcrIjzC1s5OAZCaccQFAF6zs7N/HhwcFZXqr9EvXry48U6VAD5MERERipkcvrFVAKRmVNgA4DUzMzNHZ+fwsFAFAFKz2NhY+SpzcnZRAKRyBDYAeIO1tY2ltXVoaIgCAKlWaEiwvYMDV68BaQCBDQDicnTU34TD9HexASAVkUNOFpaWtnb2CoDUj8AGAAlwcnaJiYkJ49xIAKlNaEiITqdzdHJWAKQJBDYASIDs7jgbfl0tJCQ4NjZWAQDNi46ODg4KsrC04NI1IC0hsAFAwgyZzdXaxiYwMCBt3OsfQBoWHhYWFBhg52Dv4MgvKwJpCpeiAkBS7OzsraysgwICJLZZCUsrMx2HugBoRUxMdISBtZW1m3tGvqCAtIfABgBvYWFh4ZIuXWRERGhoiMQ2c3NznbmezkynmJkpAPDfihUS1GKio6OjYmNirW1sXdOls7CwVACkRQQ2AEgWS311zUpxViIjI6PkX1SU/L/C5W0A/nNmcrhIZy45zdLSkhv3A2kef+QAkDKWBgoAAMD/PwIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgAAAAAaRWADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbALy2bdu26Oho055cuXIVLlxYeQc3blwfPXr0V199XaRIkYMHD0hP1arVFAAAgGQgsAHAa21at4rT06t373Hjxivv4MyZMyuWL69cqbIEtqFDhoSFhZ86fVoBAABIBgIbALyhTJkyc+fOMz51cnZW3k379h2qVaueJUsWBQAAIIV0CgDAhIODY568eY3/3NzcpLN3r16DBg6YPWtWqZIl2rdre/36tb1799StU7tY0SI/DRsWFRWlTnv82LGOHdrLOLVq1pg5Y0ZsbKza+UmnjocOHlQAAABSiAobALzdpUsXz507ly9fvlKlS69Yvvz69eve3t7Nm7fw8fEZP35ctmzZevbqdf78+dq1a2XNmlVKamfPnh08eJCllVXXrl19/fxOnDjh5+enAAAApBCBDQDesH//Pgd7O+PTPXv3lStXTm3v3bffxcUlf/78I0eMGD9+goS0x48f58+X99DhQ9JOnz79pEmTGzVunClTpsjISFcX5z17dktgUwAAAP4tAhsAvMHNza1Xr97GpxkzZlQbBQsWkrSmbxQoqH8spH/MkiWLjB8UGCRtqbNVqVpl5YoV165dk4qc9Lx4/kIBAAB4BwQ2AHhD4cJFhgwdqqTcpo0b27dvJ/mtZq1aTZo2Pc2tIAEAwDsjsAHA+7F06RJ5PH/hopOTU2ho6C8//6wAAAC8GwIbALzh1q2b48aNNT4tVqx4vXr1kjNhTg8PeVy9erWHR84Z06crAAAA74zABgCvOTo6enp6Dv/pJ2PPJ590lsBmbm5u7NHp9D+IojPTmfSYyWO/fl8ePHDgy35fSLtV69a5cuUyHd/M8Gg6HwAAgLcyi46OVgAgbYmMjAwICFB/Qu0/9vz5c0ll6u1JACCV8vLycnd3NzMzUwD8r1FhA4D3KX369AoAAMB7QmADAAAAAI0isAEAAACARhHYAAAAAECjCGwAAAAAoFEENgAAAADQKAIbAAAAAGgUgQ0AAAAANIrABgApFi2iomJiomOFAgD/HTP5Z6bTmessLCzkfxQAaR2BDQCSKzw8LDwsLCI8XNo6c3OdmU6/6wQA/7FYJSY2Rg4cmZmZWQsbWysrKwVAGkVgA4C3Cw0JCQkOkqPalpaW9g6OOp1OAYD/NX2xPzIyMMBPvp3s7O1tbGwVAGkOgQ0AkhIZGREYEGCmmNnY2llY8J0JQEPMDawVm8jIyJCgoLDQUAdHJ76pgDSGg8QAkCgpq/n5vrC0tJJD1+wDAdAsY/H/xfNnEtsUAGkI+x8AkLCgwICI8HAHBydOgASQKlhb25ibWwQFBcbExMhhJgVAmkBgA4AEBAcFRkREyBFrBQBSDwsLC3t7h5DgYMVMsbMjswFpAYeNASCu0JCQsLAw2elRACC10el0dvZ2IUFB4eFhCoDUj8AGAG+IiooKDAyws7VTACB10unMbW3tAv39Y2JiFACpHIENAN4QGOBva2OrM+fnaAGkYhaWlpZWVsFBgQqAVI7ABgCvhYeFxcbEWFlbKwCQytnY2IaFhUVFRioAUjMCGwC8FhIcTFoDkGZYW1mHhAQrAFIzAhsAvCTHoaNjoi0trRQASBPkCFRYaGhsLFeyAakYt/UHgJfCw8MsLSyVf8vX1/f48WM1a9ayTkmN7syZM0+fPilbtmyGDG67d++OjIwwHero6Fi5cpXz5895eXnFmbB27TqWlvqlvXLliozg7Oxcrlw5mYlxBH9//5MnTz558qRkyZJFihQx9sfExOzfv19Wtm7deuZvXqon/bdu3ezYsZOtrW2cl4s/6N69e9euXc2dO0/+/PnVnsjIyGPHjj575lOzZk1XV9f4KxscHDxt2tT69RsUL15c7Tl16pSPzzPjCC4urhUqVEh6+VMRWTsbG5uiRYsqwP+ImZmZpZVVeFi4Tbw/agCphVl0dLQCAGmLJIeAgAA3N7cUTeX73MfK2sbC4l8eyTpx4kTDhg3OnTufPXv25IwfERExevSoiRMnSnvt2nXVqlUrU6a0pCDTcUqUKLFnz95BgwYuXLgwzuS3b99xcXH55ZefJ02aJGv67NkzBweH5ctXqIHnxo0bzZo1lU510Jdffjl8+M+y6ybtvn377NmzR8bx9HwsccI4Q09Pz+LFi0nj6NFjxgyW2KCVK1f27t1LGt9++52QxqNHjypXrhQUFCSLIY9///1327bt4izzsGE/Tps2rU2bNjNmzFR76tevJ6nGOEL58uW3bNmaxPIbx9yyZfOmjZsuXb50//79fPnylyxZonPnziVKlFS05OOP22TLlm3ChL+SM7J8HoYNG9apUydjmk2+d5kWaV5EeHisojg5O6doKjlI5O7ubvpHB+B/hVMiAeAliXnm/+HNIX/88Yc5c+b89NNwY8/p02eeP3+h/rt3774kn0qVKku/7PEb++VfjRo1peLk5OR0585tSWtjxoy5du26pC+pRP3444/qrCTIZcmSRWYigyQ7TZ48WQpx0t+gQf379x/06dM3/vIMMeSuBMUZtH79eklrEtWMkViqdv369cuaNeuVK1dv3Lgp8+/Tp8+DBw9Mpzp37qyktThzlrj188+/GFdNTWtJLL/w8/Pr0qWLxLMsWbN+/74XZfQAABAASURBVP33GzZskDgnC1CrVi01/aZScvx09uxZjx49VFLuXaZFmmduYRGndA8gdSGwAYCe7PLqdLpkHk4+fvx4508+KVeuXKNGDVeuXGE66OrVq506daxUqaJkJylMGfsPHjzwxRdfyCQy9NixY9IjpaoDBw62aNEiwZeY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","mimeType":"image/jpeg","_meta":{"codex/imageDetail":"original"}}
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Submit signup",
  "timeout_ms": 30000,
  "code": "const createNow = tab.playwright.getByRole('button', { name: 'Create account', exact: true });\nconsole.log('create count', await createNow.count());\nawait createNow.click({ timeoutMs: 10000 });\nawait tab.playwright.waitForURL('http://localhost:3000/', { timeoutMs: 15000, waitUntil: 'domcontentloaded' });\nconsole.log('url', await tab.url());\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 12000));"
}
```

Output:
```text
create count 1
url http://localhost:3000/
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Webhook Dashboard" [level=1]
  - paragraph: abc1778214410452@example.test · Backend http://localhost:4000
  - navigation:
    - link "Account":
      - /url: /settings/account
      - text: Account
    - button "Refresh":
      - generic: Refresh
    - button "Sign out":
      - generic: Sign out
  - paragraph: Total ingest endpoints
  - paragraph: "0"
  - paragraph: Active ingest endpoints
  - paragraph: "0"
  - paragraph: Inbound events, 24h
  - paragraph: "0"
  - paragraph: Deliveries, 24h
  - paragraph: "0"
  - paragraph: Failed deliveries
  - paragraph: "0"
  - paragraph: Pending or retryable
  - paragraph: "0"
  - heading "Ingest Endpoints" [level=2]:
    - text: Ingest Endpoints
  - button "Add ingest endpoint":
  - table:
    - rowgroup:
      - row "Name Public ingest URL Status Inbound Deliveries Failed Active subs Last inbound Created Actions":
        - columnheader "Name"
        - columnheader "Public ingest URL"
        - columnheader "Status"
        - columnheader "Inbound"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Active subs"
        - columnheader "Last inbound"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "No ingest endpoints yet.":
        - cell "No ingest endpoints yet."
  - heading "Webhook Subscriptions" [level=2]:
    - text: Webhook Subscriptions
  - button "Add webhook subscription" [disabled]:
  - table:
    - rowgroup:
      - row "Subscription Ingest endpoint Target URL Status Deliveries Failed Last delivery Created Actions":
        - columnheader "Subscription"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Last delivery"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "No webhook subscriptions yet.":
        - cell "No webhook subscriptions yet."
  - heading "Recent Inbound Events" [level=2]:
    - text: Recent Inbound Events
  - table:
    - rowgroup:
      - row "Inbound event Ingest endpoint Status Received Deliveries Failed Payload preview Actions":
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Status"
        - columnheader "Received"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Payload preview"
        - columnheader "Actions"
    - rowgroup:
      - row "No inbound events yet.":
        - cell "No inbound events yet."
  - heading "Webhook Deliveries and Attempts" [level=2]:
    - text: Webhook Deliveries and Attempts
  - table:
    - rowgroup:
      - row "Delivery Inbound event Ingest endpoint Target URL Status Attempts Last attempt Last response Last attempted Next attempt Actions":
        - columnheader "Delivery"
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Attempts"
        - columnheader "Last attempt"
        - columnheader "Last response"
        - columnheader "Last attempted"
        - columnheader "Next attempt"
        - columnheader "Actions"
    - rowgroup:
      - row "No webhook deliveries yet.":
        - cell "No webhook deliveries yet."
  - heading "Detail" [level=2]:
    - text: Detail
  - paragraph: No row selected.
```

## Assistant

The login path reaches the new dashboard cleanly. I’m doing one data pass now: create an ingest endpoint and subscription, send a public inbound event, and confirm the tables/attempts update.

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Create endpoint in UI",
  "timeout_ms": 30000,
  "code": "let addEndpoint = tab.playwright.getByRole('button', { name: 'Add ingest endpoint', exact: true });\nconsole.log('add endpoint count', await addEndpoint.count());\nawait addEndpoint.click({ timeoutMs: 5000 });\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 5000));\nconst endpointName = tab.playwright.getByLabel('Name', { exact: true });\nconst slugSource = tab.playwright.getByLabel('URL slug source', { exact: true });\nconst endpointDescription = tab.playwright.getByLabel('Description', { exact: true });\nconsole.log('endpoint fields', await endpointName.count(), await slugSource.count(), await endpointDescription.count());\nawait endpointName.fill('Orders', { timeoutMs: 5000 });\nawait slugSource.fill(`orders-${Date.now()}`, { timeoutMs: 5000 });\nawait endpointDescription.fill('Local verification endpoint', { timeoutMs: 5000 });\nconst saveEndpoint = tab.playwright.getByRole('button', { name: 'Save', exact: true });\nconsole.log('save count', await saveEndpoint.count());\nawait saveEndpoint.click({ timeoutMs: 10000 });\nawait tab.playwright.getByText('Ingest endpoint created.', { exact: true }).waitFor({ state: 'visible', timeoutMs: 10000 });\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 10000));"
}
```

Output:
```text
add endpoint count 1
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Webhook Dashboard" [level=1]
  - paragraph: abc1778214410452@example.test · Backend http://localhost:4000
  - navigation:
    - link "Account":
      - /url: /settings/account
      - text: Account
    - button "Refresh":
      - generic: Refresh
    - button "Sign out":
      - generic: Sign out
  - paragraph: Total ingest endpoints
  - paragraph: "0"
  - paragraph: Active ingest endpoints
  - paragraph: "0"
  - paragraph: Inbound events, 24h
  - paragraph: "0"
  - paragraph: Deliveries, 24h
  - paragraph: "0"
  - paragraph: Failed deliveries
  - paragraph: "0"
  - paragraph: Pending or retryable
  - paragraph: "0"
  - heading "Ingest Endpoints" [level=2]:
    - text: Ingest Endpoints
  - button "Add ingest endpoint" [active]:
  - generic: Add ingest endpoint
  - generic: Name
  - textbox "Name"
  - generic: URL slug source
  - textbox "URL slug source"
  - generic: Description
  - textbox "Description"
  - button "Save"
  - button "Cancel"
  - table:
    - rowgroup:
      - row "Name Public ingest URL Status Inbound Deliveries Failed Active subs Last inbound Created Actions":
        - columnheader "Name"
        - columnheader "Public ingest URL"
        - columnheader "Status"
        - columnheader "Inbound"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Active subs"
        - columnheader "Last inbound"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "No ingest endpoints yet.":
        - cell "No ingest endpoints yet."
  - heading "Webhook Subscriptions" [level=2]:
    - text: Webhook Subscriptions
  - button "Add webhook subscription" [disabled]:
  - table:
    - rowgroup:
      - row "Subscription Ingest endpoint Target URL Status Deliveries Failed Last delivery Created Actions":
        - columnheader "Subscription"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Last delivery"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "No webhook subscriptions yet.":
        - cell "No webhook subscriptions yet."
  - heading "Recent Inbound Events" [level=2]:
    - text: Recent Inbound Events
  - table:
    - rowgroup:
      - row "Inbound event Ingest endpoint Status Received Deliveries Failed Payload preview Actions":
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Status"
        - columnheader "Received"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Payload preview"
        - columnheader "Actions"
    - rowgroup:
      - row "No inbound events yet.":
        - cell "No inbound events yet."
  - heading "Webhook Deliveries and Attempts" [level=2]:
    - text: Webhook Deliveries and Attempts
  - table:
    - rowgroup:
      - row "Delivery Inbound event Ingest endpoint Target URL Status Attempts Last attempt Last response Last attempted Next attempt Actions":
        - columnheader "Delivery"
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Attempts"
        - columnheader "Last attempt"
        - columnheader "Last response"
        - columnheader "Last attempted"
        - columnheader "Next attempt"
        - columnheader "Actions"
    - rowgroup:
      - row "No webhook deliveries yet.":
        - cell "No webhook deliveries yet."
  - heading "Detail" [level=2]:
    - text: Detail
  - paragraph: No row selected.
endpoint fields 1 1 1
save count 1
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Webhook Dashboard" [level=1]
  - paragraph: abc1778214410452@example.test · Backend http://localhost:4000
  - navigation:
    - link "Account":
      - /url: /settings/account
      - text: Account
    - button "Refresh":
      - generic: Refresh
    - button "Sign out":
      - generic: Sign out
  - paragraph: Ingest endpoint created.
  - paragraph: Total ingest endpoints
  - paragraph: "1"
  - paragraph: Active ingest endpoints
  - paragraph: "1"
  - paragraph: Inbound events, 24h
  - paragraph: "0"
  - paragraph: Deliveries, 24h
  - paragraph: "0"
  - paragraph: Failed deliveries
  - paragraph: "0"
  - paragraph: Pending or retryable
  - paragraph: "0"
  - heading "Ingest Endpoints" [level=2]:
    - text: Ingest Endpoints
  - button "Add ingest endpoint":
  - table:
    - rowgroup:
      - row "Name Public ingest URL Status Inbound Deliveries Failed Active subs Last inbound Created Actions":
        - columnheader "Name"
        - columnheader "Public ingest URL"
        - columnheader "Status"
        - columnheader "Inbound"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Active subs"
        - columnheader "Last inbound"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "Orders orders-1778214455348 http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events Active 0 0 0 0 Never 5/7/26, 10:27 PM Copy public ingest URL View ingest endpoint Edit ingest endpoint":
        - cell "Orders orders-1778214455348":
          - generic: Orders
          - generic: orders-1778214455348
        - cell "http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events":
          - generic: http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events
        - cell "Active":
          - generic: Active
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "Never"
        - cell "5/7/26, 10:27 PM"
        - cell "Copy public ingest URL View ingest endpoint Edit ingest endpoint":
          - button "Copy public ingest URL":
          - button "View ingest endpoint":
          - button "Edit ingest endpoint":
  - heading "Webhook Subscriptions" [level=2]:
    - text: Webhook Subscriptions
  - button "Add webhook subscription":
  - table:
    - rowgroup:
      - row "Subscription Ingest endpoint Target URL Status Deliveries Failed Last delivery Created Actions":
        - columnheader "Subscription"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Last delivery"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "No webhook subscriptions yet.":
        - cell "No webhook subscriptions yet."
  - heading "Recent Inbound Events" [level=2]:
    - text: Recent Inbound Events
  - table:
    - rowgroup:
      - row "Inbound event Ingest endpoint Status Received Deliveries Failed Payload preview Actions":
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Status"
        - columnheader "Received"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Payload preview"
        - columnheader "Actions"
    - rowgroup:
      - row "No inbound events yet.":
        - cell "No inbound events yet."
  - heading "Webhook Deliveries and Attempts" [level=2]:
    - text: Webhook Deliveries and Attempts
  - table:
    - rowgroup:
      - row "Delivery Inbound event Ingest endpoint Target URL Status Attempts Last attempt Last response Last attempted Next attempt Actions":
        - columnheader "Delivery"
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Attempts"
        - columnheader "Last attempt"
        - columnheader "Last response"
        - columnheader "Last attempted"
        - columnheader "Next attempt"
        - columnheader "Actions"
    - rowgroup:
      - row "No webhook deliveries yet.":
        - cell "No webhook deliveries yet."
  - heading "Detail" [level=2]:
    - text: Detail
  - paragraph: No row selected.
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Create subscription UI",
  "timeout_ms": 30000,
  "code": "const addSubscription = tab.playwright.getByRole('button', { name: 'Add webhook subscription', exact: true });\nconsole.log('add subscription count', await addSubscription.count());\nawait addSubscription.click({ timeoutMs: 5000 });\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 6000));\nconst targetUrl = tab.playwright.getByLabel('Target URL', { exact: true });\nconst subDescription = tab.playwright.getByLabel('Description', { exact: true });\nconsole.log('sub fields', await targetUrl.count(), await subDescription.count());\nawait targetUrl.fill('http://localhost:4000/health', { timeoutMs: 5000 });\nawait subDescription.fill('Local health route', { timeoutMs: 5000 });\nconst saveSubscription = tab.playwright.getByRole('button', { name: 'Save', exact: true });\nconsole.log('save count', await saveSubscription.count());\nawait saveSubscription.click({ timeoutMs: 10000 });\nawait tab.playwright.getByText('Webhook subscription created.', { exact: true }).waitFor({ state: 'visible', timeoutMs: 10000 });\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 12000));"
}
```

Output:
```text
add subscription count 1
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Webhook Dashboard" [level=1]
  - paragraph: abc1778214410452@example.test · Backend http://localhost:4000
  - navigation:
    - link "Account":
      - /url: /settings/account
      - text: Account
    - button "Refresh":
      - generic: Refresh
    - button "Sign out":
      - generic: Sign out
  - paragraph: Ingest endpoint created.
  - paragraph: Total ingest endpoints
  - paragraph: "1"
  - paragraph: Active ingest endpoints
  - paragraph: "1"
  - paragraph: Inbound events, 24h
  - paragraph: "0"
  - paragraph: Deliveries, 24h
  - paragraph: "0"
  - paragraph: Failed deliveries
  - paragraph: "0"
  - paragraph: Pending or retryable
  - paragraph: "0"
  - heading "Ingest Endpoints" [level=2]:
    - text: Ingest Endpoints
  - button "Add ingest endpoint":
  - table:
    - rowgroup:
      - row "Name Public ingest URL Status Inbound Deliveries Failed Active subs Last inbound Created Actions":
        - columnheader "Name"
        - columnheader "Public ingest URL"
        - columnheader "Status"
        - columnheader "Inbound"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Active subs"
        - columnheader "Last inbound"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "Orders orders-1778214455348 http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events Active 0 0 0 0 Never 5/7/26, 10:27 PM Copy public ingest URL View ingest endpoint Edit ingest endpoint":
        - cell "Orders orders-1778214455348":
          - generic: Orders
          - generic: orders-1778214455348
        - cell "http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events":
          - generic: http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events
        - cell "Active":
          - generic: Active
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "Never"
        - cell "5/7/26, 10:27 PM"
        - cell "Copy public ingest URL View ingest endpoint Edit ingest endpoint":
          - button "Copy public ingest URL":
          - button "View ingest endpoint":
          - button "Edit ingest endpoint":
  - heading "Webhook Subscriptions" [level=2]:
    - text: Webhook Subscriptions
  - button "Add webhook subscription" [active]:
  - generic: Add webhook subscription
  - generic: Ingest endpoint
  - combobox "Ingest endpoint":
    - option "Orders" [selected]
  - generic: Target URL
  - textbox "Target URL"
  - generic: Description
  - textbox "Description"
  - checkbox "Active" [checked]
  - text: Active
  - button "Save"
  - button "Cancel"
  - table:
    - rowgroup:
      - row "Subscription Ingest endpoint Target URL Status Deliveries Failed Last delivery Created Actions":
        - columnheader "Subscription"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Last delivery"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "No webhook subscriptions yet.":
        - cell "No webhook subscriptions yet."
  - heading "Recent Inbound Events" [level=2]:
    - text: Recent Inbound Events
  - table:
    - rowgroup:
      - row "Inbound event Ingest endpoint Status Received Deliveries Failed Payload preview Actions":
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Status"
        - columnheader "Received"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Payload preview"
        - columnheader "Actions"
    - rowgroup:
      - row "No inbound events yet.":
        - cell "No inbound events yet."
  - heading "Webhook Deliveries and Attempts" [level=2]:
    - text: Webhook Deliveries and Attempts
  - table:
    - rowgroup:
      - row "Delivery Inbound event Ingest endpoint Target URL Status Attempts Last attempt Last response Last attempted Next attempt Actions":
        - columnheader "Delivery"
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Attempts"
        - columnheader "Last attempt"
        - columnheader "Last response"
        - columnheader "Last attempted"
        - columnheader "Next attempt"
        - columnheader "Actions"
    - rowgroup:
      - row "No webhook deliveries yet.":
        - cell "No webhook deliveries yet."
  - heading "Detail" [level=2]:
    - text: Detail
  - paragraph: No row selected.
sub fields 1 1
save count 1
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Webhook Dashboard" [level=1]
  - paragraph: abc1778214410452@example.test · Backend http://localhost:4000
  - navigation:
    - link "Account":
      - /url: /settings/account
      - text: Account
    - button "Refresh":
      - generic: Refresh
    - button "Sign out":
      - generic: Sign out
  - paragraph: Webhook subscription created.
  - paragraph: Total ingest endpoints
  - paragraph: "1"
  - paragraph: Active ingest endpoints
  - paragraph: "1"
  - paragraph: Inbound events, 24h
  - paragraph: "0"
  - paragraph: Deliveries, 24h
  - paragraph: "0"
  - paragraph: Failed deliveries
  - paragraph: "0"
  - paragraph: Pending or retryable
  - paragraph: "0"
  - heading "Ingest Endpoints" [level=2]:
    - text: Ingest Endpoints
  - button "Add ingest endpoint":
  - table:
    - rowgroup:
      - row "Name Public ingest URL Status Inbound Deliveries Failed Active subs Last inbound Created Actions":
        - columnheader "Name"
        - columnheader "Public ingest URL"
        - columnheader "Status"
        - columnheader "Inbound"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Active subs"
        - columnheader "Last inbound"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "Orders orders-1778214455348 http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events Active 0 0 0 1 Never 5/7/26, 10:27 PM Copy public ingest URL View ingest endpoint Edit ingest endpoint":
        - cell "Orders orders-1778214455348":
          - generic: Orders
          - generic: orders-1778214455348
        - cell "http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events":
          - generic: http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events
        - cell "Active":
          - generic: Active
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "1"
        - cell "Never"
        - cell "5/7/26, 10:27 PM"
        - cell "Copy public ingest URL View ingest endpoint Edit ingest endpoint":
          - button "Copy public ingest URL":
          - button "View ingest endpoint":
          - button "Edit ingest endpoint":
  - heading "Webhook Subscriptions" [level=2]:
    - text: Webhook Subscriptions
  - button "Add webhook subscription":
  - table:
    - rowgroup:
      - row "Subscription Ingest endpoint Target URL Status Deliveries Failed Last delivery Created Actions":
        - columnheader "Subscription"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Last delivery"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "290fae76...3b49 Orders http://localhost:4000/health Active 0 0 Never 5/7/26, 10:27 PM Retry subscription with latest inbound event View webhook subscription Edit webhook subscription":
        - cell "290fae76...3b49"
        - cell "Orders"
        - cell "http://localhost:4000/health":
          - generic: http://localhost:4000/health
        - cell "Active":
          - generic: Active
        - cell "0"
        - cell "0"
        - cell "Never"
        - cell "5/7/26, 10:27 PM"
        - cell "Retry subscription with latest inbound event View webhook subscription Edit webhook subscription":
          - button "Retry subscription with latest inbound event" [disabled]:
          - button "View webhook subscription":
          - button "Edit webhook subscription":
  - heading "Recent Inbound Events" [level=2]:
    - text: Recent Inbound Events
  - table:
    - rowgroup:
      - row "Inbound event Ingest endpoint Status Received Deliveries Failed Payload preview Actions":
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Status"
        - columnheader "Received"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Payload preview"
        - columnheader "Actions"
    - rowgroup:
      - row "No inbound events yet.":
        - cell "No inbound events yet."
  - heading "Webhook Deliveries and Attempts" [level=2]:
    - text: Webhook Deliveries and Attempts
  - table:
    - rowgroup:
      - row "Delivery Inbound event Ingest endpoint Target URL Status Attempts Last attempt Last response Last attempted Next attempt Actions":
        - columnheader "Delivery"
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Attempts"
        - columnheader "Last attempt"
        - columnheader "Last response"
        - columnheader "Last attempted"
        - columnheader "Next attempt"
        - columnheader "Actions"
    - rowgroup:
      - row "No webhook deliveries yet.":
        - cell "No webhook deliveries yet."
  - heading "Detail" [level=2]:
    - text: Detail
  - paragraph: No row selected.
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Extract public ingest URL",
  "timeout_ms": 30000,
  "code": "const currentSnapshot = await tab.playwright.domSnapshot();\nconst match = currentSnapshot.match(/http:\\/\\/localhost:4000\\/ingest\\/[^\\s\\\"]+\\/events/);\nconsole.log(match?.[0] ?? 'no match');"
}
```

Output:
```text
http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Refresh dashboard after ingest",
  "timeout_ms": 30000,
  "code": "const refreshButton = tab.playwright.getByRole('button', { name: 'Refresh', exact: true });\nconsole.log('refresh count', await refreshButton.count());\nawait refreshButton.click({ timeoutMs: 5000 });\nawait tab.playwright.getByText('demo-123', { exact: false }).waitFor({ state: 'visible', timeoutMs: 10000 });\nconst afterIngest = await tab.playwright.domSnapshot();\nconsole.log(afterIngest.slice(0, 16000));"
}
```

Output:
```text
refresh count 1
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Webhook Dashboard" [level=1]
  - paragraph: abc1778214410452@example.test · Backend http://localhost:4000
  - navigation:
    - link "Account":
      - /url: /settings/account
      - text: Account
    - button "Refresh":
      - generic: Refresh
    - button "Sign out":
      - generic: Sign out
  - paragraph: Webhook subscription created.
  - paragraph: Total ingest endpoints
  - paragraph: "1"
  - paragraph: Active ingest endpoints
  - paragraph: "1"
  - paragraph: Inbound events, 24h
  - paragraph: "1"
  - paragraph: Deliveries, 24h
  - paragraph: "1"
  - paragraph: Failed deliveries
  - paragraph: "1"
  - paragraph: Pending or retryable
  - paragraph: "1"
  - heading "Ingest Endpoints" [level=2]:
    - text: Ingest Endpoints
  - button "Add ingest endpoint":
  - table:
    - rowgroup:
      - row "Name Public ingest URL Status Inbound Deliveries Failed Active subs Last inbound Created Actions":
        - columnheader "Name"
        - columnheader "Public ingest URL"
        - columnheader "Status"
        - columnheader "Inbound"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Active subs"
        - columnheader "Last inbound"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "Orders orders-1778214455348 http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events Active 1 1 1 1 5/7/26, 10:28 PM 5/7/26, 10:27 PM Copy public ingest URL View ingest endpoint Edit ingest endpoint":
        - cell "Orders orders-1778214455348":
          - generic: Orders
          - generic: orders-1778214455348
        - cell "http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events":
          - generic: http://localhost:4000/ingest/JHeYk9oQ7y9J0Di7ug8zQOoUYNQVrets/orders-1778214455348/events
        - cell "Active":
          - generic: Active
        - cell "1"
        - cell "1"
        - cell "1"
        - cell "1"
        - cell "5/7/26, 10:28 PM"
        - cell "5/7/26, 10:27 PM"
        - cell "Copy public ingest URL View ingest endpoint Edit ingest endpoint":
          - button "Copy public ingest URL":
          - button "View ingest endpoint":
          - button "Edit ingest endpoint":
  - heading "Webhook Subscriptions" [level=2]:
    - text: Webhook Subscriptions
  - button "Add webhook subscription":
  - table:
    - rowgroup:
      - row "Subscription Ingest endpoint Target URL Status Deliveries Failed Last delivery Created Actions":
        - columnheader "Subscription"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Last delivery"
        - columnheader "Created"
        - columnheader "Actions"
    - rowgroup:
      - row "290fae76...3b49 Orders http://localhost:4000/health Active 1 1 5/7/26, 10:28 PM 5/7/26, 10:27 PM Retry subscription with latest inbound event View webhook subscription Edit webhook subscription":
        - cell "290fae76...3b49"
        - cell "Orders"
        - cell "http://localhost:4000/health":
          - generic: http://localhost:4000/health
        - cell "Active":
          - generic: Active
        - cell "1"
        - cell "1"
        - cell "5/7/26, 10:28 PM"
        - cell "5/7/26, 10:27 PM"
        - cell "Retry subscription with latest inbound event View webhook subscription Edit webhook subscription":
          - button "Retry subscription with latest inbound event":
          - button "View webhook subscription":
          - button "Edit webhook subscription":
  - heading "Recent Inbound Events" [level=2]:
    - text: Recent Inbound Events
  - table:
    - rowgroup:
      - row "Inbound event Ingest endpoint Status Received Deliveries Failed Payload preview Actions":
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Status"
        - columnheader "Received"
        - columnheader "Deliveries"
        - columnheader "Failed"
        - columnheader "Payload preview"
        - columnheader "Actions"
    - rowgroup:
      - 'row "24c5ad4c...9ce9 Orders accepted 5/7/26, 10:28 PM 1 1 {\"orderId\":\"demo-123\",\"total\":42} Replay inbound event View inbound event"':
        - cell "24c5ad4c...9ce9"
        - cell "Orders"
        - cell "accepted":
          - generic: accepted
        - cell "5/7/26, 10:28 PM"
        - cell "1"
        - cell "1"
        - 'cell "{\"orderId\":\"demo-123\",\"total\":42}"':
          - generic: "{\"orderId\":\"demo-123\",\"total\":42}"
        - cell "Replay inbound event View inbound event":
          - button "Replay inbound event":
          - button "View inbound event":
  - heading "Webhook Deliveries and Attempts" [level=2]:
    - text: Webhook Deliveries and Attempts
  - table:
    - rowgroup:
      - row "Delivery Inbound event Ingest endpoint Target URL Status Attempts Last attempt Last response Last attempted Next attempt Actions":
        - columnheader "Delivery"
        - columnheader "Inbound event"
        - columnheader "Ingest endpoint"
        - columnheader "Target URL"
        - columnheader "Status"
        - columnheader "Attempts"
        - columnheader "Last attempt"
        - columnheader "Last response"
        - columnheader "Last attempted"
        - columnheader "Next attempt"
        - columnheader "Actions"
    - rowgroup:
      - row "bf44ac01...789b 24c5ad4c...9ce9 Orders http://localhost:4000/health failed 1 failed 404 5/7/26, 10:28 PM Never Retry webhook delivery View webhook delivery Edit related webhook subscription":
        - cell "bf44ac01...789b"
        - cell "24c5ad4c...9ce9"
        - cell "Orders"
        - cell "http://localhost:4000/health":
          - generic: http://localhost:4000/health
        - cell "failed":
          - generic: failed
        - cell "1"
        - cell "failed":
          - generic: failed
        - cell "404"
        - cell "5/7/26, 10:28 PM"
        - cell "Never"
        - cell "Retry webhook delivery View webhook delivery Edit related webhook subscription":
          - button "Retry webhook delivery":
          - button "View webhook delivery":
          - button "Edit related webhook subscription":
  - heading "Detail" [level=2]:
    - text: Detail
  - paragraph: No row selected.
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Retry delivery UI",
  "timeout_ms": 30000,
  "code": "const retryDeliveryButton = tab.playwright.getByRole('button', { name: 'Retry webhook delivery', exact: true });\nconsole.log('retry delivery count', await retryDeliveryButton.count());\nawait retryDeliveryButton.click({ timeoutMs: 10000 });\nawait tab.playwright.getByText('Webhook delivery retry completed.', { exact: true }).waitFor({ state: 'visible', timeoutMs: 15000 });\nconst afterRetry = await tab.playwright.domSnapshot();\nconst deliveryLine = afterRetry.split('\\n').find((line) => line.includes('Retry webhook delivery View webhook delivery'));\nconsole.log(deliveryLine ?? afterRetry.slice(0, 16000));"
}
```

Output:
```text
retry delivery count 1
      - row "bf44ac01...789b 24c5ad4c...9ce9 Orders http://localhost:4000/health failed 2 failed 404 5/7/26, 10:28 PM Never Retry webhook delivery View webhook delivery Edit related webhook subscription":
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Replay event UI",
  "timeout_ms": 30000,
  "code": "const replayButton = tab.playwright.getByRole('button', { name: 'Replay inbound event', exact: true });\nconsole.log('replay count', await replayButton.count());\nawait replayButton.click({ timeoutMs: 10000 });\nawait tab.playwright.getByText('Inbound event replay completed.', { exact: true }).waitFor({ state: 'visible', timeoutMs: 15000 });\nconst afterReplay = await tab.playwright.domSnapshot();\nconst deliveryLine2 = afterReplay.split('\\n').find((line) => line.includes('Retry webhook delivery View webhook delivery'));\nconsole.log(deliveryLine2 ?? afterReplay.slice(0, 16000));"
}
```

Output:
```text
replay count 1
      - row "bf44ac01...789b 24c5ad4c...9ce9 Orders http://localhost:4000/health failed 3 failed 404 5/7/26, 10:28 PM Never Retry webhook delivery View webhook delivery Edit related webhook subscription":
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Retry subscription UI",
  "timeout_ms": 30000,
  "code": "const retrySubscriptionButton = tab.playwright.getByRole('button', { name: 'Retry subscription with latest inbound event', exact: true });\nconsole.log('retry sub count', await retrySubscriptionButton.count());\nawait retrySubscriptionButton.click({ timeoutMs: 10000 });\nawait tab.playwright.getByText('Webhook subscription retry completed.', { exact: true }).waitFor({ state: 'visible', timeoutMs: 15000 });\nconst afterSubRetry = await tab.playwright.domSnapshot();\nconst deliveryLine3 = afterSubRetry.split('\\n').find((line) => line.includes('Retry webhook delivery View webhook delivery'));\nconsole.log(deliveryLine3 ?? afterSubRetry.slice(0, 16000));"
}
```

Output:
```text
retry sub count 1
      - row "bf44ac01...789b 24c5ad4c...9ce9 Orders http://localhost:4000/health failed 4 failed 404 5/7/26, 10:28 PM Never Retry webhook delivery View webhook delivery Edit related webhook subscription":
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Check account route and sign out",
  "timeout_ms": 30000,
  "code": "const accountLink = tab.playwright.getByRole('link', { name: 'Account', exact: true });\nconsole.log('account count', await accountLink.count());\nawait accountLink.click({ timeoutMs: 10000 });\nawait tab.playwright.waitForURL('http://localhost:3000/settings/account', { timeoutMs: 10000, waitUntil: 'domcontentloaded' });\nlet accountSnapshot = await tab.playwright.domSnapshot();\nconsole.log(accountSnapshot.slice(0, 6000));\nconst signOutButton = tab.playwright.getByRole('button', { name: 'Sign out', exact: true });\nconsole.log('sign out count', await signOutButton.count());\nawait signOutButton.click({ timeoutMs: 10000 });\nawait tab.playwright.waitForURL('http://localhost:3000/login', { timeoutMs: 10000, waitUntil: 'domcontentloaded' });\nconsole.log('url', await tab.url());\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 5000));"
}
```

Output:
```text
account count 1
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Account Settings" [level=1]
  - paragraph: abc1778214410452@example.test
  - navigation:
    - link "Dashboard":
      - /url: /
      - text: Dashboard
    - button "Sign out":
      - generic: Sign out
  - generic: Change Password
  - generic: Current password
  - textbox "Current password"
  - generic: New password
  - textbox "New password"
  - generic: Confirm new password
  - textbox "Confirm new password"
  - button "Change password":
    - generic: Change password
  - paragraph
sign out count 1
url http://localhost:3000/login
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Webhook Demo" [level=1]
  - paragraph: Sign in to manage ingest endpoints, subscriptions, and delivery recovery.
  - generic: Sign in
  - generic: Email
  - textbox "Email"
  - generic: Password
  - textbox "Password"
  - button "Sign in":
    - generic: Sign in
  - paragraph
  - paragraph: "Backend: http://localhost:4000"
  - button "Need an account?"
```

## Assistant

The browser pass is good: create endpoint/subscription works, public ingest updates summary/tables, delivery retry increments attempts, event replay increments attempts, subscription-scoped retry increments attempts, account settings loads, and sign-out returns to login. I’m doing one last worktree/status check now.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/webhook-routes.ts
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/app/page.tsx
```

## Assistant (final)

Implemented Epic 4 end to end.

Changed:
- Auth-gated dashboard in [frontend/app/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/page.tsx)
- New login flow in [frontend/app/login/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/login/page.tsx)
- Account/password settings in [frontend/app/settings/account/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/settings/account/page.tsx)
- Typed dashboard API client in [frontend/lib/webhook-api.ts](/Users/neiloler/dev/webhook-demo/frontend/lib/webhook-api.ts)
- Reusable action button and protected route wrapper in [frontend/components/action-button.tsx](/Users/neiloler/dev/webhook-demo/frontend/components/action-button.tsx) and [frontend/components/protected-screen.tsx](/Users/neiloler/dev/webhook-demo/frontend/components/protected-screen.tsx)
- Backend dashboard summary, delivery retry, inbound-event replay, subscription-scoped retry, and real attempt sequencing in [backend/src/webhook-routes.ts](/Users/neiloler/dev/webhook-demo/backend/src/webhook-routes.ts)

Verified:
- `npm run typecheck:backend`
- `npm run build:backend`
- `npm run typecheck:frontend`
- `npm run build:frontend`
- Browser pass on existing `http://localhost:3000` / `http://localhost:4000`: login redirect, signup, dashboard load, create endpoint, create subscription, public ingest, delivery retry, event replay, subscription retry, account page, sign out.

A throwaway local account and sample webhook data were created in the ignored dev SQLite DB during browser verification.

## User

Also add a button to the password inputs to be able to show the password. Have it be an "eye" (show closed and open states of the eye icon for password shown or not). Update the input component to be able to handle having a icon, this icon should be right justified with padding beside it to the right. Look to other login features in other major sites or design systems to see standard practice.


## Assistant

I’ll wire this into the shared input path rather than one-offing the login form: first I’ll confirm the usual accessibility pattern for password reveal controls, then patch the input/labeled input components and update each password field.

## Web Search

Query: password visibility toggle button accessibility aria-label aria-pressed design system

## Web Search

Query: https://material-web.dev/components/text-field/

## Assistant

The design-system examples line up on the same pattern: a trailing icon button inside the field, a full-height click target, and toggle state exposed with `aria-pressed`. I’m going to add that as a reusable input capability, then consume it through a password field wrapper so login and account settings stay consistent.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/components/ui/input.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/frontend/components/password-input.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/app/login/page.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/app/settings/account/page.tsx
```

## Assistant

The password fields now share a `PasswordInput` wrapper, while the lower-level `Input` supports a generic trailing icon slot. I’m running the checks now, then I’ll verify the login/account screens visually.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/app/login/page.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/app/settings/account/page.tsx
```

## Assistant

Checks are green after the small prop cleanup. I’m opening the login form now to verify the right-side eye button and its open/closed state in the actual UI.

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Verify password toggle",
  "timeout_ms": 30000,
  "code": "if (!globalThis.agent) {\n  const { setupAtlasRuntime } = await import('/Users/neiloler/.codex/plugins/cache/openai-bundled/browser-use/0.1.0-alpha2/scripts/browser-client.mjs');\n  await setupAtlasRuntime({ globals: globalThis });\n}\nif (!globalThis.browser) {\n  globalThis.browser = await agent.browsers.get('iab');\n}\nawait browser.nameSession('🔎 Password toggle');\nif (typeof tab === 'undefined' || !tab) {\n  globalThis.tab = await browser.tabs.new();\n}\nawait tab.goto('http://localhost:3000/login');\nawait tab.playwright.waitForLoadState({ state: 'domcontentloaded', timeoutMs: 10000 });\nconst showButton = tab.playwright.getByRole('button', { name: 'Show password', exact: true });\nconst passwordInput = tab.playwright.getByLabel('Password', { exact: true });\nconsole.log('show buttons', await showButton.count());\nconsole.log('initial type', await passwordInput.getAttribute('type', { timeoutMs: 5000 }));\nawait showButton.click({ timeoutMs: 5000 });\nconst hideButton = tab.playwright.getByRole('button', { name: 'Hide password', exact: true });\nconsole.log('hide buttons', await hideButton.count());\nconsole.log('shown type', await passwordInput.getAttribute('type', { timeoutMs: 5000 }));\nawait hideButton.click({ timeoutMs: 5000 });\nconsole.log('hidden type', await passwordInput.getAttribute('type', { timeoutMs: 5000 }));\nawait display(await tab.playwright.screenshot({ fullPage: false }));"
}
```

Output:
```text
show buttons 1
initial type password
hide buttons 1
shown type text
hidden type password
{"type":"image","data":"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dPbs2ePFF7qoE2zYsEEenT37b/Vu/3795Olqe9OmjXK3SuXKb7355o7t222vItPPnzdPxiAPSc+1a9c+/PADeV2Z57mzZxUAAOCICGwAkCYXZxe5NZqMhw8fllLb/v3727Vr7+XlPXjwe1OmTJGHLpw/L/3yaKdOncPDw1555WWJW9L//uDBP/zwfbFixes3aDB+/PhuXV+Szly5cq1cufLixYvSXrF8WVBQ0MIFC6QdGho6c+YMH18faa9bt65tmzabN2+qXr36ypUrmjdvpma2+6GhMv1rr7165cqVKlWqREZGSMD7a/TokiVLxscbX365uwIAABwR57ABwCNiYqKFyWQ6C9lIfwAAEABJREFUfPjQsGG/SE+lSpXDw8N///2PVq1b58yZ02g0ZvHz3bhxQ69evQ4cOCATSCGuR4+eg99/f+nSJUWKFJWerVu3+Pv7jxo92mAwtG3TViKf2Wxu0aLFqD//3L59W2Bg4IoVK2QyyW/x8fE7d+6UdqtWreT2kyFD5Im7du/JmjXrjRs3pID21VdD163foI7tlVd6jBk7VhqLFi48derkd99//+67g+TuoHffmTBhggIAABwOFTYAeIQUsgL8s+fOlbNlixa3b9+ev2Chj49P3rx569StM2/u3LfefLNJ40Yy2b279+S2YaPE9hsDBnR96cWZM2a0bNkqX7580tO5cxd5boXy5T75ZIjJbGrYsJEkt5o1aymJRzxukiJbcHDwDz/8KHcPHjgg6U4aTZo0lbqZxLA2bdpKWpMeCYctW7XatWuXhDp1bBL51MZB61GaHTsmXSKlU+fOCgAAcEQENgBIToppv//x5/IVK4Kvh6gZafmyZZUqVhwxYnhMbEybtm1tU2bLlu3sufODB79/LvH2vbx5cu/ZvVv6vxw6dPbsOSVLlpwyeXKb1q0lzkmnm5tbx06dVq1cuWNH4lGOvXv39vb23rlr5/p162vWrJk9e/aoqGjp9/TytM3f0yOxHRcXp951cnZWG1HRUeoM1buuLq4KAABwRAQ2AHhE/foNevfpI2mqQYOGvr6+auesWTPl9vCRo5MmTR448G3bxDdv3jx8+LDEs337969bt156pk2bZjKZDh06VDAwcO68+RcuXmrVqtXy5csvXbqkWI97jIiImDplSrNmzT29vKREtmzp0sSqmjUE5siRw9/ff/OmTTIH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","mimeType":"image/jpeg","_meta":{"codex/imageDetail":"original"}}
```

## Assistant

The login password toggle behaves correctly: the control appears as one trailing icon button, flips `type=password` to `type=text`, and returns to masked. I’m doing the same quick check on the account settings form since it has three password fields.

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Sign in for account toggle",
  "timeout_ms": 60000,
  "code": "const typeCharsFast = async (text) => {\n  for (const char of text) {\n    if (char === '@') {\n      await tab.cua.keypress({ keys: ['Shift', '2'] });\n    } else {\n      await tab.cua.keypress({ keys: [char] });\n    }\n  }\n};\nawait tab.cua.click({ x: 468, y: 325 });\nawait typeCharsFast('abc1778214410452@example.test');\nawait tab.cua.click({ x: 469, y: 400 });\nawait typeCharsFast('local-password-123');\nconst signInButton = tab.playwright.getByRole('button', { name: 'Sign in', exact: true });\nconsole.log('sign in buttons', await signInButton.count());\nawait signInButton.click({ timeoutMs: 10000 });\nawait tab.playwright.waitForURL('http://localhost:3000/', { timeoutMs: 15000, waitUntil: 'domcontentloaded' });\nawait tab.goto('http://localhost:3000/settings/account');\nawait tab.playwright.waitForLoadState({ state: 'domcontentloaded', timeoutMs: 10000 });\nconst accountShows = tab.playwright.getByRole('button', { name: 'Show password', exact: true });\nconsole.log('account show buttons', await accountShows.count());\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 5000));"
}
```

Output:
```text
sign in buttons 1
account show buttons 3
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Account Settings" [level=1]
  - paragraph: abc1778214410452@example.test
  - navigation:
    - link "Dashboard":
      - /url: /
      - text: Dashboard
    - button "Sign out":
      - generic: Sign out
  - generic: Change Password
  - generic: Current password
  - textbox "Current password"
  - button "Show password":
  - generic: New password
  - textbox "New password"
  - button "Show password":
  - generic: Confirm new password
  - textbox "Confirm new password"
  - button "Show password":
  - button "Change password":
    - generic: Change password
  - paragraph
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Toggle account first password",
  "timeout_ms": 30000,
  "code": "const currentPasswordInput = tab.playwright.getByLabel('Current password', { exact: true });\nconst showButtonsAccount = tab.playwright.getByRole('button', { name: 'Show password', exact: true });\nconsole.log('show count before', await showButtonsAccount.count());\nawait showButtonsAccount.nth(0).click({ timeoutMs: 5000 });\nconsole.log('current password type after show', await currentPasswordInput.getAttribute('type', { timeoutMs: 5000 }));\nconst hideButtonsAccount = tab.playwright.getByRole('button', { name: 'Hide password', exact: true });\nconsole.log('hide count after', await hideButtonsAccount.count());\nawait display(await tab.playwright.screenshot({ fullPage: false }));"
}
```

Output:
```text
show count before 3
current password type after show text
hide count after 1
{"type":"image","data":"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","mimeType":"image/jpeg","_meta":{"codex/imageDetail":"original"}}
```

## Assistant (final)

Implemented the password visibility toggle.

What changed:
- [frontend/components/ui/input.tsx](/Users/neiloler/dev/webhook-demo/frontend/components/ui/input.tsx): `Input` now supports a right-justified `trailingIcon` slot and adds right padding when present.
- [frontend/components/password-input.tsx](/Users/neiloler/dev/webhook-demo/frontend/components/password-input.tsx): new reusable password field with an eye toggle.
- [frontend/app/login/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/login/page.tsx): login/signup password field now uses it.
- [frontend/app/settings/account/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/settings/account/page.tsx): current, new, and confirm password fields now use it.

I followed the common pattern from Material Web’s trailing password icon example, Porsche Design System’s `aria-pressed` guidance for password visibility toggles, and MYDS’s guidance for a right-side Show/Hide trigger area:
[Material Web](https://material-web.dev/components/text-field/), [Porsche Design System](https://designsystem.porsche.com/v4/components/input-password/accessibility/), [MYDS Password Input](https://myds.vercel.app/en/docs/design/password-input).

Verified:
- `npm run typecheck:frontend`
- `npm run build:frontend`
- Browser checked login and account settings toggles: hidden fields use `type=password`, open-eye state switches to `type=text`, and buttons expose `Show password` / `Hide password`.

## User

Let's make the text fields in the password flow have a max width, they're super wide now, and don't need to be. Consider how long the average password is, even the lengthy secure ones, and then give a bit of spacial margin beyond that.


## Assistant

I’ll tighten this at the password-flow form level so the input component stays generally flexible for tables and future forms. I’m going to cap password fields around a comfortable secure-password width and keep the submit buttons aligned with that narrower measure.

## Assistant

I’m going to make the password field itself opt into the narrower measure, not every generic input. A `max-w-[30rem]` gives room for roughly 40-plus visible password characters plus the eye control, while avoiding the account page’s full-card stretch.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/components/password-input.tsx
```

## Assistant

The build is still clean. I’m reloading the settings page once to check the visual width change in a browser-sized viewport.

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Verify password field width",
  "timeout_ms": 30000,
  "code": "if (!globalThis.agent) {\n  const { setupAtlasRuntime } = await import('/Users/neiloler/.codex/plugins/cache/openai-bundled/browser-use/0.1.0-alpha2/scripts/browser-client.mjs');\n  await setupAtlasRuntime({ globals: globalThis });\n}\nif (!globalThis.browser) {\n  globalThis.browser = await agent.browsers.get('iab');\n}\nawait browser.nameSession('🔎 Password width');\nif (typeof tab === 'undefined' || !tab) {\n  globalThis.tab = await browser.tabs.new();\n}\nawait tab.goto('http://localhost:3000/settings/account');\nawait tab.playwright.waitForLoadState({ state: 'domcontentloaded', timeoutMs: 10000 });\nconsole.log((await tab.playwright.domSnapshot()).slice(0, 5000));\nawait display(await tab.playwright.screenshot({ fullPage: false }));"
}
```

Output:
```text
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Account Settings" [level=1]
  - paragraph: abc1778214410452@example.test
  - navigation:
    - link "Dashboard":
      - /url: /
      - text: Dashboard
    - button "Sign out":
      - generic: Sign out
  - generic: Change Password
  - generic: Current password
  - textbox "Current password"
  - button "Show password":
  - generic: New password
  - textbox "New password"
  - button "Show password":
  - generic: Confirm new password
  - textbox "Confirm new password"
  - button "Show password":
  - button "Change password":
    - generic: Change password
  - paragraph
{"type":"image","data":"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GwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADSKwAYAAAAAGkVgAwAAAACNIrABAAAAgEYR2AAAAABAowhsAAAAAKBRBDYAAAAA0CgCGwAAAABoFIENAAAAADTq/wAAAP//A/xG1gAAAAZJREFUAwAqY7N0q/wZEwAAAABJRU5ErkJggg==","mimeType":"image/jpeg","_meta":{"codex/imageDetail":"original"}}
```

## Assistant

The fields now cap nicely, but the account submit button is still stretching because it lives in a CSS grid. I’m going to cap that password form’s measure too so the flow reads as one compact column instead of narrow fields followed by a full-width button.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/app/settings/account/page.tsx
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Verify compact account form",
  "timeout_ms": 30000,
  "code": "await tab.goto('http://localhost:3000/settings/account');\nawait tab.playwright.waitForLoadState({ state: 'domcontentloaded', timeoutMs: 10000 });\nawait display(await tab.playwright.screenshot({ fullPage: false }));"
}
```

Output:
```text
Timed out running CDP command "Page.captureScreenshot" for tab 1
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Check compact DOM",
  "timeout_ms": 30000,
  "code": "console.log((await tab.playwright.domSnapshot()).slice(0, 4000));"
}
```

Output:
```text
- button "Open Next.js Dev Tools":
- alert
- main:
  - heading "Account Settings" [level=1]
  - paragraph: abc1778214410452@example.test
  - navigation:
    - link "Dashboard":
      - /url: /
      - text: Dashboard
    - button "Sign out":
      - generic: Sign out
  - generic: Change Password
  - generic: Current password
  - textbox "Current password"
  - button "Show password":
  - generic: New password
  - textbox "New password"
  - button "Show password":
  - generic: Confirm new password
  - textbox "Confirm new password"
  - button "Show password":
  - button "Change password":
    - generic: Change password
  - paragraph
```

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Capture compact form",
  "timeout_ms": 30000,
  "code": "await display(await tab.cua.get_visible_screenshot());"
}
```

Output:
```text
Timed out running CDP command "Page.captureScreenshot" for tab 1
```

## Assistant (final)

Done. I capped the reusable `PasswordInput` at `max-w-[30rem]`, which gives comfortable room for long generated passwords without letting the field sprawl across the whole card. I also capped the account password form to the same width so the submit button lines up with the fields.

Updated:
- [frontend/components/password-input.tsx](/Users/neiloler/dev/webhook-demo/frontend/components/password-input.tsx)
- [frontend/app/settings/account/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/settings/account/page.tsx)

Verified:
- `npm run typecheck:frontend`
- `npm run build:frontend`

I also reloaded the account page and confirmed the password fields are still present with the show-password controls. The browser screenshot call timed out, but the DOM check came back clean.

## User

Let's do about 60% of that max width.


## Assistant

I’ll shrink the password flow measure from `30rem` to about 60% of that, which is `18rem`, and keep the account form aligned to the same width.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/components/password-input.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/app/settings/account/page.tsx
```

## Assistant (final)

Done. Password fields and the account password form are now capped at `18rem`, about 60% of the previous `30rem`.

Verified:
- `npm run typecheck:frontend`
- `npm run build:frontend`

## User

What would be involved in using shadcn to give us a darkmode. Let's make it toggleable, and have the toggle live persistently in the lower righthand corner of the app. Make it pay attention to a simple local storage or cookie variable for state. Let's default to "dark" mode.


## Assistant

I’ll add this as a small app-level theme layer: set the initial class before React paints, persist the user choice in localStorage plus a cookie, and render a fixed lower-right toggle that flips the root `dark` class. The existing CSS already has dark tokens, so this should be mostly plumbing rather than restyling.

## Assistant

The repo already has shadcn-style CSS variables and a `.dark` token block, so the involved pieces are: put `dark` on `<html>`, add a tiny no-flash script that reads persisted preference, then expose a fixed client toggle that updates both storage and the document class. I’m patching exactly that now.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/frontend/components/theme-toggle.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/app/layout.tsx
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/frontend/app/globals.css
```

## Assistant

The default is now dark at the document level, with native form controls told about the active color scheme too. I’m running the frontend checks, then I’ll open the app and flip the toggle to confirm persistence.

## Tool

Server: node_repl
Tool: js

Arguments:
```json
{
  "title": "Verify theme toggle",
  "timeout_ms": 30000,
  "code": "if (!globalThis.agent) {\n  const { setupAtlasRuntime } = await import('/Users/neiloler/.codex/plugins/cache/openai-bundled/browser-use/0.1.0-alpha2/scripts/browser-client.mjs');\n  await setupAtlasRuntime({ globals: globalThis });\n}\nif (!globalThis.browser) {\n  globalThis.browser = await agent.browsers.get('iab');\n}\nawait browser.nameSession('🔎 Dark mode toggle');\nif (typeof tab === 'undefined' || !tab) {\n  globalThis.tab = await browser.tabs.new();\n}\nawait tab.goto('http://localhost:3000/login');\nawait tab.playwright.waitForLoadState({ state: 'domcontentloaded', timeoutMs: 10000 });\nconst toggle = tab.playwright.getByRole('button', { name: 'Toggle dark mode', exact: true });\nconsole.log('toggle count', await toggle.count());\nconst root = tab.playwright.locator('html');\nconsole.log('initial class', await root.getAttribute('class', { timeoutMs: 5000 }));\nconsole.log('initial pressed', await toggle.getAttribute('aria-pressed', { timeoutMs: 5000 }));\nawait toggle.click({ timeoutMs: 5000 });\nconsole.log('after light class', await root.getAttribute('class', { timeoutMs: 5000 }));\nconsole.log('after light pressed', await toggle.getAttribute('aria-pressed', { timeoutMs: 5000 }));\nawait tab.reload();\nawait tab.playwright.waitForLoadState({ state: 'domcontentloaded', timeoutMs: 10000 });\nconst toggleAfterReload = tab.playwright.getByRole('button', { name: 'Toggle dark mode', exact: true });\nconsole.log('reload class', await root.getAttribute('class', { timeoutMs: 5000 }));\nconsole.log('reload pressed', await toggleAfterReload.getAttribute('aria-pressed', { timeoutMs: 5000 }));\nawait toggleAfterReload.click({ timeoutMs: 5000 });\nconsole.log('after dark class', await root.getAttribute('class', { timeoutMs: 5000 }));\nconsole.log('after dark pressed', await toggleAfterReload.getAttribute('aria-pressed', { timeoutMs: 5000 }));"
}
```

Output:
```text
toggle count 1
initial class dark font-sans inter_b2991b2-module__9mH_6q__variable
initial pressed true
after light class font-sans inter_b2991b2-module__9mH_6q__variable
after light pressed false
reload class font-sans inter_b2991b2-module__9mH_6q__variable
reload pressed false
after dark class font-sans inter_b2991b2-module__9mH_6q__variable dark
after dark pressed true
```

## Assistant

The toggle works and persists across reload. I’m going to leave it back on dark, since that’s the requested default, and take a quick status snapshot.

## Assistant (final)

Done. Dark mode is now shadcn-style class-based theming using the existing `.dark` token block.

What was involved:
- Default `<html>` to `dark`.
- Add a tiny pre-paint script in [frontend/app/layout.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/layout.tsx) so stored preference applies before the page flashes.
- Add a persistent lower-right toggle in [frontend/components/theme-toggle.tsx](/Users/neiloler/dev/webhook-demo/frontend/components/theme-toggle.tsx).
- Persist state to both `localStorage` and a cookie under `webhook-demo-theme`.
- Add `color-scheme` hints in [frontend/app/globals.css](/Users/neiloler/dev/webhook-demo/frontend/app/globals.css).

Verified:
- `npm run typecheck:frontend`
- `npm run build:frontend`
- Browser checked: default dark, toggle switches light/dark, reload preserves the selected theme.
