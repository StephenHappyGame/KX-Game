let SHOW_CARD_INTERVAL = 0.5;
cc.Class({
    extends: cc.Component,

    properties: {
        cardSpriteArr: [cc.Sprite]
    },

    start () {

    },
    
    sendCard: function (cardDataArr, isTween, cb) {
        this.node.active = true;

        this.cardDataArr = this.cardDataArr || [];
        if (this.cardDataArr.length >= cardDataArr.length) {
            Global.Utils.invokeCallback(cb);
            return;
        }

        if (isTween){
            for (let i = this.cardDataArr.length; i < cardDataArr.length; ++i){
                this.showCard(this.cardSpriteArr[i], cardDataArr[i], SHOW_CARD_INTERVAL * (i - this.cardDataArr.length));
            }
            this.scheduleOnce(function () {
                this.cardDataArr = cardDataArr;
                Global.Utils.invokeCallback(cb);
            }.bind(this), (cardDataArr.length - this.cardDataArr.length ) * SHOW_CARD_INTERVAL);
        }else{
            // 显示牌
            for (let i = this.cardDataArr.length; i < cardDataArr.length; ++i){
                Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + cardDataArr[i], this.cardSpriteArr[i]);
                this.cardSpriteArr[i].node.active = true;
            }
            this.cardDataArr = cardDataArr;
            Global.Utils.invokeCallback(cb);
        }
    },

    showCard: function (sprite, cardData, delay) {
        sprite.node.stopAllActions();
        sprite.node.scale = 1;
        sprite.node.active = true;
        sprite.node.runAction(cc.sequence([cc.delayTime(delay), cc.scaleTo(0.2, 0.01, 1), cc.callFunc(function () {
            Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + cardData, sprite);
        }.bind(this)), cc.scaleTo(0.2, 1, 1)]));
    },

    resetWidget: function () {
        for (let i = 0; i < this.cardSpriteArr.length; ++i){
            let sprite = this.cardSpriteArr[i];
            sprite.node.getChildByName("light").active = false;
            if (!sprite.node.active) continue;
            sprite.node.stopAllActions();
            Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", this.cardSpriteArr[i]);
            sprite.node.active = false;
        }
        this.cardDataArr = null;
        this.unscheduleAllCallbacks();
    },

    setCardDataArrLight: function (cardDataArr, isSetHeight) {
        for (let i = 0; i < this.cardDataArr.length; ++i){
            if (cardDataArr.indexOf(this.cardDataArr[i]) !== -1){
                this.cardSpriteArr[i].node.getChildByName("light").active = true;
                if (isSetHeight){
                    this.cardSpriteArr[i].node.y = 15;
                }else{
                    this.cardSpriteArr[i].node.y = 0;
                }
            }else{
                this.cardSpriteArr[i].node.getChildByName("light").active = false;
                this.cardSpriteArr[i].node.y = 0;
            }
        }
    }
});
