// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        recordItem: cc.Node,
        recordRootNode: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    addDirRecord: function (dirRecordArr) {
        this.index = this.index || 10000;
        for (let i = 0; i < dirRecordArr.length; ++i){
            let node = cc.instantiate(this.recordItem);
            node.active = true;
            node.zIndex = --this.index;
            node.parent = this.recordRootNode;
            let record = dirRecordArr[i];
            for (let j = 0; j < record.length; ++j){
                if (record[j] > 0){
                    Global.CCHelper.updateSpriteFrame("Game/BaiRenNiuNiu/img_record_win", node.getChildByName(j.toString()).getComponent(cc.Sprite));
                }
            }
        }
        let childrenArr = this.recordRootNode.getChildren();
        if (childrenArr.length > 11){
            let node =childrenArr[childrenArr.length - 2];
            node.removeFromParent(true);
        }
    },

    resetWidget: function () {
        let childrenArr = this.recordRootNode.getChildren();
        for (let i = 0; i < childrenArr.length; ++i){
            if (childrenArr[i] !== this.recordItem){
                childrenArr[i].removeFromParent(true);
            }
        }
    }

    // update (dt) {},
});
