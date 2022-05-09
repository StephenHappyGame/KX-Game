let TWO_HAND_CARDS_OFFSET = 80;
let CHIP_NUMBER = require('./BJProto').chipAmount;
let BET_OFFSET = 5;
cc.Class({
    extends: cc.Component,

    properties: {
        showBetCountWidget: cc.Prefab
    },

    onLoad () {
        this.chipNumberArr = CHIP_NUMBER;
        this.betNodeArr = [];
        this.totalBetNodeCount = 0;
        this.totalBetCount = 0;
    },

    initWidget: function(headPos, betCount, isDouble, isCut){
        this.cleanBet(true);
        this.betNodeArr = [];
        this.headPos = headPos;
        if (!betCount) return;
        let node = this.createBetNodes(betCount);
        if (isCut){
            node.parent = this.node;
            node.position = cc.v2(-TWO_HAND_CARDS_OFFSET, 0);
            this.betNodeArr.push(node);

            let betCountNode = cc.instantiate(this.showBetCountWidget);
            betCountNode.getChildByName("betCount").getComponent(cc.Label).string = parseFloat(betCount.toFixed(8)).toString();
            betCountNode.parent = node;

            let node2 = cc.instantiate(node);
            node2.parent = this.node;
            node2.position = cc.v2(TWO_HAND_CARDS_OFFSET, 0);
            this.betNodeArr.push(node);
        }else{
            node.parent = this.node;
            node.position = cc.v2(0, 0);
            this.betNodeArr.push(node);

            let betCountNode = cc.instantiate(this.showBetCountWidget);
            betCountNode.getChildByName("betCount").getComponent(cc.Label).string = parseFloat(betCount.toFixed(8)).toString();
            betCountNode.parent = node;
            if (isDouble){
                let node2 = cc.instantiate(node);
                node2.parent = this.node;
                node2.position = cc.v2(50, 0);
                this.betNodeArr.push(node);
            }
        }
    },

    createBetNodes: function (count) {
        let rootNode = new cc.Node();
        for (let i = this.chipNumberArr.length - 1; i >= 0; --i){
            let chipNumber = this.chipNumberArr[i];
            let temp = Math.floor(count/chipNumber);
            while (temp-- > 0){
                count -= chipNumber;
                let node = this.createBetNode(i);
                if (this.totalBetNodeCount > 10){
                    node.y = BET_OFFSET * 10;
                }else{
                    node.y = BET_OFFSET * this.totalBetNodeCount;
                }
                node.parent = rootNode;

                this.totalBetNodeCount++;
            }
        }
        return rootNode;
    },

    createBetNode: function(index){
        let node = Global.CCHelper.createSpriteNode("GameCommon/chip_" + this.chipNumberArr[index]);
        node.scale = 0.4;
        return node;
    },

    betCount: function (count) {
        if(!count) return;
        let betNodeRoot = this.createBetNodes(count);
        betNodeRoot.position = this.headPos;
        betNodeRoot.parent = this.node;
        this.betNodeArr.push(betNodeRoot);

        let betCountNode = cc.instantiate(this.showBetCountWidget);
        betCountNode.getChildByName("betCount").getComponent(cc.Label).string = parseFloat(count.toFixed(8)).toString();
        betCountNode.parent = betNodeRoot;

        betNodeRoot.runAction(cc.moveTo(0.3, cc.v2(0,0)));
    },

    addBetCount: function (count) {
        let index = 0;
        for (let i = this.chipNumberArr.length - 1; i >= 0; --i) {
            if (this.chipNumberArr[i] === count){
                index = i;
                break;
            }
        }
        let node = this.createBetNode(index);
        node.position = this.headPos;
        node.parent = this.node;
        let y;
        if (this.totalBetNodeCount > 10){
            y = BET_OFFSET * 10;
        }else{
            y = BET_OFFSET * this.totalBetNodeCount;
        }
        this.totalBetNodeCount++;

        this.totalBetCount += count;
        node.runAction(cc.sequence([cc.moveTo(0.3, cc.v2(0, y)), cc.callFunc(
            function () {
                this.cleanBet(false);
                let rootNode = this.createBetNodes(this.totalBetCount);
                rootNode.parent = this.node;
                this.betNodeArr.push(rootNode);

                let betCountNode = cc.instantiate(this.showBetCountWidget);
                betCountNode.getChildByName("betCount").getComponent(cc.Label).string = parseFloat(this.totalBetCount.toFixed(2)).toString();
                betCountNode.parent = rootNode;

                node.removeFromParent();
            }.bind(this)
        )]));
    },

    cleanBet: function (isCleanBetCount) {
        for (let i = 0; i < this.betNodeArr.length; ++i){
            this.betNodeArr[i].removeFromParent();
        }
        this.betNodeArr = [];

        for (let i = 0; i < this.node.children.length; ++i){
            let child = this.node.children[i];
            if (child.name === 'betCount') continue;
            child.destroy();
        }

        this.totalBetNodeCount = 0;
        if(isCleanBetCount){
            this.totalBetCount = 0;
        }
    },
    
    double: function () {
        let node = cc.instantiate(this.betNodeArr[0]);
        node.position = this.headPos;
        node.parent = this.node;
        this.betNodeArr.push(node);

        node.runAction(cc.moveTo(0.3, cc.v2(70,0)));
    },
    
    cutCard: function () {
        let node = cc.instantiate(this.betNodeArr[0]);
        node.position = this.headPos;
        node.parent = this.node;
        this.betNodeArr.push(node);

        this.betNodeArr[0].runAction(cc.moveTo(0.3, cc.v2(-TWO_HAND_CARDS_OFFSET,0)));
        node.runAction(cc.moveTo(0.3, cc.v2(TWO_HAND_CARDS_OFFSET, 0)))
    }
});
