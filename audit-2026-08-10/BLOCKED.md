# 待裁决清单

1. GA4 管理界面在已登录 Chrome 中可到达现有 Analytics 首页，但初段连续失败和末段唯一重试均在接管页面时超时，尚未能安全创建 `Metatecno Website` 属性或取得 Measurement ID。没有进入创建表单、没有创建第二个属性，也没有改现有属性。因而 Property ID、Stream ID、Measurement ID、14 个月保留、Enhanced Measurement、不需要的引荐、`generate_lead` 关键事件及 GSC 链接均未能在界面落地或取证。
2. Search Console 已登录账号当前可见 `sc-domain:yuchensy.com`，但直接只读打开 `sc-domain:metatecnocq.com` 同样超时，无法确认该域权限，也无法读取 Page indexing、Sitemaps、16 个月 Performance 或 24 条 URL Inspection。`gsc-samples.csv` 保留分层样本和空值，未编造任何指标。
3. 没有真实 Measurement ID，故无法加载 Google tag、在 DebugView 看到 `page_view`/`generate_lead`，也无法确认后台唯一关键事件。生产门禁有意保持失败，防止占位符部署。
