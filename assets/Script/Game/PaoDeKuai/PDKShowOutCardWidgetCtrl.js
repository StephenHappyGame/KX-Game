cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        
    },
    
    initWidget: function (cardDataArr, index) {
        for(let i = 0; i < cardDataArr.length; ++i){
            let node = Global.CCHelper.createSpriteNode('Game/PaoDeKuai/Card/' + cardDataArr[i]);
            node.parent = this.node;
        }
        if (index === 1){
            this.node.anchorX = 1;
        }else if (index === 2){
            this.node.anchorX = 0;
        }

        // 播放动画
        this.node.scale = 0.5 * 0.9;
        let action = cc.scaleTo(0.15, 0.5);
        action.easing(cc.easeBackOut());
        this.node.runAction(action)
    },

    getCenterPos: function () {
        if (this.node.anchorX === 1){
            return cc.v2(-30 * this.node.childrenCount, 0);
        }else if (this.node.anchorX === 0){
            return cc.v2(30 * this.node.childrenCount, 0);
        }else {
            return cc.v2(0, 0);
        }
    }
});
