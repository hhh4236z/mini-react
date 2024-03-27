import React from './core/React.js'

function Counter({ num }) {
  function handleClick() {
    console.log('click')
  }
  return (<div>This is {num}
    <button onClick={handleClick}>click</button>  
  </div>);
}

function App() {
  return (
  <div>
    hello
    <Counter num={10}/>
    <Counter num={20}/>
  </div>    
  )
}

export default App