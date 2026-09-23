# Metatecno Canonical 治理与验证报告

日期：2026-08-08（Asia/Shanghai）
目标：`https://www.metatecnocq.com/`
范围：本地代码治理与公开生产站只读核验；未部署、未提交 Search Console 验证。

## 管理结论

Google 邮件中的 `Alternate page with proper canonical tag` 本身不是处罚。它表示 Google 把某个 URL 识别为另一规范 URL 的重复版本，因此没有单独收录该备用地址。

本站已实证存在一组持续制造备用 URL 的信号冲突：GitHub Pages 同时以 `200` 提供斜杠 URL 和 `/index.html` URL，页面 canonical 与 sitemap 选择斜杠 URL，但修改前站内共有 19,063 个 `<a href>` 主动链接到 `/index.html`。本次已把这些站内入口统一为斜杠规范 URL，并增加自动防回归检查。

本次工作的成功标准是“站点不再主动推荐重复 URL，重要规范页能够被 Google 选择和收录”，不是 Search Console 的备用页数量归零。历史抓取、外链和 GitHub Pages 的双 `200` 行为仍可能使旧 `/index.html` 地址继续出现在报告中。

## 已实证证据

| 证据 | 修复前 | 修复后/当前 | 结论 |
|---|---:|---:|---|
| 本地 HTML 文件 | 383 | 383 | 页面数量未改变 |
| canonical 标签 | 383 | 383，全部与文件对应的斜杠 URL 一致 | 未倒转 canonical |
| 站内 `/index.html` 锚点链接 | 19,063 | 0 | 站点不再主动发现该重复版本 |
| sitemap URL | 164 | 164，其中 `/index.html` 为 0 | sitemap 未用于制造假绿灯 |
| hreflang `/index.html` URL | 0 | 0 | 多语言信号未被改成英语 canonical |
| `sitemap.xml` SHA-256 | `83e9e826359bbef13fa9b0afc4edf9d2f7052170a8cf47c44077c9a0ca93d178` | 相同 | 文件未修改 |
| `robots.txt` SHA-256 | `a010ced5a3f2a5d6bd1a61a540c943891106104cdef32d8301cf9252b6db6068` | 相同 | 文件未修改 |

2026-08-08 对生产站的只读 GET 验证显示：`/en/` 与 `/en/index.html` 均返回 `200`，`/en/products/` 与 `/en/products/index.html` 也均返回 `200`，响应服务器为 GitHub Pages。

安全公开抓取检查了30页，发现29个抓到的 `/index.html` URL 的 canonical 指向对应斜杠 URL；共发现656个站内 URL，因30页抓取预算限制有626个未抓取。审计指纹为 `52f34282311c09b6f3e04861fb2a3e4a095c06037ed05d7633ce46d4865cbe5e`。该结果只证明已抓取范围，不代表完整 Search Console 数据。

## Search Console 证据状态

邮件已经证明一次针对 `Alternate page with proper canonical tag` 的验证失败，但邮件正文没有提供失败 URL。当前未取得 `metatecnocq.com` 属性中“查看详情”的精确失败样例，因此以下账户侧信息仍未确认：

- 每个失败 URL 的 Google-selected canonical；
- 失败 URL 是否全部属于 `/index.html`；
- 对应斜杠规范页是否已经收录；
- 是否另有参数、协议、主机或错误多语言 canonical 变体。

因此，本报告把 `/index.html` 根因表述为“代码与生产站已实证的主要矛盾”，不冒充 Search Console 全量根因。取得失败样例后，应把 URL 分成 `/index.html`、参数/主机变体、多语言误规范化、正常备用页四类再判断。

## 已实施变更

1. 新增 `tools/normalize-internal-index-links.mjs`：
   - `--check` 只读检查并在发现残留时失败；
   - `--write` 只改同站 `<a href>`；
   - 相对、根相对和同源绝对 `/index.html` 地址统一为根相对斜杠 URL；
   - 查询参数与锚点保持不变；外链、资源、canonical、hreflang、`mailto`、`tel` 不处理；
   - 每次改写都验证新旧 URL 只相差末尾 `index.html`。
2. 扩展 `tools/verify-seo.mjs`：
   - 覆盖383/383个 HTML；
   - 检查每页恰好一个自引用 canonical；
   - 检查全部站内锚点、hreflang 与 sitemap 不含 `/index.html`；
   - 保留41个语言首页的 title、description、H1、canonical 与自 hreflang 检查；
   - 失败时输出文件、行号和原因并返回非零状态。
3. 规范化378个 HTML 文件中的19,063个链接。未改变页面正文、翻译、canonical、hreflang、sitemap、robots、DNS或托管配置。

## 对抗式验证

- 幂等性：第二次 `--write` 输出 `changed_files=0 rewritten_links=0`。
- 独立文本闸门：HTML 锚点中的 `/index.html` 为0；sitemap 中为0。
- 全量验证：`383/383 HTML pages`、`41 localized home pages`、`0 internal index.html links`、`0 hreflang index.html URLs`、`164 sitemap URLs` 全部通过。
- 反向测试：在临时副本中加入 `/en/index.html` 后，normalizer 与 verifier 都以退出码1变红；运行清理后，两者恢复全绿。临时测试未触碰用户工作区文件。
- 本地静态服务抽查：`/`、`/en/`、`/en/products/`、`/en/products/dd350-anode-gasket/`、`/fr/contact/`、`/de/` 六个代表性斜杠 URL 均返回 `200`。
- `git diff --check` 通过。

以下取巧方案均未使用：把 canonical 倒转到 `/index.html`、给备用页加 `noindex`、修改或扩充 sitemap、删除页面、放宽检查、吞掉失败码、JavaScript 跳转、把多语言页面 canonical 到英语页。

## 部署后正确观察方式

本次没有 commit、push 或部署。另行审核并部署后：

1. 在 Search Console 只检查重要斜杠规范页，例如 `/en/`、`/en/products/`、关键产品页和知识页，确认 Google-selected canonical 与用户声明一致且规范页可收录。
2. 取得原验证失败 URL 清单；若主要是 `/index.html`，等待 Google 自然重抓。不要因为历史备用 URL 尚未清零而反复点击“验证修复”。
3. 若业务必须让 `/index.html` 永久消失，需要在 GitHub Pages 前增加支持服务器端 `301` 的边缘/托管层；这属于独立的 DNS/基础设施变更，不在本次授权范围。
4. 不使用 robots.txt、移除工具或 `noindex` 做 canonical 去重。

Google 官方依据：

- [什么是 canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization)
- [指定 canonical 与内部链接最佳实践](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Page indexing 报告与验证说明](https://support.google.com/webmasters/answer/7440203)

## 限制

- 本地修复尚未上线，线上抓取结果不会因本次本地修改立即变化。
- 公开审计受30页预算限制，不能代替完整站点抓取或 Search Console URL Inspection。
- 未取得 Search Console 精确失败 URL，不能声称邮件涉及的每个 URL 都已确认。
- 未检查图片像素、翻译质量、排名或 AI 引用概率；这些与本次 canonical 治理不是同一问题。
