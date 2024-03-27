import React from './core/React.js'

let count = 10
let props = {
  id: 1234
}
function Counter({ num }) {
  function handleClick() {
    console.log('click')
    count++
    props = {}
    React.update()
  }
  return (<div>This is {count}
    <button onClick={handleClick}>click</button>
    <input type="text" form={count}/>
  </div>);
}

function App() {
  return (
  <div {...props}>
    <Counter />
  </div>    
  )
}

export default App