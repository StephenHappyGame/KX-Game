// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
        cards: [cc.Sprite],
        cardType: cc.Sprite
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.hideCards();
    },

    hideCards () {
        this.cardType.node.active = false;
        for (let i = 0; i < this.cards.length; i ++) {
            Global.CCHelper.updateSpriteFrame('GameCommon/Card/card_back', this.cards[i]);
        }
    },

    showCards (data) {
        Global.CCHelper.updateSpriteFrame('GameCommon/ZJHCardType/labelImg_cardType_' + data.cardType, this.cardType);
        this.scheduleOnce(function () {
            this.cardType.node.active = true;
            Global.AudioManager.playSound("HongHeiDaZhan/Sound/cardType_" + data.cardType);
        }.bind(this), 1.5);

        for (let i = 0; i < data.cards.length; i ++) {
            this.cardAnimation(this.cards[i].node, data.cards[i] + '', i);
        }
    },

    cardAnimation: function (card, cardData, index) {
        this.scheduleOnce(function () {
            Global.AudioManager.playSound('GameCommon/Sound/flipcard');
            let originalPos = {x: card.x, y: card.y};
            let originalScale = {x: card.scaleX, y: card.scaleY};
            let actions = [];
            actions[actions.length] = cc.moveBy(0.2, 10, originalPos.y);
            actions[actions.length] = cc.spawn([cc.scaleTo(0.1, 0.1, originalScale.y), cc.moveBy(0.1, -10, originalPos.y + 10)]);
            actions[actions.length] = cc.callFunc(function () {
                Global.CCHelper.updateSpriteFrame('GameCommon/Card/' + cardData, card.getComponent(cc.Sprite));
            }.bind(this));
            actions[actions.length] = cc.spawn([cc.scaleTo(0.1, originalScale.x, originalScale.y), cc.moveTo(0.1, originalPos.x, originalPos.y)]);
            actions[actions.length] = cc.moveTo(0.3, originalPos.x, originalPos.y).easing(cc.easeBackOut());
            card.runAction(cc.sequence(actions));
        }.bind(this), index * 0.5);
    },

    // update (dt) {},
});
