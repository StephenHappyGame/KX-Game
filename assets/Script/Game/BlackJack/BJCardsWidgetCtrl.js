let gameLogic = require("./BJGameLogic");
let CARD_OFFSET = 50;
let ADD_ONE_CARD_TIME = 1;
cc.Class({
    extends: cc.Component,

    properties: {
        pointRootNode: cc.Node,
        pointsLabel:  cc.Label,
        showOperationNode: cc.Node,
        cardNode: cc.Node
    },

    onLoad () {
    },
    
    initWidget: function (cardArr, isAnim, cb) {
        this.cardArr = [];
        this.cardNodeArr = [];
        if (!cardArr) return;
        if (cardArr.length === 1){
            cardArr.push(0);
        }

        if (isAnim){
            let self = this;
            let actions = [];
            function addAction(cardData, cb){
                actions.push(cc.callFunc(function () {
                    self.addCard(cardData, cb);
                }));
            }
            for (let i = 0; i < cardArr.length; ++i){
                if(i === cardArr.length - 1){
                    addAction(cardArr[i], cb);
                }else{
                    addAction(cardArr[i]);
                    actions.push(cc.delayTime(ADD_ONE_CARD_TIME));
                }
            }
            if (actions.length === 1){
                this.node.runAction(actions[0]);
            }else{
                this.node.runAction(cc.sequence(actions));
            }

        }else{
            for (let i = 0; i < cardArr.length; ++i){
                let node = Global.CCHelper.createSpriteNode("GameCommon/Card/" + (!!cardArr[i]?cardArr[i]:"card_back"));
                this.cardNodeArr.push(node);
                this.cardArr.push(cardArr[i]);
                node.x = CARD_OFFSET * (i - (cardArr.length)/2);
                node.parent = this.cardNode;
            }

            this.updatePoints();
        }
    },

    addCard: function (cardData, cb) {
        this.adjustCardPos();
        this.cardArr.push(cardData);
        this.scheduleOnce(function () {
            let node = Global.CCHelper.createSpriteNode("GameCommon/Card/card_back");
            node.x = CARD_OFFSET * (this.cardNodeArr.length - this.cardNodeArr.length/2);
            node.parent = this.cardNode;
            this.cardNodeArr.push(node);
            if (cardData !== 0){
                this.cardAnimation(node.getComponent(cc.Sprite), cardData, 0, cb);
            }
        }.bind(this), 0.3);
    },

    adjustCardPos: function(){
        for (let i = 0; i < this.cardNodeArr.length; ++i){
            let x = CARD_OFFSET * (i - (this.cardNodeArr.length)/2);
            this.cardNodeArr[i].runAction(cc.moveTo(0.25, cc.v2(x, 0)));
        }
    },

    stopCard: function(){
        let point = gameLogic.getCardPoint(this.cardArr);
        this.pointsLabel.string = point.toString();
        if (point > 21){
            this.pointRootNode.getChildByName("red").active = true;
            this.pointRootNode.getChildByName("blue").active = false;
            this.pointRootNode.getChildByName("green").active = false;
        }else{
            this.pointRootNode.getChildByName("red").active = false;
            this.pointRootNode.getChildByName("blue").active = false;
            this.pointRootNode.getChildByName("green").active = true;
        }
    },

    popCardNode: function(){
        this.cardArr.pop();
        return this.cardNodeArr.pop();
    },

    addCardNode: function(cardNode, cardData){
        cardNode.parent = this.cardNode;
        this.cardNodeArr.push(cardNode);
        this.cardArr.push(cardData);
    },

    showOperation: function (isShow) {
    },
    
    updatePoints: function () {
        // 更新点数
        this.pointsLabel.node.parent.active = true;
        let points = gameLogic.getShowCardPoint(this.cardArr);
        if (points.length === 1){
            this.pointsLabel.string = points[0].toString();
        }else{
            this.pointsLabel.string = points[1] + "/" + points[0];
        }

        if (points[0] > 21){
            this.pointRootNode.getChildByName("red").active = true;
            this.pointRootNode.getChildByName("blue").active = false;
            this.pointRootNode.getChildByName("green").active = false;
        }else if (points[0] === 21){
            this.pointsLabel.string = points[0].toString();
            this.pointRootNode.getChildByName("red").active = false;
            this.pointRootNode.getChildByName("blue").active = false;
            this.pointRootNode.getChildByName("green").active = true;
        }
    },

    hidePoints: function () {
        this.pointsLabel.node.parent.active = false;
    },

    cardAnimation: function (cardSprite, cardData, delayTime, cb) {
        let actions = [];
        let originalPos = {x: cardSprite.node.x, y: cardSprite.node.y};
        let originalScale = {x: cardSprite.node.scaleX, y: cardSprite.node.scaleY};
        actions.push(cc.delayTime(delayTime));
        actions.push(cc.callFunc(function () {
            Global.AudioManager.playSound('GameCommon/Sound/flipcard');
        }));
        actions.push(cc.moveBy(0.2, 10, originalPos.y));
        actions.push(cc.spawn([cc.scaleTo(0.1, 0.1, originalScale.y), cc.moveBy(0.1, -10, originalPos.y + 10)]));
        actions.push(cc.callFunc(function () {
            Global.CCHelper.updateSpriteFrame('GameCommon/Card/' + cardData, cardSprite);
        }));

        actions.push(cc.spawn([cc.scaleTo(0.1, originalScale.x, originalScale.y), cc.moveTo(0.1, originalPos.x, originalPos.y)]));
        let temp = cc.moveTo(0.3, originalPos.x, originalPos.y);
        temp.easing(cc.easeBackOut());
        actions.push(temp);

        actions.push(cc.callFunc(function () {
            this.updatePoints();
            Global.Utils.invokeCallback(cb);
        }.bind(this)));

        cardSprite.node.runAction(cc.sequence(actions));
    },

    showBankerCardArr:function (cardDataArr, cb) {
        if (this.cardArr.length === cardDataArr.length && !!this.cardArr[this.cardArr.length - 1]){
            Global.Utils.invokeCallback(cb);
            return;
        }
        if (this.cardArr.length !== 2 || this.cardNodeArr.length !== 2){
            this.clearWidget();
            this.initWidget([cardDataArr[0]], false);
        }
        this.cardArr[this.cardArr.length - 1] = cardDataArr[this.cardArr.length - 1];
        this.cardAnimation(this.cardNodeArr[this.cardNodeArr.length - 1].getComponent(cc.Sprite), this.cardArr[this.cardArr.length - 1], 0, function () {
            if (this.cardArr.length === cardDataArr.length){
                this.stopCard();
                Global.Utils.invokeCallback(cb);
                return;
            }
            let self = this;
            let actions = [];
            function addAction(cardData, cb){
                actions.push(cc.callFunc(function () {
                    self.addCard(cardData, cb);
                }));
            }
            for (let i = this.cardArr.length; i < cardDataArr.length; ++i){
                if(i === cardDataArr.length - 1){
                    addAction(cardDataArr[i], function () {
                        this.stopCard();
                        Global.Utils.invokeCallback(cb);
                    }.bind(this));
                }else{
                    addAction(cardDataArr[i]);
                    actions.push(cc.delayTime(ADD_ONE_CARD_TIME));
                }
            }
            if (actions.length === 1){
                this.node.runAction(actions[0]);
            }else{
                this.node.runAction(cc.sequence(actions));
            }
        }.bind(this));
    },
    
    clearWidget: function () {
        this.node.stopAllActions();

        this.unscheduleAllCallbacks();

        this.cardNode.removeAllChildren();
        this.cardArr = [];
        this.cardNodeArr = [];

        this.pointsLabel.node.parent.active = false;
    }
});
