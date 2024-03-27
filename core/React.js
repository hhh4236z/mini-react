const TEXT_ELEMENT = 'TEXT ELEMENT'

let nextWorkOfUnit = null
// work in progress
let wipRoot = null
// 记录旧的节点
let currentRoot = null

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
  wipRoot = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    alternate: currentRoot,
  }

  nextWorkOfUnit = wipRoot
  requestIdleCallback(loop)
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
      dom[key] = newProps[key]
    }
  })
}

function reconcileChildren(fiber, children) {
  // 处理子节点
  let prevFiber = null
  // 拿出旧的对应fiber
  // 第一个要比较的显然就是旧的fiber的child
  let oldFiber = fiber.alternate?.child
  children.forEach((child, index) => {
    let newFiber

    const isSameType = oldFiber?.type === child.type

    if (isSameType) {
      // 相同type，那就只是更新，不用挂载了
      newFiber = {
        type: child.type,
        props: child.props,
        parent: fiber,
        // 还是原来的 dom，不需要更新
        dom: oldFiber.dom,
        sibiling: null,
        child: null,
        // 记录上对应的旧节点
        alternate: oldFiber,
        effectTag: 'update',
      }
    }
    else {
      newFiber = {
        type: child.type,
        props: child.props,
        parent: fiber,
        dom: null,
        sibiling: null,
        child: null,
        // 记录上对应的旧节点
        alternate: oldFiber,
        effectTag: 'placement',
      }
    }

    if (index === 0) {
      // 第一个儿子，
      fiber.child = newFiber
    }
    else {
      // 兄弟节点形成链表
      prevFiber.sibiling = newFiber
    }

    prevFiber = newFiber

    // 旧节点对应更新
    oldFiber = oldFiber?.sibiling
  })
}

function updateFunctionComponent(fiber) {
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
  if (fiber.sibiling)
    return fiber.sibiling

  // 找父亲的兄弟
  // 父亲的兄弟没有，就找爷爷的兄弟
  let parent = fiber.parent
  while (parent) {
    if (parent.sibiling)
      return parent.sibiling
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
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextWorkOfUnit && wipRoot) {
    // 没有下一个 fiber 了，说明递归结束了，可以提交了
    // 统一挂载，避免有些任务先挂载显示了，然后后续的没有空闲时间，等会就才挂载
    commitRoot()
    // 保存好旧的节点
    currentRoot = wipRoot
    wipRoot = null
  }
  requestIdleCallback(loop)
}

function commitRoot() {
  // 根的 dom已经是挂载的
  commitFiber(wipRoot.child)
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
  commitFiber(fiber.sibiling)
}

const React = {
  render,
  update,
  createElement,
}

export default React
