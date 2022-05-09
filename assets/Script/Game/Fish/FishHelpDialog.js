let fishConfig = require('./API/fishConfig');
cc.Class({
    extends: cc.Component,

    properties: {
        fishInfoItem: cc.Node
    },

    start () {
        for (let i = 0; i < fishConfig.fishType.length; ++i){
            let fishInfo = fishConfig.fishType[i];
            let node = cc.instantiate(this.fishInfoItem);
            node.getChildByName("Label").getComponent(cc.Label).string = fishInfo.rewardTimes + "倍";
            let sprite = node.getChildByName("fishSprite").getComponent(cc.Sprite);
            Global.CCHelper.updateSpriteFrame("Fish/Fish/fish" + fishInfo.resIndex + "_" + 1, sprite, function () {
                if (sprite.node.width > this.fishInfoItem.width - 10) {
                    sprite.node.scale = (this.fishInfoItem.width - 10)/sprite.node.width;
                }
            }.bind(this));
            node.active = true;
            node.parent = this.fishInfoItem.parent;
        }
    },

    onBtnClick(){
        Global.DialogManager.destroyDialog(this, true);
    }
});
