# vite-plugin-ncnh

**NCNH** = **N**omodulejs **C**hange **N**o **H**ot-refresh (HTML)

一个 Vite 开发服务器插件，用于在开发环境中热更新 `<script>` 标签不带`type=module`属性引用的 JS 文件，同时保持 HTML 页面本身未变化情况下不刷新，保留表单输入等用户数据。

## 特性

- 🔥 热更新 `<script>` 引用的 JS 文件
- 💾 保持 HTML 页面本身未变化情况下不刷新，不刷新（保留表单输入值）
- 🍞 内置 Toast 提示组件（可选）

## 安装

```bash
npm install -D vite-plugin-nomodulejs-change-norefresh-html
# 或
pnpm add -D vite-plugin-nomodulejs-change-norefresh-html
# 或
yarn add -D vite-plugin-nomodulejs-change-norefresh-html
```

## 使用

在 `vite.config.ts` 或 `vite.config.js` 中添加插件：

```js
import { defineConfig } from 'vite'
import { vitePluginNCNH } from 'vite-plugin-nomodulejs-change-norefresh-html'

export default defineConfig({
  plugins: [
    vitePluginNCNH({
      injectToast: true  // 是否注入 Toast 组件，默认 true
    })
  ]
})
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `injectToast` | `boolean` | `true` | 是否在 HTML 中自动注入 Toast 组件的 CSS 和 JS |
| `onHotUpdate` | `function` | `undefined` | 模块热更新后在**浏览器端**执行的回调函数（接收数据对象 `{ gjs, mjs, timestamp }`） |

### onHotUpdate 回调示例

```js
import { defineConfig } from 'vite'
import { vitePluginNCNH } from 'vite-plugin-nomodulejs-change-norefresh-html'

export default defineConfig({
  plugins: [
    vitePluginNCNH({
      injectToast: true,
      // 此函数会被序列化并注入到浏览器中
      onHotUpdate(ctx) {
        console.log('热更新:', ctx.gjs, ctx.mjs)
        console.log('时间戳:', ctx.timestamp)
        // 热更新后的自定义逻辑（在浏览器中运行）
      }
    })
  ]
})
```

**注意：** `onHotUpdate` 回调函数会被序列化为字符串并注入到 HTML 页面中，它在浏览器上下文中执行，而不是在服务端。

## 工作原理

1. 插件拦截 Vite 的 HMR 更新请求
2. 对于 `<script nomodule>` 引用的 JS 文件变更，不触发页面刷新
3. 动态创建新的 `<script>` 标签重新加载变更的 JS 文件
4. 可选显示 Toast 提示通知用户

## 内置 Toast 组件

插件默认提供轻量级 Toast 提示组件，可通过 `injectToast: false` 禁用。

### Toast API

AI code

```javascript
// 成功提示
toast.success('操作成功！')

// 错误提示
toast.error('发生错误')

// 警告提示
toast.warning('数据已过期')

// 信息提示
toast.info('这是一条消息')

// 自定义配置
toast.success('操作完成', {
  duration: 5000,      // 停留时间 (毫秒)，0 表示不自动关闭
  position: 'top-right', // 位置：top-right, top-left, top-center, bottom-right, bottom-left, bottom-center
  closable: true       // 是否显示关闭按钮
})

// 设置默认配置
setToastDefaults({
  duration: 3000,
  position: 'top-center',
  closable: true
})
```

## 开发命令

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint

# 运行测试
npm run test
```

## 文件结构

```
vite-plugin-nomodulejs-change-norefresh-html/
├── vite-plugin-ncnh.js    # 插件主文件
├── public/
│   ├── toast.js           # Toast 组件 JS
│   └── toast.css          # Toast 组件样式
├── demo/                  # 演示项目目录
│   ├── index.html         # 演示主页
│   ├── toast-demo.html    # Toast 演示页面
│   ├── 1.js, 2.js...      # 测试用的 JS 文件
│   ├── package.json       # 演示项目的 package.json
│   └── vite.config.ts     # 演示项目的 Vite 配置
├── package.json
├── README.md              # 英文文档
└── README_zh.md           # 中文文档
```

## 演示项目

运行 demo 项目测试插件功能：

```bash
cd demo
pnpm install
pnpm dev
```

打开浏览器访问 http://localhost:5173，然后：
1. 在输入框中输入一些文字
2. 修改 `1.js`、`2.js` 等文件
3. 观察页面不刷新但代码热更新，输入框内容保持不变

## 注意事项

- 此插件仅在 Vite 开发服务器 (`vite serve`) 模式下生效
- 生产构建不会包含此插件的逻辑
- Toast 组件通过 `/@vite-plugin-ncnh/` 路径提供，使用 ETag 缓存机制

## 许可证

ISC
