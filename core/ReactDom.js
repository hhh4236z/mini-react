import { render } from './react.js'

const ReactDOM = {
  createRoot(container) {
    return {
      render(App) {
        render(App, container)
      },
    }
  },
}

export default ReactDOM
