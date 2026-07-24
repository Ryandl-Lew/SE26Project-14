import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: '.\\mvnw.cmd -q spring-boot:run -Dspring-boot.run.profiles=dev',
      cwd: '../backend',
      url: 'http://127.0.0.1:8080/actuator/health',
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        DB_URL: process.env.E2E_DB_URL || 'jdbc:mysql://127.0.0.1:3306/bionote?useUnicode=true&characterEncoding=utf8&serverTimezone=UTC',
        DB_USERNAME: 'bionote',
        DB_PASSWORD: 'bionote-dev',
        JWT_SECRET: 'e2e-secret-with-at-least-thirty-two-characters-123456',
        FRONTEND_ORIGIN: 'http://127.0.0.1:5173',
        DEV_SEED_ENABLED: 'false',
        UPLOAD_ROOT: process.env.E2E_UPLOAD_ROOT || '../tmp/e2e-uploads',
      },
    },
    {
      command: 'npm.cmd run dev -- --host 127.0.0.1',
      cwd: '.',
      url: 'http://127.0.0.1:5173',
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
})
