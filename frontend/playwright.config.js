import { defineConfig } from '@playwright/test'

/**
 * Playwright E2E 测试配置 — BioNote 前端。
 *
 * 运行前确保：
 *   1. 后端已启动：cd backend && ./mvnw spring-boot:run
 *   2. 前端已启动：cd frontend && npm run dev
 *   3. 然后：npx playwright test
 */
export default defineConfig({
  /** 测试文件目录 */
  testDir: './e2e',

  /** 单个测试超时（毫秒） */
  timeout: 90_000,

  /** expect 断言超时 */
  expect: {
    timeout: 15_000,
  },

  /** 失败时自动截图 */
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  /** 仅测试 Chromium */
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          // 中文环境避免字体渲染差异
          args: ['--lang=zh-CN'],
        },
      },
    },
  ],

  /** 报告输出目录 */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
  ],

  /** 输出目录 */
  outputDir: 'test-results',
})
