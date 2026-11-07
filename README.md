# 神州 · SHENZHOU

![神州公会首页预览](assets/img/og-cover.png)

> 此间山河，共筑神州。
>
> 为 **OrangeMC** 生存服里的「神州」公会制作的官方网站。纯静态、无数据库、无构建步骤，可以直接部署在 **GitHub Pages** 免费空间。

网站包含：

- **宣传首页**：公会介绍、招新状态、精选工程、公会日志、加入入口
- **成员名录**：搜索、按职位/状态筛选、排序、成员资料弹窗
- **工程进度**：状态筛选、进度条、里程碑、成员分工、最近工地动态
- **建筑坐标**：维度筛选、关键词搜索、一键复制坐标与 `/tp` 指令
- **加入我们**：申请条件、加入流程、申请模板、常见问题
- **站长后台**：只有拥有 GitHub 仓库写权限的人可以发布内容

所有成员、工程、坐标、公告和页面文案都可以在后台修改。修改先保存在草稿里，预览确认后再发布；每次发布会生成一个 GitHub 提交，可随时回溯或撤销。

---

## 先在电脑上看看

**直接双击 `本地预览.bat`**，浏览器会自动打开：

- 网站：<http://127.0.0.1:8787/>
- 后台：<http://127.0.0.1:8787/admin.html>

预览窗口关闭后，在命令行窗口按 `Ctrl+C` 即可停止本地服务。不要直接双击 `index.html`，浏览器会阻止读取本地的 JSON 文件，页面会显示「存档没有读出来」。

如果 8787 端口被占用，可以用另一个端口：

```powershell
powershell -ExecutionPolicy Bypass -File preview.ps1 -Port 8790
```

> 当前仓库里的成员、工程、坐标和公告是**演示数据**。请在后台替换成你们服务器的真实信息，再对外发布。

---

## 部署到 GitHub Pages（免费）

### 1. 创建仓库

1. 登录 GitHub，点击右上角 **+ → New repository**。
2. 仓库名可以取 `shenzhou-site`，可见性选择 **Public**。
3. 创建后先不要添加 README，保持空仓库即可。

> GitHub 免费账户只能从 **公开仓库** 发布 Pages。如果仓库设为私有，需要 GitHub Pro 或更高方案才能使用 Pages。

### 2. 上传网站文件

**方法 A：在 GitHub 网页上传（不装任何软件）**

1. 打开新仓库，点击 **Add file → Upload files**。
2. 把本文件夹里的这些内容一起拖进去：
   - `index.html`
   - `admin.html`
   - `assets/` 文件夹
   - `data/` 文件夹
   - `robots.txt`
   - `.nojekyll`（这是空文件，Windows 默认隐藏；没有也可以上传，不影响使用）
   - 其他说明文件可传可不传
3. 在底部填写提交说明，例如「初始化神州公会网站」，点击 **Commit changes**。

**方法 B：使用 Git 命令行**

```bash
cd 这个文件夹
git init
git add .
git commit -m "初始化神州公会网站"
git branch -M main
git remote add origin https://github.com/<你的用户名>/shenzhou-site.git
git push -u origin main
```

### 3. 开启 GitHub Pages

1. 进入仓库 **Settings → Pages**。
2. **Build and deployment → Source** 选择 **Deploy from a branch**。
3. **Branch** 选择 `main`，目录选择 `/ (root)`，点击 **Save**。
4. 等待 1–2 分钟，页面顶部会出现站点地址：

```
https://<你的用户名>.github.io/shenzhou-site/
```

用手机或电脑打开这个地址，就是公开网站。后台地址是：

```
https://<你的用户名>.github.io/shenzhou-site/admin.html
```

> 每次在后台点击「发布更新」，GitHub Pages 会自动重新发布，通常需要 1–2 分钟。浏览器如果看到旧内容，按 `Ctrl+F5` 强制刷新。

---

## 第一次使用后台

后台没有设置传统密码，因为纯静态网站无法安全地隐藏密码。真正限制权限的是 **GitHub 仓库的写权限**：

- 任何人都可以打开 `admin.html`，但没有你的访问令牌就无法写入；
- 只有拥有这个仓库 **Contents 写权限** 的账号才能发布；
- 每次发布都会在 GitHub 留下提交记录，可以追溯和回滚。

### 1. 创建访问令牌

1. 打开 GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**。
2. 点击 **Generate new token**。
3. **Repository access** 选择 **Only select repositories**，只勾选你的网站仓库。
4. 在 **Repository permissions** 中找到 **Contents**，设为 **Read and write**。
5. 生成后复制 `github_pat_...` 开头的令牌。

官方直达：「[创建 Fine-grained token](https://github.com/settings/personal-access-tokens/new)」

### 2. 登录后台

1. 打开 `https://<你的用户名>.github.io/<仓库名>/admin.html`。
2. 填写：
   - **仓库所有者**：你的 GitHub 用户名
   - **仓库名**：例如 `shenzhou-site`
   - **分支**：`main`
   - **Personal Access Token**：刚才复制的令牌
3. 点击 **连接并读取内容**。

在 GitHub Pages 上打开后台时，仓库所有者和仓库名通常会自动识别；如果使用自定义域名或本地预览，请手动填写。

> 默认不勾选「记住令牌」，令牌只存在 `sessionStorage`，关闭标签页后失效。不要在公共电脑上勾选记住。

### 3. 编辑与发布

1. 在左侧选择 **站点设置 / 成员管理 / 工程管理 / 坐标管理 / 公告日志**。
2. 修改后，左上角会显示「N 个文件有未发布修改」。
3. 点击 **预览**，会在新标签页打开只在你当前浏览器可见的预览版本（底部有橙色「预览模式」提示）。
4. 确认无误后点击 **发布更新**。后台会把修改过的 JSON 文件合并成一个 GitHub 提交。
5. 等待 1–2 分钟，刷新公开网站即可看到更新。

如果发布失败，未发布的修改仍然保留在当前页面草稿里，可以修复问题后重试。

---

## 日常维护

### 修改内容

全部在后台完成，不需要改代码：

- **站点设置**：公会名、主城名称、服务器名、首页标题、宣传文案、公告、招新条件、加入流程、FAQ、联系方式、页脚
- **首页主视觉**：在后台直接上传游戏截图，替换首页右侧的内置插画；可随时一键恢复插画，支持 PNG / JPG / WebP，图片随发布自动写入仓库
- **成员管理**：增删改成员、职位、状态、标签、简介
- **工程管理**：更新进度、里程碑、参与成员、工地动态；可设置是否在首页精选
- **坐标管理**：增删改坐标、维度、分类、建造者；关闭「公开」后不在前台显示
- **公告日志**：首页展示最新三条；可置顶

### 联系方式和服务器地址

在 **站点设置 → 招新与联络** 中填写：

- **服务器地址**：可选；填写后出现在页脚和加入页，并带复制按钮
- **QQ 群**：可选；填写后展示群号与复制按钮
- **GitHub 链接**：可选
- **联络说明**：会显示在加入页的「找到我们」卡片中

留空时，页面会显示「在游戏中联系成员」的提示，不会凭空生成 QQ 号或服务器 IP。

### 撤销一次发布

在 GitHub 仓库的 **Commits** 历史里找到对应提交，使用 **Revert** 生成一次反向提交即可。或者直接让管理员在后台重新改回内容再发布。

### 备份

- GitHub 仓库本身就是完整备份，历史版本都在。
- 数据文件集中在 `data/` 目录，也可以直接手动编辑（需要保持 JSON 格式正确）。
- 后台每次发布只提交发生变化的数据文件，不会动页面代码。

---

## 数据结构（给以后维护的人）

```text
index.html                 公开网站入口
admin.html                 仅站长使用的内容后台
assets/
  css/base.css             设计系统、共用组件、导航、页脚、弹窗
  css/pages.css            首页与各内容页布局
  css/admin.css            后台样式
  js/config.js             数据路径、预览存储、仓库默认设置
  js/app.js                SPA 路由、导航、交互、预览模式
  js/data.js               读取 JSON 数据
  js/ui.js                 头像、卡片、状态、弹窗等组件
  js/pages/*.js            各页面模板
  js/hero-art.js           首页等距插画（纯 SVG）
  js/admin.js              GitHub 后台编辑器
  img/                     图标与社交分享图
data/
  site.json                站点设置与全部页面文案
  members.json             成员名册
  projects.json            工程与进度
  builds.json              建筑坐标
  news.json                公告日志
preview.ps1 / 本地预览.bat  Windows 本地预览服务
```

- 页面不依赖任何第三方框架、字体或 CDN，离线也能完整显示。
- 成员头像由名字自动生成像素头像，无需上传图片。
- 首页主视觉：后台「站点设置 → 首页与公告」可上传图片（写入 `assets/img/hero-upload.png|jpg`），清空后恢复内置插画（`assets/js/hero-art.js` 中的内联 SVG）。主视觉标签默认引用「主城名称 · 主城」。
- 社交分享图的 `og:image` 目前是相对路径。绑定自定义域名后，建议在 `index.html` 中把它改成完整的 `https://你的域名/assets/img/og-cover.png`，部分社交平台只接受绝对地址。

---

## 安全说明

- 后台页面本身是公开的，这不影响安全；**没有令牌就无法写入仓库**。
- 令牌只直接发送到 `api.github.com`，不经过任何中间服务器。
- 不要把令牌贴到群里、截图里或提交进仓库。
- 如果怀疑令牌泄露，立即到 GitHub 删除/重新生成；旧令牌会马上失效。
- 公开仓库的访客可以看到 `data/` 和页面代码，这本来就都是公开内容。请不要把现实中的联系方式、住址等敏感信息写进公开数据。
- 不要让仓库拥有者之外的人拥有仓库写权限，否则对方也可以绕过后台直接改仓库。

---

## 常见问题

**后台提示「令牌无效或已过期」**  
重新生成一个 Fine-grained token，确认勾选了这个仓库，并且 **Contents** 是 **Read and write**。

**后台提示「仓库、分支或文件不存在」**  
检查仓库名、分支名，以及令牌的 Repository access 是否包含这个仓库。文件上传不完整时也会出现。

**发布成功，但公开网站还是旧内容**  
先等 1–2 分钟；再按 `Ctrl+F5` 强制刷新。也可以在仓库 **Actions** 页看 Pages 的部署记录。

**本地预览打不开**  
确认不是直接双击 `index.html`，而是运行 `本地预览.bat`。如果端口被占用，换一个端口；如果 PowerShell 被安全软件拦截，请允许它运行。

**中国大陆访问 GitHub Pages 很慢或不稳定**  
这是 GitHub Pages 的网络问题。网站是纯静态文件，可以原样部署到 Cloudflare Pages、Netlify、Vercel 或自己的服务器，后台仍然通过 GitHub API 提交内容，代码不用改。部署到其他平台时，把该平台的发布目录指向本文件夹即可。

---

## 可选的下一步

- 绑定自己的域名（GitHub Pages 支持，需在仓库 Settings → Pages 中配置 Custom domain）
- 更多图片位：目前首页主视觉支持后台上传图片，后续可以给工程、坐标加上截图相册（上传机制已经就绪）
- 加一层 Cloudflare Access，让后台页面本身也需要邮箱验证
- 把「加入申请」接到 QQ 群、Discord 或表单服务

如果准备公开，记得先把示例成员、工程、坐标和公告替换成真实内容。
