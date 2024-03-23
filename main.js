import { createElement } from './core/react.js'
import ReactDOM from './core/ReactDom.js'

const App = createElement('div', { id: 'app' }, 'hello', '-', 'world')

ReactDOM.createRoot(document.getElementById('root')).render(App)
