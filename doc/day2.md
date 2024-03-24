接前一天的问题，渲染时直接递归处理所有节点可能导致卡顿，因此采用分片的形式，即等浏览器空闲时处理一部分，我们可以使用 `requestIdleCallback` 这个 api

大致拆分思路如下：

1. 用一个 `performUnitWork` 来处理一个节点：
   1. 检查生成对应的 dom 元素
   2. props 处理
   3. 子节点处理
      1. 父子节点的联系 (父与第一个子节点联系即可)
      2. 兄弟节点的来呢西 (子节点按顺序，链表)
   4. 返回下一个要处理的节点
      1. 检查是否有子节点
      2. 检查兄弟节点
      3. 检查父节点的兄弟节点
2. 空闲回调函数
  1. 判断是否有空闲
  2. `performUnitWork` 处理后拿到返回的节点，继续处理

---

假设一直浏览器没空闲，导致用户等会就后面的节点才出来，如何处理？

1. 定义一个值来表达连续几次没有做任何节点的处理，达到某个值时，给 `requestIdleCallback` 传入 [`option`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback#options) 来强制调用，并做处理
