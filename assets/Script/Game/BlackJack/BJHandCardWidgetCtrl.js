let TWO_HAND_CARDS_OFFSET = 80;
cc.Class({
    extends: cc.Component,

    properties: {
        cardsWidget: cc.Prefab
    },

    onLoad () {
    },
    
    initWidget: function (cardDataArr) {
        if (!!this.cardsWidgetCtrlArr){
            for (let i = 0; i < this.cardsWidgetCtrlArr.length; ++i){
                this.cardsWidgetCtrlArr[i].node.destroy();
            }
        }
        this.cardsWidgetCtrlArr = [];
        this.cardDataArr = cardDataArr || [];
        this.operationIndex = -1;
        if (!cardDataArr) return;

        let cardsArrCount = (!!cardDataArr[0]?1:0) + (!!cardDataArr[1]?1:0);
        if (!!cardDataArr[0]){
            let node = cc.instantiate(this.cardsWidget);
            let ctrl = node.getComponent('BJCardsWidgetCtrl');
            this.cardsWidgetCtrlArr.push(ctrl);
            ctrl.initWidget(cardDataArr[0], false);
            if (cardsArrCount === 2){
                node.x = -TWO_HAND_CARDS_OFFSET;
            }
            node.parent = this.node;
        }
        if (!!cardDataArr[1]){
            let node = cc.instantiate(this.cardsWidget);
            let ctrl = node.getComponent('BJCardsWidgetCtrl');
            this.cardsWidgetCtrlArr.push(ctrl);
            ctrl.initWidget(cardDataArr[1], false);
            if (cardsArrCount === 2){
                node.x = TWO_HAND_CARDS_OFFSET;
            }
            node.parent = this.node;
        }
    },

    getCardDataArr: function(){
        return this.cardDataArr;
    },

    sendCard: function(cardDataArr, cb){
        this.cardDataArr = cardDataArr;
        let node = cc.instantiate(this.cardsWidget);
        let ctrl = node.getComponent('BJCardsWidgetCtrl');
        this.cardsWidgetCtrlArr.push(ctrl);
        ctrl.initWidget(cardDataArr[0], true, cb);
        node.parent = this.node;
    },

    addCard: function (index, cardDataArr, cb) {
        this.cardDataArr = cardDataArr;
        let arr = cardDataArr[index];
        this.cardsWidgetCtrlArr[index].addCard(arr[arr.length - 1], cb);
    },

    cutCard: function (cardDataArr, cb) {
        this.cardDataArr = cardDataArr;
        let cardNode = this.cardsWidgetCtrlArr[0].popCardNode();

        let node = cc.instantiate(this.cardsWidget);
        let ctrl = node.getComponent('BJCardsWidgetCtrl');
        this.cardsWidgetCtrlArr.push(ctrl);
        ctrl.initWidget();
        node.parent = this.node;
        ctrl.addCardNode(cardNode, cardDataArr[1][0]);

        this.cardsWidgetCtrlArr[0].hidePoints();
        this.cardsWidgetCtrlArr[0].node.runAction(cc.sequence([cc.moveTo(0.3, cc.v2(-TWO_HAND_CARDS_OFFSET, 0)),cc.delayTime(0.2), cc.callFunc(function () {
            this.cardsWidgetCtrlArr[0].addCard(cardDataArr[0][1], cb);
        }.bind(this))]));

        this.cardsWidgetCtrlArr[0].hidePoints();
        this.cardsWidgetCtrlArr[1].adjustCardPos();
        this.cardsWidgetCtrlArr[1].node.runAction(cc.sequence([cc.moveTo(0.3, cc.v2(TWO_HAND_CARDS_OFFSET, 0)),cc.delayTime(0.2), cc.callFunc(function () {
            this.cardsWidgetCtrlArr[1].addCard(cardDataArr[1][1]);
        }.bind(this))]));
        cardNode.runAction(cc.moveTo(0.3, cc.v2(0, 0)));
    },

    stopCard: function(index){
        // 计算分数
        this.operationIndex = -1;

        this.cardsWidgetCtrlArr[index].stopCard();
    },

    getCurOperationIndex: function(){
        return this.operationIndex;
    },

    showOperation: function (index) {
        this.operationIndex = index;
        this.cardsWidgetCtrlArr[index].showOperation(true);
        let ctrl = this.cardsWidgetCtrlArr[(index + 1)%2];
        if (!!ctrl){
            ctrl.showOperation(false);
        }
    },
    
    showBankerHandCard: function (cardDataArr, cb) {
        this.cardsWidgetCtrlArr[0].showBankerCardArr(cardDataArr, cb);
    }
});
