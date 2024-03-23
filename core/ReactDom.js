import React from './react.js'

const ReactDOM = {
  createRoot(container) {
    return {
      render(App) {
        React.render(App, container)
      },
    }
  },
}

export default ReactDOM
