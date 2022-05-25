cc.Class({
    extends: cc.Component,

    properties: {

        //用户信息
        nicknameText: cc.Label,
        scoreText: cc.Label,
        scoreText1: cc.Label,
        headIcon: cc.Sprite,

        gameBtnItem: cc.Prefab,
        gameBtnGroup: cc.Node,

        showItem: cc.Prefab,
        pageViewContent: cc.Node,

        gameGroup: cc.Node,
        roomGroup: cc.Node,

        roomItem: cc.Prefab,
        roomContent: cc.Node,
        gameTitleImg: cc.Sprite,

        topGroup: cc.Node,
        bottomGroup: cc.Node,
        backGroup: cc.Node,

        noticeRedPoint: cc.Node,

        broadcastNode: cc.Node,
        broadcastWidget: cc.Prefab
    },

    init: function () {
        this.updatePlayerInfo();

        this.showGameGroup();

        // 添加广播组件
        let node = cc.instantiate(this.broadcastWidget);
        node.parent = this.broadcastNode;
    },

    showNotice: function () {
        if (!Global.alreadyShowNotice) {
            Global.DialogManager.createDialog('Notice/NoticeListDialog');
            Global.alreadyShowNotice = true;
        }
    },

    updatePlayerInfo: function() {
        //大厅
        this.nicknameText.string = Global.Player.convertNickname(Global.Player.getPy('nickname'));
        this.scoreText.string = Global.Player.getPy('gold');
        this.scoreText1.string = Global.Player.getPy('gold');
        Global.CCHelper.updateSpriteFrame(Global.Player.getPy('avatar'), this.headIcon);
        this.noticeRedPoint.active = Global.Player.checkUnRead() !== 0;
    },

    checkJoinRoom: function () {
        //玩家在房间
        let roomID = Global.Player.getPy('roomID');
        if (!!roomID) {
            Global.DialogManager.createDialog("Match/MatchGameDialog", {roomID: roomID});
        }
    },

    createShowView: function () {
        for (let i = 0; i < 1; i ++) {
            let item = cc.instantiate(this.showItem);
            item.parent = this.pageViewContent;
        }
    },

    createGameItem: function () {
        let gameList = Global.GameTypes.allGames;
        let gameTypeArr = [];
        for (let i = 0; i < gameList.length; ++i){
            let temp = gameList[i];
            if (gameTypeArr.indexOf(temp.kind) === -1){
                gameTypeArr.push(temp.kind);
            }
        }
        //gameTypeArr.push('more');

        for (let i = 0; i < gameTypeArr.length; i+=2) {
            let item = cc.instantiate(this.gameBtnItem);
            item.parent = this.gameBtnGroup;
            item.getComponent('GameBtnItem').updateUI({game1: gameTypeArr[i], game2: gameTypeArr[i+1]}, function (data) {
                this.showRoomGroup(data);
            }.bind(this));
        }
    },

    showRoomGroup: function (kindId) {
        //更多游戏
        if (kindId === 'more') {
            Global.DialogManager.addTipDialog('敬请期待！');
            return;
        }

		// 德州单独处理
		if(kindId === Global.Enum.gameType.DZ) {
            Global.DialogManager.addLoadingCircle(1);
            Global.DialogManager.createDialog("Game/DeZhouPoker/RoomLayer/DZRoomLayerDialog", null, function() {
                Global.DialogManager.removeLoadingCircle();
            });
			return;
		}
        let data = Global.GameTypes.getLevelsByKind(kindId);
        if (data.length === 1) {
            Global.DialogManager.createDialog("Match/MatchGameDialog", {gameTypeID: data[0].gameTypeID});
            return;
        }

        Global.CCHelper.updateSpriteFrame('Hall/labelImg_game_' + kindId, this.gameTitleImg);
        this.roomContent.destroyAllChildren();
        for (let i = 0; i < data.length; i ++) {
            let item = cc.instantiate(this.roomItem);
            item.parent = this.roomContent;
            item.getComponent('RoomItem').updateUI(data[i]);
        }

        this.gameGroup.active = false;
        this.topGroup.active = false;
        this.bottomGroup.active = false;
        this.roomGroup.active = true;
        this.backGroup.active = true;
    },

    showGameGroup: function () {
        this.gameGroup.active = true;
        this.topGroup.active = true;
        this.bottomGroup.active = true;
        this.roomGroup.active = false;
        this.backGroup.active = false;
    },

    // use this for initialization
    onLoad: function () {
        //界面数据更新，填充
        //Global.MessageCallback.addListener('SelfEntryRoomPush', this);
        Global.MessageCallback.addListener('UpdateUserInfoUI', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);

        this.init();
        this.showNotice();
        this.createShowView();
        this.createGameItem();

        this.checkJoinRoom();

        Global.AudioManager.startPlayBgMusic("Hall/Sound/hall_bg_music");

        //延迟显示gameGroup，防止创建Sprite有闪动现象
        this.gameGroup.active = false;
        setTimeout(function () {
            this.gameGroup.active = true;
        }.bind(this), 100);
    },

    onDestroy: function() {
        //Global.MessageCallback.removeListener('SelfEntryRoomPush', this);
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
    },

    messageCallbackHandler: function(router, msg) {
        switch (router) {
            case 'SelfEntryRoomPush':
				this.enterGame(msg);
                break;
            case 'UpdateUserInfoUI':
            case 'ReConnectSuccess':
                this.updatePlayerInfo();
                break;
        }
    },

	enterGame: function(entryRoomData) {
		//console.log('enterGame', entryRoomData);
		Global.DialogManager.addLoadingCircle();
		// let gameType = Global.GameTypes.getCurrentGameType();
        let gameType = entryRoomData.kindId;
        let needLoad = [];

        switch (gameType) {
            case Global.Enum.gameType.ZJH:
                let ZJHModel = require('../../Game/ZhaJinHua/ZJHModel');
                ZJHModel.init(entryRoomData);
                needLoad = ['ZhaJinHua'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog('ZhaJinHua/UIPrefabs/ZhaJinHuaDialog', null, function () {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog('Hall/HallDialog');
                    })
                });
                break;
            case Global.Enum.gameType.NN:
                let NNModel = require('../../Game/Niuniu/NNModel');
                NNModel.setEntryRoomData(entryRoomData);
                needLoad = ['Niuniu'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("Niuniu/NNMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog('Hall/HallDialog');
                    });
                });
                break;
            case Global.Enum.gameType.TTZ:
                let TTZModel = require('../../Game/TuiTongZi/TTZModel');
                TTZModel.setEntryRoomData(entryRoomData);
                needLoad = ['TuiTongZi'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("TuiTongZi/TTZMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog('Hall/HallDialog');
                    });
                });
                break;
            case Global.Enum.gameType.LHD:
                let LHDModel = require('../../Game/LongHuDou/LHDModel');
                LHDModel.setEntryRoomData(entryRoomData);
                needLoad = ['LongHuDou'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("LongHuDou/LHDMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog('Hall/HallDialog');
                    });
                });
                break;
            case Global.Enum.gameType.HHDZ:
                let HHDZModel = require('../../Game/HongHeiDaZhan/HHDZModel');
                HHDZModel.init(entryRoomData);
                needLoad = ['HongHeiDaZhan'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog('HongHeiDaZhan/HHDZMainDialog', null, function () {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog('Hall/HallDialog');
                    });
                });
                break;
            case Global.Enum.gameType.BJL:
                let BJLModel = require('../../Game/BaiJiaLe/BJLModel');
                BJLModel.setEntryRoomData(entryRoomData);
                needLoad = ['BaiJiaLe'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("BaiJiaLe/BJLMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog('Hall/HallDialog');
                    });
                });
                break;
            case Global.Enum.gameType.FISH:
                needLoad = ['Fish'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("Fish/FishMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                    });
                });
                break;
            case Global.Enum.gameType.SSS:
                needLoad = ['ThirteenWater'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("ThirteenWater/TWMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                    });
                });
                break;
            case Global.Enum.gameType.DDZ:
                needLoad = ['Game/DDZ'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("Game/DDZ/DDZMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                    });
                });
                break;
			case Global.Enum.gameType.BJ:
			needLoad = ['Game/BlackJack'];
			Global.CCHelper.loadRes(needLoad, function () {
				Global.DialogManager.createDialog("Game/BlackJack/BJMainDialog", null, function() {
					Global.DialogManager.removeLoadingCircle();
					Global.DialogManager.destroyDialog("Hall/HallDialog");
				});
			});
			break;
            case Global.Enum.gameType.BRNN:
                needLoad = ['Game/BaiRenNiuNiu'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("Game/BaiRenNiuNiu/BRNNMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                    });
                });
                break;
            case Global.Enum.gameType.DZ:
                needLoad = ['Game/DeZhouPoker'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("Game/DeZhouPoker/DZMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                        if (Global.DialogManager.isDialogExit("Game/DeZhouPoker/RoomLayer/DZRoomLayerDialog")) Global.DialogManager.destroyDialog("Game/DeZhouPoker/RoomLayer/DZRoomLayerDialog", true);
                    });
                });
                break;
            case Global.Enum.gameType.PDK:
                needLoad = ['Game/PaoDeKuai'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("Game/PaoDeKuai/PDKMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                    });
                });
                break;
        }

        // if (Global.GameTypes.getCurrentKind() !== entryRoomData.kindId) {
        //     Global.DialogManager.addPopDialog('您已在游戏房间中，请先解散再加入别的游戏房间！');
        // }
	},

    onBtnClk: function (event, param) {
        switch (param) {
            case 'back':
                this.showGameGroup();
                break;
            case 'bank':
                Global.DialogManager.createDialog('Bank/BankDialog');
                break;
            case 'exchange':
                Global.DialogManager.createDialog('Bank/TiXianDialog');
                break;
            case 'commission':
                Global.DialogManager.createDialog('Commission/CommissionDialog');
                break;
            case 'head':
                Global.DialogManager.createDialog('UserInfo/UserInfoDialog');
                break;
            case 'rank':
                Global.DialogManager.createDialog('Rank/RankDialog');
                break;
            case 'notice':
                Global.DialogManager.createDialog('Notice/NoticeListDialog');
                break;
            case 'recharge':
            case 'addGold':
                Global.DialogManager.createDialog('Recharge/RechargeDialog');
                break;
        }

        Global.CCHelper.playPreSound();
    }
});
