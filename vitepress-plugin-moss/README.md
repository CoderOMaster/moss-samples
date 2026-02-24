# vitepress-plugin-moss

A [VitePress](https://vitepress.dev) plugin that adds [Moss](https://moss.dev) semantic (AI) search to your docs. At build time it reads your Markdown source, chunks it, and uploads it to the Moss cloud. At runtime the search UI downloads the index once and runs all queries locally in the browser — no round-trips on every keystroke.

---

## How it works

```
Build time                                      Runtime (browser)
────────────────────────────────────────────    ──────────────────────────────────────
VitePress calls buildEnd hook                   User presses Ctrl/⌘+K or /
    ↓                                               ↓
mossIndexerPlugin reads siteConfig              @inferedge/moss downloads the index
    ↓                                               ↓
@moss-tools/md-indexer reads source .md         Queries run locally < 10 ms
using VitePress's own markdown renderer             ↓
(understands includes, extensions, etc.)        Results navigate via metadata.navigation
    ↓                                           (pre-computed URL + anchor per chunk)
Uploads via @inferedge-rest/moss REST client
(deletes old index, then re-uploads chunks)
    ↓
Index is live on Moss cloud
```

Two separate npm packages are involved:
- **`@inferedge-rest/moss`** — Node.js REST client used **at build time** (inside `@moss-tools/md-indexer`) to upload documents
- **`@inferedge/moss`** — WebAssembly browser SDK used **at runtime** to download the index and run local queries

---

## Installation

```bash
npm install vitepress-plugin-moss
# or
pnpm add vitepress-plugin-moss
# or
yarn add vitepress-plugin-moss
```

> **Requirement:** your project's `package.json` must have `"type": "module"` because VitePress is ESM-only.

---

## Setup

### 1. Configure VitePress

The plugin is easy to integrate using the `vite.plugins` option in your VitePress config. This handles both the search configuration and the build-time indexing automatically.

```ts
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'
import { mossIndexerPlugin } from 'vitepress-plugin-moss'

export default defineConfig({
  title: 'My Docs',
  themeConfig: {
    search: {
      provider: 'moss' as any,
      options: {
        projectId: process.env.MOSS_PROJECT_ID!,
        projectKey: process.env.MOSS_PROJECT_KEY!,
        indexName: 'my-docs',
      },
    },
  },
  vite: {
    plugins: [mossIndexerPlugin()]
  }
})
```

Once integrated via `vite.plugins`, the Moss search component will automatically replace the default VitePress search bar (Zero-Config UI).

The plugin activates only when `search.provider` is `'moss'`. If the provider is anything else, `mossIndexerPlugin` returns a no-op and `buildEnd` exits immediately.

### 2. Get your Moss credentials

1. Sign up at [moss.dev](https://moss.dev)
2. Create a project and note your **Project ID** and **API key**
3. Pass them via environment variables (see below)

### 3. Set environment variables

Never hard-code credentials in your config file.

```bash
# .env  ← add to .gitignore, never commit
MOSS_PROJECT_ID=your_project_id
MOSS_PROJECT_KEY=your_api_key
```

> **Note:** `projectKey` ends up embedded in the client-side JavaScript bundle. Treat it as you would an Algolia search-only API key — use a key scoped to read/query operations only.

---

## Options reference

All options go under `themeConfig.search.options`:

```ts
{
  // Required
  projectId: string    // Moss project ID
  projectKey: string   // Moss API key
  indexName: string    // Name of the index to create/overwrite on every build

  // Optional — Search UI
  topK?: number        // Number of results to return (default: 10)
  placeholder?: string // Search input placeholder (default: 'Search docs...')
  buttonText?: string  // Nav bar button label (default: 'Search')
}
```

Indexing always runs on every `vitepress build` when the provider is `'moss'` — there is no `enabled` flag to toggle.

### Excluding a page from the index

Add `search: false` to the page's frontmatter:

```md
---
search: false
---
```

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` / `⌘+K` | Open / close search |
| `/` | Open search (when not focused on an input) |
| `↑` / `↓` | Navigate results |
| `↵` | Go to selected result |
| `Esc` | Close search |

---

## Build output

A successful build prints:

```
Moss Sync: Starting End-to-End Process
---------------------------------------

Step 1: Building Index in Memory...
Processing N pages...
✅ Index built in memory: N chunks generated

Step 2: Uploading to Moss...
  ✅ Deleted existing index "my-docs"
✅ Upload success! Index "my-docs" is live.

 Sync Successfully Completed!
```

If indexing fails (network error, bad credentials, etc.) the build **does not fail** — the error is logged and the rest of the VitePress build continues.

---

## Testing Locally (Demo Site)

The repository includes a ready-to-use demo site in the `demo-site/` folder. This is the best way to test changes to the plugin.

### Step 1 — Build the plugin

First, build the plugin from the root directory to generate the `dist` folder.

```bash
pnpm install
pnpm build
```

### Step 2 — Set up the Demo Site

Navigate to the demo site directory and install its dependencies.

```bash
cd demo-site
pnpm install
```

### Step 3 — Configure and Build

The demo site is already configured to use the local plugin. You just need to add your Moss credentials to `demo-site/docs/.vitepress/config.ts` (or use environment variables).

```bash
# From inside demo-site/
npx vitepress build docs
```

### Step 4 — Preview

Start the preview server to test the search modal.

```bash
npx vitepress preview docs
```

Open [http://localhost:4173](http://localhost:4173) in your browser and verify the search functionality.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Build error: `"vitepress" resolved to an ESM file` | `package.json` missing `"type": "module"` | Add `"type": "module"` to your project's `package.json` |
| `Missing Moss configuration` error | `projectId`, `projectKey`, or `indexName` not set | Check environment variables and `themeConfig.search.options` |
| `Could not load search index` in browser | Index not built yet, or wrong credentials | Run `vitepress build` first; verify credentials |
| No results returned | Index is empty or query doesn't match | Check the Moss dashboard for your index contents |
| Page not indexed | Page has `search: false` in frontmatter | Remove the flag to include the page |
| Modal doesn't open | Keyboard shortcut conflict | Try clicking the nav button directly |

---

## Project structure

```
vitepress-plugin-moss/
├── index.ts          # mossIndexerPlugin — the main export; hooks into VitePress buildEnd
├── indexing.ts       # Re-exports buildJsonDocs + uploadDocuments from @moss-tools/md-indexer
├── Search.vue        # Search modal UI component (browser SDK)
├── SearchButton.vue  # Nav bar search button
├── types.ts          # MossSearchOptions interface + DefaultTheme module augmentation
├── vite.config.ts    # Build config for the plugin itself
├── tsconfig.json
└── package.json
```

### Dependency split

```
vitepress-plugin-moss
├── @moss-tools/md-indexer   ← build time only (Node.js)
│   ├── @inferedge-rest/moss     REST client for uploading to Moss cloud
│   ├── vitepress                uses resolveConfig + createMarkdownRenderer
│   └── cheerio / gray-matter   HTML parsing, frontmatter
└── @inferedge/moss          ← runtime only (browser WebAssembly)
    └── Queries run locally after index is downloaded
```

---

## License

MIT
