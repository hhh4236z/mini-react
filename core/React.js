const TEXT_ELEMENT = 'TEXT ELEMENT'

// 调度
let nextFiber = null

function render(node, container) {
  // 构造一个根节点的fiber
  nextFiber = {
    dom: container,
    props: {
      // 这样 parent.dom 就能找到 container 来挂载
      children: [node],
    },
  }

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
        if (typeof child === 'string')
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
    if (key !== 'children')
      dom[key] = props[key]
  })
}

function initChildren(fiber) {
  // 处理子节点
  let prevFiber = null
  const children = fiber.props.children
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

// 处理单个任务
function performUnitWork(fiber) {
  if (!fiber.dom) {
    // 判断一下，如果是根节点挂载的化，dom已经是有的了
    const el = (fiber.dom = createDom(fiber.type))

    // 找到父节点的dom来挂载
    fiber.parent.dom.append(el)

    updateProps(el, fiber.props)
  }

  initChildren(fiber)

  // 第一个child
  if (fiber.child)
    return fiber.child

  // 找兄弟
  if (fiber.sibiling)
    return fiber.sibiling

  // 找父亲的兄弟
  if (fiber.parent?.sibiling)
    return fiber.parent.sibiling
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
}
requestIdleCallback(loop)

const React = {
  render,
  createElement,
}

export default React
