/**
 * Utility functions used all around the project to speed up certain repeatable tasks.
 * 
 * @category Utilities
 * @exports Utils
 */
var Utils = module.exports;

// control variable of func "myPrint"
var isPrintFlag = false;

/**
 * Makes sure that *cb* is type of `function` and invokes it with latter arguments.
 * 
 * @param {function} cb - function to invoke 
 */
Utils.invokeCallback = function (cb) {
    if (!!cb && typeof cb === 'function') {
        cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
};

/**
 * Clones *origin* object 1:1 and returns the clone.
 * 
 * @param {any} origin - object to clone
 * @returns {any} Cloned object
 */
Utils.clone = function (origin) {
    if (!origin) {
        return;
    }

    var obj = {};
    for (var f in origin) {
        if (origin.hasOwnProperty(f)) {
            obj[f] = origin[f];
        }
    }
    return obj;
};

/**
 * Counts all properties that the *obj* is an owner and returns the amount.
 * 
 * @param {any} obj - object to count properties in
 * @returns {number}
 */
Utils.size = function (obj) {
    if (!obj) {
        return 0;
    }

    var size = 0;
    for (var f in obj) {
        if (obj.hasOwnProperty(f)) {
            size++;
        }
    }

    return size;
};

function getStack() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
        return stack;
    };
    var err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
}

function getFileName(stack) {
    return stack[1].getFileName();
}

function getLineNumber(stack) {
    return stack[1].getLineNumber();
}

Utils.myPrint = function () {
    if (isPrintFlag) {
        var len = arguments.length;
        if (len <= 0) {
            return;
        }
        var stack = getStack();
        var aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
        for (var i = 0; i < len; ++i) {
            aimStr += arguments[i] + ' ';
        }
        console.log('\n' + aimStr);
    }
};
// print the file name and the line number ~ end

/**
 * Gets owned properties from *model* specified by the *fields*.
 * 
 * @param {any} model - object to get properties from
 * @param {string[]} fields - array of property names to get
 * @returns {any} Object with specified properties
 */
Utils.getProperties = function (model, fields) {
    var result = {};
    fields.forEach(function (field) {
        if (model.hasOwnProperty(field)) {
            result[field] = model[field];
        }
    });
    return result;
};

/**
 * Sets all properties from *properties* object to *model*.
 * 
 * @param {any} model - destination object
 * @param {any} properties - source object
 */
Utils.setProperties = function (model, properties) {
    for (var prop in properties) {
        model[prop] = properties[prop];
    }
};

/**
 * Multiplies all properties of the *properties* object by *multiplier*.
 * 
 * @param {any} properties - object to multiply
 * @param {number} multiplier - value
 * @returns {any} New object with multiplied properties
 */
Utils.multiplyProperties = function (properties, multiplier) {
    var result = {};
    for (var k in properties) {
        result[k] = Math.floor(properties[k] * multiplier);
    }
    return result;
};

/**
 * Adds all properties from *fromProps* to *toProps*.
 * If *toProps* doesn't have a property it will be added.
 * 
 * @param {any} toProps - destination object
 * @param {any} fromProps - source object
 */
Utils.addProperties = function (toProps, fromProps) {
    for (var k in fromProps) {
        if (toProps[k]) {
            toProps[k] += fromProps[k];
        } else {
            toProps[k] = fromProps[k];
        }
    }
};

/**
 * Chceks if *obj* is empty (doesn't have any properties).
 * 
 * @param {any} obj - object to check
 * @returns {boolean}
 */
Utils.isEmptyObject = function (obj) {
    for (var name in obj) {
        return false;
    }

    return true;
};

/**
 * Counts all properties in the *obj*.
 * 
 * @param {object} obj 
 * @returns 
 */
Utils.getLength = function (obj) {
    var total = 0;
    for (var k in obj) {
        total++;
    }
    return total;
}

/**
 * Calculates distance between *fromPos* to *toPos*.
 * 
 * @param {any} fromPos - origin position
 * @param {any} toPos - destination position
 * @returns {number} Distance between positions.
 */
Utils.getDist = function(fromPos, toPos) {
    var dx = toPos.x - fromPos.x;
    var dy = toPos.y - fromPos.y;
    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Checks if number is positive and integer.
 * 
 * @param {any} num - number to check (can be any type)
 * @returns {boolean}
 */
Utils.isPositiveInteger = function(num) {
    var r = /^[1-9][0-9]*$/;
    return r.test(num);
};

/**
 * Parses *ip* and returns it in form of number.
 * 
 * Bits 24 - 32 = 1st part
 * Bits 16 - 23 = 2nd part
 * Bits 8 - 15 = 3th part
 * Bits 0 - 7 = 4th part
 * 
 * @param {string} ip - ip to parse 
 * @returns {number} Ip in form of a 32-bit number.
 */
Utils.ipToInt = function (ip) {
    var parts = ip.split(".");

    if (parts.length != 4) {
        return 0;
    }
    return (parseInt(parts[0], 10) << 24
        | parseInt(parts[1], 10) << 16
        | parseInt(parts[2], 10) << 8
        | parseInt(parts[3], 10)) >>> 0;
};

/**
 * Get random number in specified range.
 * 
 * @param {number} Min - minimum value
 * @param {number} Max - maximum value
 * @returns {number} Random number in range.
 */
Utils.getRandomNum = function (Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    return (Min + Math.round(Rand * Range));
};

/**
 * Converts user ID to number, by hasing it.
 * 
 * @param {string} userId 
 * @returns 
 */
Utils.userId2Number = function (userId) {
    var hash = 5381,
        i = userId.length;

    while (i)
        hash = (hash * 33) ^ userId.charCodeAt(--i);

    /* 
     * JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. 
     */
    return Number(hash >>> 0);
};

/**
 * Create full room ID usable for join, with id *roomID* and server with id *serverID*.
 * 
 * @param {string} serverID - server ID
 * @param {number} roomID - room ID
 * @returns {number} Full room ID.
 */
Utils.createJoinRoomID = function (serverID, roomID){
    var id = parseInt(serverID.split('-')[1]);
    if (!!id){
        return id * 1000 + roomID;
    }

    return 0;
};

/**
 * Breaks down full room ID to server ID and room ID.
 * 
 * @param {number} joinRoomID - full room ID
 * @returns {object} Returns object with *gameServerID* and *roomID* fields.
 */
Utils.parseJoinRoomID = function (joinRoomID){
    joinRoomID = parseInt(joinRoomID);
    if (!!joinRoomID){
        return {
            gameServerID: 'game-' + Math.floor(joinRoomID/1000),
            roomID: joinRoomID % 1000
        };
    }
    return null;
};

var DAY_MS = 24 * 60 * 60 * 1000;
Utils.getIntervalDay = function (time1, time2){
    return Math.abs((Math.floor(time1/DAY_MS) - Math.floor(time2/DAY_MS)));
};

//使数字保留num个小数位，默认保留2位，转换之后是数字
Utils.numToFixed = function (number, count) {
    var count_ = count || 2;
    return parseFloat(parseFloat(number).toFixed(count_));
};

//时间戳转换成日期
Date.prototype.format = function(format) {
    var date = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S+": this.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length === 1
                ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
};

String.prototype.format = function(args) {
    var result = this;
    if (arguments.length > 0) {
        if (arguments.length === 1 && typeof (args) === "object") {
            for (var key in args) {
                if(args[key]!==undefined){
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
        }
        else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] !== undefined) {
                    var reg = new RegExp("({[" + i + "]})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
    }
    return result;
};

//生成随机字符串
Utils.randomString = function (len) {
    len = len || 16;
    var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    var maxPos = chars.length;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
};

// 获取单位向量
Utils.getUnitVector = function (startPoint, endPoint) {
    let point = cc.v2(0, 0);
    let distance;
    distance = Math.pow((startPoint.x - endPoint.x), 2) + Math.pow((startPoint.y - endPoint.y),2);
    distance = Math.sqrt(distance);
    if(distance === 0) return point;
    point.x = (endPoint.x - startPoint.x)/distance;
    point.y = (endPoint.y - startPoint.y)/distance;
    return point;
};

Utils.stringFormat = function() {
    if (arguments.length === 0)
        return null;
    let str = arguments[0];
    for (let i = 1; i < arguments.length; i++) {
        let re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
        str = str.replace(re, arguments[i]);
    }
    return str;
};

// 截取英文字符的长度
Utils.getStringByRealLength = function(str, length) {
    let realLength = 0;
    for(let i = 0; i < str.length; ++i) {
        let count = str.charCodeAt(i);
        if(count >= 0 && count <= 128) {
            ++ realLength;
        } else {
            realLength += 2;
        }
        if(realLength >= length) {
            break;
        }
    }
    return str.substring(0, i+1);
};

Utils.getStringRealLength = function(str) {
    let realLength = 0;
    for(let i = 0; i < str.length; ++i) {
        let count = str.charCodeAt(i);
        if(count >= 0 && count <= 128) {
            ++ realLength;
        } else {
            realLength += 2;
        }
    }
    return realLength;
};

Utils.formatNumberToString = function (num, maxDecimalLength) {
    return parseFloat(num.toFixed(maxDecimalLength)).toString();
};

Utils.keepNumberPoint = function (num, maxDecimalLength) {
    let base = 1;
    for (let i = 0; i < maxDecimalLength; ++i){
        base *= 10;
    }
    return Math.floor(num * base)/base;
};

/**
 * 获得从m中取n的所有组合
 */
/**
 * 获得从m中取n的所有组合
 */
Utils.getCombinationFlagArrs = function(m, n) {
    if(!n || n < 1 || m < n) {
        return [];
    }
    if (m === n){
        return [[1,1]];
    }
    let resultArrs = [],
        flagArr = [],
        isEnd = false,
        i, j, leftCnt;

    for (i = 0; i < m; i++) {
        flagArr[i] = i < n ? 1 : 0;
    }

    resultArrs.push(flagArr.concat());

    while (!isEnd) {
        leftCnt = 0;
        for (i = 0; i < m - 1; i++) {
            if (flagArr[i] === 1 && flagArr[i+1] === 0) {
                for(j = 0; j < i; j++) {
                    flagArr[j] = j < leftCnt ? 1 : 0;
                }
                flagArr[i] = 0;
                flagArr[i+1] = 1;
                let aTmp = flagArr.concat();
                resultArrs.push(aTmp);
                if(aTmp.slice(-n).join("").indexOf('0') === -1) {
                    isEnd = true;
                }
                break;
            }
            flagArr[i] === 1 && leftCnt++;
        }
    }
    return resultArrs;
};