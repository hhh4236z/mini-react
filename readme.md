# mini-react 课程总结

## 虚拟节点

`react` 使用虚拟节点来映射对应的真实 dom 节点，因此我们在实现的时候，第一步就是定义好虚拟节点的类型：

```ts
interface VDom {
  // Function 表示这是个函数式组件
  type: string | Function
  props: Record<string, any> & {
    children: VDom[]
  }
}
```

然后我们实现一个函数来生成虚拟节点：

```js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        // 一些系列处理 ...
        return child
      }),
    },
  }
}
```

***注意这个函数很重要，我们编写的 jsx 经过 babel 或 esbuild 等工具转义后，得到的就是调用该函数的形式，例如：***

```jsx
function App() {
  return (<div>hello</div>)
}

render(<App />)
```

转义后就变成：

```js
import { jsx as _jsx } from 'react/jsx-runtime'
function App() {
  return /* #__PURE__ */_jsx('div', {
    children: 'hello'
  })
}
```

## 虚拟节点的渲染

### 构建

在渲染时，我们通用将虚拟节点封装到一个 `fiber` 的对象中，它的结构如下：

```TypeScript
interface Fiber {
  dom?: HTMLDocument
  type: string | Function
  props: Record<string, any>
  parent?: Fiber
  sibling?: Fiber // 它的兄弟节点
  child?: Fiber // 它的第一个子节点
  alternate?: Fiber // 对应上一次渲染的节点，方便做比较，局部更新
  effectTag: 'update' | 'placement'
}
```

在 `render` 函数中，我们首先生成一个根 `fiber` 然后自上而下地构建所有 fiber，构建完成后我们开始去提交挂载

```js
function render(vnode, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [vnode]
    }
  }

  // 放到一个全局变量上，然后再 loop 中去构建整个树
  nextWorkOfUnit = wipRoot
}

function loop() {
  // eslint-disable-next-line curly
  while (nextWorkOfUnit) {
    nextWorkOfUnit = performUnitWork(nextWorkOfUnit)

    // ... 其他操作
  }

  // commit work
}

function performUnitWork(fiber) {
  // 构建 fiber 的 children
  // 使得 fiber 的child, 以及 fiber的其他child 通过 .sibling 链接起来
  const isFunctionComponent = typeof fiber.type === 'function'

  if (isFunctionComponent)
    updateFunctionComponent(fiber)
  else
    updateHoistComponent(fiber)

  // 返回下一个 fiber (即递归)
  // 1. 尝试 fiber.child
  // 2. 尝试 fiber.sibling
  // 3. 尝试 fiber 最近的有兄弟的父节点
}
```

以上我们就可以构建完整个视图，通用 `fiber.child` 和 `fiber.sibling` 将所有视图连接起来

> 构建过程，我们采用 `requestIdleCallback` 再空闲时间运行

### 提交

上面的 `loop` 函数中，当 `while` 循环停止时，即表示整个视图都构建完毕了，这时候我们开始根据视图自上而下的渲染页面

```js
function commitFiber(fiber) {
  const parent = fiber.parent
  parent.dom.append(fiber.dom)

  // 递归
  commitFiber(fiber.child)
  commitFiber(fiber.sibling)
}

// wipRoot.child 为我们视图中最顶点的节点
commitFiber(wipRoot.child)
```

> 注意 `commitFiber` 内的代码只是示意，真实运行下需要做各种区分、判断，这里仅是提炼出最核心的说明

综上，虚拟节点的生成以及渲染就完成了

## `useState` 的实现

`useState` 是 `react` 中很重要的函数，它接受一个初始值，返回一个值以及一个触发更新的函数：

```js
function useState(initial) {
  const currentFiber = wipFiber
  const stateHook = {
    value: initial
  }

  function setState(action) {
    // todo:
  }

  return [stateHook.value, setState]
}
```

> 这里提一嘴，我们再上一节构建的时候，再处理函数式组件时，会用一个全局变量来接受对应的 `fiber`

```js
function updateFunctionComponent(fiber) {
  wipFiber = fiber

  // ...
  const children = [fiber.type(fiber.props)]

  // ...
}
```

因此 `useState` 中的 `wipFiber` 即时当前函数组件对应的 `fiber`

然后我们定义一个 `stateHook` 来存储值，然后将其附在 `currentFiber` 上，即当前组件的 `fiber`，然后我们在 `setState` 中，就可以去更新 `stateHook.value`

```diff
function useState(initial) {
  const currentFiber = wipFiber
  const stateHook = {
    value: initial
  }

+ currentFiber.stateHook = stateHook

  function setState(action) {
+   // 更新值
+   stateHook.value = action(stateHook.value)
+
+   // 构造更新fiber
+   wipRoot = {
+     ...currentFiber,
+     alternate: currentFiber,
+   }
+
+   nextWorkOfUnit = wipRoot
  }

  return [stateHook.value, setState]
}
```
如上，我们这时候使用 `setState` 就可以触发更新了，但是有个问题，每次 stateHook.value 都还是 `initial`，而不是上一次修改后的值，这里我们只需做个判断，尝试从 `fiber` 的 `alternate` 上拿，因为上一次更新的 `value` 的 `stateHook` 就放在上一次的 `fiber` 上：

```diff
function useState(initial) {
  const currentFiber = wipFiber
+ const oldStateHook = wipFiber.alternate
  const stateHook = {
-   value: initial
+   value: oldStateHook ? oldStateHook.value : initial
  }

  currentFiber.stateHook = stateHook

  function setState(action) {
  // 更新值
    stateHook.value = action(stateHook.value)

    // 构造更新fiber
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    }

    nextWorkOfUnit = wipRoot
  }

  return [stateHook.value, setState]
}
```

这样子，我们每次都能拿到设置后的值了

当然，我们一个函数组件中，肯定不止使用一个 `useState` 的，以此我们因该使用数组来保存这个 `stateHook`

```diff
function useState(initial) {
  const currentFiber = wipFiber
- const oldStateHook = wipFiber.alternate
+ const oldStateHook = wipFiber.alternate?.stateHooks?.[stateHookIndex]
+ stateHookIndex++
+
  const stateHook = {
    value: oldStateHook ? oldStateHook.value : initial
  }

+ // 重新添加新的
+ stateHooks.push(stateHook)
+ currentFiber.stateHooks = stateHooks

  function setState(action) {
    // 更新值
    stateHook.value = action(stateHook.value)

    // 构造更新fiber
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    }

    nextWorkOfUnit = wipRoot
  }

  return [stateHook.value, setState]
}

function updateFunctionComponent(fiber) {
  wipFiber = fiber

  // ...
  const children = [fiber.type(fiber.props)]

+ stateHookIndex = 0
+ stateHooks = []
}
```

我们使用两个全局变量 `stateHookIndex` 和 `stateHooks` 在调用 `useState` 时去存储新生成的 `stateHook` 以及获取旧的 `stateHook` (注意每次调用函数组件时，会重置这两个变量)

> 这也是为什么 `react` 中的 `hook` 函数必须在函数的最顶层，如果在分支内如 `if` 分支中，就可能导致前后二次渲染，新旧 `stateHook` 不对应

另外 `setState` 还可以传入值，我们可以做个简单的处理即可：

```js
function setState(action) {
  action = typeof action === 'function' ? action : () => action
  // ...
}
```

## `useEffect` 的实现

### callback 的调用

`useEffect` 的大体实现跟 `useStae` 大体类似，也是利用一个全局变量将当前函数组件中所有 `useEffect` 收集起来：

```js
function useEffect(callback, deps) {
  const currentFiber = wipFiber

  // 收集
  effectHooks.push({
    callback,
    deps,
  })

  currentFiber.effectHooks = effectHooks
}

function updateFunctionComponent(fiber) {
  wipFiber = fiber

  // ...
  const children = [fiber.type(fiber.props)]

  stateHookIndex = 0
  stateHooks = []
  effectHooks = []
}
```

然后我们在提交后，去处理这些 `effect`：

```js
function run(fiber) {
  const effectHooks = fiber.effectHooks

  if (!fiber.alternate) {
    // 没有旧的对应节点，即表示第一次，无脑调用
    effectHooks.forEach((hook) => {
      hook.callback()
    })
  }
  else {
    // 有对应旧节点
    const oldEffectHooks = fiber.alternate.effectHooks
    effectHooks.forEach((hook, index) => {
      const oldHook = oldEffectHooks[index]
      const needUpdate = hook.deps.some((val, i) => val !== oldHook.deps[i])
      if (needUpdate)
        hook.callback()
    })
  }

  // 递归调用
  run(fiber.child)
  run(fiber.sibling)
}
```

这里我们在处理 `effect` 时，通过 `fiber.alternate` 来判断是否为第一初始化，是的话直接调用对应的回调即可！

而不是的话，就比较复杂了，我们知道 `useEffect` 的回调除了初始化之外，在其 `deps` 上任意值发生变化，也会调用，因此这里我们首先拿到对应旧的 `oldEffectHooks`，然后以此去比较每一对新旧 `effect` 的 `deps` 数组，**一一查看每个位置是否发生变化 (因为每次函数调用 `useEffect` 都会传入全新的 `deps` 数组，因此新旧 `deps` 有变化即表明需要更新)**，调用 `hook.callback`

### clean 函数的实现

clean 函数的实现逻辑基本类似，只是它应该是在 `effect` 的 `callback` 调用前去执行

首先我们需要收集好 `callback` 返回的函数，以便下一次需要清除时调用：

```diff
function run(fiber) {
  const effectHooks = fiber.effectHooks

  if (!fiber.alternate) {
    // 没有旧的对应节点，即表示第一次，无脑调用
    effectHooks.forEach((hook) => {
-      hook.callback()
+      hook.cleanup = hook.callback()
    })
  }
  else {
    // 有对应旧节点
    const oldEffectHooks = fiber.alternate.effectHooks
    effectHooks.forEach((hook, index) => {
      const oldHook = oldEffectHooks[index]
      const needUpdate = hook.deps.some((val, i) => val !== oldHook.deps[i])
      if (needUpdate)
-        hook.callback()
+        hook.cleanup = hook.callback()
+     else
+        hook.cleanup = oldHook.cleanup
    })
  }

  // 递归调用
  run(fiber.child)
  run(fiber.sibling)
}
```

> 这里有个特别注意的点就是，不需要更新调用 `callback`，要存储旧 `hook` 的清除函数，否则下次要执行清除函数时，旧 `hook` 上就没有清除函数了

然后我们去执行清除函数

```js
function runCleanup(fiber) {
  const oldEffectHooks = fiber.alternate?.effectHooks || []
  const effectHooks = fiber.effectHooks || []
  oldEffectHooks.forEach((hook, index) => {
    const newHook = effectHooks[index]
    const needUpdate = hook.deps.some((val, i) => val !== newHook.deps[i])
    // 有更新才需要去调用 cleanup
    if (needUpdate)
      hook.cleanup?.()
  })

  runCleanup(fiber.child)
  runCleanup(fiber.sibling)
}
```

同理跟上面的实现类似，我们去判断新旧的 `deps` 是否发现变化，有的话，从旧的 `hook` 中拿出 `cleanup` 函数来执行

## 总结

本文仅总结一下个人在学习 `react` 中，一些个人认为比较关键的点，代码上没做一些边界条件的考虑，如有纰漏，欢迎评论指正
