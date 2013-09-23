
KISSY.add('gallery/kDataGenerator/1.0/regexp-parser',function (S) {

    var keychars = ['[', ']', '{', '}', '^', '-', '|', '.', '+', '?', '*', '\\'],
        metachars = ['\\w', '\\d', '\\c', /*'\\t', '\\n','\\u',*/ '.'],
        metacharsHandlerMap = {
            '.': 'getChar',
            '\\w': 'getWordChar',
            '\\d': 'getNumber',
            '\\c': 'getChineseChar'
        },
        metacharsMapping = {
            '\\n': '\u000d\u000a',
            '\\t': '\t'
        },
    esc = '\\';



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


    function parseRegExp(str) {
        var char, index, nodelist = [], currentNode, handler, orOperatoFlag = 0, orOperatorNode;
        for (var i = 0, len = str.length; i < len; i++) {
            char = str.charAt(i);
            switch (char) {

                case '|':
                    var nodelistLen = nodelist.length;
                    if (!orOperatorNode) {
                        orOperatorNode = new treeNode('orOperatorNodeHandler', []);
                    }

                    orOperatorNode.nodelist.push(new treeNode('plainNodeHandler', nodelist.slice(orOperatoFlag, nodelistLen)));
                    orOperatoFlag = nodelistLen;
                    break;
                case '.':
                    nodelist.push(new treeNode(metacharsHandlerMap['.']));
                    ;
                    break;
                case '\\':
                    char = str[i + 1];
                    if (keychars.indexOf(char) > 0) {
                        nodelist.push(char);
                        i++;
                        break;
                    }
                    char = '\\' + char;
                    if (metachars.indexOf(char) >= 0) {
                        handler = metacharsHandlerMap[char];
                        if (handler) {
                            nodelist.push(new treeNode(handler));
                        } else {
                            nodelist.push(metacharsMapping[char]);
                        }
                        i++;
                    } else {
                        //todo 报错
                    }

                    ;
                    break;
                case '[':
                    if (!isEscapeEffect(str, i)) {

                        while ((index = str.indexOf(']', i)) > 0) {

                            if (!isEscapeEffect(str, index)) {
                                nodelist.push(parserBracket(str.slice(i + 1, index)));
                                i = index;
                                break;
                            }
                        }
                        if (index < 1) {
                            //todo 错误处理
                        }


                    }
                    ;
                    break;
                case '(':
                    if (!isEscapeEffect(str, i)) {

                        while ((index = str.indexOf(')', i)) > 0) {

                            if (!isEscapeEffect(str, index)) {
                                nodelist.push(parseRegExp(str.slice(i + 1, index)));
                                i = index;
                                break;
                            }
                        }
                        if (index < 1) {
                            //todo 错误处理
                        }


                    }
                    ;
                    break;
                case '{':
                    index = str.indexOf('}', i + 1);
                    if (index > 0) {
                        char = str.slice(i + 1, index);
                        i = index;
                    } else {
                        //todo 报错
                    }


                    ;

                case '+':
                    ;
                case '*':
                    ;
                case '?':
                    currentNode = nodelist.pop();
                    if (typeof currentNode === 'string') {
                        currentNode = new treeNode('plainNodeHandle', [currentNode]);
                    }
                    if (!currentNode['opt']['quantifier']) {
                        currentNode['opt']['quantifier'] = char;


                    } else {
                        //todo 报错
                    }

                    nodelist.push(currentNode);
                    ;
                    break;

                default :
                    nodelist.push(char);
                    ;
            }
        }
        if (orOperatorNode) {
            orOperatorNode.nodelist.push(new treeNode('plainNodeHandler', nodelist.slice(orOperatoFlag, nodelist.length)));
            return orOperatorNode;
        } else {
            return new treeNode('plainNodeHandler', nodelist);
        }


    }

    function parserBracket(str) {
        var char, nodelist = [], handler, i = 0, len, ex = false;
        if (str.charAt(0) == '^') {
            // ex 等同 ^
            ex = true;
            i++;
        }
        for (len = str.length; i < len; i++) {
            char = str.charAt(i);
            switch (char) {
                case '[':
                    //todo 报错
                    ;
                    break;
                case '\\':
                    char = str[i + 1];
                    if (keychars.indexOf(char) > 0) {
                        nodelist.push(char);
                        i++;
                        break;
                    }
                    char = '\\' + char;
                    if (metachars.indexOf(char) > 0) {
                        handler = metacharsHandlerMap[char];
                        if (handler) {
                            nodelist.push(new treeNode(handler));
                        } else {
                            nodelist.push(char);
                        }
                    } else {
                        //todo 报错
                    }

                    ;
                    break;
               /* case ']':
                    return new treeNode('brachetNodeHandler', nodelist, {"ex": ex});
                    ;
                    break;*/
                default :
                    nodelist.push(char);
                    ;
            }
        }
        return new treeNode('brachetNodeHandler', nodelist, {"ex": ex});
    }



    /**
     *
     * @param handler
     * @param nodelist
     * @param opt nodeHanler 处理的时候需要参数
     *        目前 quantifier 量词
     *             ex [^abc]
     */
    function treeNode(handlerName, nodelist, opt) {
        this.handlerName = handlerName;
        this.nodelist = nodelist;
        this.opt = opt ? opt : {};
    }

    treeNode.prototype = {
        output: function () {

            var result;
            if (this.opt.quantifier) {
                result = this._quantifierHandler();
            } else {
                result = this.getHandler().call(this);
            }

            return result;
        },
        getHandler: function () {
            var handler = this[this.handlerName];
            if (this.handler) {
                return this.handler;
            }

            if (handler) {
                return this.handler = handler;
            } else {
                return this.handler = this['plainNodeHandler'];
            }
        },
        _getStrFromNode: function (node) {
            var resultStr;
            if (node instanceof treeNode) {
                resultStr = node.output();
            } else {
                resultStr = node;
            }
            return resultStr;
        },
        _quantifierHandler: function () {
            var repeatCount = this._parseQuantifierStr(this.opt.quantifier), result = '', handler = this.getHandler();
            for (var i = 0; i < repeatCount; i++) {
                result += handler.call(this);
            }
            return result;

        },
        _parseQuantifierStr: function (QuantifierStr) {


            if (QuantifierStr == '?') {
                return (this.getRandom(1, 10) >= 6) ? 1 : 0;
            }
            var nums = QuantifierStr.split(',');
            if (nums.length === 1) {

                return nums[0];
            } else {
                return this.getRandom(nums[0], nums[1]);
            }
        },
        brachetNodeHandler: function () {
            var char, nodelist = this.nodelist;
            if (this.opt.ex) {
                char = this.getChar();
                while (nodelist.indexOf(char) > -1) {
                    char = this.getChar();
                }

            } else {
                char = this.orOperatorNodeHandler();
            }
            return char;
        },
        plainNodeHandler: function () {
            var node, resultStr = '', nodelist = this.nodelist;
            for (var i = 0, len = nodelist.length; i < len; i++) {
                node = nodelist[i];

                resultStr += this._getStrFromNode(node);
            }
            return resultStr;

        },

        orOperatorNodeHandler: function () {
            var nodelist = this.nodelist;
            var len = nodelist.length, selectNode;
            if (len <= 2) {
                selectNode = nodelist[this.getRandom(1, 10) >= 6 ? 1 : 0];
            } else {
                selectNode = nodelist[this.getRandom(0, len - 1)];
            }


            return this._getStrFromNode(selectNode);
        },
        getRandom: function (min, max) {
            return parseInt(min) + Math.round(Math.random() * (max - min));
        },

        getChar: function () {
            var index = this.getRandom(33, 126);
            return String.fromCharCode(index);
        },
        getWordChar: function () {
            var index = this.getRandom(65, 116);

            //a-z 部分和A-Z部分相差6个字符
            if (index - 65 >= 26) {
                index += 6;
            }
            return String.fromCharCode(index);
        },
        getNumber: function () {
            var index = this.getRandom(48, 57);
            return String.fromCharCode(index);
        },
        getChineseChar: function () {
            var index = this.getRandom(parseInt('4e00', 16), parseInt('9fbf', 16));
            return unescape('%u'.concat(index.toString(16)));
            //unescape() 解码
        },
        _parseQuantifierStr: function (QuantifierStr) {


            if (QuantifierStr == '?') {
                return (this.getRandom(1, 10) >= 6) ? true : false;
            }
            var nums = QuantifierStr.split(',');
            if (nums.length === 1) {

                return nums[0];
            } else {
                return this.getRandom(nums[0], nums[1]);
            }
        }
    }


      function parse(str){
          var regexpTree = parseRegExp(str);
          return regexpTree.output();
      }

    return {
        parse:parse
    }
}, {requires:[]});
/*
 * return
 * ['a','b',
 * {
 *   charlist:[c,d,e]
 *   handler:handleRange,
 *   quantifier:'*'
 * },
 * ]
 *
 * */





