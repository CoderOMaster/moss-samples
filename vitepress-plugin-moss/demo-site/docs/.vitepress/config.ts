import { defineConfig } from 'vitepress'
import { mossIndexerPlugin } from 'vitepress-plugin-moss'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  title: 'Moss Test Site',
  themeConfig: {
    search: {
      provider: 'moss' as any,
      options: {
        projectId: process.env.MOSS_PROJECT_ID || 'your-project-id',
        projectKey: process.env.MOSS_PROJECT_KEY || 'your-project-key',
        indexName: process.env.MOSS_INDEX_NAME || 'test-docs',
      },
    },
  },
  vite: {
    plugins: [mossIndexerPlugin()]
  }
})
