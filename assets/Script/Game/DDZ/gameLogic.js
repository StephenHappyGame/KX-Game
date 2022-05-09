let logic = module.exports;
let gameProto = require('./DDZProto');

//扑克数据
logic.CARD_DATA_ARRAY = [
    0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,	//方块 A - K
    0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,	//梅花 A - K
    0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,	//红桃 A - K
    0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,	//黑桃 A - K
    0x4E,0x4F
];

//数值掩码
let MASK_COLOR = 				    0xF0;								//花色掩码
let MASK_VALUE =					0x0F;								//数值掩码


logic.getCardValue = function(cardData) {
    return cardData&MASK_VALUE;
};
//获取花色
logic.getCardColor = function(cardData) {
    return cardData&MASK_COLOR;
};
//逻辑数值
logic.getCardLogicValue = function (cardData) {
    //扑克属性
    let cardColor = this.getCardColor(cardData);
    let cardValue = this.getCardValue(cardData);

    if (cardValue <= 0 || cardValue > (MASK_VALUE&0x4f)){
        return 0;
    }

    //转换数值
    if (cardColor === 0x40) return cardValue+2;
    return (cardValue<=2)?(cardValue+13):cardValue;
};

logic.getCardLogicValueArr = function (cardDataArr) {
    let arr = [];
    for (let i = 0; i < cardDataArr.length; ++i){
        arr.push(logic.getCardLogicValue(cardDataArr[i]));
    }
    return arr;
};

/* 获取牌 */
logic.getRandCardList= function() {
    let tempCardDataArr = this.CARD_DATA_ARRAY.slice();
    let cardDataArr = [];

    let maxCount = tempCardDataArr.length;
    let randCount = 0;
    let pos = 0;
    // 混乱牌
    do{
        pos = Math.floor(Math.random() * (maxCount - randCount));
        cardDataArr[randCount++] = tempCardDataArr[pos];
        tempCardDataArr[pos] = tempCardDataArr[maxCount - randCount];
    }while(randCount < maxCount);
    return cardDataArr;
};

logic.sortCardList = function (cardDataArr, isOrderByCount) {
    //数目过虑
    if (!cardDataArr || cardDataArr.length <= 1) return cardDataArr;
    let cardCount = cardDataArr.length;
    //转换数值
    let sortValueArr = [];
    for (let i = 0; i < cardDataArr.length; i++) {
        sortValueArr[i]= this.getCardLogicValue(cardDataArr[i]);
    }

    //排序操作
    for (let i = 0; i < cardCount; ++i){
        let sortValue = sortValueArr[i];
        let cardData = cardDataArr[i];
        for (let j = i+1; j < cardCount; ++j){
            if ((sortValueArr[j] > sortValue) || ((sortValue === sortValueArr[j]) && (cardDataArr[j] > cardData))){
                // 交换位置]
                sortValueArr[i] = sortValueArr[j];
                sortValueArr[j] = sortValue;
                sortValue = sortValueArr[i];
                cardDataArr[i] = cardDataArr[j];
                cardDataArr[j] = cardData;
                cardData = cardDataArr[i];
            }
        }
    }
    //数目排序
    if (!!isOrderByCount){
        //分析扑克
        let analyseResult = this.analyseCardDataArr(cardDataArr);

        cardDataArr = [];
        //拷贝四牌
        cardDataArr = cardDataArr.concat(analyseResult.fourCardData);

        //拷贝三牌
        cardDataArr = cardDataArr.concat(analyseResult.threeCardData);

        //拷贝对牌
        cardDataArr = cardDataArr.concat(analyseResult.doubleCardData);

        //拷贝单牌
        cardDataArr = cardDataArr.concat(analyseResult.singleCardData);
    }
    return cardDataArr;
};

logic.getCardType = function (cardDataArr) {
    let cardCount = cardDataArr.length;
    //简单牌型
    switch (cardCount) {
        case 0:
        {
            return gameProto.cardType.ERROR;
        }
        case 1: //单牌
        {
            return gameProto.cardType.SINGLE;
        }
        case 2:	//对牌火箭
        {
            //牌型判断
            if ((cardDataArr[0] === 0x4F)&&(cardDataArr[1] === 0x4E)) return gameProto.cardType.MISSILE_CARD;
            if (this.getCardLogicValue(cardDataArr[0]) === this.getCardLogicValue(cardDataArr[1])) return gameProto.cardType.DOUBLE;

            return gameProto.cardType.ERROR;
        }
    }

    //分析扑克
    let analyseResult = this.analyseCardDataArr(cardDataArr);
    if (!analyseResult) return gameProto.cardType.ERROR;

    //四牌判断
    if (analyseResult.fourCardData.length > 0) {
        //牌型判断
        if ((analyseResult.fourCardData.length === 4)&&(cardCount === 4)) return gameProto.cardType.BOMB_CARD;
        if ((analyseResult.fourCardData.length === 4)&&(analyseResult.singleCardData.length === 2)&&(cardCount === 6)) return gameProto.cardType.FOUR_LINE_TAKE_ONE;
        if ((analyseResult.fourCardData.length === 4)&&(analyseResult.doubleCardData.length/2 === 2)&&(cardCount === 8)) return gameProto.cardType.FOUR_LINE_TAKE_TWO;
        return gameProto.cardType.ERROR;
    }

    //三牌判断
    if (analyseResult.threeCardData.length > 0) {
        let threeCount = analyseResult.threeCardData.length/3;
        //三条类型
        if(threeCount === 1 && cardCount === 3) return gameProto.cardType.THREE;
        //连牌判断
        if (threeCount > 1) {
            //变量定义
            let cardData = analyseResult.threeCardData[0];
            let firstLogicValue = this.getCardLogicValue(cardData);

            //错误过虑
            if (firstLogicValue >= 15) return gameProto.cardType.ERROR;

            //连牌判断
            for (let i = 1; i < threeCount; i++) {
                let tempCardData = analyseResult.threeCardData[i * 3];
                if (firstLogicValue !== (this.getCardLogicValue(tempCardData) + i)) return gameProto.cardType.ERROR;
            }
        }

        //牌形判断
        if (threeCount * 3 === cardCount) return gameProto.cardType.THREE_LINE;
        if (threeCount * 4 === cardCount) return gameProto.cardType.THREE_LINE_TAKE_ONE;
        if ((threeCount * 5 === cardCount)&&(analyseResult.doubleCardData.length/2 === threeCount)) return gameProto.cardType.THREE_LINE_TAKE_TWO;

        return gameProto.cardType.ERROR;
    }

    //两张类型
    if (analyseResult.doubleCardData.length/2 >= 3) {
        let doubleCount = analyseResult.doubleCardData.length/2;
        //变量定义
        let cardData = analyseResult.doubleCardData[0];
        let firstLogicValue = this.getCardLogicValue(cardData);

        //错误过虑
        if (firstLogicValue >= 15) return gameProto.cardType.ERROR;

        //连牌判断
        for (let i = 1; i < doubleCount; i++){
            let cardData = analyseResult.doubleCardData[i*2];
            if (firstLogicValue !== (this.getCardLogicValue(cardData)+i)) return gameProto.cardType.ERROR;
        }

        //二连判断
        if ((doubleCount*2) === cardCount) return gameProto.cardType.DOUBLE_LINE;

        return gameProto.cardType.ERROR;
    }

    //单张判断
    if ((analyseResult.singleCardData.length >= 5)&&(analyseResult.singleCardData.length === cardCount)) {
        //变量定义
        let cardData = analyseResult.singleCardData[0];
        let firstLogicValue = this.getCardLogicValue(cardData);

        //错误过虑
        if (firstLogicValue>=15) return gameProto.cardType.ERROR;

        //连牌判断
        for (let i = 1; i < analyseResult.singleCardData.length; i++){
            let cardData = analyseResult.singleCardData[i];
            if (firstLogicValue !== (this.getCardLogicValue(cardData)+i)) return gameProto.cardType.ERROR;
        }

        return gameProto.cardType.SINGLE_LINE;
    }
    return gameProto.cardType.ERROR;
};

logic.analyseCardDataArr = function (cardDataArr) {
    let cardCount = cardDataArr.length;
    let analyseResult = {
        fourCardData: [],
        threeCardData: [],
        doubleCardData: [],
        singleCardData: []
    };

    //扑克分析
    for (let i = 0; i < cardCount; i++) {
        //变量定义
        let sameCount = 1;
        let logicValue = this.getCardLogicValue(cardDataArr[i]);
        if(logicValue <= 0) return null;
        //搜索同牌
        for (let j=i+1; j < cardCount;j++){
            //获取扑克
            if (this.getCardLogicValue(cardDataArr[j]) !== logicValue) break;
            //设置变量
            sameCount++;
        }

        //设置结果
        switch (sameCount) {
            case 1:		//单张
            {
                analyseResult.singleCardData.push(cardDataArr[i]);
                break;
            }
            case 2:		//两张
            {
                analyseResult.doubleCardData.push(cardDataArr[i]);
                analyseResult.doubleCardData.push(cardDataArr[i + 1]);
                break;
            }
            case 3:		//三张
            {
                analyseResult.threeCardData.push(cardDataArr[i]);
                analyseResult.threeCardData.push(cardDataArr[i + 1]);
                analyseResult.threeCardData.push(cardDataArr[i + 2]);
                break;
            }
            case 4:		//四张
            {
                analyseResult.fourCardData.push(cardDataArr[i]);
                analyseResult.fourCardData.push(cardDataArr[i + 1]);
                analyseResult.fourCardData.push(cardDataArr[i + 2]);
                analyseResult.fourCardData.push(cardDataArr[i + 3]);
                break;
            }
        }

        //设置索引
        i+=(sameCount-1);
    }
    return analyseResult;
};

logic.compareCard = function (firstCardArr, nextCardArr) {
    //获取类型
    let nextType = this.getCardType(nextCardArr);
    //类型判断
    if (nextType === gameProto.cardType.ERROR) return false;
    if (nextType === gameProto.cardType.MISSILE_CARD) return true;

    let firstType = this.getCardType(firstCardArr);
    if (firstType === gameProto.cardType.MISSILE_CARD) return false ;

    //炸弹判断
    if ((firstType !== gameProto.cardType.BOMB_CARD)&&(nextType === gameProto.cardType.BOMB_CARD)) return true;
    if ((firstType === gameProto.cardType.BOMB_CARD)&&(nextType !== gameProto.cardType.BOMB_CARD)) return false;

    //规则判断
    if ((firstType !== nextType)||(firstCardArr.length !== nextCardArr.length)) return false;

    //开始对比
    switch (nextType) {
        case gameProto.cardType.SINGLE:
        case gameProto.cardType.DOUBLE:
        case gameProto.cardType.THREE:
        case gameProto.cardType.SINGLE_LINE:
        case gameProto.cardType.DOUBLE_LINE:
        case gameProto.cardType.THREE_LINE:
        case gameProto.cardType.BOMB_CARD: {
            //获取数值
            let nextLogicValue = this.getCardLogicValue(nextCardArr[0]);
            let firstLogicValue = this.getCardLogicValue(firstCardArr[0]);
            //对比扑克
            return nextLogicValue > firstLogicValue;
        }
        case gameProto.cardType.THREE_LINE_TAKE_ONE:
        case gameProto.cardType.THREE_LINE_TAKE_TWO: {
            //分析扑克
            let nextResult = this.analyseCardDataArr(nextCardArr);
            let firstResult = this.analyseCardDataArr(firstCardArr);
            //获取数值
            let nextLogicValue = this.getCardLogicValue(nextResult.threeCardData[0]);
            let firstLogicValue = this.getCardLogicValue(firstResult.threeCardData[0]);
            //对比扑克
            return nextLogicValue > firstLogicValue;
        }
        case gameProto.cardType.FOUR_LINE_TAKE_ONE:
        case gameProto.cardType.FOUR_LINE_TAKE_TWO: {
            //分析扑克
            let nextResult = this.analyseCardDataArr(nextCardArr);
            let firstResult = this.analyseCardDataArr(firstCardArr);
            //获取数值
            let nextLogicValue = this.getCardLogicValue(nextResult.fourCardData[0]);
            let firstLogicValue = this.getCardLogicValue(firstResult.fourCardData[0]);

            //对比扑克
            return nextLogicValue > firstLogicValue;
        }
    }
    return false;
};

logic.removeCard = function (removeCardArr, cardDataArr) {
    if (removeCardArr.length > cardDataArr.length) return false;

    let tempCardDataArr = cardDataArr.slice();

    //置零扑克
    let deleteCount = 0;
    for (let i = 0; i < removeCardArr.length; i++){
        for (let j = 0; j < cardDataArr.length; j++){
            if (removeCardArr[i] === tempCardDataArr[j]) {
                tempCardDataArr[j] = 0;
                deleteCount++;
                break;
            }
        }
    }
    if(deleteCount !== removeCardArr.length) return false;

    let index = 0;
    for(let i = 0; i < tempCardDataArr.length; ++i){
        if (tempCardDataArr[i] !== 0){
            cardDataArr[index++] = tempCardDataArr[i];
        }
    }
    cardDataArr.splice(index, cardDataArr.length - index);
    return true;
};

logic.removeCardByValue = function (removeCardValueArr, cardDataArr) {
    if (removeCardValueArr.length > cardDataArr.length) return false;

    let tempCardDataArr = cardDataArr.slice();

    //置零扑克
    let deleteCount = 0;
    for (let i = 0; i < removeCardValueArr.length; i++){
        let isDelete = false;
        for (let j = 0; j < cardDataArr.length; j++){
            if (removeCardValueArr[i] === this.getCardLogicValue(tempCardDataArr[j])) {
                tempCardDataArr[j] = 0;
                isDelete = true;
            }
        }
        if (isDelete) deleteCount++;
    }
    if(deleteCount !== removeCardValueArr.length) return false;

    let index = 0;
    for(let i = 0; i < tempCardDataArr.length; ++i){
        if (tempCardDataArr[i] !== 0){
            cardDataArr[index++] = tempCardDataArr[i];
        }
    }
    cardDataArr.splice(index, cardDataArr.length - index);
    return true;
};

//出牌搜索
logic.searchOutCard = function(handCardDataArr, turnCardDataArr) {
    let resultCardArr = [];

    //构造扑克
    let cardDataArr = handCardDataArr.slice();
    let cardCount = handCardDataArr.length;

    cardDataArr = this.sortCardList(cardDataArr);

    let turnCardCount = turnCardDataArr.length;

    //获取类型
    let turnOutCardType = this.getCardType(turnCardDataArr);

    //出牌分析
    switch (turnOutCardType) {
        case gameProto.cardType.ERROR: {
            return resultCardArr;
        }
        case gameProto.cardType.SINGLE:					//单牌类型
        case gameProto.cardType.DOUBLE:					//对牌类型
        case gameProto.cardType.THREE:					//三条类型
        {
            //获取数值
            let logicValue = this.getCardLogicValue(turnCardDataArr[0]);

            //分析扑克
            let analyseResult = this.analyseCardDataArr(cardDataArr);

            //寻找单牌
            if (turnCardCount <= 1) {
                for (let i = 0;i < analyseResult.singleCardData.length; i++) {
                    let index = analyseResult.singleCardData.length-i-1;
                    if (this.getCardLogicValue(analyseResult.singleCardData[index])>logicValue) {
                        //设置结果
                        resultCardArr.push(analyseResult.singleCardData[index]);
                        return resultCardArr;
                    }
                }
            }

            //寻找对牌
            if (turnCardCount <= 2) {
                for (let i=0;i<analyseResult.doubleCardData.length;i++){
                    let index=(analyseResult.doubleCardData.length/2-i-1)*2;
                    if (this.getCardLogicValue(analyseResult.doubleCardData[index])>logicValue) {
                        //设置结果
                        resultCardArr = analyseResult.doubleCardData.slice(index, index + turnCardCount);
                        return resultCardArr;
                    }
                }
            }

            //寻找三牌
            if (turnCardCount<=3) {
                for (let i=0;i<analyseResult.threeCardData.length;i++){
                    let index=(analyseResult.threeCardData.length/3-i-1)*3;
                    if (this.getCardLogicValue(analyseResult.threeCardData[index])>logicValue) {
                        //设置结果
                        resultCardArr = analyseResult.threeCardData.slice(index, index + turnCardCount);
                        return resultCardArr;
                    }
                }
            }

            break;
        }
        case gameProto.cardType.SINGLE_LINE:		//单连类型
        {
            //长度判断
            if (cardCount < turnCardCount) break;

            //获取数值
            let logicValue=this.getCardLogicValue(turnCardDataArr[0]);

            //搜索连牌
            for (let i=(turnCardCount-1);i<cardCount;i++){
                //获取数值
                let handLogicValue=this.getCardLogicValue(cardDataArr[cardCount-i-1]);

                //构造判断
                if (handLogicValue>=15) break;
                if (handLogicValue<=logicValue) continue;

                //搜索连牌
                let lineCount=0;
                for (let j=(cardCount-i-1);j<cardCount;j++){
                    if ((this.getCardLogicValue(cardDataArr[j])+lineCount)===handLogicValue) {
                        //增加连数
                        resultCardArr[lineCount++] = cardDataArr[j];
                        //完成判断
                        if (lineCount===turnCardCount) {
                            return resultCardArr;
                        }
                    }
                }
            }

            break;
        }
        case gameProto.cardType.DOUBLE_LINE:		//对连类型
        {
            //长度判断
            if (cardCount < turnCardCount) break;

            //获取数值
            let logicValue=this.getCardLogicValue(turnCardDataArr[0]);

            //搜索连牌
            for (let i=(turnCardCount-1);i<cardCount;i++){
                //获取数值
                let handLogicValue=this.getCardLogicValue(cardDataArr[cardCount-i-1]);

                //构造判断
                if (handLogicValue<=logicValue) continue;
                if ((handLogicValue>=15)) break;

                //搜索连牌
                let lineCount=0;
                for (let j=(cardCount-i-1);j<(cardCount-1);j++){
                    if (((this.getCardLogicValue(cardDataArr[j])+lineCount)===handLogicValue)
                        &&((this.getCardLogicValue(cardDataArr[j+1])+lineCount)===handLogicValue)) {
                        //增加连数
                        resultCardArr[lineCount * 2] = cardDataArr[j];
                        resultCardArr[lineCount * 2 + 1] = cardDataArr[j + 1];
                        lineCount++;
                        //完成判断
                        if (lineCount*2===turnCardCount) {
                            return resultCardArr;
                        }
                    }
                }
            }

            break;
        }
        case gameProto.cardType.THREE_LINE:				//三连类型
        case gameProto.cardType.THREE_LINE_TAKE_ONE:	//三带一单
        case gameProto.cardType.THREE_LINE_TAKE_TWO:	//三带一对
        {
            //长度判断
            if (cardCount<turnCardCount) break;

            //获取数值
            let logicValue=0;
            for (let i=0;i<turnCardCount-2;i++){
                logicValue=this.getCardLogicValue(turnCardDataArr[i]);
                if (this.getCardLogicValue(turnCardDataArr[i+1])!==logicValue) continue;
                if (this.getCardLogicValue(turnCardDataArr[i+2])!==logicValue) continue;
                break;
            }

            //属性数值
            let turnLineCount=0;
            if (turnOutCardType === gameProto.cardType.THREE_LINE_TAKE_ONE) turnLineCount=turnCardCount/4;
            else if (turnOutCardType === gameProto.cardType.THREE_LINE_TAKE_TWO) turnLineCount=turnCardCount/5;
            else turnLineCount=turnCardCount/3;

            //搜索连牌
            for (let i=turnLineCount*3-1;i<cardCount;i++){
                //获取数值
                let handLogicValue=this.getCardLogicValue(cardDataArr[cardCount-i-1]);
                //构造判断
                if (handLogicValue<=logicValue) continue;
                if ((turnLineCount>1)&&(handLogicValue>=15)) break;

                //搜索连牌
                let lineCount=0;
                for (let j=(cardCount-i-1);j<(cardCount-2);j++){
                    //三牌判断
                    if ((this.getCardLogicValue(cardDataArr[j])+lineCount)!==handLogicValue) continue;
                    if ((this.getCardLogicValue(cardDataArr[j+1])+lineCount)!==handLogicValue) continue;
                    if ((this.getCardLogicValue(cardDataArr[j+2])+lineCount)!==handLogicValue) continue;

                    //增加连数
                    resultCardArr[lineCount*3]=cardDataArr[j];
                    resultCardArr[lineCount*3+1]=cardDataArr[j+1];
                    resultCardArr[lineCount*3+2]=cardDataArr[j+2];
                    lineCount++;

                    //完成判断
                    if (lineCount === turnLineCount) {
                        //构造扑克
                        let leftCardDataArr = cardDataArr.slice();
                        this.removeCard(resultCardArr, leftCardDataArr);

                        //分析扑克
                        let analyseResultLeft = this.analyseCardDataArr(leftCardDataArr);

                        //单牌处理
                        if (turnOutCardType === gameProto.cardType.THREE_LINE_TAKE_ONE) {
                            //提取单牌
                            for (let k=0; k<analyseResultLeft.singleCardData.length; k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index=analyseResultLeft.singleCardData.length-k-1;
                                let singleCard=analyseResultLeft.singleCardData[index];
                                resultCardArr.push(singleCard);
                            }

                            //提取对牌
                            for (let k=0; k < analyseResultLeft.doubleCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index=(analyseResultLeft.doubleCardData.length-k-1);
                                let singleCard=analyseResultLeft.doubleCardData[index];
                                resultCardArr.push(singleCard);
                            }

                            //提取三牌
                            for (let k=0;k<analyseResultLeft.threeCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index=(analyseResultLeft.threeCardData.length-k-1);
                                let singleCard=analyseResultLeft.threeCardData[index];
                                resultCardArr.push(singleCard);
                            }

                            //提取四牌
                            for (let k=0;k<analyseResultLeft.fourCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index=(analyseResultLeft.fourCardData.length-k-1);
                                let singleCard=analyseResultLeft.fourCardData[index];
                                resultCardArr.push(singleCard);
                            }
                        }

                        //对牌处理
                        if (turnOutCardType === gameProto.cardType.THREE_LINE_TAKE_TWO) {
                            //提取对牌
                            for (let k=0;k<analyseResultLeft.doubleCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;
                                //设置扑克
                                let index=(analyseResultLeft.doubleCardData.length/2-k-1)*2;
                                let cbCardData1=analyseResultLeft.doubleCardData[index];
                                let cbCardData2=analyseResultLeft.doubleCardData[index + 1];
                                resultCardArr.push(cbCardData1);
                                resultCardArr.push(cbCardData2);
                            }

                            //提取三牌
                            for (let k=0;k<analyseResultLeft.threeCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;
                                //设置扑克
                                let index=(analyseResultLeft.threeCardData.length/3-k-1)*3;
                                let cbCardData1=analyseResultLeft.threeCardData[index];
                                let cbCardData2=analyseResultLeft.threeCardData[index + 1];
                                resultCardArr.push(cbCardData1);
                                resultCardArr.push(cbCardData2);
                            }

                            //提取四牌
                            for (let k=0;k<analyseResultLeft.fourCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index=(analyseResultLeft.fourCardData.length/4-k-1)*4;
                                let cbCardData1=analyseResultLeft.fourCardData[index];
                                let cbCardData2=analyseResultLeft.fourCardData[index + 1];
                                resultCardArr.push(cbCardData1);
                                resultCardArr.push(cbCardData2);
                            }
                        }

                        //完成判断
                        if (resultCardArr.length === turnCardCount) return resultCardArr;
                    }
                }
            }

            break;
        }
    }

    //搜索炸弹
    if ((cardCount>=4)&&(turnOutCardType!== gameProto.cardType.MISSILE_CARD)) {
        //变量定义
        let logicValue=0;
        if (turnOutCardType===gameProto.cardType.BOMB_CARD) logicValue=this.getCardLogicValue(turnCardDataArr[0]);

        //搜索炸弹
        for (let i=3;i<cardCount;i++){
            //获取数值
            let handLogicValue=this.getCardLogicValue(cardDataArr[cardCount-i-1]);

            //构造判断
            if (handLogicValue<=logicValue) continue;

            //炸弹判断
            let j = 1;
            for (j=1;j<4;j++) {
                if (this.getCardLogicValue(cardDataArr[cardCount+j-i-1])!==handLogicValue) break;
            }
            if (j!==4) continue;

            //设置结果
            resultCardArr = [];
            resultCardArr[0]=cardDataArr[cardCount-i-1];
            resultCardArr[1]=cardDataArr[cardCount-i];
            resultCardArr[2]=cardDataArr[cardCount-i+1];
            resultCardArr[3]=cardDataArr[cardCount-i+2];
            return resultCardArr;
        }
    }

    //搜索火箭
    if ((cardCount>=2)&&(cardDataArr[0]===0x4F)&&(cardDataArr[1]===0x4E)) {
        //设置结果
        resultCardArr = [];
        resultCardArr[0]=cardDataArr[0];
        resultCardArr[1]=cardDataArr[1];
        return resultCardArr;
    }
    return [];
};

//分析单牌
logic.getAllSingleCard = function(handCardDataArr) {
    let tmpCardDataArr = logic.sortCardList(handCardDataArr.slice());
    let handCardCount = handCardDataArr.length;

    let singleCardDataArr = [];

    //扑克分析
    for (let i=0;i<handCardCount;i++){
        //变量定义
        let sameCount=1;
        let logicValue=logic.getCardLogicValue(tmpCardDataArr[i]);
        //搜索同牌
        for (let j=i+1;j<handCardCount;j++){
            //获取扑克
            if (logic.getCardLogicValue(tmpCardDataArr[j])!== logicValue) break;

            //设置变量
            sameCount++;
            if(sameCount > 1) break;
        }

        if(sameCount===1) {
            singleCardDataArr.push(tmpCardDataArr[i]);
        }

        //设置索引
        i+=(sameCount-1);
    }
    return singleCardDataArr;
};

//分析对子
logic.getAllDoubleCard = function(handCardDataArr) {
    let tmpCardDataArr = logic.sortCardList(handCardDataArr.slice());
    let handCardCount = handCardDataArr.length;

    let doubleCardDataArr = [];

    //扑克分析
    for (let i=0;i<handCardCount;i++){
        let sameCount = 1;
        let logicValue=logic.getCardLogicValue(tmpCardDataArr[i]);

        for (let j = i+1; j < handCardCount; ++j){
            //搜索同牌
            if (logic.getCardLogicValue(tmpCardDataArr[j]) !== logicValue) break;

            sameCount++;
        }
        if (sameCount >= 2){
            doubleCardDataArr.push(tmpCardDataArr[i]);
            doubleCardDataArr.push(tmpCardDataArr[i+1]);
        }
        i += (sameCount-1);
    }
    return doubleCardDataArr;
};

//分析三条
logic.getAllThreeCard = function(handCardDataArr) {
    let tmpCardDataArr = logic.sortCardList(handCardDataArr.slice());
    let handCardCount = handCardDataArr.length;

    let threeCardDataArr = [];

    //扑克分析
    for (let i=0;i<handCardCount-2;i++){
        let sameCount=1;
        let logicValue=logic.getCardLogicValue(tmpCardDataArr[i]);

        //搜索同牌
        for (let j=i+1;j<=i+3 && j<handCardCount;j++){
            //获取扑克
            if (logic.getCardLogicValue(tmpCardDataArr[j]) !== logicValue) break;
            sameCount++;
        }

        if (sameCount >= 3){
            threeCardDataArr.push(tmpCardDataArr[i]);
            threeCardDataArr.push(tmpCardDataArr[i + 1]);
            threeCardDataArr.push(tmpCardDataArr[i + 2]);
        }

        i += (sameCount - 1);
    }
    return threeCardDataArr;
};

//分析顺子
logic.getAllLineCard = function(handCardDataArr){
    let handCardCount = handCardDataArr.length;
    let temCardDataArr = logic.sortCardList(handCardDataArr.slice());

    let lineCardDataArr = [];
    //数据校验
    if(handCardCount<5) return lineCardDataArr;

    let firstCard = 0 ;
    //去除2和王
    for(let i=0 ; i<handCardCount ; ++i){
        if(logic.getCardLogicValue(temCardDataArr[i])<15)	{
            firstCard = i;
            break;
        }
    }

    let singleLineCardDataArr = [];
    let findSingleLine = true ;

    //连牌判断
    while ((temCardDataArr.length + firstCard)>=5 && findSingleLine) {
        findSingleLine = false ;
        singleLineCardDataArr = [temCardDataArr[firstCard]];
        let lastCard = temCardDataArr[firstCard];
        for (let i=firstCard+1; i<temCardDataArr.length; i++){
            let cardData=temCardDataArr[i];
            let logicValueDiff = logic.getCardLogicValue(lastCard) - logic.getCardLogicValue(cardData);
            if (logicValueDiff > 0){
                lastCard = cardData;
                // 非连续
                if (logicValueDiff > 1){
                    if(singleLineCardDataArr.length<5) {
                        singleLineCardDataArr = [lastCard];
                    } else{
                        break;
                    }
                }
                // 连续
                else{
                    singleLineCardDataArr.push(lastCard);
                }
            }
        }

        //保存数据
        if(singleLineCardDataArr.length>=5) {
            logic.removeCard(singleLineCardDataArr, temCardDataArr);
            lineCardDataArr = lineCardDataArr.concat(singleLineCardDataArr);
            findSingleLine = true ;
        }
    }
    return lineCardDataArr;
};

//分析炸弹
logic.getAllBombCard = function(handCardDataArr) {
    let handCardCount = handCardDataArr.length;
    //大小排序
    let temCardDataArr = logic.sortCardList(handCardDataArr.slice());

    let boomCardArr = [];
    if(handCardDataArr.length<2) return boomCardArr;

    //双王炸弹
    if(0x4F===temCardDataArr[0] && 0x4E===temCardDataArr[1]) {
        boomCardArr.push(temCardDataArr[0]);
        boomCardArr.push(temCardDataArr[1]);
    }

    if (handCardCount >= 4){
        //扑克分析
        for (let i=0; i < handCardCount - 3;i++){
            //变量定义
            let sameCount = 1;
            let logicValue = logic.getCardLogicValue(temCardDataArr[i]);
            //搜索同牌
            for (let j=i+1;j<=i+3 && j < handCardCount;j++) {
                //获取扑克
                if (logic.getCardLogicValue(temCardDataArr[j]) !== logicValue) break;
                sameCount++;
            }
            if (sameCount === 4) {
                boomCardArr.push(temCardDataArr[i]);
                boomCardArr.push(temCardDataArr[i + 1]);
                boomCardArr.push(temCardDataArr[i + 2]);
                boomCardArr.push(temCardDataArr[i + 3]);
            }
        }
    }
    return boomCardArr;
};

// 获取所有单张类型
logic.getAllSingleCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.SINGLE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let handCardCount = handCardDataArr.length;
    for(let i=0; i<handCardCount; ++i){
        if(!!turnCardData && turnCardData.length > 0){
            if (logic.getCardLogicValue(handCardDataArr[i]) <= logic.getCardLogicValue(turnCardData[0])) continue;
        }
        let index = cardTypeResult.cardTypeCount ;
        cardTypeResult.cardDataArr[index] = [];
        cardTypeResult.cardType = gameProto.cardType.SINGLE ;
        cardTypeResult.cardDataArr[index][0] = handCardDataArr[i] ;
        cardTypeResult.eachHandCardCount[index] = 1 ;
        cardTypeResult.cardTypeCount++;
    }
    return cardTypeResult;
};

// 获取所有对子类型
logic.getAllDoubleCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.DOUBLE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let doubleCardDataArr = this.getAllDoubleCard(handCardDataArr) ;

    for(let i=0; i<doubleCardDataArr.length; i+=2){
        if (!!turnCardData && turnCardData.length > 0){
            if (logic.getCardLogicValue(doubleCardDataArr[i]) <= logic.getCardLogicValue(turnCardData[0])) continue;
        }
        let index = cardTypeResult.cardTypeCount ;
        cardTypeResult.cardDataArr[index] = [];
        cardTypeResult.cardType = gameProto.cardType.DOUBLE ;
        cardTypeResult.cardDataArr[index][0] = doubleCardDataArr[i] ;
        cardTypeResult.cardDataArr[index][1] = doubleCardDataArr[i+1] ;
        cardTypeResult.eachHandCardCount[index] = 2 ;
        cardTypeResult.cardTypeCount++ ;
    }
    return cardTypeResult;
};

// 获取所有三条类型
logic.getAllThreeCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.THREE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let cardDataArr = this.getAllThreeCard(handCardDataArr) ;

    for(let i=0; i<cardDataArr.length; i+=3){
        if (!!turnCardData && turnCardData.length > 0){
            if (logic.getCardLogicValue(cardDataArr[i]) <= logic.getCardLogicValue(turnCardData[0])) continue;
        }
        let index = cardTypeResult.cardTypeCount ;
        cardTypeResult.cardDataArr[index] = [];
        cardTypeResult.cardType = gameProto.cardType.THREE ;
        cardTypeResult.cardDataArr[index][0] = cardDataArr[i] ;
        cardTypeResult.cardDataArr[index][1] = cardDataArr[i+1] ;
        cardTypeResult.cardDataArr[index][2] = cardDataArr[i+2] ;
        cardTypeResult.eachHandCardCount[index] = 3;
        cardTypeResult.cardTypeCount++ ;
    }
    return cardTypeResult;
};

// 获取单连类型
logic.getAllLineCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.SINGLE_LINE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let turnFirstCardLogicValue = !turnCardData?0:logic.getCardLogicValue(turnCardData[0]);
    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    let handCardCount = tmpCardDataArr.length;
    let firstCard = 0 ;
    //去除2和王
    for(let i=0 ; i<handCardCount ; ++i){
        if(logic.getCardLogicValue(tmpCardDataArr[i])<15) {
            firstCard = i ;
            break ;
        }
    }
    let singleLineCardArr = [];
    let leftCardCount = handCardCount ;
    let isFindSingleLine = true ;

    //连牌判断
    while ((leftCardCount + firstCard)>=5 && isFindSingleLine) {
        isFindSingleLine = false ;
        let lastCard = tmpCardDataArr[firstCard] ;
        singleLineCardArr = [lastCard];
        for (let i=firstCard+1; i<leftCardCount; i++){
            let cardData = tmpCardDataArr[i];
            let logicValueDiff = logic.getCardLogicValue(lastCard)-logic.getCardLogicValue(cardData);
            if (logicValueDiff !== 0) {
                lastCard = tmpCardDataArr[i] ;
                if (logicValueDiff !== 1){
                    //连续判断
                    if(singleLineCardArr.length<5) {
                        singleLineCardArr = [lastCard]
                    }
                    else break ;
                }else{
                    singleLineCardArr.push(lastCard);
                }
            }
        }

        //保存数据
        if(singleLineCardArr.length>=5 && (!turnCardData || (turnCardData.length <= singleLineCardArr.length))) {
            let index ;
            //所有连牌
            let curLineCount = 5;
            let curLineIndex = 0;
            while (curLineCount <= singleLineCardArr.length) {
                if (!!turnCardData && turnCardData.length > 0){
                    if (curLineCount !== turnCardData.length){
                        curLineIndex++;
                        if (curLineIndex + curLineCount > singleLineCardArr.length){
                            curLineIndex = 0;
                            curLineCount++;
                        }
                        continue;
                    }
                    if(logic.getCardLogicValue(singleLineCardArr[curLineIndex]) <= turnFirstCardLogicValue){
                        curLineIndex = 0;
                        curLineCount++;
                        continue;
                    }
                }
                index = cardTypeResult.cardTypeCount ;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cardType = gameProto.cardType.SINGLE_LINE ;
                cardTypeResult.cardDataArr[index] = singleLineCardArr.slice(curLineIndex, curLineIndex + curLineCount);
                cardTypeResult.eachHandCardCount[index] = curLineCount;
                cardTypeResult.cardTypeCount++ ;

                curLineIndex++;
                if (curLineIndex + curLineCount > singleLineCardArr.length){
                    curLineIndex = 0;
                    curLineCount++;
                }
            }

            logic.removeCard(singleLineCardArr, tmpCardDataArr) ;
            leftCardCount -= singleLineCardArr.length;
            isFindSingleLine = true ;
        }
    }
    return cardTypeResult;
};

// 获取对连类型
logic.getAllDoubleLineCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.DOUBLE_LINE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };

    let turnFirstCardLogicValue = !turnCardData?0:logic.getCardLogicValue(turnCardData[0]);

    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    let handCardCount = tmpCardDataArr.length;

    //连牌判断
    let firstCard = 0;
    //去除2和王
    for(let i=0 ; i<handCardCount ; ++i)	{
        if(logic.getCardLogicValue(tmpCardDataArr[i])<15){
            firstCard = i ;
            break ;
        }
    }

    let leftCardCount = handCardCount-firstCard ;
    let isFindDoubleLine = true ;
    let doubleLineCount = 0 ;
    let doubleLineCard = [];
    //开始判断
    while (leftCardCount>=6 && isFindDoubleLine) {
        let lastCard = tmpCardDataArr[firstCard] ;
        let sameCount = 1 ;
        doubleLineCount = 0 ;
        isFindDoubleLine=false ;
        for(let i=firstCard+1 ; i<leftCardCount+firstCard ; ++i){
            //搜索同牌
            while (logic.getCardLogicValue(lastCard)===logic.getCardLogicValue(tmpCardDataArr[i]) && i<leftCardCount+firstCard) {
                ++sameCount;
                ++i ;
            }

            let lastDoubleCardValue = 0;
            if(doubleLineCount>0) lastDoubleCardValue = logic.getCardLogicValue(doubleLineCard[doubleLineCount-1]) ;
            //重新开始
            if((sameCount<2 || (doubleLineCount>0 && (lastDoubleCardValue-logic.getCardLogicValue(lastCard))!==1)) && i<=leftCardCount+firstCard) {
                if(doubleLineCount>=6) break ;
                //回退
                if(sameCount>=2) i-=sameCount ;
                lastCard = tmpCardDataArr[i] ;
                doubleLineCount = 0 ;
            }
            //保存数据
            else if(sameCount>=2) {
                doubleLineCard[doubleLineCount] = tmpCardDataArr[i-sameCount];
                doubleLineCard[doubleLineCount+1] = tmpCardDataArr[i-sameCount+1];
                doubleLineCount += 2 ;

                //结尾判断
                if(i===(leftCardCount+firstCard-2))
                    if((logic.getCardLogicValue(lastCard)-logic.getCardLogicValue(tmpCardDataArr[i]))===1 && (logic.getCardLogicValue(tmpCardDataArr[i])===logic.getCardLogicValue(tmpCardDataArr[i+1]))) {
                        doubleLineCard[doubleLineCount] = tmpCardDataArr[i] ;
                        doubleLineCard[doubleLineCount+1] = tmpCardDataArr[i+1] ;
                        doubleLineCount += 2 ;
                        break ;
                    }

            }
            lastCard = tmpCardDataArr[i] ;
            sameCount = 1 ;
        }

        //保存数据
        if(doubleLineCount>=6) {
            let index ;

            //所有连牌
            let currentDoubleLineCount = 6 ;
            let currentDoubleLineIndex = 0;
            while ( currentDoubleLineCount <= doubleLineCount ) {
                if (!!turnCardData && turnCardData.length > 0){
                    if (currentDoubleLineCount !== turnCardData.length){
                        currentDoubleLineIndex+=2;
                        if (currentDoubleLineIndex + currentDoubleLineCount > doubleLineCount){
                            currentDoubleLineIndex = 0;
                            currentDoubleLineCount+=2;
                        }
                        continue;
                    }
                    if(logic.getCardLogicValue(doubleLineCard[currentDoubleLineIndex]) <= turnFirstCardLogicValue){
                        currentDoubleLineIndex = 0;
                        currentDoubleLineCount+=2;
                        continue;
                    }
                }

                index = cardTypeResult.cardTypeCount;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cardType = gameProto.cardType.DOUBLE_LINE ;
                cardTypeResult.cardDataArr[index] = doubleLineCard.slice(currentDoubleLineIndex, currentDoubleLineIndex + currentDoubleLineCount);
                cardTypeResult.eachHandCardCount[index] = currentDoubleLineCount;
                cardTypeResult.cardTypeCount++;

                currentDoubleLineIndex+=2;
                if (currentDoubleLineIndex + currentDoubleLineCount > doubleLineCount){
                    currentDoubleLineIndex = 0;
                    currentDoubleLineCount += 2 ;
                }
            }

            logic.removeCard(doubleLineCard, tmpCardDataArr);
            isFindDoubleLine=true ;
            leftCardCount -= doubleLineCount ;
        }
    }
    return cardTypeResult;
};

// 获取三连类型
logic.getAllThreeLineCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.THREE_LINE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let turnFirstCardLogicValue = !turnCardData?0:logic.getCardLogicValue(turnCardData[0]);
    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    let handCardCount = tmpCardDataArr.length;
    //连牌判断
    let firstCard = 0 ;
    //去除2和王
    for(let i=0 ; i<handCardCount ; ++i)	if(logic.getCardLogicValue(tmpCardDataArr[i])<15)	{firstCard = i ; break ;}

    let leftCardCount = handCardCount-firstCard ;
    let isFindThreeLine = true ;
    let threeLineCount = 0 ;
    let threeLineCardArr = [] ;
    //开始判断
    while (leftCardCount>=6 && isFindThreeLine) {
        let lastCard = tmpCardDataArr[firstCard] ;
        let sameCount = 1 ;
        threeLineCount = 0 ;
        isFindThreeLine = false ;
        for(let i=firstCard+1 ; i<leftCardCount+firstCard ; ++i){
            //搜索同牌
            while (logic.getCardLogicValue(lastCard)===logic.getCardLogicValue(tmpCardDataArr[i]) && i<leftCardCount+firstCard) {
                ++sameCount;
                ++i ;
            }

            let lastThreeCardValue ;
            if(threeLineCount>0) lastThreeCardValue = logic.getCardLogicValue(threeLineCardArr[threeLineCount-1]) ;

            //重新开始
            if((sameCount<3 || (threeLineCount>0&&(lastThreeCardValue-logic.getCardLogicValue(lastCard))!==1)) && i<=leftCardCount+firstCard) {
                if(threeLineCount>=6) break ;
                if(sameCount>=3) i-=sameCount ;
                lastCard = tmpCardDataArr[i] ;
                threeLineCount = 0 ;
            }
            //保存数据
            else if(sameCount>=3) {
                threeLineCardArr[threeLineCount] = tmpCardDataArr[i-sameCount] ;
                threeLineCardArr[threeLineCount+1] = tmpCardDataArr[i-sameCount+1] ;
                threeLineCardArr[threeLineCount+2] = tmpCardDataArr[i-sameCount+2] ;
                threeLineCount += 3 ;

                //结尾判断
                if(i===(leftCardCount+firstCard-3))
                    if((logic.getCardLogicValue(lastCard)-logic.getCardLogicValue(tmpCardDataArr[i]))===1 && (logic.getCardLogicValue(tmpCardDataArr[i])===logic.getCardLogicValue(tmpCardDataArr[i+1])) && (logic.getCardLogicValue(tmpCardDataArr[i])===logic.getCardLogicValue(tmpCardDataArr[i+2]))) {
                        threeLineCardArr[threeLineCount] = tmpCardDataArr[i] ;
                        threeLineCardArr[threeLineCount+1] = tmpCardDataArr[i+1] ;
                        threeLineCardArr[threeLineCount+2] = tmpCardDataArr[i+2] ;
                        threeLineCount += 3 ;
                        break ;
                    }

            }
            lastCard = tmpCardDataArr[i];
            sameCount = 1 ;
        }

        //保存数据
        if(threeLineCount>=6) {
            let index ;

            //所有连牌
            let currentCount = 6 ;
            let currentIndex = 0;
            while ( currentCount <= threeLineCount ) {
                if (!!turnCardData && turnCardData.length > 0) {
                    if (currentCount !== turnCardData.length) {
                        currentIndex += 3;
                        if (currentIndex + currentCount > threeLineCount) {
                            currentIndex = 0;
                            currentCount += 3;
                        }
                        continue;
                    }
                    if (logic.getCardLogicValue(threeLineCardArr[currentIndex]) <= turnFirstCardLogicValue) {
                        currentIndex = 0;
                        currentCount += 3;
                        continue;
                    }
                }

                index = cardTypeResult.cardTypeCount;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cardType = gameProto.cardType.THREE_LINE;
                cardTypeResult.cardDataArr[index] = threeLineCardArr.slice(currentIndex, currentIndex + currentCount);
                cardTypeResult.eachHandCardCount[index] = currentCount;
                cardTypeResult.cardTypeCount++;

                currentIndex += 3;
                if (currentIndex + currentCount > threeLineCount) {
                    currentIndex = 0;
                    currentCount += 3;
                }
            }

            logic.removeCard(threeLineCardArr, tmpCardDataArr) ;
            isFindThreeLine=true ;
            leftCardCount -= threeLineCount ;
        }
    }
    return cardTypeResult;
};

// 获取三带单类型
logic.getAllThreeLineTakeOneCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.THREE_LINE_TAKE_ONE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };

    let turnFirstCardLogicValue = 0;
    let turnCardThree;
    if (!!turnCardData){
        turnCardThree = this.getAllThreeCard(turnCardData);
        turnFirstCardLogicValue = logic.getCardLogicValue(turnCardThree[0]);
    }

    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();

    //移除炸弹
    let allBomCardDataArr = this.getAllBombCard(tmpCardDataArr);
    logic.removeCard(allBomCardDataArr, tmpCardDataArr);

    let handThreeCardArr = this.getAllThreeCard(tmpCardDataArr);
    let handThreeCount=handThreeCardArr.length;
    if (!turnCardData || (turnCardData.length === 4)) {
        let index ;
        //去掉三条
        let remainCardDataArr = tmpCardDataArr.slice();
        logic.removeCard(handThreeCardArr, remainCardDataArr);
        let remainCardCount = remainCardDataArr.length;
        //三条带一张
        for(let i=0; i<handThreeCount; i+=3){
            if (!!turnCardData && (logic.getCardLogicValue(handThreeCardArr[i])<=turnFirstCardLogicValue)) continue;
            //三条带一张
            for(let j=0; j<remainCardCount; ++j) {
                index = cardTypeResult.cardTypeCount ;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cbCardType = gameProto.cardType.THREE_LINE_TAKE_ONE ;
                cardTypeResult.cardDataArr[index][0] = handThreeCardArr[i] ;
                cardTypeResult.cardDataArr[index][1] = handThreeCardArr[i+1] ;
                cardTypeResult.cardDataArr[index][2] = handThreeCardArr[i+2] ;
                cardTypeResult.cardDataArr[index][3] = remainCardDataArr[j] ;
                cardTypeResult.eachHandCardCount[index] = 4 ;
                cardTypeResult.cardTypeCount++ ;
            }
        }
    }

    //三连带单
    let leftThreeCardCount=handThreeCount ;
    let isFindThreeLine=true ;
    let lastIndex=0 ;
    if(logic.getCardLogicValue(handThreeCardArr[0])===15) lastIndex=3 ;
    while (leftThreeCardCount + lastIndex>=6 && isFindThreeLine) {
        let lastLogicCard=logic.getCardLogicValue(handThreeCardArr[lastIndex]);
        let threeLineCard = [];
        let threeLineCardCount=3;
        threeLineCard[0]=handThreeCardArr[lastIndex];
        threeLineCard[1]=handThreeCardArr[lastIndex+1];
        threeLineCard[2]=handThreeCardArr[lastIndex+2];

        isFindThreeLine = false ;
        for(let j=3+lastIndex; j<leftThreeCardCount; j+=3){
            //连续判断
            if(1!==(lastLogicCard-(logic.getCardLogicValue(handThreeCardArr[j])))) {
                lastIndex = j ;
                if(leftThreeCardCount-j>=6) isFindThreeLine = true ;
                break;
            }
            lastLogicCard=logic.getCardLogicValue(handThreeCardArr[j]);
            threeLineCard[threeLineCardCount]=handThreeCardArr[j];
            threeLineCard[threeLineCardCount+1]=handThreeCardArr[j+1];
            threeLineCard[threeLineCardCount+2]=handThreeCardArr[j+2];
            threeLineCardCount += 3;
        }
        if(threeLineCardCount>3) {
            let index ;

            //移除三条（还应该移除炸弹王等）
            let remainCard = tmpCardDataArr.slice();
            logic.removeCard(handThreeCardArr, remainCard);
            let remainCardCount = remainCard.length;

            for(let start=0; start<threeLineCardCount-3; start+=3){
                //本顺数目
                let thisTreeLineCardCount = threeLineCardCount-start ;
                if(!!turnCardThree && (thisTreeLineCardCount!== turnCardThree.length || logic.getCardLogicValue(threeLineCard[0])<=turnFirstCardLogicValue)){
                    continue;
                }
                //单牌个数
                let singleCardCount=(thisTreeLineCardCount)/3;

                //单牌不够
                if(remainCardCount<singleCardCount) continue ;

                //单牌组合
                let comCard = [];
                let comResCard = [];
                this.combination(comCard, 0, comResCard, remainCard, singleCardCount, singleCardCount);
                let comResLen= comResCard.length;
                for(let i=0; i<comResLen; ++i){
                    index = cardTypeResult.cardTypeCount ;
                    if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                    cardTypeResult.cardType = gameProto.cardType.THREE_LINE_TAKE_ONE ;
                    //保存三条
                    let arr = threeLineCard.slice(start, threeLineCardCount);
                    cardTypeResult.cardDataArr[index] = arr;
                    //保存单牌
                    cardTypeResult.cardDataArr[index] = arr.concat(comResCard[i].slice(0, singleCardCount));

                    cardTypeResult.eachHandCardCount[index] = thisTreeLineCardCount+singleCardCount ;
                    cardTypeResult.cardTypeCount++ ;
                }
            }

            //移除三连
            isFindThreeLine = true ;
            logic.removeCard(threeLineCard, handThreeCardArr) ;
            leftThreeCardCount -= threeLineCardCount;
        }
    }
    return cardTypeResult;
};

// 获取三带对类型
logic.getAllThreeLineTakeTwoCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.THREE_LINE_TAKE_TWO,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();

    let turnFirstCardLogicValue = 0;
    let turnCardThree;
    if (!!turnCardData){
        turnCardThree = this.getAllThreeCard(turnCardData);
        turnFirstCardLogicValue = logic.getCardLogicValue(turnCardThree[0]);
    }

    let handThreeCard = this.getAllThreeCard(tmpCardDataArr);
    let handThreeCount = handThreeCard.length ;
    let remainCarData = tmpCardDataArr.slice();

    //移除三条（还应该移除炸弹王等）
    logic.removeCard(handThreeCard, remainCarData) ;
    let remainCardCount = remainCarData.length;

    //抽取对牌
    let allDoubleCardData = this.getAllDoubleCard(remainCarData);
    let allDoubleCardCount= allDoubleCardData.length;

    if (!turnCardData || (turnCardData.length === 5)){
        //三条带一对
        for(let i=0; i<handThreeCount; i+=3){
            let index ;
            if (!!turnCardData && (logic.getCardLogicValue(handThreeCard[i] <= turnFirstCardLogicValue))) continue;
            //三条带一对
            for(let j=0; j<allDoubleCardCount; j+=2){
                index = cardTypeResult.cardTypeCount ;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cardType = gameProto.cardType.THREE_LINE_TAKE_TWO ;
                cardTypeResult.cardDataArr[index][0] = handThreeCard[i] ;
                cardTypeResult.cardDataArr[index][1] = handThreeCard[i+1] ;
                cardTypeResult.cardDataArr[index][2] = handThreeCard[i+2] ;
                cardTypeResult.cardDataArr[index][3] = allDoubleCardData[j] ;
                cardTypeResult.cardDataArr[index][4] = allDoubleCardData[j+1] ;
                cardTypeResult.eachHandCardCount[index] = 5 ;
                cardTypeResult.cardTypeCount++ ;
            }
        }
    }

    //三连带对
    let leftThreeCardCount=handThreeCount ;
    let isFindThreeLine=true ;
    let lastIndex=0 ;
    if(logic.getCardLogicValue(handThreeCard[0])===15) lastIndex=3 ;
    while (leftThreeCardCount>=6 && isFindThreeLine) {
        let lastLogicCard=logic.getCardLogicValue(handThreeCard[lastIndex]);
        let threeLineCard = [];
        let threeLineCardCount=3;
        threeLineCard[0]=handThreeCard[lastIndex];
        threeLineCard[1]=handThreeCard[lastIndex+1];
        threeLineCard[2]=handThreeCard[lastIndex+2];

        isFindThreeLine=false ;
        for(let j=3+lastIndex; j<leftThreeCardCount; j+=3){
            //连续判断
            if(1!==(lastLogicCard-(logic.getCardLogicValue(handThreeCard[j])))) {
                lastIndex = j ;
                if(leftThreeCardCount-j>=6) isFindThreeLine = true ;
                break;
            }

            lastLogicCard=logic.getCardLogicValue(handThreeCard[j]);
            threeLineCard[threeLineCardCount]=handThreeCard[j];
            threeLineCard[threeLineCardCount+1]=handThreeCard[j+1];
            threeLineCard[threeLineCardCount+2]=handThreeCard[j+2];
            threeLineCardCount += 3;
        }
        if(threeLineCardCount>3) {
            let index ;

            for(let start=0; start<threeLineCardCount-3; start+=3){
                //本顺数目
                let thisTreeLineCardCount = threeLineCardCount-start ;
                if (!!turnCardData){
                    if (thisTreeLineCardCount !== turnCardThree.length) continue;
                    if (logic.getCardLogicValue(threeLineCard[start]) <= turnFirstCardLogicValue) break;
                }
                //对牌张数
                let doubleCardCount=((thisTreeLineCardCount)/3);
                //对牌不够
                if(remainCardCount<doubleCardCount) continue ;

                let doubleCardIndex = []; //对牌下标
                for(let i=0, j=0; i<allDoubleCardCount; i+=2, ++j){
                    doubleCardIndex[j]=i ;
                }

                //对牌组合
                let comCard = [];
                let comResCard = [];
                //利用对牌的下标做组合，再根据下标提取出对牌
                this.combination(comCard, 0, comResCard, doubleCardIndex, doubleCardCount, doubleCardCount);
                let comResLen = comResCard.length;

                for(let i=0; i<comResLen; ++i){
                    index = cardTypeResult.cardTypeCount ;
                    if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                    cardTypeResult.cardType = gameProto.cardType.THREE_LINE_TAKE_TWO ;
                    //保存三条
                    cardTypeResult.cardDataArr[index] = threeLineCard.slice(start, threeLineCardCount);
                    //保存对牌
                    for(let j=0, k=0; j<doubleCardCount; ++j, k+=2){
                        cardTypeResult.cardDataArr[index][thisTreeLineCardCount+k] = allDoubleCardData[comResCard[i][j]];
                        cardTypeResult.cardDataArr[index][thisTreeLineCardCount+k+1] = allDoubleCardData[comResCard[i][j]+1];
                    }
                    cardTypeResult.eachHandCardCount[index] = thisTreeLineCardCount+2*doubleCardCount ;
                    cardTypeResult.cardTypeCount++ ;
                }
            }
            //移除三连
            isFindThreeLine = true ;
            logic.removeCard(threeLineCard, handThreeCard) ;
            leftThreeCardCount -= threeLineCardCount ;
        }
    }
    return cardTypeResult;
};

// 获取四带单类型
logic.getAllFourLineTakeOneCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.FOUR_LINE_TAKE_ONE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    if (handCardDataArr.length < 6) return cardTypeResult;
    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    let handCardCount = tmpCardDataArr.length;

    let firstCard = 0 ;
    //去除王牌
    for(let i=0 ; i<handCardCount && i < 3; ++i){
        if(logic.getCardColor(tmpCardDataArr[i])!==0x40){
            firstCard = i ;
            break ;
        }
    }

    let handAllFourCardData = this.getAllBombCard(tmpCardDataArr.slice(firstCard));
    let handAllFourCardCount = handCardDataArr.length;

    if (handAllFourCardCount <= 0) return cardTypeResult;

    let turnAllFourCardData = [];
    let turnFirstCardLogicValue = 0;
    if (!!turnCardData){
        turnAllFourCardData = this.getAllBombCard(turnCardData);
        turnFirstCardLogicValue = logic.getCardLogicValue(turnAllFourCardData[0]);
    }

    if(!!turnCardData && logic.getCardLogicValue(handAllFourCardData[0]) <= turnFirstCardLogicValue) return cardTypeResult;


    let canOutFourCardData = [];
    let canOutFourCardCount = 0;
    if (!!turnCardData){
        //可出的牌
        for(let i=0; i<handAllFourCardCount; i+=4) {
            if(logic.getCardLogicValue(handAllFourCardData[i])>turnFirstCardLogicValue) {
                canOutFourCardData[canOutFourCardCount] = handAllFourCardData[i] ;
                canOutFourCardData[canOutFourCardCount+1] = handAllFourCardData[i+1] ;
                canOutFourCardData[canOutFourCardCount+2] = handAllFourCardData[i+2] ;
                canOutFourCardData[canOutFourCardCount+3] = handAllFourCardData[i+3] ;
                canOutFourCardCount += 4 ;
            }
        }
        if((handCardCount-canOutFourCardCount) < (turnCardData.length-turnAllFourCardData.length)) return cardTypeResult;
    }else{
        canOutFourCardData = handAllFourCardData;
        canOutFourCardCount = handCardDataArr.length;
    }

    let remainCard = tmpCardDataArr.slice();
    logic.removeCard(canOutFourCardData, remainCard);
    for(let start=0; start<canOutFourCardCount; start += 4){
        let index ;
        //单牌组合
        let comCard = [];
        let comResCard = [];
        //单牌组合
        this.combination(comCard, 0, comResCard, remainCard, 2, 2);
        for(let i=0; i<comResCard.length; ++i){
            //不能带对
            if(logic.getCardValue(comResCard[i][0])=== logic.getCardValue(comResCard[i][1])) continue;

            index=cardTypeResult.cardTypeCount ;
            cardTypeResult.cardDataArr[index] = canOutFourCardData.slice(start, start + 4);
            cardTypeResult.cardDataArr[index][4] = comResCard[i][0] ;
            cardTypeResult.cardDataArr[index][4+1] = comResCard[i][1] ;
            cardTypeResult.eachHandCardCount[index] = 6 ;
            cardTypeResult.cardTypeCount++ ;
        }
    }
    return cardTypeResult;
};

// 获取四带对类型
logic.getAllFourLineTakeTwoCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.FOUR_LINE_TAKE_TWO,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };

    if (handCardDataArr.length < 8) return cardTypeResult;
    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    let handCardCount = tmpCardDataArr.length;

    let firstCard = 0 ;
    //去除王牌
    for(let i=0 ; i<handCardCount && i<3 ; ++i)	if(logic.getCardColor(tmpCardDataArr[i])!==0x40)	{firstCard = i ; break ;}

    let handAllFourCardData = this.getAllBombCard(tmpCardDataArr.slice(firstCard));
    let handAllFourCardCount = handCardDataArr.length;

    if (handAllFourCardCount <= 0) return cardTypeResult;

    let turnAllFourCardData = [];
    let turnFirstCardLogicValue = 0;
    if (!!turnCardData){
        turnAllFourCardData = this.getAllBombCard(turnCardData);
        turnFirstCardLogicValue = logic.getCardLogicValue(turnAllFourCardData[0]);
    }

    if(!!turnCardData && logic.getCardLogicValue(handAllFourCardData[0])<turnFirstCardLogicValue) return cardTypeResult;


    let canOutFourCardData = [] ;
    let canOutFourCardCount=0 ;
    //可出的牌
    if (!!turnCardData){
        for(let i=0; i<handAllFourCardCount; i+=4){
            if(logic.getCardLogicValue(handAllFourCardData[i])>turnFirstCardLogicValue) {
                canOutFourCardData[canOutFourCardCount] = handAllFourCardData[i] ;
                canOutFourCardData[canOutFourCardCount+1] = handAllFourCardData[i+1] ;
                canOutFourCardData[canOutFourCardCount+2] = handAllFourCardData[i+2] ;
                canOutFourCardData[canOutFourCardCount+3] = handAllFourCardData[i+3] ;
                canOutFourCardCount += 4 ;
            }
        }
        if((handCardCount-canOutFourCardCount) < (turnCardData.length-turnAllFourCardData.length)) return cardTypeResult;
    }else{
        canOutFourCardData = handAllFourCardData;
        canOutFourCardCount = handCardCount;
    }

    let remainCard = tmpCardDataArr.slice();
    logic.removeCard(canOutFourCardData, remainCard);
    for(let start=0; start<canOutFourCardCount; start += 4){
        let allDoubleCardData = this.getAllDoubleCard(remainCard);
        let allDoubleCardCount= allDoubleCardData.length;

        let doubleCardIndex = [];
        for(let i=0, j=0; i<allDoubleCardCount; i+=2, ++j)
            doubleCardIndex[j]=i ;

        //对牌组合
        let comCard = [];
        let comResCard = [];

        //利用对牌的下标做组合，再根据下标提取出对牌
        this.combination(comCard, 0, comResCard, doubleCardIndex, 2, 2);
        for(let i=0; i<comResCard.length; ++i){
            let index = cardTypeResult.cardTypeCount ;
            cardTypeResult.cardDataArr[index] = canOutFourCardData.slice(start, start + 4);
            //保存对牌
            for(let j=0, k=0; j<2; ++j, k+=2){
                cardTypeResult.cardDataArr[index][4+k] = allDoubleCardData[comResCard[i][j]];
                cardTypeResult.cardDataArr[index][4+k+1] = allDoubleCardData[comResCard[i][j]+1];
            }

            cardTypeResult.eachHandCardCount[index] = 8 ;
            cardTypeResult.cardTypeCount++ ;
        }
    }
    return cardTypeResult;
};

// 获取炸弹类型
logic.getAllBombCardType= function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.BOMB_CARD,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let fourCardData = [];
    if(handCardDataArr.length>=2 && 0x4F===handCardDataArr[0] && 0x4E===handCardDataArr[1]) {
        let index = cardTypeResult.cardTypeCount ;
        cardTypeResult.cardDataArr[index] = [];
        cardTypeResult.cardType = gameProto.cardType.BOMB_CARD ;
        cardTypeResult.cardDataArr[index][0] = handCardDataArr[0] ;
        cardTypeResult.cardDataArr[index][1] = handCardDataArr[1] ;
        cardTypeResult.eachHandCardCount[index] = 2 ;
        cardTypeResult.cardTypeCount++ ;
        fourCardData = this.getAllBombCard(handCardDataArr.slice(2, handCardDataArr.length)) ;
    } else {
        fourCardData = this.getAllBombCard(handCardDataArr) ;
    }
    for (let i=0; i< fourCardData.length; i+=4){
        if (!!turnCardData && turnCardData.length > 0){
            if (logic.getCardLogicValue(fourCardData[i])<=logic.getCardLogicValue(turnCardData[0])) continue;
        }
        let index = cardTypeResult.cardTypeCount ;
        if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
        cardTypeResult.cardType = gameProto.cardType.BOMB_CARD ;
        cardTypeResult.cardDataArr[index][0] = fourCardData[i] ;
        cardTypeResult.cardDataArr[index][1] = fourCardData[i+ 1] ;
        cardTypeResult.cardDataArr[index][2] = fourCardData[i + 2] ;
        cardTypeResult.cardDataArr[index][3] = fourCardData[i + 3] ;
        cardTypeResult.eachHandCardCount[index] = 4 ;
        cardTypeResult.cardTypeCount++ ;
    }
    return cardTypeResult;
};

logic.analyseOutCardTypeActive = function(handCardDataArr, cardTypeResultArr){
    // 初始化结果
    for (let i = 0; i <= 12; ++i){
        cardTypeResultArr.push({
            cardTypeCount: 0,
            cardDataArr: [],
            eachHandCardCount: [],
            cardType: i
        })
    }
    cardTypeResultArr[gameProto.cardType.SINGLE] = this.getAllSingleCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.DOUBLE] = this.getAllDoubleCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.THREE] = this.getAllThreeCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.BOMB_CARD] = this.getAllBombCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.SINGLE_LINE] = this.getAllLineCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.DOUBLE_LINE] = this.getAllDoubleLineCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.THREE_LINE] = this.getAllThreeLineCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_ONE] = this.getAllThreeLineTakeOneCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_TWO] = this.getAllThreeLineTakeTwoCardType(handCardDataArr);
};