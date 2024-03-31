const TEXT_ELEMENT = 'TEXT ELEMENT'

let nextWorkOfUnit = null
// work in progress
let wipRoot = null
// 记录旧的节点
let currentRoot = null
// 记录中途局部更新的
let wipFiber = null
// 要删除的
const deletions = []

// hook 存储
let stateHooks = []
// function 内按顺序取 stateHook
let stateHookIndex = 0
// 收集effect
let effectHooks = []

function render(node, container) {
  wipRoot = {
    dom: container,
    props: {
      // 这样 parent.dom 就能找到 container 来挂载
      children: [node],
    },
  }

  nextWorkOfUnit = wipRoot
  requestIdleCallback(loop)
}

function update() {
  // 记录当前的
  const currentFiber = wipFiber

  return () => {
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    }

    nextWorkOfUnit = wipRoot
    requestIdleCallback(loop)
  }
}

function createTextElement(text) {
  return {
    type: TEXT_ELEMENT,
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        const isTextNode = typeof child === 'string' || typeof child === 'number'
        if (isTextNode)
          return createTextElement(child)
        return child
      }),
    },
  }
}

function createDom(type) {
  return type === TEXT_ELEMENT
    ? document.createTextNode('')
    : document.createElement(type)
}

function updateProps(dom, newProps, oldProps = {}) {
  // 1. 旧的节点有，新的没有，删除即可
  Object.keys(oldProps).forEach((key) => {
    if (key !== 'children') {
      if (!(key in newProps))
        dom.removeAttribute(key)
    }
  })

  // 2. 新的节点与旧节点有差异

  Object.keys(newProps).forEach((key) => {
    if ((newProps[key] === oldProps[key])) {
      // 不变的话，就跳过即可！
      return
    }
    if (key.startsWith('on')) {
      const eventType = key.slice(2).toLowerCase()
      // 卸载旧的
      dom.removeEventListener(eventType, oldProps[key])

      dom.addEventListener(eventType, newProps[key])
    }
    else if (key !== 'children') {
      // 更新
      if (shouldSetAsProps(dom, key, newProps[key]))
        dom[key] = newProps[key]
      else
        dom.setAttribute(key, newProps[key])
    }
  })
}

function reconcileChildren(fiber, children) {
  // 处理子节点
  let prevFiber = null
  // 拿出旧的对应fiber
  // 第一个要比较的显然就是旧的fiber的child
  let oldFiber = fiber.alternate?.child

  // TODO: 如果 children 内的 child是一个数组，怎么做，包一层 fragment 应该把？
  // 这里先直接flat
  children = children.flat()

  children.forEach((child, index) => {
    let newFiber

    const isSameType = oldFiber && oldFiber.type === child.type

    if (isSameType) {
      // 相同type，那就只是更新，不用挂载了
      newFiber = {
        type: child.type,
        props: child.props,
        parent: fiber,
        // 还是原来的 dom，不需要更新
        dom: oldFiber.dom,
        sibling: null,
        child: null,
        // 记录上对应的旧节点
        alternate: oldFiber,
        effectTag: 'update',
      }
    }
    else {
      // 可能是空节点，要忽略掉
      if (child) {
        newFiber = {
          type: child.type,
          props: child.props,
          parent: fiber,
          dom: null,
          sibling: null,
          child: null,
          effectTag: 'placement',
          // 新节点，旧不需要 alternate 指向了 （简易版
        }
      }

      // 不一样，旧的要删除
      if (oldFiber)
        deletions.push(oldFiber)
    }

    // 考虑如果第一个节点是 false，因此不能用 index === 0来判断
    if (index === 0 || !prevFiber) {
      // 第一个儿子，
      fiber.child = newFiber
    }
    else {
      // 兄弟节点形成链表
      prevFiber.sibling = newFiber
    }

    // 确保有，才更新为上一个节点
    if (newFiber)
      prevFiber = newFiber

    // 旧节点对应更新
    oldFiber = oldFiber?.sibling
  })

  // 新的比旧的短
  // 剩余的旧的全删掉
  while (oldFiber) {
    deletions.push(oldFiber)
    oldFiber = oldFiber.sibling
  }
}

function updateFunctionComponent(fiber) {
  // 记录更新的 function
  wipFiber = fiber

  // 函数更新了，stateHook重新赋值
  stateHooks = []
  stateHookIndex = 0
  effectHooks = []

  // fiber.type 即为函数式组件的函数，传入props
  const children = [fiber.type(fiber.props)]

  reconcileChildren(fiber, children)
}

function updateHoistComponent(fiber) {
  if (!fiber.dom) {
    // 判断一下，如果是根节点挂载的化，dom已经是有的了
    const el = (fiber.dom = createDom(fiber.type))

    updateProps(el, fiber.props)
  }
  reconcileChildren(fiber, fiber.props.children)
}

// 处理单个任务
function performUnitWork(fiber) {
  const isFunctionComponent = typeof fiber.type === 'function'

  if (isFunctionComponent)
    updateFunctionComponent(fiber)
  else
    updateHoistComponent(fiber)

  // 第一个child
  if (fiber.child)
    return fiber.child

  // 找兄弟
  if (fiber.sibling)
    return fiber.sibling

  // 找父亲的兄弟
  // 父亲的兄弟没有，就找爷爷的兄弟
  let parent = fiber.parent
  while (parent) {
    if (parent.sibling)
      return parent.sibling
    parent = parent.parent
  }
}

/**
 *
 * @param {IdleDeadline} deadline
 */
function loop(deadline) {
  let shouldYield = false

  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performUnitWork(nextWorkOfUnit)

    // 更新到当前更新根节点的兄弟节点时，就没必要更新了
    if (wipRoot?.sibling?.type === nextWorkOfUnit?.type)
      nextWorkOfUnit = undefined

    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextWorkOfUnit && wipRoot) {
    deletions.forEach(deleteFiber)
    deletions.length = 0
    // 没有下一个 fiber 了，说明递归结束了，可以提交了
    // 统一挂载，避免有些任务先挂载显示了，然后后续的没有空闲时间，等会就才挂载
    commitRoot()
    // 挂载后，执行effect
    commitEffects()
    // 保存好旧的节点
    currentRoot = wipRoot
    wipRoot = null
  }
  requestIdleCallback(loop)
}

function commitEffects() {
  function run(fiber) {
    if (!fiber)
      return
    const effectHooks = fiber.effectHooks || []

    if (!fiber.alternate) {
      // 没有旧的对应fiber, 说明时第一次，初始化，那直接调用
      effectHooks.forEach((hook) => {
        hook.cleanup = hook.callback()
      })
    }
    else {
      // 去判断旧的和新的 dep有无变化
      const oldEffectHooks = fiber.alternate.effectHooks || []

      effectHooks.forEach((hook, index) => {
        const oldHook = oldEffectHooks[index]
        // 新旧的 dpes 上有某个位置的值不同，说明 deps 更新了
        // HI: 秒呀！没做前一直在想一个纯原始值怎么检测对比更新？原来这么自然而然，以为每次函数调用，都会传入新的 deps进来，
        // 和旧的以此比较就行了！太秒了
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
}

function commitRoot() {
  // 根的 dom已经是挂载的
  commitFiber(wipRoot.child)
}

function deleteFiber(fiber) {
  // 删除fiber
  if (fiber.dom) {
    // function 节点是没有dom的，因此要向上找
    let parentFiber = fiber.parent
    while (!parentFiber.dom)
      parentFiber = parentFiber.parent
    parentFiber.dom.removeChild(fiber.dom)
  }
  else {
    // function component, 删除其子节点
    deleteFiber(fiber.child)
  }
}

function commitFiber(fiber) {
  if (!fiber)
    return

  // function 节点是没有dom的，因此要向上找
  let parentFiber = fiber.parent
  while (!parentFiber.dom)
    parentFiber = parentFiber.parent

  if (fiber.dom) {
    if (fiber.effectTag === 'update')
      updateProps(fiber.dom, fiber.props, fiber.alternate.props)
    else if (fiber.effectTag === 'placement')
      parentFiber.dom.append(fiber.dom)
  }

  commitFiber(fiber.child)
  commitFiber(fiber.sibling)
}

function shouldSetAsProps(el, key, _value) {
  // 特殊情况，input.form是只读的，只能通过 setAttribute设置
  if (key === 'form' && el.tagName === 'INPUT')
    return false
  return key in el
}

function useState(initial) {
  const currentFiber = wipFiber

  // 取到上一个存储的state
  const oldStateHook = wipFiber.alternate?.stateHooks?.[stateHookIndex]
  stateHookIndex++

  const stateHook = {
    value: oldStateHook ? oldStateHook.value : initial,
    // 所有 setState的执行，收集起来，等下次useState调用，再批量处理
    queue: oldStateHook ? oldStateHook.queue : [],
  }

  stateHook.queue.forEach((action) => {
    // 更新，方便下一次更新的时候，从 alternate 中的stateHooks获取到
    stateHook.value = action(stateHook.value)
  })

  stateHook.queue = []

  stateHooks.push(stateHook)
  // 保存起来
  currentFiber.stateHooks = stateHooks

  function setState(action) {
    const normalAction = typeof action === 'function' ? action : () => action

    // 这里先调用了1次，后面收集又调用了1，导致调用两次
    const eager = normalAction(stateHook.value)

    // 更新后的值不变，就没必要更新
    // 但是每次先执行 action，那queue 有什么意义？
    if (eager === stateHook.value)
      return

    // 直接赋值，没必要调用2次
    stateHook.value = eager
    // 收集 action
    // 归一化 直接传参的写法
    // stateHook.queue.push(normalAction)

    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    }

    nextWorkOfUnit = wipRoot
    requestIdleCallback(loop)
  }

  return [stateHook.value, setState]
}

function useEffect(callback, deps) {
  const currentFiber = wipFiber

  // 收集
  effectHooks.push({
    callback,
    deps,
  })

  currentFiber.effectHooks = effectHooks
}

const React = {
  render,
  update,
  createElement,
  useState,
  useEffect,
}

export default React
