## moserver
> 本来用名mock-server发现被用了，果断改名moserver

这是一个local static server；其实一直用[F5](http://getf5.com)，mac下面启动啥的不太稳定，看官方建了好久的node-f5一直没写，然后结合现在想用的功能写了个

* 支持livereload
* mock文件自动输出，模拟接口数据
* 支持回调，这样方便数据处理
* 反向代理，调试代码更方便

### 使用
```bash
npm i -g moserver
ms 
# ms -h
```

### 访问配置页面
http://localhost:端口号/_/

### mockjs支持
将mockjs格式的文件命名为`.mock`会自动编译

### 数据处理
要处理的文件同名放个`xxx.ms`，格式参考node module格式，实例如下：
```js
module.exports = function (data, q, $) {
  //data是文件内容，q是query，$是cheerio 可以$.load(data)之后类似jquery方式处理页面数据
  var cb = q.callback;
  if (cb) {
    return cb + '(' + data + ')';
  }
  return data;
}

```
