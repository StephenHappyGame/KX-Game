cc.Class({
    extends: cc.Component,

    properties: {
        tipLabel: cc.Label
    },

    onLoad () {
        Global.MessageCallback.addListener('SelfEntryRoomPush', this);

        if (this.dialogParameters.roomID){
            this.node.active = false;
            Global.Player.setPy('roomID', 0);
            Global.DialogManager.addLoadingCircle();
            Global.API.hall.joinRoomRequest(this.dialogParameters.roomID, function () {}, function () {
                Global.DialogManager.removeLoadingCircle();
            });
        }else{
            this.gameTypeID = this.dialogParameters.gameTypeID;
            let gameTypeInfo = Global.GameTypes.getGameInfoByGameTypeID(this.gameTypeID);
            if (Global.Player.gold < gameTypeInfo.goldLowerLimit){
                Global.DialogManager.destroyDialog(this);
                Global.DialogManager.addPopDialog("金币不足，无法匹配");
                return;
            } else if (gameTypeInfo.goldUpper > 0 && Global.Player.gold > gameTypeInfo.goldUpper){
                Global.DialogManager.destroyDialog(this);
                Global.DialogManager.addPopDialog("金币超过房间上限，无法匹配");
                return;
            }
            // 不需要匹配的游戏，直接请求
            if (!gameTypeInfo.matchRoom){
                this.node.active = false;
                Global.DialogManager.addLoadingCircle();
                Global.API.hall.matchRoomRequest(this.gameTypeID);
                return;
            }
            this.node.active = true;
            let index = 2;
            this.schedule(function () {
                index = ++index%3;
                if (index === 2){
                    this.tipLabel.string = "游戏即将开始，请耐心等待...";
                }else if (index === 1){
                    this.tipLabel.string = "游戏即将开始，请耐心等待..";
                }else{
                    this.tipLabel.string = "游戏即将开始，请耐心等待.";
                }
            }.bind(this), 1);

            Global.API.hall.matchRoomRequest(this.gameTypeID);
        }
    },

    onDestroy: function() {
        Global.MessageCallback.removeListener('SelfEntryRoomPush', this);
    },
    
    onBtnEvent: function () {
        Global.DialogManager.addLoadingCircle(1);
        Global.API.hall.stopMatchRoomRequest(function () {
            Global.DialogManager.removeLoadingCircle();
            Global.DialogManager.destroyDialog(this);
        }.bind(this));
    },

    messageCallbackHandler: function(router, msg) {
        switch (router) {
            case 'SelfEntryRoomPush':
                this.enterGame(msg);
                break;
        }
    },

    enterGame: function(entryRoomData) {
        Global.DialogManager.addLoadingCircle();
        let gameType = entryRoomData.kindId;
        let needLoad = [];
        switch (gameType) {
            case Global.Enum.gameType.ZJH:
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
                /*let ZJHModel = require('../../Game/ZhaJinHua/ZJHModel');
                ZJHModel.init(entryRoomData);*/
                needLoad = ['ZhaJinHua'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog('Game/ZhaJinHua/UIPrefabs/ZhaJinHuaDialog', null, function () {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog('Hall/HallDialog');
                    })
                });
                break;
            case Global.Enum.gameType.NN:
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
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
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
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
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
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
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
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
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
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
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
                needLoad = ['Fish'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("Fish/FishMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                    });
                });
                break;
            case Global.Enum.gameType.SSS:
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
                needLoad = ['ThirteenWater'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("ThirteenWater/TWMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                    });
                });
                break;
            case Global.Enum.gameType.DDZ:
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
                needLoad = ['Game/DDZ'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("Game/DDZ/DDZMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                    });
                });
                break;
            case Global.Enum.gameType.BJ:
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
                needLoad = ['Game/BlackJack'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("Game/BlackJack/BJMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                    });
                });
                break;
            case Global.Enum.gameType.BRNN:
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
                needLoad = ['Game/BaiRenNiuNiu'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("Game/BaiRenNiuNiu/BRNNMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                    });
                });
                break;
            case Global.Enum.gameType.DZ:
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog', "Game/DeZhouPoker/RoomLayer/DZRoomLayerDialog"]);
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
                Global.DialogManager.destroyAllDialog(['Hall/HallDialog']);
                needLoad = ['Game/PaoDeKuai'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("Game/PaoDeKuai/PDKMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog("Hall/HallDialog");
                    });
                });
                break;
        }
    },
});
