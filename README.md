# 我的天数账本

一个手机和 Mac 都能使用的 PWA，用于记录年假、育儿假、幼儿园包天天数，以及后续新增的类似额度项目。

## 功能

- 年假、育儿假支持 0.5 天和 1 天记录。
- 幼儿园按整天孩子人次计算，一个孩子去算 1 天，两个孩子同一天去算 2 天。
- 首页卡片显示总额度、已用和剩余天数。
- 项目详情提供列表和日历视图。
- 未配置 Supabase 时使用浏览器演示数据；配置后使用邮箱验证码登录和云同步。

## 本地运行

```bash
npm install
npm run dev
```

## Supabase 配置

1. 在 Supabase 创建项目。
2. 执行 `supabase/migrations/202606100001_initial_ledger.sql`。
3. 复制 `.env.example` 为 `.env.local`，填写：

```bash
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_PUBLISHABLE_KEY=你的 Supabase publishable key
```

4. 在 Supabase Auth 中开启邮箱登录，并把部署域名加入 Redirect URLs。

完整上线步骤见 `DEPLOYMENT.md`。

## 验证

```bash
npm test
npm run build
```
