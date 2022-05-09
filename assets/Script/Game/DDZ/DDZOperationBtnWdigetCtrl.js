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
        callLandNode: cc.Node,
        outCardNode: cc.Node,
        readyNode: cc.Node
    },

    onLoad () {},

    startReady: function () {
        this.callLandNode.active = false;
        this.outCardNode.active = false;
        this.readyNode.active = true;
    },
    
    startCallLand: function (minScore) {
        this.callLandNode.active = true;
        this.outCardNode.active = false;
        this.readyNode.active = false;
        for (let i = 1;  i <= 3; ++i){
            let node = this.callLandNode.getChildByName(i.toString());
            if (!!node){
                node.active = minScore <= i;
            }
        }
    },
    
    startOutCard: function (isNewTurn) {
        this.callLandNode.active = false;
        this.outCardNode.active = true;
        this.readyNode.active = false;

        this.outCardNode.getChildByName('buchu').active = !isNewTurn;
        this.outCardNode.getChildByName('tip').active = !isNewTurn;
    },

    clearWidget: function () {
        this.callLandNode.active = false;
        this.outCardNode.active = false;
        this.readyNode.active = false;
    },

    getClockNode: function () {
        if (this.callLandNode.active) return this.callLandNode.getChildByName('selfClockNode');
        if (this.outCardNode.active) return this.outCardNode.getChildByName('selfClockNode');
        if (this.readyNode.active) return this.readyNode.getChildByName('selfClockNode');
        return null;
    }
});
