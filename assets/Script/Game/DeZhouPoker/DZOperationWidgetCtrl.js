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
        selfOperationNode: cc.Node,
        flowCountLabel: cc.Label,
        passNode: cc.Node,
        flowNode: cc.Node,
        allInNode: cc.Node,

        autoOperationNode: cc.Node,
        autoPass: cc.Toggle,
        autoGiveUp: cc.Toggle,
        flowAny: cc.Toggle,

        addBetNode: cc.Node,
        addBetProgressBar: cc.ProgressBar,
        progressHandler: cc.Node,

        curSelectCountLabel: cc.Label,
        allinNode: cc.Node,

        totalCount1Label: cc.Label,
        totalCount2_3Label: cc.Label,
        totalCount1_2Label: cc.Label
    },

    start () {
        // 添加点击拖动handler事件
        this.progressHandler.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            // 更新选择金币
            let minAddBetCount = (this.maxBetCount - this.curBetCount) + this.bigHideBetCount;
            // 金币不足最小加注额，只能allin
            if (minAddBetCount >= this.leftCount){
                this.addBetProgressBar.progress = 1;
                this.updateSelectBetCount();
                return;
            }
            let delta = event.getDelta();
            this.progressHandler.y += delta.y;
            let maxY = this.progressHandler.parent.height * 0.5 - 10;
            let minY = this.progressHandler.parent.height * -0.5 + 10;
            if (this.progressHandler.y > maxY) this.progressHandler.y = maxY;
            if (this.progressHandler.y < minY) this.progressHandler.y = minY;

            this.addBetProgressBar.progress = (this.progressHandler.y + maxY)/(this.progressHandler.parent.height - 20);
            this.addBetProgressBar.progress = Global.Utils.keepNumberPoint(this.addBetProgressBar.progress, 2);

            this.updateSelectBetCount();
        }.bind(this));
    },

    updateWidget: function (isSelfOperation, curBetCount, maxBetCount, leftCount, bigHideBetCount, totalBetCount, cb) {
        this.node.active = true;

        this.callback = cb;
        this.isSelfOperation = isSelfOperation;
        this.curBetCount = curBetCount;
        this.maxBetCount = maxBetCount;
        this.leftCount = leftCount;
        this.bigHideBetCount = bigHideBetCount;
        this.totalBetCount = totalBetCount;

        this.curSelectCount = 0;

        this.addBetNode.active = false;
        if (isSelfOperation){
            // 判断是否能自动操作,自动操作则直接返回
            if (this.checkAutoOperation()) return;

            this.selfOperationNode.active = true;
            this.autoOperationNode.active = false;

            this.autoPass.isChecked = false;
            this.autoGiveUp.isChecked = false;
            this.flowAny.isChecked = false;

            if (curBetCount >= maxBetCount){
                this.passNode.active = true;
                this.flowNode.active = false;
                this.allInNode.active = false;
            }else if (maxBetCount - curBetCount > leftCount){
                this.passNode.active = false;
                this.flowNode.active = false;
                this.allInNode.active = true;
            }else{
                this.passNode.active = false;
                this.flowNode.active = true;
                this.allInNode.active = false;

                this.flowCountLabel.string = Global.Utils.formatNumberToString(maxBetCount - curBetCount, 2);
            }
        }else{
            this.autoOperationNode.active = true;
            this.selfOperationNode.active = false;

            /*this.autoPass.isChecked = false;
            this.autoGiveUp.isChecked = false;
            this.flowAny.isChecked = false;*/
        }
    },

    checkAutoOperation: function () {
        // 是否选择自动过/弃
        if (this.autoGiveUp.isChecked){
            // 如果需要跟注则直接弃牌
            if (this.maxBetCount > this.curBetCount){
                Global.Utils.invokeCallback(this.callback, "giveup");
            }else{
                Global.Utils.invokeCallback(this.callback, "pass");
            }
            return true;
        }else if (this.autoPass.isChecked){
            if (this.maxBetCount <= this.curBetCount){
                Global.Utils.invokeCallback(this.callback, "pass");
                return true;
            }
        }else if (this.flowAny.isChecked){
            if (this.maxBetCount === this.curBetCount){
                Global.Utils.invokeCallback(this.callback, "pass");
                return true;
            }else{
                // 金币足够则跟注，金币不够则all in
                if (this.leftCount > this.maxBetCount - this.curBetCount){
                    Global.Utils.invokeCallback(this.callback, "flow", this.maxBetCount - this.curBetCount);
                    return true;
                }else{
                    Global.Utils.invokeCallback(this.callback, "flow", -1);
                    return true;
                }
            }
        }
        return false;
    },

    updateSelectBetCount: function () {
        let minBetCount = (this.maxBetCount - this.curBetCount) + this.bigHideBetCount;
        // 所剩金币不足最小下注金额，只能选择allin
        if (this.addBetProgressBar.progress === 1 || minBetCount >= this.leftCount){
            this.curSelectCountLabel.node.active = false;
            this.allinNode.active = true;

            this.curSelectCount = -1;
        }else{
            this.curSelectCountLabel.node.active = true;
            this.allinNode.active = false;

            this.curSelectCount = minBetCount + (this.leftCount - minBetCount) * this.addBetProgressBar.progress;
            this.curSelectCountLabel.string = Global.Utils.formatNumberToString(this.curSelectCount, 2);
        }
    },
    
    onBtnEvent: function (event, parameter) {
        if (parameter === "giveup"){
            if (!this.isSelfOperation) return;
            Global.DialogManager.addPopDialog("确定要弃牌吗？", function(){
                Global.Utils.invokeCallback(this.callback, "giveup");
            }.bind(this), function () {});
        } else if (parameter === "pass"){
            if (!this.isSelfOperation) return;
            if (this.curBetCount !== this.maxBetCount) return;
            this.addBetNode.active = false;
            Global.Utils.invokeCallback(this.callback, "pass");
        } else if (parameter === "flow"){
            if (!this.isSelfOperation) return;
            let betCount = this.maxBetCount - this.curBetCount;
            if (betCount <= 0) return;
            this.addBetNode.active = false;
            Global.Utils.invokeCallback(this.callback, "flow", betCount);
        } else if (parameter === "addBet"){
            if (!this.isSelfOperation) return;
            if (this.allInNode.active){
                Global.DialogManager.addTipDialog("金币不足无法加注");
                return;
            }
            if(!this.addBetNode.active){
                // 显示加注条
                this.addBetNode.active = true;
                // 如果所剩金币不足最小加注额，则只能all in
                let minBetCount = (this.maxBetCount - this.curBetCount) + this.bigHideBetCount;
                if (minBetCount >= this.leftCount){
                    this.addBetProgressBar.progress = 1;
                    this.progressHandler.y = this.progressHandler.parent.height * 0.5 - 10;
                } else{
                    this.addBetProgressBar.progress = 0;
                    this.progressHandler.y = this.progressHandler.parent.height * -0.5 + 10;
                }
                // 设置默认选择金额
                this.updateSelectBetCount();

                // 设置进度条
                this.addBetProgressBar.progress = 0;
                // 设置其他几个默认金额
                let minAddBetCount = (this.maxBetCount - this.curBetCount) + this.bigHideBetCount;
                // 1倍池低
                if (this.leftCount >= this.totalBetCount && this.leftCount > this.curSelectCount && this.totalBetCount >= minAddBetCount){
                    this.totalCount1Label.node.parent.active = true;
                    this.totalCount1Label.string = Global.Utils.formatNumberToString(this.totalBetCount, 2);
                }else{
                    this.totalCount1Label.node.parent.active = false;
                }
                // 2/3池低
                if (this.leftCount >= (this.totalBetCount * 2/3) && this.leftCount > this.curSelectCount && (this.totalBetCount * 2/3 >= minAddBetCount)){
                    this.totalCount2_3Label.node.parent.active = true;
                    this.totalCount2_3Label.string = Global.Utils.keepNumberPoint(this.totalBetCount * 2/3, 2).toString();
                }else{
                    this.totalCount2_3Label.node.parent.active = false;
                }
                // 1/2池低
                if (this.leftCount >= (this.totalBetCount / 2) && this.leftCount > this.curSelectCount && (this.totalBetCount / 2 >= minAddBetCount)){
                    this.totalCount1_2Label.node.parent.active = true;
                    this.totalCount1_2Label.string = Global.Utils.keepNumberPoint(this.totalBetCount * 1/2, 2).toString();

                }else{
                    this.totalCount1_2Label.node.parent.active = false;
                }
            }else{
                this.addBetNode.active = false;
                // 进行加注
                Global.Utils.invokeCallback(this.callback, "addBet", this.curSelectCount);
            }
        } else if (parameter === "count1"){
            if (!this.isSelfOperation) return;
            this.addBetNode.active = false;
            // 进行加注
            Global.Utils.invokeCallback(this.callback, "addBet", this.totalBetCount);
        } else if (parameter === "count2_3"){
            if (!this.isSelfOperation) return;
            this.addBetNode.active = false;
            // 进行加注
            Global.Utils.invokeCallback(this.callback, "addBet", Global.Utils.keepNumberPoint(this.totalBetCount * 2 / 3), 2);
        } else if (parameter === "count1_2"){
            if (!this.isSelfOperation) return;
            this.addBetNode.active = false;
            // 进行加注
            Global.Utils.invokeCallback(this.callback, "addBet", Global.Utils.keepNumberPoint(this.totalBetCount * 1 / 2), 2);
        } else if (parameter === "cancelAdd"){
            this.addBetNode.active = false;
        } else if (parameter === "autoPass"){
            this.autoGiveUp.isChecked = false;
            this.flowAny.isChecked = false;
        } else if (parameter === "autoGiveUp"){
            this.autoPass.isChecked = false;
            this.flowAny.isChecked = false;
        } else if (parameter === "flowAny"){
            this.autoPass.isChecked = false;
            this.autoGiveUp.isChecked = false;
        } else if (parameter === "allin"){
            if (!this.isSelfOperation) return;
            this.addBetNode.active = false;
            // 进行加注
            Global.Utils.invokeCallback(this.callback, "addBet", -1);
        }
    },

    resetWidget: function () {
        this.selfOperationNode.active = false;
        this.autoOperationNode.active = false;
        this.addBetNode.active = false;

        this.autoPass.isChecked = false;
        this.autoGiveUp.isChecked = false;
        this.flowAny.isChecked = false;

        this.callback = false;
    }

    // update (dt) {},
});
