cc.Class({
    extends: cc.Component,

    properties: {
        cardSpriteArr: [cc.Sprite],
        cardTypeSprite: cc.Sprite
    },

    onLoad () {
        this.cardPosArr = [];
        for (let i = 0; i < this.cardSpriteArr.length; ++i){
            this.cardPosArr[i] = this.cardSpriteArr[i].node.position;
        }
    },

    sendCard(index, isTween){
        this.resetWidget();

        this.node.active = true;
        this.cardTypeSprite.node.parent.active = false;
        for (let i = 0; i < this.cardSpriteArr.length; ++i){
            this.cardSpriteArr[i].node.active = true;
        }
        if (!!isTween){
            let startWorldPos = this.node.parent.parent.convertToWorldSpaceAR(cc.v2(0, 0));
            for (let i = 0; i < this.cardSpriteArr.length; ++i){
                let node = this.cardSpriteArr[i].node;
                node.position = this.node.convertToNodeSpaceAR(startWorldPos);
                let moveAction = cc.moveTo(0.35, this.cardPosArr[i]);
                //moveAction.easing(cc.easeBackOut());
                node.runAction(cc.sequence([cc.delayTime(0.03 * i + index * 0.2 + 0.5), moveAction]));
            }
        }
    },

    showCard(cardDataArr, cardType, index){
        this.resetWidget();

        let self = this;
        function startAction(cardData, sprite, pos, cardType) {
            self.node.active = true;
            sprite.node.active = true;
            sprite.node.runAction(cc.sequence([cc.delayTime(0.7 * index + 1), cc.moveTo(0.3, cc.v2(0, 0)), cc.callFunc(
                function () {
                    Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + cardData, sprite);
                }.bind(self)
            ), cc.delayTime(0.05), cc.moveTo(0.3, pos), cc.callFunc(function () {
                if (cardType !== null){
                    // 牌类型
                    Global.CCHelper.updateSpriteFrame("Game/BaiRenNiuNiu/win_" + cardType, self.cardTypeSprite, function () {
                        self.cardTypeSprite.node.parent.active = true;
                    }.bind(self));
                }
            }.bind(self))]));
        }

        for (let i = 0; i < this.cardSpriteArr.length; ++i){
            startAction(cardDataArr[i], this.cardSpriteArr[i], this.cardPosArr[i], (i === 0)?cardType:null);
        }
    },

    resetWidget(){
        for (let i = 0; i < this.cardSpriteArr.length; ++i){
            this.cardSpriteArr[i].node.active = false;
            Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", this.cardSpriteArr[i]);

            this.cardSpriteArr[i].node.stopAllActions();
            this.cardSpriteArr[i].node.position = this.cardPosArr[i];
        }

        this.cardTypeSprite.node.parent.active = false;

        this.node.active = false;
    }
});
