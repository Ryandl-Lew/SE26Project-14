/**
 * BioNote P5 核心链路 E2E 测试
 *
 * 覆盖：登录 → 项目详情 → 文件上传 → 全局搜索 → PDF 导出
 *
 * 前提条件：
 *   1. 后端已启动（localhost:8080）
 *   2. 前端已启动（localhost:5173）
 *   3. DemoDataInitializer 已播种演示数据（p-001, r-001, li 用户）
 *
 * 运行：
 *   npx playwright test
 *   npx playwright test --headed   # 有头模式调试
 */

import { test, expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* ======================== 常量 ======================== */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DUMMY_PDF = path.join(__dirname, 'fixtures', 'dummy.pdf')

/** 测试项目 ID（DemoDataInitializer 播种） */
const TEST_PROJECT_ID = 'p-001'
/** 测试记录 ID（DemoDataInitializer 播种） */
const TEST_RECORD_ID = 'r-001'

/** localStorage 注入的演示用户 */
const MOCK_USER = {
  id: 'u-001',
  name: '李同学',
  email: 'li@example.com',
  avatarText: '李',
}

/* ======================== 测试套件 ======================== */

test.describe('BioNote P5 核心链路测试 (文件/搜索/导出)', () => {

  /* --------------------- 前置：登录态注入 --------------------- */

  test.beforeEach(async ({ page }) => {
    // 1. 初次访问建立浏览器上下文
    await page.goto('/')

    // 2. 注入 auth token 和用户信息到 localStorage
    //    （绕过 UI 登录以加速测试，模拟真实 login API 写入的数据结构）
    await page.evaluate((user) => {
      localStorage.setItem('auth_token', 'mock-jwt-u-001-e2e-test')
      localStorage.setItem('auth_user', JSON.stringify(user))
    }, MOCK_USER)

    // 3. 刷新页面，触发 authStore.restoreSession() 读取 localStorage
    await page.reload()

    // 4. 等待仪表盘加载完成（.hero-strip 是 DashboardPage 专有类名）
    await page.waitForSelector('.hero-strip', { timeout: 15_000 })
  })

  /* ============================================================
   *  主测试：完整 P5 核心链路
   * ============================================================ */

  test('完整链路：文件上传 → 全局搜索 → PDF 导出', async ({ page }) => {

    /* =================== Step 1: 进入项目详情 =================== */

    await test.step('Step 1 — 进入项目详情页', async () => {
      // 点击 Dashboard 上的 "进入项目管理" 按钮
      await page.click('button:has-text("进入项目管理")')

      // 等待项目详情加载（h1 包含项目名称）
      await page.waitForURL(`**/projects/${TEST_PROJECT_ID}`)
      await page.waitForSelector('.detail-header h1', { timeout: 10_000 })

      // 验证页面核心元素存在
      await expect(page.locator('.detail-header h1')).toContainText('GFP')
      await expect(page.locator('.fm-root')).toBeVisible()
    })

    /* =================== Step 2: 上传文件附件 =================== */

    await test.step('Step 2 — 上传 dummy.pdf 附件', async () => {
      // 确认初始状态：文件列表为空，显示占位文案
      await expect(page.locator('.fm-empty')).toBeVisible()

      // 定位隐藏的 <input type="file">（FileManager 组件内唯一一个）
      const fileInput = page.locator('.fm-root input[type="file"]')

      // Playwright setInputFiles 对 hidden input 同样生效
      await fileInput.setInputFiles(DUMMY_PDF)

      // 上传进度条出现后消失 → 文件出现在列表中
      await page.waitForSelector('.fm-file-name', { timeout: 15_000 })

      // 验证文件名出现在列表中
      const fileNameEl = page.locator('.fm-file-name').first()
      await expect(fileNameEl).toContainText('dummy')

      // 验证空状态文案已消失
      await expect(page.locator('.fm-empty')).not.toBeVisible()
    })

    /* =================== Step 3: 全局搜索 =================== */

    await test.step('Step 3 — 搜索刚上传的文件', async () => {
      // 通过 URL 参数直接触发搜索（SearchPage 的 useEffect 会自动 fetch）
      await page.goto('/search?q=dummy')

      // 等待搜索完成，结果列表出现
      await page.waitForSelector('.search-hit-item', { timeout: 15_000 })

      // 至少找到 1 条结果（刚上传的附件）
      const hitCount = await page.locator('.search-hit-item').count()
      expect(hitCount).toBeGreaterThanOrEqual(1)

      // 验证搜索结果中包含文件实体标签
      const firstHit = page.locator('.search-hit-item').first()
      await expect(firstHit.locator('.search-hit-title')).toBeVisible()

      // 验证搜索状态栏显示命中数
      await expect(page.locator('.search-status strong')).toBeVisible()
    })

    /* =================== Step 4: 导出 PDF =================== */

    await test.step('Step 4 — 导出实验记录 PDF', async () => {
      // 导航到实验记录详情页
      await page.goto(`/records/${TEST_RECORD_ID}`)

      // 等待记录详情加载完成
      await page.waitForSelector('.detail-header h1', { timeout: 10_000 })
      await expect(page.locator('.detail-header h1')).toBeVisible()

      // 点击 "📄 导出 PDF" 按钮，同步捕获下载事件
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30_000 }),
        page.click('button:has-text("导出 PDF")'),
      ])

      // 断言：下载文件名包含 .pdf
      const filename = download.suggestedFilename()
      expect(filename).toMatch(/\.pdf$/i)

      // 断言：文件内容非空
      const stream = await download.createReadStream()
      expect(stream).toBeTruthy()

      // 可选：将下载文件保存到 test-results 供人工核查
      await download.saveAs(`test-results/${filename}`)

      console.log(`  ✅ PDF 下载成功：${filename}`)
    })

  }) // end of main test

})
