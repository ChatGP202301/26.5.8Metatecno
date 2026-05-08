# Metatecno Logo 使用说明

## 📁 Logo文件

项目中包含以下Logo文件：

### 1. 标准Logo
- **文件名**: `logo.svg`
- **尺寸**: 240x80px
- **格式**: SVG（矢量，可无限缩放）
- **用途**: 网站导航栏、页眉

### 2. 大尺寸Logo
- **文件名**: `logo-large.svg`
- **尺寸**: 400x120px
- **格式**: SVG
- **用途**: 宣传材料、打印、高分辨率显示

### 3. Favicon图标
- **文件名**: `favicon.svg`
- **尺寸**: 64x64px
- **格式**: SVG
- **用途**: 浏览器标签页图标

## 🎨 设计元素

### 颜色方案
- **主色**: #0066cc (蓝色) - 代表专业、技术、可靠
- **辅色**: #00d4aa (青绿色) - 代表创新、环保
- **点缀**: #ff6b35 (橙色) - 代表活力、突破
- **文字**: #666666 (深灰色)

### 设计特点
1. **六边形图案** - 象征工业制造、精密工程
2. **METATECNO** - 加粗字体，现代感强
3. **装饰线** - 青绿色横线，增加视觉层次
4. **副标题** - TECHNOLOGY CO., LTD，表明公司性质

## 💡 设计理念

- **工业风格**: 六边形元素代表制造业的精密与专业
- **现代简洁**: 清晰的字体，简洁的布局
- **技术感**: 几何图形象征技术创新
- **国际化**: 英文标识，适合国际市场

## 📐 使用规范

### 最小尺寸
- 网页显示: 最小高度 40px
- 打印: 最小高度 15mm

### 安全空间
Logo周围应保留至少logo高度50%的空白区域

### 不要做的事情
- ❌ 不要改变颜色比例
- ❌ 不要拉伸或压缩Logo
- ❌ 不要旋转Logo
- ❌ 不要添加阴影或特效
- ❌ 不要改变字体

## 🖼️ 在网站中使用

### HTML代码示例
```html
<!-- 导航栏中使用 -->
<div class="logo">
    <a href="/">
        <img src="images/logo.svg" alt="Metatecno" style="height: 60px;">
    </a>
</div>

<!-- 页脚中使用 -->
<img src="images/logo.svg" alt="Metatecno" class="footer-logo">

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="images/favicon.svg">
```

### CSS样式建议
```css
.logo img {
    height: 60px;
    width: auto;
}

@media (max-width: 768px) {
    .logo img {
        height: 50px;
    }
}
```

## 🎯 应用场景

### 网站应用
- ✅ 导航栏
- ✅ 页脚
- ✅ 浏览器标签页（favicon）
- ✅ 社交媒体分享图

### 线下应用
- ✅ 名片
- ✅ 信纸
- ✅ 宣传册
- ✅ 展会资料
- ✅ 产品包装

## 📄 导出其他格式

如果需要PNG格式（用于某些特定场景）：

### 使用在线工具转换
1. 访问 https://cloudconvert.com/svg-to-png
2. 上传SVG文件
3. 选择分辨率（推荐2x或3x）
4. 下载PNG文件

### 推荐尺寸
- 标准: 240x80px (1x)
- 高清: 480x160px (2x)
- 超高清: 720x240px (3x)

## 🌈 不同背景下的使用

### 白色背景
使用标准彩色Logo（默认）

### 深色背景
如需在深色背景上使用，可以：
1. 使用白色版本的Logo
2. 或在Logo周围添加白色背景板

### 图片背景
建议在Logo下方添加半透明白色背景，确保可读性

## 📱 响应式设计

Logo在不同设备上的建议尺寸：
- **桌面**: 60px高度
- **平板**: 55px高度
- **手机**: 50px高度

## 🔄 更新历史

- **v1.0** (2024-01-15) - 初始设计
  - 创建标准Logo
  - 创建Favicon
  - 创建大尺寸版本

## 📞 设计相关问题

如需Logo的其他版本或有设计疑问：
- Email: info@metatecnocq.com

---

**Logo所有权归 Metatecno(Chongqing)Technology Co.,LTD 所有**
