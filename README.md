## 综述

**kDataGenerator** 是一个使用简单规则用于生成假数据的轻量级工具，实现的过程中更倾向于提供高自由度和易学易用。
它使用的规则是在 **json** 的基础上增加一点点 **规则** ，不过这些 **规则** 的十分简单，基本看过一眼便能了解。


* 版本：1.0
* 作者：mingzheng
* demo：[http://gallery.kissyui.com/kDataGenerator/1.0/demo/index.html](http://gallery.kissyui.com/kDataGenerator/1.0/demo/index.html)

## 使用方法

    S.use('gallery/kDataGenerator/1.0/index', function (S, KDataGenerator) {
         //注意正则转义字符
         var dataStr = '{"data":{"normalText":1(2-5)}(1-4),"regExp":/\\d{6,10}@(qq|taobao|wanyi)\\.com/(2-6),"num":1(5)}';
         
         KDataGenerator.getData(dataStr);
         // 或者
         KDataGenerator.renderData(KDataGenerator.format(dataStr));
    })

## 规则

###基本格式
使用的是一种类json的格式，不过有特别之处，比如支持regexp类型，有量词规则，不支持数组（因为不需要）

    {属性名:数据项(量词)}
**数据项** 和 **量词** 和普通对象字面量有所区别，其他的语法和普通的对象字面量一样
  
###数据项
支持的数据项有三种：
* normal(普通json数据项，也可以说是值类型)---- 【 *字符串或者数字等* 】
* regexp(基本的正则，产生符合正则的数据)---- 【 */字符串/* 】
* object(符合规则的对象，会递归解析)----   【 *{字符串：数据项}* 】

Q1:为什么没有 Array 类型？（请看【量词】）

###量词
* **(?)** 代表随机有或者没有
* **(x)** 个数精确为 x
* **(x-y)** 大于 x 小于 y的一个随机数

A1:添加了后两种规则都会返回数组（所以不需要 **Array** 类型）

Q2:为什么没有 ' ***** ' 量词？

A2:( **0-某个数** ),不过生成器没实现 **0** 到 **无穷大** 这个量词，因为这个对于生成数据来说没有意义

### 正则 regexp
暂时支持的正则符号：' **[** ', ' **]** ', ' **{** ', ' **}** ', ' **^** ', ' **-** ', ' **|** ', ' **.** ',' **?** ',' **\w** ', ' **\d** ', ' **\c** '

**\c** 为自定义的类型，输出中文字符，不过现在随机输出的中文含有很少见的文字，不美观

###其他
1. *量词* 位于数据项后面，比如{data:{}( **1-4** )}, **1-4** 为量词 
2. **regexp** 类型必须有量词（生成单个数据，使用 **regexp** 无意义）

## API说明(都是Class.Method)

###*KDataGenerator.getData(dataStr)*

编译+数据生成，返回一个 数据对象
    
###*KDataGenerator.format(dataStr)*

编译，返回中间数据格式，可重复使用 **renderData** 生成数据，免去解析的过程

###*KDataGenerator.renderData(parsedStr)*

根据中间数据格式产生目标数据
