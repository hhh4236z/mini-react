import React from './core/React.js'

let barCount = 1
let fooCount = 1
let appCount = 1
function Bar() {
  console.log('bar run')
  // updateFunctionComponent 内记录 当前组件的 fiber
  // 同时调用组件的方法，即 Bar()
  // 则 React.update() 会被调用时，则update 是一个闭包，内部变量指向当前的组件fiber
  const update = React.update()
  function handleClick() {
    barCount++
    update()
  }
  return (
    <div>
      <h2>bar</h2>
      <p>
        <button onClick={handleClick}>bar {barCount}</button>
      </p>
    </div>
  )
}

function Foo() {
  console.log('foo run')
  const update = React.update()
  function handleClick() {
    fooCount++
    update()
  }
  return (
    <div>
      <h2>
        foo
      </h2>
      <p>
        <button onClick={handleClick}>foo {fooCount}</button>
      </p>
    </div>
  )
}


function App() {
  console.log('app run')
  const update = React.update()
  function handleClick() {
    appCount++
    update()
  }
  return (
    <div>
      <h1>app</h1>
      <div>
        <button onClick={handleClick}>app {appCount}</button>
      </div>
      <Foo />
      <Bar />
    </div>
  )
}

export default App