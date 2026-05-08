# 如何将网站上传到GitHub - 完整指南

## 🚀 方法1: 使用Git命令行（推荐）

### 步骤1: 安装Git

**Windows:**
- 下载: https://git-scm.com/download/windows
- 安装后打开 Git Bash

**Mac:**
```bash
# 使用Homebrew安装
brew install git
```

**Linux:**
```bash
sudo apt-get install git  # Ubuntu/Debian
sudo yum install git      # CentOS/RHEL
```

### 步骤2: 配置Git

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 步骤3: 在GitHub创建仓库

1. 访问 https://github.com
2. 登录您的账号
3. 点击右上角 "+" → "New repository"
4. 仓库名称: `metatecno-website`
5. 描述: `Official website for Metatecno(Chongqing)Technology Co.,LTD`
6. 选择 **Public** 或 **Private**
7. **不要**勾选 "Initialize this repository with a README"
8. 点击 "Create repository"

### 步骤4: 上传代码

打开终端/命令行，进入网站文件夹：

```bash
# 进入网站目录
cd /path/to/metatecno-website

# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Complete multi-language website"

# 添加远程仓库（替换YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/metatecno-website.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

### 步骤5: 验证上传

访问: `https://github.com/YOUR_USERNAME/metatecno-website`

您应该看到所有文件已经上传！

---

## 🌐 方法2: 使用GitHub Desktop（最简单）

### 步骤1: 安装GitHub Desktop

下载: https://desktop.github.com/

### 步骤2: 登录GitHub账号

打开GitHub Desktop，登录您的账号

### 步骤3: 创建新仓库

1. File → New Repository
2. Name: `metatecno-website`
3. Local Path: 选择您的网站文件夹的**父目录**
4. 点击 "Create Repository"

### 步骤4: 发布到GitHub

1. 点击 "Publish repository"
2. 取消勾选 "Keep this code private" (如果想公开)
3. 点击 "Publish repository"

完成！

---

## 📤 方法3: 直接在GitHub网页上传（小项目）

### 步骤1: 创建仓库

1. 访问 https://github.com/new
2. 创建新仓库: `metatecno-website`

### 步骤2: 上传文件

1. 进入仓库页面
2. 点击 "uploading an existing file"
3. 将整个 `metatecno-website` 文件夹拖拽到页面
4. 等待上传完成
5. 填写提交信息: "Initial commit"
6. 点击 "Commit changes"

**注意**: 这个方法适合小项目，大量文件可能较慢

---

## 🔗 配置GitHub Pages（让网站上线）

### 步骤1: 启用GitHub Pages

1. 进入仓库 Settings
2. 左侧菜单选择 "Pages"
3. Source: 选择 "main" 分支
4. Folder: 选择 "/ (root)"
5. 点击 "Save"

### 步骤2: 等待部署

- 通常需要1-5分钟
- 刷新页面，会显示网站URL
- 默认地址: `https://YOUR_USERNAME.github.io/metatecno-website/`

### 步骤3: 配置自定义域名（可选）

1. 在GitHub Pages设置中，找到 "Custom domain"
2. 输入: `metatecnocq.com`
3. 点击 "Save"
4. 在域名注册商处配置DNS:

```
类型: A记录
名称: @
值: 185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153

类型: CNAME
名称: www
值: YOUR_USERNAME.github.io
```

---

## 📋 上传后检查清单

- [ ] 所有文件都已上传
- [ ] 文件夹结构正确
- [ ] README.md 可以正常显示
- [ ] 在GitHub上能看到所有页面
- [ ] GitHub Pages 已启用
- [ ] 网站可以访问

---

## 🔄 以后如何更新网站

### 使用Git命令行:

```bash
# 进入项目目录
cd /path/to/metatecno-website

# 查看修改
git status

# 添加修改的文件
git add .

# 提交修改
git commit -m "Update: 描述你的修改"

# 推送到GitHub
git push
```

### 使用GitHub Desktop:

1. 打开GitHub Desktop
2. 查看修改的文件
3. 填写提交信息
4. 点击 "Commit to main"
5. 点击 "Push origin"

---

## 🛠️ 常见问题解决

### 问题1: git push 失败

**解决方案**:
```bash
# 如果提示需要认证
git config --global credential.helper store
git push

# 如果提示分支落后
git pull origin main --rebase
git push
```

### 问题2: 文件太大无法上传

**解决方案**:
- GitHub单个文件限制100MB
- 使用Git LFS处理大文件
- 或者将大文件放在CDN上

### 问题3: .gitignore 不生效

**解决方案**:
```bash
# 清除Git缓存
git rm -r --cached .
git add .
git commit -m "Fix: Update .gitignore"
git push
```

### 问题4: 网站显示404

**解决方案**:
- 确认index.html在根目录
- 检查GitHub Pages是否已启用
- 等待5-10分钟让部署完成
- 清除浏览器缓存

---

## 📞 需要帮助？

如果遇到问题:
1. 查看GitHub文档: https://docs.github.com
2. 搜索具体错误信息
3. 联系技术支持: info@metatecnocq.com

---

## 🎉 完成！

现在您的网站代码已经在GitHub上了！

**下一步**:
1. 添加真实的产品图片
2. 完成其他语言翻译
3. 配置自定义域名
4. 开始推广您的网站

祝您成功！🚀
