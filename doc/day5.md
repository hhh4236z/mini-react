# day5

## 节点的更新删除

在新旧节点的对比时，如果 type 不一样，则需要将旧的节点给删除，我们可以收集起来，在提交的时候先进行删除

新节点遍历结束后，将过去旧的未比较的节点页收集来删除

## 边界条件

我们经常使用如下表达式：

```jsx
function App() {
  return (show & <p>hello world</p>)
}
```

这时候会得到一个 `false` 的节点，因此在处理的时候，我们要跳过这个节点：

```js
if (child) {
  newFiber = {
    type: child.type,
  }
}

if (newFiber)
  prevFiber = newFiber
```

但是这里有个问题，如果 `false` 是第一个节点，那么下面这行代码旧有问题了，更新时就无法更新该 fiber 的儿子了，child 为 null 了

```js
if (index === 0)
  fiber.child = newFiber
```

所以我们可以改成如下，找到第一个 child 为止

```js
if (!fiber.child)
  fiber.child = newFiber
```

然后同步改动 `update`，避免上一次 fiber 的 child 已经存在影响逻辑

```js
function update() {
  // 记录当前的
  const currentFiber = wipFiber

  return () => {
    wipRoot = {
      ...currentFiber,
      // reconcileChildren时重新收集 child
      child: null,
      alternate: currentFiber,
    }

    nextWorkOfUnit = wipRoot
    requestIdleCallback(loop)
  }
}
```
