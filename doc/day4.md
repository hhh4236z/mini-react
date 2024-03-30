# day4

## 事件绑定

1. 注册事件也是同 `props` 传下来，因此只需要在处理 `props` 的时候去判断是否为注册事件，然后进行事件的注册即可
2. 更新注册的时候，需要注意将旧的事件删除掉，避免每次更新都加一个新事件

## props 更新

1. 更新需要与旧的节点做比较，因此我们使用 `currentRoot` 在每次统一提交时保存旧的根节点，然后再次更新时，将新的根节点的 `alternate` 指向旧节点
2. 更新调和 `children` 时，即可从 `alternate.child` 拿到对应需要对比的第一个旧子节点，此后以此通过 `sibiling` 拿到后续的旧节点比较 (关键)
3. 新旧 `props` 的对比
   1. 是否有旧 `props` 删除
   2. 是否有 `props` 更新