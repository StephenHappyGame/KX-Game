let gameProto = require('./DZProto');
let gameLogic = require('./DZGameLogic');
cc.Class({
    extends: cc.Component,

    properties: {
        cardSpriteArr: [cc.Sprite],
        cardTypeSprite: cc.Sprite,
        lightNodeArr: [cc.Node]
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    onLoad () {
        this.cardPosArr = [this.cardSpriteArr[0].node.position, this.cardSpriteArr[1].node.position];
    },

    sendCard: function (cardDataArr, userStatus, index) {
        if (userStatus !== gameProto.gameStatus.PLAYING) return;
        this.node.active = true;

        this.cardDataArr = cardDataArr;

        this.cardSpriteArr[0].node.opacity = 255;
        this.cardSpriteArr[1].node.opacity = 255;

        this.cardSpriteArr[0].node.active = true;
        this.cardSpriteArr[1].node.active = true;

        this.cardSpriteArr[0].node.position = this.cardPosArr[0];
        this.cardSpriteArr[1].node.position = this.cardPosArr[1];


        if (index >= 0){
            Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", this.cardSpriteArr[0]);
            Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", this.cardSpriteArr[1]);

            // 添加发牌动画
            let startWorldPos = this.node.parent.parent.convertToWorldSpaceAR(cc.v2(0, 0));
            let moveTime = 0.3;
            function startAction(cardData, sprite, pos, delay) {
                let node = sprite.node;
                node.position = node.parent.convertToNodeSpaceAR(startWorldPos);
                let moveAction = cc.moveTo(moveTime, pos);
                // 其他玩家的牌则，放大再缩小
                if (!cardDataArr){
                    node.scale = 1/0.6;
                }
                moveAction = cc.spawn([moveAction, cc.scaleTo(moveTime, 1)]);
                let actionArr = [cc.delayTime(delay), moveAction];
                if (!!cardDataArr){
                    actionArr.push(cc.scaleTo(0.1, 0.01, 1));
                    actionArr.push(cc.callFunc(function () {
                        Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + cardData, sprite);
                    }.bind(this)));
                    actionArr.push(cc.scaleTo(0.1, 1, 1));
                }
                node.runAction(cc.sequence(actionArr));
            }

            for (let i = 0; i < this.cardSpriteArr.length; ++i){
                startAction(!!cardDataArr?cardDataArr[i]:null, this.cardSpriteArr[i], this.cardPosArr[i], 0.1 * i + index * 0.2 + 0.2);
            }
        }else{
            // 显示牌背
            if (!cardDataArr || cardDataArr.length === 0){
                Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", this.cardSpriteArr[0]);
                Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", this.cardSpriteArr[1]);

            }
            // 显示扑克牌
            else{
                Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + cardDataArr[0], this.cardSpriteArr[0]);
                Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + cardDataArr[1], this.cardSpriteArr[1]);
            }
        }
    },

    showCard: function (cardDataArr) {
        if (!cardDataArr || cardDataArr.length === 0) return;

        // 已显示的牌不再重复显示
        if (!!this.cardDataArr && this.cardDataArr.length > 0) return;

        function startAction(cardData, sprite, delay) {
            let node = sprite.node;
            let actionArr = [cc.delayTime(delay)];
            if (!!cardDataArr){
                actionArr.push(cc.scaleTo(0.1, 0.01, 1));
                actionArr.push(cc.callFunc(function () {
                    Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + cardData, sprite);
                }.bind(this)));
                actionArr.push(cc.scaleTo(0.1, 1, 1));
            }
            node.runAction(cc.sequence(actionArr));
        }

        for (let i = 0; i < this.cardSpriteArr.length; ++i){
            startAction(!!cardDataArr?cardDataArr[i]:null, this.cardSpriteArr[i], 0.1 * i);
        }
    },

    updatePublicCard: function (cardDataArr) {
        if (!this.cardDataArr || this.cardDataArr.length === 0) return;
        let arr = cardDataArr.concat(this.cardDataArr);
        let maxCardDataArr = gameLogic.fiveFromSeven(arr);
        let cardType = gameLogic.getCardType(maxCardDataArr);

        this.cardTypeSprite.node.parent.active = true;
        Global.CCHelper.updateSpriteFrame("Game/DeZhouPoker/self_card_type_" + cardType, this.cardTypeSprite);

        return maxCardDataArr;
    },

    resetWidget: function () {
        if (!this.cardPosArr || this.cardPosArr.length === 0) return;
        this.cardSpriteArr[0].node.active = false;
        this.cardSpriteArr[1].node.active = false;

        this.cardSpriteArr[0].node.position = this.cardPosArr[0];
        this.cardSpriteArr[1].node.position = this.cardPosArr[1];

        this.cardSpriteArr[0].node.opacity = 255;
        this.cardSpriteArr[1].node.opacity = 255;

        this.cardTypeSprite.node.parent.active = false;

        this.node.active = false;
    },
    
    giveUp: function (isSelf) {
        // 播放弃牌动画
        if (!isSelf){
            this.cardSpriteArr[0].node.active = true;
            this.cardSpriteArr[1].node.active = true;
        }
    },

    setCardDataArrLight: function (cardDataArr) {
        if (!this.cardDataArr) return;
        for (let i = 0; i < this.cardDataArr.length; ++i){
            this.lightNodeArr[i].active = cardDataArr.indexOf(this.cardDataArr[i]) !== -1;
        }
    }
});