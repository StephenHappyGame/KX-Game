let roomProto = require("../../API/RoomProto");

let GOLD_BACK_TIME = 0.4;

cc.Class({
    extends: cc.Component,

    properties: {
        gameHeadRichCtrlArr: [require("GameHeadController")],
        gameHeadSelfCtrl: require("GameHeadController"),
        gameHeadShenSuanZiCtrl: require("GameHeadController"),
        onlineNode: cc.Node,
        betRootNode: cc.Node,
        chipNodeArr: [cc.Node],
        selectChipButtonArr: [cc.Button],
        betStartTipNode: cc.Node,
        betStopTipNode: cc.Node,
        waitTipNode: cc.Node,
        tipBgNode: cc.Node
    },

    start () {
        this.otherUserBetActionStartPos = Global.CCHelper.getRelativePosition(this.onlineNode, this.betRootNode);
        this.chipNumberArr = [1, 10, 50, 100, 500];
        this.curSelectedChipIndex = 0;
        this.chipArr = [];
        for (let i = 0; i < this.selectChipButtonArr.length; ++i){
            this.selectChipButtonArr[i].enabled = false;
            this.selectChipButtonArr[i].node.opacity = 150;
        }
        this.userBetCountList = {};

        this.profitPercentage = 0;
        this.kindID = 0;

        this.selectedChipArr = [];

        for (let i = 0; i < this.chipNumberArr.length; ++i){
            let node = Global.CCHelper.createSpriteNode("GameCommon/selected_chip_" + this.chipNumberArr[i]);
            node.active = false;
            node.parent = this.selectChipButtonArr[i].node;
            this.selectedChipArr.push(node);
        }

        Global.MessageCallback.addListener("RoomMessagePush", this);
    },

    onDestroy(){
        Global.MessageCallback.removeListener("RoomMessagePush", this);
    },

    messageCallbackHandler(router, msg){
        if(router === "RoomMessagePush"){
            if (msg.type === roomProto.GET_ROOM_SHOW_USER_INFO_PUSH){
                this.updateRoomUserInfo(msg.data);
            }else if (msg.type === roomProto.USER_LEAVE_ROOM_RESPONSE){
                Global.DialogManager.removeLoadingCircle();
            }
        }
    },

    buttonEvent(event, param){
        if (param === "exit"){
            Global.DialogManager.addPopDialog("是否要退出房间？", function () {
                // 发送退出房间的请求
                Global.API.room.roomMessageNotify(roomProto.userLeaveRoomNotify());
                Global.DialogManager.addLoadingCircle();
            }, function () {});
        }else if (param === "settings"){
            Global.DialogManager.createDialog("Setting/SettingDialog");
        }else if (param === "rule"){
            Global.DialogManager.createDialog("GameCommon/GameRule/GameRuleDialog", {kind: this.kindID});
        }else if (param === "online"){
            Global.DialogManager.createDialog("GameCommon/GameOnlineUser/GameOnlineUserDialog");
        }
    },

    betEvent(event, param){
        if (this.chipNumberArr.hasOwnProperty(param)){
            this.updateChipButtonState(true, param);
        }
    },

    onGameInit(profitPercentage, kindID){
        // 更新玩家信息
        Global.API.room.roomMessageNotify(roomProto.getRoomShowUserInfoNotify());

        // 记录返利比例
        this.profitPercentage = profitPercentage || 0;

        // kindID
        this.kindID = kindID || 0;
    },

    onReconnection(){
        // 删除筹码
        for (let i = 0; i < this.chipArr.length; ++i){
            this.chipArr[i].destroy();
        }
        this.chipArr = [];
        // 清理头像信息
        this.gameHeadSelfCtrl.updateInfo(null);
        this.gameHeadShenSuanZiCtrl.updateInfo(null);
        for (let i = 0; i < this.gameHeadRichCtrlArr.length; ++i){
            this.gameHeadRichCtrlArr[i].updateInfo(null);
        }
        // 隐藏下注筹码
        this.updateChipButtonState(false);
        this.curSelectedChipIndex = 0;
        // 停止动画
        this.betStartTipNode.active = false;
        this.betStopTipNode.active = false;
        this.waitTipNode.active = false;
        this.tipBgNode.active = false;
        // 清理数据
        this.userBetCountList = {};
    },

    // 游戏开始
    onGameStart(){
        this.userBetCountList = {};
        // 更新玩家信息
        Global.API.room.roomMessageNotify(roomProto.getRoomShowUserInfoNotify());

        this.showWait(false);
    },

    // 开始下注
    onGameBetStart(){
        // 播放动画
        this.betStartTipNode.active = true;
        this.betStartTipNode.stopAllActions();
        this.betStartTipNode.x = -1000;
        let actionIn = cc.moveTo(0.3, cc.v2(0,0));
        actionIn.easing(cc.easeIn(3.0));
        let actionOut = cc.moveTo(0.3, cc.v2(1000,0));
        actionOut.easing(cc.easeIn(3.0));
        this.betStartTipNode.runAction(cc.sequence([actionIn, cc.delayTime(0.5), actionOut, cc.callFunc(function () {
            this.betStartTipNode.active = false;
        }.bind(this))]));
        this.tipBgNode.active = true;
        this.tipBgNode.stopAllActions();
        this.tipBgNode.opacity = 0;
        this.tipBgNode.runAction(cc.sequence([cc.fadeTo(0.2, 255), cc.delayTime(0.7), cc.fadeTo(0.2, 0)]));
        // 显示可下筹码
        this.updateChipButtonState(true, 0);
        // 播放音效
        Global.AudioManager.playSound("GameCommon/Sound/bet_start");
    },

    // 停止下注
    onGameBetEnd(){
        // 播放动画
        this.betStopTipNode.active = true;
        this.betStopTipNode.stopAllActions();
        this.betStopTipNode.x = -1000;
        let actionIn = cc.moveTo(0.3, cc.v2(0,0));
        actionIn.easing(cc.easeIn(3.0));
        let actionOut = cc.moveTo(0.3, cc.v2(1000,0));
        actionOut.easing(cc.easeIn(3.0));
        this.betStopTipNode.runAction(cc.sequence([actionIn, cc.delayTime(0.5), actionOut, cc.callFunc(function () {
            this.betStopTipNode.active = false;
        }.bind(this))]));
        this.tipBgNode.active = true;
        this.tipBgNode.stopAllActions();
        this.tipBgNode.opacity = 0;
        this.tipBgNode.runAction(cc.sequence([cc.fadeTo(0.2, 255), cc.delayTime(0.7), cc.fadeTo(0.2, 0)]));
        // 禁用筹码
        this.updateChipButtonState(false);
        // 播放音效
        Global.AudioManager.playSound("GameCommon/Sound/bet_stop");
    },

    onGameResult(resultArr){
        let self = this;
        function showResult(data) {
            let ctrlArr = self.getGameHeadCtrlByUid(data.uid);
            if (data.score > 0){
                let uid = data.uid;
                let endPos = self.otherUserBetActionStartPos;
                if (!!ctrlArr[0]){
                    endPos = Global.CCHelper.getRelativePosition(ctrlArr[0].node, self.betRootNode);
                }
                for (let j = 0; j < self.chipArr.length; ++j){
                    let chipNode = self.chipArr[j];
                    if (chipNode.ownUid === uid){
                        chipNode.runAction(cc.sequence([cc.moveTo(GOLD_BACK_TIME, endPos), cc.removeSelf()]));
                        chipNode.ownUid = null;
                    }
                }
            }
            if (ctrlArr.length > 0){
                self.scheduleOnce(function () {
                    for (let i = 0; i < ctrlArr.length; ++i){
                        ctrlArr[i].goldChange(self.userBetCountList[data.uid], false);
                        if (data.score > 0){
                            ctrlArr[i].goldChange(data.score * (1 - (self.profitPercentage)/100), (i === 0));
                        }else{
                            ctrlArr[i].goldChange(data.score, (i === 0));
                        }
                    }
                }, GOLD_BACK_TIME);
            }
        }
        // 播放筹码动画
        for(let i = 0; i < resultArr.length; ++i){
            showResult(resultArr[i])
        }
        for (let i = 0; i < this.chipArr.length; ++i){
            let chipNode = this.chipArr[i];
            if (!!chipNode.ownUid ){
                chipNode.runAction(cc.sequence([cc.moveTo(GOLD_BACK_TIME, this.otherUserBetActionStartPos), cc.removeSelf()]));
                chipNode.ownUid = null;
            }
        }
        this.chipArr = [];
        // 播放音效
        Global.AudioManager.playSound("GameCommon/Sound/win_bet");
    },

    showWait(isShow){
        this.tipBgNode.active = isShow;
        this.tipBgNode.stopAllActions();
        this.tipBgNode.opacity = 255;
        this.waitTipNode.active = isShow;
    },

    userBet(uid, count, rect, isTween){
        if (count <= 0) return;
        let headCtrl = this.getGameHeadCtrlByUid(uid);
        if (headCtrl.length > 0 && isTween){
            headCtrl[0].execBet(isTween);
            this.execBet(uid, Global.CCHelper.getRelativePosition(headCtrl[0].node, this.betRootNode), rect, count, isTween);
            // 减少金额
            for (let i = 0; i < headCtrl.length; ++i){
                headCtrl[i].goldChange(count * -1, false);
            }
        }else{
            this.execBet(uid, this.otherUserBetActionStartPos, rect, count, isTween);
        }
        if(uid === Global.Player.getPy("uid")){
            this.updateChipButtonState(true, this.curSelectedChipIndex);
        }
        if(uid in this.userBetCountList){
            this.userBetCountList[uid] = this.userBetCountList[uid] + count;
        }else{
            this.userBetCountList[uid] = count;
        }
    },

    execBet(uid, startPosition, rect, count, isTween){
        for (let i = this.chipNumberArr.length - 1; i >= 0; --i){
            let chipNumber = this.chipNumberArr[i];
            let temp = Math.floor(count/chipNumber);
            while (temp-- > 0){
                count -= chipNumber;
                let endPosition = cc.v2(rect.x + Math.random() * rect.width, rect.y + Math.random() * rect.height);
                let node =cc.instantiate(this.chipNodeArr[i]);
                node.parent = this.betRootNode;
                if(!!isTween){
                    node.position = startPosition;
                    node.setScale(0.3);
                    let time = cc.v2(endPosition.x - startPosition.x, endPosition.y - startPosition.y).mag()/2000;
                    let action = cc.sequence([cc.spawn([cc.scaleTo(time, 1), cc.moveTo(time, endPosition)]), cc.scaleTo(0.3, 0.8)]);
                    node.runAction(action);
                }else{
                    node.setScale(0.8);
                    node.position = endPosition;
                }
                node.ownUid = uid;
                this.chipArr.push(node);
            }
        }
        if (isTween){
            if (count > 100){
                Global.AudioManager.playSound("GameCommon/Sound/bet_big");
            }else{
                Global.AudioManager.playSound("GameCommon/Sound/bet_small");
            }
        }
    },

    // 获取当前选择的筹码
    getCurChipNumber(){
        return this.chipNumberArr[this.curSelectedChipIndex] || 0;
    },

    // 更新界面显示玩家信息
    updateRoomUserInfo(data){
        this.gameHeadSelfCtrl.updateInfo(data.selfUserInfo.userInfo);
        this.gameHeadShenSuanZiCtrl.updateInfo(!!data.shenSuanZiInfo?data.shenSuanZiInfo.userInfo:null);
        if (!!data.fuHaoUserInfoArr){
            for (let i = 0; i < this.gameHeadRichCtrlArr.length; ++i){
                this.gameHeadRichCtrlArr[i].updateInfo(!!data.fuHaoUserInfoArr[i]?data.fuHaoUserInfoArr[i].userInfo:null);
            }
        }
    },

    // 通过ID获取头像节点
    getGameHeadCtrlByUid(uid){
        let ctrlArr = [];
        if (this.gameHeadSelfCtrl.getUid() === uid) ctrlArr.push(this.gameHeadSelfCtrl);
        if (this.gameHeadShenSuanZiCtrl.getUid() === uid) ctrlArr.push(this.gameHeadShenSuanZiCtrl);
        for (let i = 0; i < this.gameHeadRichCtrlArr.length; ++i){
            if (this.gameHeadRichCtrlArr[i].getUid() === uid) ctrlArr.push(this.gameHeadRichCtrlArr[i]);
        }
        return ctrlArr;
    },

    // 更新下注按钮状态
    updateChipButtonState(enableBet, selectIndex){
        this.curSelectedChipIndex = selectIndex;
        if(!!enableBet){
            let selfGold = this.gameHeadSelfCtrl.getUserInfo().gold;
            for(let i = 0; i < this.selectChipButtonArr.length; ++i){
                let chipButton = this.selectChipButtonArr[i];
                let enable = (this.chipNumberArr[i] < selfGold);
                chipButton.enabled = enable;
                chipButton.node.opacity = enable?255:150;
                chipButton.node.y = 0;

                this.selectedChipArr[i].active = false;
            }
            let selectedButton = this.selectChipButtonArr[selectIndex];
            if (selectedButton.enabled){
                selectedButton.node.y = 5;

                this.selectedChipArr[selectIndex].active = true;
            }else{
                if (selfGold > this.chipNumberArr[0]){
                    this.selectChipButtonArr[0].node.y = 5;
                    this.curSelectedChipIndex = 0;

                    this.selectedChipArr[0].active = true;
                }
            }
        }else{
            for(let i = 0; i < this.selectChipButtonArr.length; ++i){
                let chipButton = this.selectChipButtonArr[i];
                chipButton.enabled = false;
                chipButton.node.opacity = 150;
                chipButton.node.y = 0;

                this.selectedChipArr[i].active = false;
            }
            this.curSelectedChipIndex = 0;
        }
    }
});
