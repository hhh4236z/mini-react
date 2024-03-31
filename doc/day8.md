# day 8

实现 TODO 应用，主要碰见几个问题：

- 使用 `todos.map(..)` 创建多节点，会出现子元素还是一个数组：

```js
function reconcileChildren(fiber, children) {
  // ...

  children.forEach((child, index) => {
    // child 可能是哥 数组
  })

  // ...
}
```

因此可以先将 `children` 给拍扁 (但好像不是好办法，另外看教程好像没有这个问题)

> 仔细看了下，这样是没错的，因为 `.map` 下去那就是个数组，所以写的时候用了 `...map去解构`

- useEffect 中调用了 `setState` 没有渲染出来

这是因为提交状态更新后，采取提交 effects，而 effects 中调用触发新的 state，但没有再次调用提交

因此我们可以再 `commitWork` 之后再去检测是否还有更新

```diff js
function loop() {
  // ...

  if (!nextWorkOfUnit && wipRoot) {
    deletions.forEach(deleteFiber)
    deletions.length = 0
    commitWork()

+   if (nextWorkOfUnit && !wipRoot) {
+     // useEffect 中可能会调用 setState, 导致需要再次提交
+     // 因为commitWork 中把 wipRoot 变为空了，而currentRoot 保存了下 wipRoot
+     // 但是这样子 不就 旧的和新的 是同一个了？
+     wipRoot = currentEffectRoot
    }
  }
}
```

做一个检查，因为 `setState` 内会去更新 `nextWorkOfUnit` 和 `wipRoot`

而 `commitRoot` 中会将 `wipRoot = null`，因此我们新建一个变量 `currentEffectRoot` 来存储提交 effect 后的 `wipRoot`

```diff js
function commitWork() {
  // 没有下一个 fiber 了，说明递归结束了，可以提交了
  // 统一挂载，避免有些任务先挂载显示了，然后后续的没有空闲时间，等会就才挂载
  commitRoot()
  // 保存好旧的节点
  currentRoot = wipRoot
  commitEffects()
+  // 挂载后，执行effect 可能会 调用 setState, 导致wipRoot更新
+  currentEffectRoot = wipRoot

  wipRoot = null
}
```
