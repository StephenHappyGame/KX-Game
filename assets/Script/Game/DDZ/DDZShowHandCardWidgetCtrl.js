cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        
    },
    
    initWidget: function (cardDataArr, index) {
        for(let i = 0; i < cardDataArr.length; ++i){
            let node = Global.CCHelper.createSpriteNode('Game/DDZ/CardSmall/' + cardDataArr[i]);
            node.parent = this.node;
        }
        if (index === 1){
            this.node.anchorX = 1;
        }else if (index === 2){
            this.node.anchorX = 0;
        }
    }
});
