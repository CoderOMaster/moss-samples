# Installation and Setup Guide

This guide will walk you through the process of integrating the Moss search plugin into your own VitePress projects.

## Prerequisites

Before you begin, ensure you have the following ready:
*   A VitePress project (version 1.0.0 or higher).
*   A Moss account and project credentials from [moss.dev](https://moss.dev).
*   Node.js environment with your preferred package manager (npm, pnpm, or yarn).

## Step-by-Step Installation

### 1. Install the Package

Run the following command in your project root:

```bash
npm install vitepress-plugin-moss
```

### 2. Configure the Plugin

Open your `docs/.vitepress/config.ts` file and import the plugin. Add it to the `vite.plugins` array and configure the `themeConfig.search` options.

```typescript
import { defineConfig } from 'vitepress'
import { mossIndexerPlugin } from 'vitepress-plugin-moss'

export default defineConfig({
  themeConfig: {
    search: {
      provider: 'moss' as any,
      options: {
        projectId: 'fd7f9e5c-8cca-44e6-9727-a24a18f38986',
        projectKey: 'moss_I3WTNxPuzCPNWtwJUe4Cm0lcwYmmeJv9',
        indexName: 'test-docs'
      }
    }
  },
  vite: {
    plugins: [mossIndexerPlugin()]
  }
})
```

## Advanced Configuration

You can customize the look and feel of the search UI using optional parameters:

| Option | Description | Default |
| --- | --- | --- |
| `topK` | Number of results to display. | `10` |
| `placeholder` | Text shown in the search input. | `'Search docs...'` |
| `buttonText` | Label for the navigation button. | `'Search'` |

## Troubleshooting Common Issues

### Search Modal Not Appearing
Ensure that the `provider` in your configuration is set exactly to `'moss'`. Also, double-check that you have imported and added `mossIndexerPlugin()` to the Vite plugins list.

### No Search Results
If search returns no results, make sure you have run a full `build` of your site. Moss indexes your content during the build process. Check your terminal output for any indexing errors.
