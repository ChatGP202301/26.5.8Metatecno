# 图片资源指南

## 📁 图片目录结构

```
images/
├── logo.png                    # 公司Logo
├── favicon.ico                 # 网站图标
├── og-image.jpg               # 社交媒体分享图片
├── hero/
│   └── hero-bg.jpg            # 首页横幅背景
├── products/
│   ├── electrolyzer-seals/    # 电解槽密封产品图片
│   ├── fluoroplastic/         # 氟塑料产品图片
│   └── pipeline-seals/        # 管道密封产品图片
├── about/
│   ├── factory-exterior.jpg   # 工厂外观
│   ├── production-line.jpg    # 生产线
│   ├── team.jpg              # 团队照片
│   └── workshop.jpg          # 车间照片
└── certifications/
    ├── iso-cert.png          # ISO认证
    ├── quality-cert.png      # 质量认证
    └── other-certs.png       # 其他证书
```

## 🖼️ 图片规格要求

### 1. Logo
- **文件名**: `logo.png`
- **尺寸**: 200x60px
- **格式**: PNG（透明背景）
- **用途**: 网站导航栏、页脚

### 2. Favicon
- **文件名**: `favicon.ico`
- **尺寸**: 32x32px 或 16x16px
- **格式**: ICO 或 PNG
- **用途**: 浏览器标签页图标

### 3. Hero背景图
- **文件名**: `hero-bg.jpg`
- **尺寸**: 1920x1080px（最小）
- **格式**: WebP（推荐）或 JPG
- **大小**: < 500KB（优化后）
- **用途**: 首页顶部大图

### 4. 产品图片
- **尺寸**: 800x600px
- **格式**: WebP（推荐）或 JPG
- **大小**: < 200KB（每张）
- **命名**: 使用描述性名称，如 `ici-gasket-01.jpg`
- **数量**: 每个产品类别至少3-5张

### 5. 工厂/关于图片
- **尺寸**: 1200x800px
- **格式**: WebP 或 JPG
- **大小**: < 300KB
- **数量**: 4-6张

### 6. 证书图片
- **尺寸**: 600x800px（竖版）
- **格式**: PNG（保持清晰度）
- **大小**: < 500KB
- **要求**: 确保文字清晰可读

### 7. 社交媒体分享图
- **文件名**: `og-image.jpg`
- **尺寸**: 1200x630px
- **格式**: JPG
- **用途**: Facebook, LinkedIn等分享预览

## 🎨 图片优化建议

### 推荐工具：

**在线压缩**:
- TinyPNG (https://tinypng.com) - PNG/JPG压缩
- Squoosh (https://squoosh.app) - 多格式优化
- Compressor.io - 无损压缩

**本地工具**:
- ImageOptim (Mac)
- FileOptimizer (Windows)
- GIMP (跨平台)

### 优化步骤：

1. **调整尺寸** - 按照上述规格调整
2. **转换格式** - 优先使用WebP
3. **压缩** - 在线工具压缩
4. **重命名** - 使用描述性文件名
5. **上传** - 放到对应目录

## 📝 图片命名规范

### ✅ 好的命名：
```
electrolyzer-seal-asahi-kasei.jpg
factory-production-line-2024.jpg
iso-9001-certificate.png
team-photo-research-department.jpg
```

### ❌ 避免的命名：
```
IMG_1234.jpg
图片1.jpg
product.jpg
pic.png
```

### 命名规则：
- 全部小写字母
- 使用连字符(-)分隔单词
- 包含关键词（有助于SEO）
- 避免特殊字符
- 使用英文命名

## 🔄 替换占位符图片

### 步骤1: 准备图片
按照上述规格准备所有图片

### 步骤2: 上传到对应目录
```
images/
├── logo.png              ← 替换这个
├── products/
│   └── *.jpg            ← 添加产品图片
├── about/
│   └── *.jpg            ← 添加公司图片
└── certifications/
    └── *.png            ← 添加证书图片
```

### 步骤3: 更新HTML
在HTML文件中找到占位符并替换：

**查找**:
```html
<div class="image-placeholder">
```

**替换为**:
```html
<img src="/images/products/your-image.jpg" alt="产品描述">
```

## 📱 响应式图片

为了更好的性能，可以提供多个尺寸：

```html
<picture>
  <source media="(min-width: 1200px)" srcset="/images/hero/hero-bg-large.webp">
  <source media="(min-width: 768px)" srcset="/images/hero/hero-bg-medium.webp">
  <img src="/images/hero/hero-bg-small.webp" alt="Hero Background">
</picture>
```

## ✅ 图片检查清单

上传前检查：
- [ ] 所有图片已优化压缩
- [ ] 文件大小符合要求
- [ ] 尺寸正确
- [ ] 文件命名规范
- [ ] 格式正确（WebP/JPG/PNG）
- [ ] 图片清晰、无水印
- [ ] 包含所有必需图片

## 🎯 重要提醒

**版权问题**:
- ✅ 使用您自己拍摄的照片
- ✅ 使用购买了授权的图片
- ✅ 使用免费商用素材
- ❌ 不要使用网上随意下载的图片
- ❌ 不要使用竞争对手的图片

**推荐的免费图片网站**（用于临时占位）:
- Unsplash (https://unsplash.com)
- Pexels (https://pexels.com)
- Pixabay (https://pixabay.com)

## 📞 需要帮助？

如有图片处理问题，联系：
- Email: info@metatecnocq.com
- 或咨询专业摄影/设计服务

---

**准备好图片后，记得更新HTML文件中的图片路径！**
