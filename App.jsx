import React from './core/React.js'

let show = true

function Counter({ num }) {
  function handleClick() {
    show = !show
    React.update()
  }
  return (<div>
    <button onClick={handleClick}>click</button>
  </div>);
}

function App() {
  return (
    <div>
      {
        show ? <div>
          <span>1</span>
          <span>2</span>
          <span>3</span>
        </div> : <div>
          <span>1</span>
        </div>
      }
      <Counter />
    </div>
  )
}

export default App