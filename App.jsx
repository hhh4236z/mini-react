import React from './core/React.js'

function Counter({ num }) {
  return <div>This is {num}</div>

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