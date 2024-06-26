## 实现最简单的 mini-react

- 实现生成虚拟节点的函数
  - 注意纯文本节点的生成
- 实现渲染虚拟节点的函数
  - 真实 dom 节点生成
  - props 的设置
  - 递归子节点的渲染
    - 层级很深，子节点太多递归渲染影响性能，如何处理？
      - 切分？

## 支持 jsx

引入 `Vite` 来支持 jsx，在编译时会自动将 jsx 转化为生成虚拟节点的函数

查看文档，实际底层时采用 `esbuild` 来做编译的，同时也可以做如下配置，来改变生成代码中的 `React.createElement`

```js
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsxFactory: 'h', // 默认 React.createElement
    jsxFragment: 'Fragment',
  },
})
```

也可以使用如下注释来改变

```js
/** @jsx h */
```

> 这是 `esbuild` 对齐 [babel-plugin-transform-react-jsx](https://babeljs.io/docs/babel-plugin-transform-react-jsx#customizing-the-classic-runtime-import) 的功能

## 拓展

- 调试虚拟节点的函数，采用单元测试更为高效、简便
