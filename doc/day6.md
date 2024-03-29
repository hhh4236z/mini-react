# day6

## useState 的实现

首先拿到当前的 fiber，保存起来

内部初始化一个 stateHook 对象，他的 value 保存对应值 (即初始值)

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

然后 `setState` 内部取更新 `value`，触发更新：

```js
function setState(action) {
  stateHook.value = action(stateHook.value)

  wipFiber = {
    ...currentFiber,
    alternate: currrentFiber
  }

  requestIdleCallback(loop)
}
```

然后触发更新后，会重新调用到该 `useState`，但是这时候 `value` 还是 initial 就不对了，应该是上一次运行时创建的 `stateHook` 的 value

因此我们需要把每次 `useState` 中创建的 `stateHook` 存起来，我们可以做个全局变量

```js
// eslint-disable-next-line prefer-const
let stateHooks = []
// eslint-disable-next-line prefer-const
let stateHookIndex = 0
```

因为有多个 useState，所以用一个数组来存，然后按序号取，**这也是为什么 `useState` 只能再函数顶部**

然后我们在更新函数组件时，重置他们

```js
function updateFunctionComponent(fiber) {
  // ...
  stateHooks = []
  stateHookIndex = 0
}
```

然后在 `useState` 内去存储他们：

```js
function useState(initial) {
  const currentFiber = wipFiber
  // 3 尝试拿到 1 存起来的 stateHook
  const oldStateHook = currentFiber?.stateHooks?.[stateHookIndex]

  const stateHook = {
    // 4. 拿到 2 更新的值
    value: oldStateHook ? oldStatHook.value : initial
  }

  // 按执行顺序，放到数组里
  stateHooks.push(stateHook)

  // 1. 存好
  currentFiber.stateHooks = stateHooks

  function setState(action) {
    // 2. 更新好值
    stateHook.value = action(stateHook.value)

    // ... 开始更新
  }
}
```

## 批量 action 处理

我们没必要在 `setState` 内就做 action 的调用，可以在 `useState` 调用时，再将之前存起来的 `action` 全调用完

```diff
function useState(initial) {
  const currentFiber = wipFiber
  // 3 尝试拿到 1 存起来的 stateHook
  const oldStateHook = currentFiber?.stateHooks?.[stateHookIndex]

  const stateHook = {
    // 4. 拿到 2 更新的值
    value: oldStateHook ? oldStatHook.value : initial
+   queue: oldStateHook ? oldStatHook.queue : []
  }

+  stateHook.queue.forEach((action) => {
+   // 更新，方便下一次更新的时候，从 alternate 中的stateHooks获取到
+   stateHook.value = action(stateHook.value)
+  })
+ // 清空
+ stateHook.queue = []

  // 按执行顺序，放到数组里
  stateHooks.push(stateHook)

  // 1. 存好
  currentFiber.stateHooks = stateHooks

  function setState(action) {
    // 2. 更新好值
-   stateHook.value = action(stateHook.value)
+   stateHook.queue.push(action)

    // ... 开始更新
  }
}
```

当前这里的 `action` 只支持函数，我们可以做个判断，支持值得传入

```js
const normalAction = typeof action === 'function' ? action : () => action
```

## 优化更新

如果说更新后得值和原来的值不变，则没必要去更新了，因此我们可以先执行下 `action`

```js
function setState(action) {
  const eager = action(stateHook.value)

  if (eager === stateHook)
    return

  // ...更新
}
```

> 但其实这里不大明白，既然会提前执行 action 了，那批量的 action 有什么意义？
