# Metatecno 优化版网站 - GitHub Pages 部署指南

## 📦 包含内容

此目录包含完整的优化版 Metatecno 网站，可直接部署到 GitHub Pages。

### ✅ 已集成的优化

- ✅ **WhatsApp + 多渠道浮动联系按钮**
- ✅ **增强的交互功能**（深色模式、动画、图片灯箱等）
- ✅ **PWA 支持**（离线访问、可安装）
- ✅ **Service Worker**（性能优化、缓存策略）
- ✅ **完整的 SEO 标签**
- ✅ **43 种语言版本**
- ✅ **响应式设计优化**

---

## 🚀 快速部署到 GitHub Pages

### 方法 1：使用 GitHub Desktop（推荐新手）

1. **安装 GitHub Desktop**
   - 下载：https://desktop.github.com/

2. **创建新仓库**
   - 打开 GitHub Desktop
   - File → New Repository
   - Name: `metatecno-website`
   - Local Path: 选择这个文件夹的上级目录
   - 勾选 "Initialize this repository with a README"
   - Click "Create Repository"

3. **发布到 GitHub**
   - Click "Publish repository"
   - 取消勾选 "Keep this code private"（如果要公开）
   - Click "Publish Repository"

4. **启用 GitHub Pages**
   - 打开浏览器访问：https://github.com/你的用户名/metatecno-website
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Save

5. **访问网站**
   - 网址：https://你的用户名.github.io/metatecno-website/

### 方法 2：使用命令行（推荐开发者）

```bash
# 1. 进入网站目录
cd metatecno-optimized

# 2. 初始化 Git 仓库
git init

# 3. 添加所有文件
git add .

# 4. 创建首次提交
git commit -m "Initial commit: Optimized Metatecno website"

# 5. 在 GitHub 上创建新仓库
# 访问 https://github.com/new
# 仓库名：metatecno-website
# 不要初始化 README

# 6. 关联远程仓库（替换 YOUR-USERNAME）
git remote add origin https://github.com/YOUR-USERNAME/metatecno-website.git

# 7. 推送到 GitHub
git branch -M main
git push -u origin main

# 8. 启用 GitHub Pages
# 访问仓库 Settings → Pages
# Source: Deploy from a branch → main / (root) → Save
```

### 方法 3：使用 GitHub Web 界面（最简单）

1. **访问 GitHub**
   - https://github.com/new

2. **创建新仓库**
   - Repository name: `metatecno-website`
   - Public
   - Click "Create repository"

3. **上传文件**
   - Click "uploading an existing file"
   - 拖拽所有文件到浏览器窗口
   - 等待上传完成
   - Commit changes

4. **启用 GitHub Pages**
   - Settings → Pages
   - Source: main / (root)
   - Save

5. **访问网站**
   - https://你的用户名.github.io/metatecno-website/

---

## ⚙️ 部署前需要配置的项目

### 1. Google Analytics（可选但推荐）

在所有 HTML 文件中，替换：
```javascript
gtag('config', 'G-XXXXXXXXXX');
```
为你的实际 Google Analytics ID

### 2. WhatsApp 号码确认

文件：`assets/contact-fab.js`
```javascript
whatsapp: {
  enabled: true,
  number: '862372600785', // 确认这是正确的号码
  message: 'Hello, I\'m interested in your products'
}
```

### 3. 微信二维码

上传你的微信二维码图片到：
```
assets/wechat-qr.png
```

### 4. 域名配置（如果使用自定义域名）

在仓库根目录创建 `CNAME` 文件：
```
www.metatecno.com
```

---

## 📁 文件结构

```
metatecno-optimized/
├── index.html              # 语言选择页面
├── robots.txt              # SEO 爬虫配置
├── sitemap.xml             # 网站地图
├── manifest.json           # PWA 配置
├── sw.js                   # Service Worker
│
├── assets/
│   ├── styles.css          # 原始样式
│   ├── enhanced-styles.css # 增强样式
│   ├── enhanced-site.js    # 增强功能
│   ├── contact-fab.js      # 联系按钮
│   ├── logo.svg
│   ├── favicon.svg
│   └── media/              # 图片资源
│
├── en/                     # 英文版本
│   ├── index.html
│   ├── about/
│   ├── products/
│   ├── contact/
│   └── ...
│
├── zh/                     # 简体中文（需要翻译）
├── ja/                     # 日文
├── ru/                     # 俄文
└── ...                     # 其他 40+ 语言
```

---

## 🔧 本地测试

### 使用 Python 简单服务器

```bash
# Python 3
cd metatecno-optimized
python3 -m http.server 8000

# 访问 http://localhost:8000
```

### 使用 Node.js http-server

```bash
# 安装
npm install -g http-server

# 运行
cd metatecno-optimized
http-server -p 8000

# 访问 http://localhost:8000
```

### 使用 VS Code Live Server

1. 安装 "Live Server" 扩展
2. 右键 `index.html` → "Open with Live Server"

---

## ✅ 部署后检查清单

### 基础功能
- [ ] 网站能正常访问
- [ ] 所有页面链接正常
- [ ] 图片正常加载
- [ ] 导航菜单正常工作
- [ ] 语言切换正常工作

### 优化功能
- [ ] WhatsApp 按钮显示并可点击
- [ ] 微信二维码弹窗正常
- [ ] 深色模式切换正常
- [ ] 移动端汉堡菜单正常
- [ ] 图片灯箱正常工作
- [ ] 滚动动画正常

### PWA 功能
- [ ] 在 Chrome DevTools → Application → Manifest 查看
- [ ] Service Worker 已注册
- [ ] 可以"添加到主屏幕"
- [ ] 离线访问正常（断网测试）

### SEO
- [ ] Google Search Console 已验证
- [ ] sitemap.xml 已提交
- [ ] 所有页面有正确的 meta 标签
- [ ] 社交媒体分享预览正常

### 性能
- [ ] PageSpeed Insights 测试
- [ ] 移动端分数 > 85
- [ ] 桌面端分数 > 90

---

## 🐛 常见问题

### 问题：页面显示 404
**解决：** 
- 检查 GitHub Pages 是否已启用
- 确认 Source 设置为 main / (root)
- 等待几分钟让 GitHub 构建网站

### 问题：CSS/JS 不加载
**解决：**
- 检查文件路径是否正确
- 清除浏览器缓存
- 确认文件已正确上传

### 问题：WhatsApp 按钮不显示
**解决：**
- 检查 `contact-fab.js` 是否正确加载
- 打开浏览器控制台查看错误
- 确认脚本在 HTML 中正确引用

### 问题：Service Worker 错误
**解决：**
- GitHub Pages 必须使用 HTTPS
- 检查 `sw.js` 文件路径
- 清除 Service Worker 缓存重新测试

---

## 📈 性能优化建议

### 进一步优化（可选）

1. **启用 Cloudflare CDN**
   - 注册 Cloudflare
   - 添加你的域名
   - 自动 CDN 加速

2. **图片转换为 WebP**
   ```bash
   # 使用 cwebp 工具
   find assets/media -name "*.jpg" -exec sh -c 'cwebp -q 85 "$1" -o "${1%.jpg}.webp"' _ {} \;
   ```

3. **压缩 CSS 和 JS**
   ```bash
   # 使用在线工具或命令行
   npx cssnano assets/styles.css assets/styles.min.css
   npx terser assets/enhanced-site.js -o assets/enhanced-site.min.js
   ```

4. **启用浏览器缓存**
   - 在 GitHub Pages 无需配置
   - 如使用自定义域名，在 DNS 服务商配置

---

## 🔒 安全建议

1. **启用 HTTPS**
   - GitHub Pages 自动启用
   - 在 Settings → Pages → Enforce HTTPS 勾选

2. **定期更新**
   - 定期检查依赖库更新
   - 监控安全漏洞

3. **备份**
   - Git 自动备份所有历史版本
   - 建议定期下载本地备份

---

## 📞 获取帮助

### 资源
- GitHub Pages 文档：https://docs.github.com/pages
- GitHub Pages 社区：https://github.community/
- 网站测试工具：https://pagespeed.web.dev/

### 联系支持
如果遇到问题：
1. 检查浏览器控制台错误
2. 查看 GitHub Pages 构建日志
3. 在仓库 Issues 中提问

---

## 🎉 完成！

您的优化版 Metatecno 网站现在已经部署到 GitHub Pages！

**网址格式：**
```
https://你的用户名.github.io/metatecno-website/
```

**下一步：**
1. 测试所有功能
2. 提交到 Google Search Console
3. 配置 Google Analytics
4. 在社交媒体分享

**祝您网站运营成功！** 🚀

---

*最后更新: 2026-05-11*
