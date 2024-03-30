# day7 useEffect

## 实现 `useEffect` 主要在于把握执行回调函数的时机

类似 `useState`，我们将每次调用得到的 `callback` 和 `deps` 存起来放到 fiber 上

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
```

然后我们在 `commitRoot` 函数调用后，去递归调用所有收集的 `effect`

```js
function commitEffects() {
  function run(fiber) {
    if (!fiber)
      return

    const effectHooks = fiber.effectHooks || []

    if (!fiber.alternate) {
      effectHooks.forEach((hook) => {
        hook.cleanup = hook.callback()
      })
    }
    else {
      const oldEffectHooks = fiber.alternate.effectHooks || []

      effectHooks.forEach((hook, index) => {
        const oldHook = oldEffectHooks[index]
        // 与旧的deps比较
        const needUpdate = hook.deps.some((val, i) => val !== oldHook.deps[i])
        if (needUpdate)
          hook.cleanup = hook.callback()
        // 没更新，把旧的clean 函数拿过来存
        else
          hook.cleanup = oldHook.cleanup
      })
    }

    run(fiber.child)
    run(fiber.sibling)
  }

  run(wipRoot)
}
```

如上我们以此去递归每个 `fiber` 来去查看你它存的 effect，这里分两种情况：

1. 组件第一次初始化，这时候无条件调用 (这里我们使用 `!fiber.alternate` 来判断，**没有旧的对应 fiber 自然就是初始化了**)
2. 第二种比较复杂了，需要和旧的 deps 比较，判断依赖的值是否变化，然后再进行调用

## cleanup 的调用时机

注意 `useEffect` 传入的 callback 是可以返回一个 `cleanup` 函数，方便再下一个调用 effect 前去调用清空

因此注意看上诉代码中，我们使用 `hook.cleanup` 收集当前 callback 的返回值，然后再下一次 `run` 前去调用所有旧的 cleanup

> 注意一点是：不需要更新的 callbcak，需要把旧的 oldHook 的 cleanup 赋值给当前新的 hook，不然后续之前的 cleanup 就找不到了

然后类似 `run`，我们写一个调用 cleanup 的函数 `hrunCleanup`

```js
function runCleanup(fiber) {
  if (!fiber)
    return

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

runCleanup(wipRoot)
run(wipRoot)
```

同理也是需要判断前后 `deps` 的依赖项是否发生变化再做更新
