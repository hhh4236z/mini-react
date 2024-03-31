import React from './core/React'

const filters = [
  'all',
  'done',
  'undo'
]

function getTodos() {
  const saved = localStorage.getItem(KEY_TODOS)
  if (saved) {
    return JSON.parse(saved)
  }
  return []
}

const KEY_TODOS = '__key__todo__'
const KEY_TODOS_FILTER = '__key__todo__filter__'
export default function App() {
  const [msg, setMsg] = React.useState('')
  const [todos, setTodos] = React.useState(getTodos())
  const [filter, setFilter] = React.useState(localStorage.getItem(KEY_TODOS_FILTER) || 'all')
  const filterTotos = todos.filter((todo) => {
    if (filter === 'all') return true
    if (filter === 'done') return todo.done
    return !todo.done
  })

  function handleAdd() {
    if (!msg) return

    setTodos(todo => ([
      ...todo,
      {
        done: false,
        value: msg
      }
    ]))

    setMsg('')
  }

  function handleInputKeyup(e) {
    if (e.code === 'Enter') {
      handleAdd()
    }
  }

  function handleFilter(e) {
    setFilter(e.target.value)
  }

  function toggleTodo(todo) {
    setTodos((todos) => {
      const newTodos = [...todos]
      todo.done = !todo.done
      return newTodos
    })
  }
  
  function handleRemove(todo) {
    setTodos((todos) => todos.filter(_todo => _todo.value === todo.value))
  }

  function handleSave() {
    localStorage.setItem(KEY_TODOS, JSON.stringify(todos))
    localStorage.setItem(KEY_TODOS_FILTER, filter)
  }

  return (
    <div>
      <div>
        <input type="text" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyUp={handleInputKeyup}/>
        <button onClick={handleAdd}>add</button>
      </div>
      <button onClick={handleSave}>save</button>
      <div id='filter-container'>
        {
          filters.map((key) => (
            <span>
              <input type="radio" name='filter' id={key} value={key} onChange={handleFilter} checked={filter === key}/>
              <label for={key}>{key}</label>
            </span>
          ))
        }
      </div>
      <ul>
        {
          filterTotos.map((todo) => (
            <li>
              <span className={todo.done ? 'item-done' : 'item-normal'}>{todo.value}</span>
              <button onClick={() => toggleTodo(todo, !todo.done)}>{ todo.done ? 'cancel' : 'complete' }</button>
              <button onClick={() => handleRemove(todo)}>remove</button>
            </li>
          ))
        }
      </ul>
    </div>
  )
}