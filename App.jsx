import React from './core/React.js'

let show = false

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
  function handleClick() {
    show = !show
    React.update()
  }
  return (
    <div>
      <p>hello world</p>
      { show && <h2>xixi</h2>} 
      <button onClick={handleClick}>show</button>
    </div>
  )
}

export default App