# Supabase + Vercel 部署说明

## 1. 创建 Supabase 项目

1. 打开 <https://database.new>，创建一个新的 Supabase 项目。
2. 进入项目后打开 SQL Editor。
3. 执行 `supabase/migrations/202606100001_initial_ledger.sql`。
4. 打开 Authentication > Sign In / Providers，确认 Email 登录已启用。
5. 打开 Project Connect 或 Settings > API Keys，复制：
   - Project URL
   - Publishable key

不要复制或暴露 secret/service_role key 到前端项目。

## 2. 本地连接 Supabase

复制 `.env.example` 为 `.env.local`，填写：

```bash
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=你的_publishable_key
```

本地验证：

```bash
npm test
npm run build
npm run dev
```

打开 `http://localhost:5173/`，配置成功时页面会进入邮箱验证码登录流程。

## 3. 部署到 Vercel

在 Vercel 导入项目，或用 Vercel CLI 部署。配置如下：

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

项目包含 `vercel.json`，会把 SPA 路由回退到 `index.html`。

## 4. 配置 Supabase Auth Redirect URL

首次部署后，复制 Vercel 生产域名，例如：

```text
https://your-project.vercel.app
```

回到 Supabase Authentication > URL Configuration：

- Site URL: `https://your-project.vercel.app`
- Redirect URLs: 加入 `https://your-project.vercel.app`

保存后，重新触发一次 Vercel 部署。

## 5. 上线后验收

- 打开 Vercel 域名，应该显示邮箱验证码登录。
- 用邮箱登录后，默认生成年假、育儿假、幼儿园。
- 新增一条年假 0.5 天记录，刷新页面后仍存在。
- 换一台设备用同一邮箱登录，应看到同一份记录。
- 换另一个邮箱登录，应看不到前一个邮箱的数据。
