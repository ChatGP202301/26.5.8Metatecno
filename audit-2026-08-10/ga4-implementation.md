# GA4 实施与验收记录

证据日期：2026-08-10。状态：本地实现完成，Google 后台创建与真实采集受界面超时阻断，未部署。

## 后台对象

| 项目 | 既定值 | 实际状态 |
|---|---|---|
| Analytics property | Metatecno Website；Asia/Shanghai；USD | 未创建；Property ID 未取得 |
| Web stream | metatecnocq.com；https://www.metatecnocq.com | 未创建；Stream ID 与 Measurement ID 未取得 |
| 数据保留 | 14 months | 未能配置 |
| Enhanced Measurement | page view、scroll、outbound click、site search、video、download、form interaction | 未能配置 |
| Unwanted referral | formsubmit.co | 未能配置；不做无法控制的 cross-domain |
| Key event | 仅 generate_lead | 未能创建/标记 |
| Search Console link | sc-domain:metatecnocq.com | 权限与目标属性均未能确认 |

已登录 Chrome 能看到现有 Analytics 首页，但 Analytics 管理页面的初段尝试与末段唯一重试均在接管阶段超时。没有进入创建表单，没有创建第二个属性，也没有改现有属性。

## 本地实现

- `assets/analytics.js`：Measurement ID 当前为故意不可部署的 `G-REPLACE01`。先排队 Consent Mode v2 四项默认 denied；广告四项中的三项同意字段永远 denied，只有选择 all 后将 analytics_storage 更新为 granted，并且只加载一次 gtag。
- `assets/cookie-consent.js`：兼容 `metatecno_cookie_consent_v1`；动态提供多语 Cookie settings；从 all 撤回至 essential 时清理可访问 `_ga` cookie 并立即重载。
- `assets/contact-form.js`：只有客户端校验、蜜罐与反垃圾门禁均通过时，向 sessionStorage 写入 `metatecno_lead_pending_v1`；内容只含 path、language、time，不含姓名、邮箱、电话或表单正文；不发送 GA 事件、不改变提交目标。
- thank-you：只有存在待确认标记才排队一次 `generate_lead`，随后立即清标记；直接访问与刷新没有该标记。
- 辅助事件：同意后委托监听 `contact_whatsapp`、`contact_email`；参数仅含页面路径、页面类型、内容语言、联系方法与 CTA 位置。`form_start`/`form_submit` 由计划中的 Enhanced Measurement 提供，均不设为关键事件。
- localhost/127.0.0.1 自动带 `debug_mode: true`；生产不启用。
- 383 页均恰好一个 cookie script、一个 analytics script、一个可操作横幅与一个可达隐私入口；原先缺失的 11 页已补齐。五份现有政策已加入 Google Analytics、同意、用途、14 个月保留和撤回说明；其他语言链接英文政策。

## 事件字典

| Event | 来源 | 触发 | 允许参数 | Key event |
|---|---|---|---|---|
| page_view | gtag config / Enhanced Measurement | 同意后每次页面配置一次 | GA 标准参数；content_language、content_group、page_path | 否 |
| generate_lead | assets/analytics.js | thank-you 且存在合法 sessionStorage 待确认标记；随后清标记 | content_language、content_group、page_path、lead_source_path | 是，唯一 |
| contact_whatsapp | assets/analytics.js | 同意后点击 wa.me | content_language、content_group、page_path、contact_method、cta_location | 否 |
| contact_email | assets/analytics.js | 同意后点击 mailto | content_language、content_group、page_path、contact_method、cta_location | 否 |
| scroll / click / view_search_results / video_* / file_download / form_start / form_submit | GA4 Enhanced Measurement | 后台启用且访客同意 | GA 标准非 PII 参数 | 否 |

姓名、公司名、邮箱、电话、主题、消息正文和完整表单内容不得作为事件名、参数名或参数值进入 GA。

## 红→绿与运行时证据

| 验收 | 结果 |
|---|---|
| 安装器初始反向门禁 | 红：`Analytics installer: 383 HTML pages; 383 noncompliant.` |
| 安装写入与幂等 | 绿：383 updated；随后 0 noncompliant；二次写入 0 updated |
| 占位模式结构验证 | 绿：`383/383 HTML pages; Measurement ID G-REPLACE01; 1 consent banner + 1 cookie script + 1 analytics script per page; 5 privacy disclosures.` |
| 生产门禁 | 预期红：仅 `Measurement ID is still a placeholder` |
| 独立副本破坏 | 删除 en/index.html 的 analytics 标签后红：恰好 1 finding；恢复后 383/383 绿 |
| 首次访问 | 横幅可见；0 Google resource；0 Google script |
| 拒绝与刷新 | 横幅收起并持久；Cookie settings 可见；0 Google resource；0 Google script |
| 同意（占位 ID） | fail-closed：横幅收起但 0 Google resource、0 Google script；未伪造 tag 测试 |
| 撤回 | Cookie settings 重开；从 all 选 essential 触发重载；重载后 0 Google resource、0 Google script |
| 直接 thank-you | 页面可达；0 Google resource、0 Google script；源代码门禁要求待确认标记 |
| 真实表单 | 未提交，符合禁止真实提交要求 |
| DebugView | 阻断：无真实 Measurement ID，无法产生或确认 page_view / generate_lead |

本地服务器还暴露出独立的现有问题：媒体目录在当前源树缺失，多数图片/Logo 请求为 404。它不影响同意脚本本身，但会影响页面信任与本地视觉验收，已列入 SEO backlog。

## 取得后台访问后的部署步骤

1. 在当前公司账号只创建一次既定 property 与 web stream，记录三个 ID；设置 14 个月、Enhanced Measurement、formsubmit.co unwanted referral、唯一 key event `generate_lead`，有权限才链接 GSC。
2. 只把 `assets/analytics.js` 中 `G-REPLACE01` 替换为界面显示的 Measurement ID，不复制任何现有属性 ID。
3. 运行 `node tools/install-analytics.mjs --root . --check`，必须 0 noncompliant。
4. 运行 `node tools/verify-analytics.mjs --root .`，必须 383/383 且不允许占位符。
5. 本地重新验证首次/拒绝/撤回均 0 Google 请求；同意后 gtag 脚本和 page_view 各一次；不提交真实表单，通过受控 sessionStorage 路径验证一次 generate_lead 和刷新防重。
6. 在 GA4 DebugView 确认 `page_view`、`contact_whatsapp`、`contact_email` 与恰好一次 `generate_lead`，确认参数无 PII。
7. 仅在以上门禁全绿后交给部署负责人；本次工作没有部署、commit 或 push。

## 回滚

本次开工前快照位于 `/private/tmp/metatecno-ga4-baseline.8ZgPFF/site/`，SHA 清单在 `source-before.sha256`，Git 状态在 `git-status-before.txt`。在当前会话仍存在时，可从快照逐文件恢复被允许范围内的 HTML、`assets/cookie-consent.js` 与 `assets/contact-form.js`，并移除新增的 `assets/analytics.js`、`tools/install-analytics.mjs`、`tools/verify-analytics.mjs`。不要使用 `git reset` 或覆盖用户原有脏改动。部署后回滚应使用部署系统保存的本版本前制品，而不是依赖系统临时目录。
