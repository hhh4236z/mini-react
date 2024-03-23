const TEXT_ELEMENT = 'TEXT ELEMENT'

function render(node, container) {
  const el = node.type === TEXT_ELEMENT
    ? document.createTextNode('')
    : document.createElement(node.type)

  Object.keys(node.props).forEach((key) => {
    if (key !== 'children')
      el[key] = node.props[key]
  })

  node.props.children.forEach((child) => {
    render(child, el)
  })

  container.append(el)
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

const React = {
  render,
  createElement,
}

export default React
