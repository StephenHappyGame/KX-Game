cc.Class({
    extends: cc.Component,

    properties: {
        outCardNode: cc.Node,
        readyNode: cc.Node
    },

    onLoad () {},

    startReady: function () {
        this.outCardNode.active = false;
        this.readyNode.active = true;
    },
    
    startOutCard: function (isNewTurn, enablePass) {
        this.outCardNode.active = true;
        this.readyNode.active = false;

        this.outCardNode.getChildByName('buchu').active = !isNewTurn && enablePass;
        this.outCardNode.getChildByName('tip').active = !isNewTurn && !enablePass;
        this.outCardNode.getChildByName('outCard').active = !enablePass;
    },

    clearWidget: function () {
        this.outCardNode.active = false;
        this.readyNode.active = false;
    },

    getClockNode: function () {
        if (this.outCardNode.active) return this.outCardNode.getChildByName('selfClockNode');
        if (this.readyNode.active) return this.readyNode.getChildByName('selfClockNode');
        return null;
    }
});
