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
  return (
  <div>
    <Counter />
    { show ? <p>hello</p> : 'xixi'}
  </div>    
  )
}

export default App