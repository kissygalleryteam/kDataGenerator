/**
 * @fileoverview 
 * @author mingzheng<polazeyu@qq.com>
 * @module kDataGenerator
 **/
KISSY.add('gallery/kDataGenerator/1.0/index',function (S, regexpParser) {

    //迁移为 kissy 模块 的兼容
    var JSON= KISSY.JSON;

   // var regexpParser=require('./regexp-parser.js');

    /*
     格式化部分的变量
     */
    var EXP_KEY_PREFIX = "DataGenerator_EXP_KEY";

    var controlerMap = {};
    var regExpMap = {},
        regExpCount = 0;

    /*
     取controler的正则
     */
    var controlerRegExp = /\(([^:\(\)]*)\)[,\}]|\(([^:\(\)]*)\)$/;
    /*,
     regExpStringRegExp=/:\/(([^\/]*|[]))\//;*/



// 暂时只有一种 controler，所以这个还用不到
    /*
     var controlerHandlers={
     repeatCount:repeatCountHandler
     };
     */


    /**
     * 根据 format 生成的 json 渲染数据
     * @param dataObj
     * @returns {*} 我们所需要的 json 数据
     */
    function renderData(dataObj){
        /*console.log(renderItem(dataObj));*/
        return renderItem(dataObj);
    }


    function controlerHandle(controler,dataItem,renderer){
        var dataResult,repeatCount;
        if(!controler){
            return renderer(dataItem);
        }


        // 由于只有一种 controler，默认写死
        repeatCount=controler['repeatCount'];
        if(repeatCount){
            dataResult=repeatCountHandler(repeatCount,dataItem,renderer);
        }

        return dataResult;
    }

    /**
     * 从量词获取数量
     * @desc 和正则类似,不过精简了，因为有些规则在匹配的时候有意义，在生成数据的时候确没意义
     *       有三种：
     *       ? 代表随机有或者没有
     *       x 个数精确为 x
     *       x-y 大于 x 小于 y 的一个随机数
     *       只有？会发返回Boolean
     * @param QuantifierStr
     * @return
     *        {Number} 返回结果为数组,即使是返回0,也是空数组 []
     *        {Boolean} 告诉repeatCountHandler,该量词用来表示该数据项的出现与否
     */
    function parseQuantifierStr(QuantifierStr){


        if(QuantifierStr == '?'){
            return (getRandom(1,10)>=6)?true:false;
        }
        var nums=QuantifierStr.split('-');
        if(nums.length===1){

            return nums[0];
        }else{
            return getRandom(nums[0],nums[1]);
        }
    }
    function getRandom(min,max){
        return parseInt(min)+Math.floor(Math.random()*(max-min));
    }

    function repeatCountHandler(QuantifierStr,dataItem,renderer){
        var repeatCount= parseQuantifierStr(QuantifierStr),result;

        //如果量词为 ? 的时候，实际上返回一个数据或者不返回数据
        if(typeof  repeatCount === 'boolean'){
            if(repeatCount){
                result= renderer(dataItem);
            }

            return result;
        }


        // 如果量词为 x 或者 x-y ，实际上会返回一个数租
        result=[];
        for(var i = 0;i<repeatCount;i++){
            result.push(renderer(dataItem));
        }

        return result;

    }
    function renderItem(item){
        var dataType=item['dataType'],
            controler=item['controler'],
            dataItem=item['dataItem'],
            dataResult;
        switch (dataType){
            case 'Object':
                dataResult= controlerHandle(controler,dataItem,renderObjectTypeDate);
                ;break;
            case 'RegExp':
                dataResult=controlerHandle(controler,dataItem,renderRegExpTypeDate);
                ;break;
            case 'Normal':
                dataResult=controlerHandle(controler,dataItem,renderNormalTypeDate);
                ;break;
        }
        return dataResult;

    }

    function renderObjectTypeDate(dataItem){
        var key,resultObj={};
        for(key in dataItem){
            resultObj[key]= renderItem(dataItem[key]);
        }
        return resultObj;
    }
    function renderRegExpTypeDate(dataItem){

        return regexpParser.parse(dataItem);

    }
    function renderNormalTypeDate(dataItem){
        return dataItem;
    }










    /*
     格式化 begin
     */

    /**
     *  格式化，按照规则编译成易于处理的 json ，便于后续使用
     * @param dataStr {
            "data":{
               "a":1(2)
            }(2),
            "regExp":/abc/(1),
            "num":1(3)
            }
     * @return {
*     data:{
*        dataItem:{
*           a:{
*               dataItem:1,
*               controler:{
*                   repeatCount:2
*               },
*               dataType:'Normal'
*           }
*        },
*        controler{
*            repeatCount:2
*        },
*        dataType:'Object'
*     },
*     regExp:{
*         dataItem:/abc/,
*         controler:{
*             repeatCount:1
*         },
*         dataType:'RegExp'
*     },
*     num:{
*         dataItem:1,
*         controler:{
*             repeatCount:2
*         }
*         dataType:'Normal'
*     }
* }
     */
    function format(dataStr) {
        var preprocessedDataStr = preprocess(dataStr);
        return formatObjectType(JSON.parse(preprocessedDataStr));
    }
    function formatObjectType(item, chain) {
        var type = getType(item), formatedObj, controler, key, dataItem = {};

        if (!chain) {
            chain = '';
        }

        controler = controlerMap[chain];
        dataItem = handleItem(item, type, chain);

        formatedObj = {
            'controler': controler,
            'dataItem': dataItem,
            'dataType': type
        };

        return formatedObj;
    }
    function handleObject(item, chain) {
        var key, dataItem = {}, childChain;

        for (key in item) {
            childChain = (chain == '') ? key : chain + '.' + key;
            dataItem[key] = formatObjectType(item[key], childChain);
        }
        return dataItem;
    }
    function handleRegExp(item) {
        return regExpMap[item];
    }

    function handleItem(item, type, chain) {
        var result;

        switch (type) {
            case 'Object':
                result = handleObject(item, chain);
                break;
            case 'RegExp':
                result = handleRegExp(item);
                break;
            case 'Normal':
                result = item;
                break;
        }

        return result;
    }

    function getType(item) {
        if (typeof item == 'object') {
            return 'Object';
        }

        if ((typeof item == 'string') && (item.indexOf(EXP_KEY_PREFIX) == 0)) {
            return 'RegExp';
        }

        return 'Normal';
    }


    /**
     * 预处理
     * @param dataStr
     * @returns {*}
     */
    function preprocess(dataStr) {
        var matchItem, key, controler, slicedStr;

        while (matchItem = controlerRegExp.exec(dataStr)) {
            slicedStr = dataStr.slice(0, matchItem.index);

            //在分离controler的过程中提取正则item比较适合，所以在这里使用 pickRegExpItemIfExist
            slicedStr = pickRegExpItemIfExist(slicedStr);
            key = findStructureChain(slicedStr);
            controler = parseControler(matchItem[1]||matchItem[2]);
            controlerMap[key] = controler;


            if(matchItem[2]){
                //匹配到第二子串的时候，会少了一个 } 或者 , 所以需要加1补偿回来
                dataStr = slicedStr + dataStr.slice(matchItem.index + matchItem[0].length, dataStr.length);
            }else{
                dataStr = slicedStr + dataStr.slice(matchItem.index + matchItem[0].length - 1, dataStr.length);
            }


        }

        return dataStr;

    }
    /*function pickControler(){

     }*/

    /**
     * 尝试抽取 正则类型数据
     * @param slicedStr
     * @returns {*}
     */
    function pickRegExpItemIfExist(slicedStr) {
        var char, i = slicedStr.length - 1, regExpStr = '', preChar;
        if (slicedStr.charAt(i) !== '/') {
            return slicedStr;
        }
        i--;
        while (1) {
            char = slicedStr.charAt(i);
            if (char == '/') {
                //todo 添加报错信息
                if (isEscapeEffect(slicedStr, i)) {
                    regExpStr = char + regExpStr;
                } else {
                    if (slicedStr.charAt(i - 1) == ':') {
                        /*
                         regExp字符串到此结束
                         */

                        break;

                    } else {
                        //todo 错误处理
                    }
                }
            } else {
                regExpStr = char + regExpStr;
            }
            i--;

        }
        //console.log('finish'+regExpItemHandle(slicedStr.slice(0,i),regExpStr));
        return regExpItemHandle(slicedStr.slice(0, i), regExpStr);


    }


    /**
     *   用来把regExpStr保存起来，并用一个key来代替它的位置
     *   如果原本为这样的一个串 "regExp":/abc/(1),
     * @param slicedStr  "regExp":
     * @param regExpStr     abd
     * @return "regExp":"DataGenerator_EXP_KEY001"
     * @desc 可以根据 "DataGenerator_EXP_KEY001" 去regExpMap里面取regExpStr
     */
    function regExpItemHandle(slicedStr, regExpStr) {
        return slicedStr + '"' + saveRegExpItem(regExpStr) + '"'
    }

    function saveRegExpItem(regExpStr) {
        var regExpKey = EXP_KEY_PREFIX + regExpCount++;
        regExpMap[regExpKey] = regExpStr;
        return regExpKey;
    }


    /**
     * 字符是否生效，前面是否有转义字符，转义字符的个数，奇数个则生效，偶数个不生效
     * @param str
     * @param index 字符的位置
     */
    function isEscapeEffect(str, index) {
        var count = 0, char, i = index;
        for (i--; i > -1; i--) {
            char = str.charAt(index);
            if (char !== '\\') {
                break;
            } else {
                count++;
            }
        }
        return (count % 2) == 1
    }


    /**
     * 控制器字符串解析 （每项数据后面 ‘（）’里的内容，暂时支持一种 【量词控制】）
     * @param controlerStr
     * @returns {{}}
     */
    function parseControler(controlerStr) {
        var items = controlerStr.split(','),
            controler = {};

        controler['repeatCount'] = items[0];
        return controler;

    }

    /**
     * 根据controler的位置，产生该controler的结构链，用于之后数据项和controler的对应
     * @param str 找到 controler 后根据其index切割完成的string
     * @return {String}
     * @desc  {
            "data":{
               "a":1
            注： 上面demo中 第一个controler 解析
            结果： data.a
            使用data.a 我们可以知道controler（2）所对应的数据项

            测试2: 输入 '{"wo":{"data":{"a":1},"name":{"index":1,"key":{"me":2'
                  输出  wo.name.key.me
 */
//TODO 转义字符支持
    function findStructureChain(str) {
        var resultString = '';
        var rightBraceCount = -1, char, pickStr = '', pickChar, prevChar, startFlag, endFlag;
        for (var i = str.length - 1; i > -1; i--) {
            char = str.charAt(i);
            switch (char) {
                case '}':
                    rightBraceCount++;
                    break;
                case '{':
                    rightBraceCount--;
                    break;
                case ':':
                    if (rightBraceCount < 0 && (str.charAt(--i) == '"')) {
                        startFlag = endFlag = i;
                        i--;

                        prevChar = str.charAt(i - 1);

                        while (!((pickChar = str.charAt(i)) == '"' && (prevChar == ',' || prevChar == '{')) && i > -1) {
                            //pickStr+=pickChar;
                            startFlag--;
                            i--;
                            prevChar = str.charAt(i - 1);
                        }

                        resultString = str.slice(startFlag, endFlag) + '.' + resultString;

                        pickStr = '';

                        /*
                         在记入一个key之后
                         */
                        rightBraceCount++;
                    }
                    ;
                    break;
            }
        }
        resultString = resultString.slice(0, resultString.length - 1);
        return resultString;
    }
    /*
     格式化 end
     */


    function getData(dataStr){
        return renderData(format(dataStr));
    }

    //exports.getData=getData

    return {

        // 编译+数据生成
        getData:getData,

        // 数据生成（根据编译后的结果）
        renderData:renderData,

        // 编译
        format:format
    };


   /* var a='{"wo":{"data":{"a":1},"name":{"index":1,"key":{"me":2';
    console.log(findStructureChain(a));*/




}, {requires:['./regexp-parser','json']});



