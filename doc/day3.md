## 集中式提交

接昨天的问题，可能出现渲染了几个节点后，后续没有空闲时间，导致过了很多才渲染后面的节点，观感上
就不好？(见仁见智？)

因此采取一种集中式的提交 (或挂载) 即像之前那样再每个任务中去创建处理节点**但不进行挂载**，直到最后的处理完所有节点后，再递归去挂载所有节点，这样就用户一次性看到所有的节点了

---

## 函数式编程

如下的函数式组件：

```js
function App() {
  return (
    <div>hello </div>
  )
}
```

在编译时，会被编译成如下：

```js
const app = {
  type: () => {
    return React.createElement('div', null, 'hello ')
  },
  props: {
    children: []
  }
}
```

因此在处理节点的时候，要做判断去处理它：

```js
// is function compoennt
const children = fiber.type(fiber.props)
// todo
```

另外要注意的是函数节点是没有 dom 的，因此在挂载时要跳过，同时子元素在找父元素挂载时，要递归向上查找，跳过函数节点：

```js
let parentFiber = fiber.parent
while (!parentFiber.dom)
  parentFiber = parentFiber.parent

if (fiber.dom)
  parentFiber.dom.append(fiber.dom)
```
