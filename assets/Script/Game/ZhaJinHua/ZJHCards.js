let ZJHAudio = require('./ZJHAudio');
let ZJHProto = require('./GameProtoZJH');

cc.Class({
    extends: cc.Component,

    properties: {
        card: cc.Prefab,
        lookCardBtn: cc.Button,
        showCardBtn: cc.Button,
        cardTypeSprite: cc.Sprite
    },

    hideAllBtns: function () {
        this.lookCardBtn.node.active = false;
        this.showCardBtn.node.active = false;
    },

    showLookBtn: function () {
        // this.lookCardBtn.node.active = true;
        // this.showCardBtn.node.active = false;
    },

    showShowBtn: function () {
        // this.lookCardBtn.node.active = false;
        // this.showCardBtn.node.active = true;
    },

    /*onBtnClk: function (event, param) {
        if (param === "lookCard") {
            ZJHAudio.kanPai();

            api.lookCard();
        } else if (param === "showCard") {
            api.showdown();
        }

        this.hideAllBtns();
    },*/

    //看牌
    showCards: function (showType, cardType, cardDataArr) {
        //若要把牌show出来，则在头像上显示
        if (showType === 'showdown') {
            this.node.opacity = 255;
            this.node.x = 0;
            this.node.y = 20;
            this.setCardsPos(25);

            for (let i = 0; i < this.cards.length; i ++) {
                this.cards[i].scale = 0.95;
            }

            Global.CCHelper.updateSpriteFrame('GameCommon/ZJHCardType/labelImg_cardType_' + cardType, this.cardTypeSprite, function () {
                this.cardTypeSprite.node.active = true;
            }.bind(this));
        } else {
            if (this.alreadyShowCardsStatus) {
                return;
            }
        }

        if (cardDataArr) {
            for (let i = 0; i < cardDataArr.length; i ++) {
                this.cards[i].getComponent('ZJHCard').showKaBei();
                this.cardAnimation(this.cards[i], cardDataArr[i]);
                this.alreadyShowCardsStatus = true;
            }
        }

        this.scheduleOnce(function () {
            if (this.posIndex === 0 && cardType) {
                ZJHAudio.foldPai();

                this.cardTypeSprite.node.active = true;
                if (cardType === ZJHProto.CARD_TYPE_ZASE_235) {
                    Global.CCHelper.updateSpriteFrame('GameCommon/ZJHCardType/labelImg_cardType_' + ZJHProto.CARD_TYPE_DAN_ZHANG, this.cardTypeSprite);
                } else {
                    Global.CCHelper.updateSpriteFrame('GameCommon/ZJHCardType/labelImg_cardType_' + cardType, this.cardTypeSprite);
                }
            }
        }.bind(this), 0.5);
    },

    cardAnimation: function (card, cardData) {
        let originalPos = {x: card.x, y: card.y};
        let originalScale = {x: card.scaleX, y: card.scaleY};
        let actions = [];
        actions[actions.length] = cc.moveTo(0.2, -this.cardOffsetX, originalPos.y);
        actions[actions.length] = cc.spawn([cc.scaleTo(0.1, 0.1, originalScale.y), cc.moveTo(0.1, -this.cardOffsetX, originalPos.y + 10)]);
        actions[actions.length] = cc.callFunc(function () {
            card.getComponent('ZJHCard').setData(cardData);
        }.bind(this));
        actions[actions.length] = cc.spawn([cc.scaleTo(0.1, originalScale.x, originalScale.y), cc.moveTo(0.1, -this.cardOffsetX, originalPos.y)]);
        actions[actions.length] = cc.moveTo(0.3, originalPos.x, originalPos.y).easing(cc.easeBackOut());
        card.runAction(cc.sequence(actions));
    },

    //发牌动画
    setPos: function (posIndex, cardDataArr, chairPos, isTween) {
        this.posIndex = posIndex;
        this.chairPos = chairPos;
        this.cardDataArr = cardDataArr;

        let destScale = 0.7;
        if (posIndex === 0) {
            this.setCardsPos(42);
            destScale = 1;
        } else {
            this.hideAllBtns();
        }

        let offsetX = 135;
        let offsetY = 50;
        switch (posIndex) {
            case 0:
                this.node.x = 180;
                this.node.y = -10;
                break;
            case 1:
                this.node.x = -offsetX;
                this.node.y = -offsetY;
                break;
            case 2:
                this.node.x = -offsetX;
                this.node.y = -offsetY;
                break;
            case 5:
            case 3:
                this.node.x = offsetX;
                this.node.y = -offsetY;
                break;
            case 4:
                this.node.x = offsetX;
                this.node.y = -offsetY;
                break;
        }

        if (isTween) {
            for (let i = 0; i < this.cards.length; i ++) {
                let destX = this.cards[i].x;
                let destY = this.cards[i].y;

                this.cards[i].x = -chairPos.x - this.node.x;
                this.cards[i].y = -chairPos.y - this.node.y;

                let durTime = 0.3;
                let actions = [];
                actions[actions.length] = cc.delayTime(0.3 * i);
                actions[actions.length] = cc.callFunc(function () {
                    if (this.posIndex === 0) {
                        ZJHAudio.faPai();
                    }
                }.bind(this));
                actions[actions.length] = cc.spawn([cc.delayTime(posIndex * 0.1), cc.moveTo(durTime, destX, destY), cc.scaleTo(durTime, destScale, destScale), cc.rotateBy(durTime, 360, 360)]);
                this.cards[i].runAction(cc.sequence(actions));
            }
        }else{
            for (let i = 0; i < this.cards.length; i ++) {
                this.cards[i].scale = destScale;
            }
            if (cardDataArr){
                this.showCards(null, null, cardDataArr);
            }
        }
        this.node.active = true;
    },

    giveUpCardAnimation: function (card, index, chairPos) {
        let originalScale = {x: card.scaleX, y: card.scaleY};
        let originalPos = {x: card.x, y: card.y};
        let actions = [];
        let time = 0.5;
        actions[actions.length] = cc.delayTime(index * 0.1);
        actions[actions.length] = cc.spawn([cc.rotateBy(time, 360, 360), cc.moveTo(time, 0, -2 * chairPos.y).easing((cc.easeSineOut())), cc.scaleTo(time, 0.5, 0.5)]);
        actions[actions.length] = cc.callFunc(function () {
            card.scale = originalScale.x;
            card.y = originalPos.y - 200;
            card.x = originalPos.x;
        });
        actions[actions.length] = cc.delayTime((2 - index) * 0.1);
        actions[actions.length] = cc.moveTo(time, originalPos.x, originalPos.y);

        if (index === this.cards.length - 1) {
            actions[actions.length] = cc.callFunc(function () {
                this.giveUpCardAnimationCb();
            }.bind(this))
        }

        card.runAction(cc.sequence(actions));
    },

    giveUpCardAnimationCb: function () {
        if (!!this.giveUpCb) {
            this.giveUpCb();
        }
    },

    giveUpCards: function (isSelf, cb) {
        if (cb) {
            this.giveUpCb = cb;
        }

        if (isSelf) {
            for (let i = 0; i < this.cards.length; i ++) {
                this.giveUpCardAnimation(this.cards[i], i, this.chairPos);
            }
        } else {
            let actions = [];
            actions[actions.length] = cc.spawn([cc.fadeOut(0.5), cc.moveTo(0.5, -this.chairPos.x, -this.chairPos.y).easing(cc.easeSineOut())]);
            actions[actions.length] = cc.callFunc(function () {
                this.giveUpCardAnimationCb();
            }.bind(this));
            this.node.runAction(cc.sequence(actions));
        }
    },

    createCards: function () {
        this.cards = [];
        for (let i = 0; i < 3; i ++) {
            let card = cc.instantiate(this.card);
            card.parent = this.node;
            card.x = (i - 1) * 25;
            card.scale = 0.5;
            card.zIndex = -1;

            this.cards[i] = card;
        }
    },

    setCardsPos: function (offsetX) {
        this.cardOffsetX = offsetX;
        for (let i = 0; i < this.cards.length; i ++) {
            this.cards[i].x = (i - 1) * offsetX;
        }
    },

    // use this for initialization
    onLoad: function () {
        this.createCards();
        this.hideAllBtns();
        this.node.active = false;
        this.alreadyShowCardsStatus = false;
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
