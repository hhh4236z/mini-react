const TEXT_ELEMENT = 'TEXT ELEMENT'

// 调度
let nextFiber = null
// 统一提交
let root = null

function render(node, container) {
  // 构造一个根节点的fiber
  nextFiber = {
    dom: container,
    props: {
      // 这样 parent.dom 就能找到 container 来挂载
      children: [node],
    },
  }

  root = nextFiber
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

function updateProps(dom, props) {
  Object.keys(props).forEach((key) => {
    if (key.startsWith('on')) {
      const eventType = key.slice(2).toLowerCase()
      dom.addEventListener(eventType, props[key])
    }
    else if (key !== 'children') {
      dom[key] = props[key]
    }
  })
}

function initChildren(fiber, children) {
  // 处理子节点
  let prevFiber = null
  children.forEach((child, index) => {
    // 构造一个，而不是直接在 child本身添加
    // child 是一个 vdom
    const newFiber = {
      type: child.type,
      props: child.props,
      parent: fiber,
      dom: null,
      sibiling: null,
      child: null,
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
  })
}

function updateFunctionComponent(fiber) {
  // fiber.type 即为函数式组件的函数，传入props
  const children = [fiber.type(fiber.props)]
  initChildren(fiber, children)
}

function updateHoistComponent(fiber) {
  if (!fiber.dom) {
    // 判断一下，如果是根节点挂载的化，dom已经是有的了
    const el = (fiber.dom = createDom(fiber.type))

    updateProps(el, fiber.props)
  }
  initChildren(fiber, fiber.props.children)
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

  while (!shouldYield && nextFiber) {
    nextFiber = performUnitWork(nextFiber)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextFiber && root) {
    // 没有下一个 fiber 了，说明递归结束了，可以提交了
    // 统一挂载，避免有些任务先挂载显示了，然后后续的没有空闲时间，等会就才挂载
    commitRoot()
    root = null
  }
  requestIdleCallback(loop)
}

function commitRoot() {
  // 根的 dom已经是挂载的
  commitFiber(root.child)
}

function commitFiber(fiber) {
  if (!fiber)
    return

  // function 节点是没有dom的，因此要向上找
  let parentFiber = fiber.parent
  while (!parentFiber.dom)
    parentFiber = parentFiber.parent

  if (fiber.dom)
    parentFiber.dom.append(fiber.dom)

  commitFiber(fiber.child)
  commitFiber(fiber.sibiling)
}

const React = {
  render,
  createElement,
}

export default React
