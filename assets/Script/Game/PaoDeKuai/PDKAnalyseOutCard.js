let logic = require('./PDKGameLogic');
let gameProto = require('./PDKProto');

let exp = module.exports;

//分析单牌
exp.getAllSingleCard = function(handCardDataArr) {
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
exp.getAllDoubleCard = function(handCardDataArr) {
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
exp.getAllThreeCard = function(handCardDataArr) {
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
exp.getAllLineCard = function(handCardDataArr){
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
exp.getAllBombCard = function(handCardDataArr) {
    let handCardCount = handCardDataArr.length;
    //大小排序
    let temCardDataArr = logic.sortCardList(handCardDataArr.slice());

    let boomCardArr = [];
    if(handCardDataArr.length<4) return boomCardArr;

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

    return boomCardArr;
};

// 获取所有单张类型
exp.getAllSingleCardType = function (handCardDataArr, turnCardData) {
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
exp.getAllDoubleCardType = function (handCardDataArr, turnCardData) {
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
exp.getAllThreeCardType = function (handCardDataArr, turnCardData) {
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
exp.getAllLineCardType = function (handCardDataArr, turnCardData) {
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
exp.getAllDoubleLineCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.DOUBLE_LINE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };

    let turnFirstCardLogicValue = !turnCardData?0:logic.getCardLogicValue(turnCardData[0]);

    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    //连牌判断
    let leftCardCount = tmpCardDataArr.length ;
    let isFindDoubleLine = true ;
    let doubleLineCount = 0 ;
    let doubleLineCard = [];
    //开始判断
    while (leftCardCount>=4 && isFindDoubleLine) {
        let lastCard = tmpCardDataArr[0] ;
        let sameCount = 1 ;
        doubleLineCount = 0 ;
        isFindDoubleLine=false ;
        for(let i=1 ; i<leftCardCount ; ++i){
            //搜索同牌
            while (logic.getCardLogicValue(lastCard)===logic.getCardLogicValue(tmpCardDataArr[i]) && i<leftCardCount) {
                ++sameCount;
                ++i ;
            }

            let lastDoubleCardValue = 0;
            if(doubleLineCount>0) lastDoubleCardValue = logic.getCardLogicValue(doubleLineCard[doubleLineCount-1]) ;
            //重新开始
            if((sameCount<2 || (doubleLineCount>0 && (lastDoubleCardValue-logic.getCardLogicValue(lastCard))!==1)) && i<=leftCardCount) {
                if(doubleLineCount>=4) break ;
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
                if(i===(leftCardCount-2))
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
        if(doubleLineCount>=4) {
            let index ;

            //所有连牌
            let currentDoubleLineCount = 4 ;
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
exp.getAllThreeLineCardType = function (handCardDataArr, turnCardData) {
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
exp.getAllThreeLineTakeOneCardType = function (handCardDataArr, turnCardData) {
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
exp.getAllThreeLineTakeTwoCardType = function (handCardDataArr, turnCardData) {
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

// 获取炸弹类型
exp.getAllBombCardType= function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.BOMB_CARD,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let fourCardData = this.getAllBombCard(handCardDataArr) ;
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

exp.analyseOutCardTypeActive = function(handCardDataArr, cardTypeResultArr){
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

    cardTypeResultArr[gameProto.cardType.BOMB_CARD] = this.getAllBombCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.SINGLE_LINE] = this.getAllLineCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.DOUBLE_LINE] = this.getAllDoubleLineCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.THREE_LINE] = this.getAllThreeLineCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_ONE] = this.getAllThreeLineTakeOneCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_TWO] = this.getAllThreeLineTakeTwoCardType(handCardDataArr);
};
