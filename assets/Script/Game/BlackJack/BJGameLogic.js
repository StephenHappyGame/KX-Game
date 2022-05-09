let logic = module.exports;

//数值掩码
let MASK_VALUE =					0x0F;								//数值掩码


logic.getCardValue = function(cardData) {
    let value = cardData&MASK_VALUE;
    if (value >= 10) value = 10;
    if (value === 1) value = 11;
    return value;
};

logic.getCardPoint = function (cardDataArr) {  
    let count = 0;
    let ACardCount = 0;
    for (let i = 0; i < cardDataArr.length; ++i){
        let value = logic.getCardValue(cardDataArr[i]);
        if (value === 11 && (cardDataArr[i]&MASK_VALUE) === 1){
            ACardCount += 1;
        }
        count += value;
    }
    if (count > 21){
        count -= ACardCount * 10;
    }
    return count;
};

logic.getShowCardPoint = function(cardDataArr){
    let count = 0;
    let ACardCount = 0;
    for (let i = 0; i < cardDataArr.length; ++i){
        let value = logic.getCardValue(cardDataArr[i]);
        if (value === 11 && (cardDataArr[i]&MASK_VALUE) === 1){
            ACardCount += 1;
        }
        count += value;
    }
    if (count > 21 && !!ACardCount){
        count -= ACardCount * 10;
        return [count];
    }else{
        if (!!ACardCount){
            return [count, count - ACardCount * 10];
        }else{
            return [count];
        }
    }
};

logic.isBurst = function (cardDataArr) {  
    let point = logic.getCardPoint(cardDataArr);
    return point > 21;
};

logic.isCanCutCard = function (cardDataArr) {  
    if (cardDataArr.length !== 2) return false;
    return logic.getCardValue(cardDataArr[0]) === logic.getCardValue(cardDataArr[1]);
};