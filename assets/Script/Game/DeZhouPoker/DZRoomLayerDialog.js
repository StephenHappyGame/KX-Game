cc.Class({
    extends: cc.Component,

    properties: {
        blindCountLabelArr: [cc.Label],
        preCountLabelArr: [cc.Label],
        minTakeCountLabelArr: [cc.Label],

        nickname: cc.Label,
        goldLabel: cc.Label,

        avatarSprite: cc.Sprite
    },

    start () {
        this.nickname.string = Global.Player.convertNickname(Global.Player.getPy('nickname'));
        this.goldLabel.string = Global.Utils.formatNumberToString(Global.Player.gold, 2);
        Global.CCHelper.updateSpriteFrame(Global.Player.getPy('avatar'), this.avatarSprite);

        for (let i = 0; i < 8; ++i){
            let gameTypeInfo = Global.GameTypes.getGameInfoByKindAndLevel(Global.Enum.gameType.DZ, i + 1);
            if (!!gameTypeInfo){
                let parameters = JSON.parse(gameTypeInfo.parameters);
                this.blindCountLabelArr[i].string = parameters["blindBetCount"] + "/" + (parameters["blindBetCount"] * 2);
                if (!!this.preCountLabelArr[i]){
                    this.preCountLabelArr[i].string = parameters["preBetCount"].toString();
                }
                this.minTakeCountLabelArr[i].string = gameTypeInfo.goldLowerLimit.toString();
            }else{
                this.minTakeCountLabelArr[i].string = "0";
                this.blindCountLabelArr[i].string = "0/0";
                if (!!this.preCountLabelArr[i]){
                    this.preCountLabelArr[i].string = "0";
                }
            }
        }
    },
    
    onBtnClick: function (event, parameter) {
        switch (parameter){
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
                let level = parseInt(parameter);
                let gameTypeInfo = Global.GameTypes.getGameInfoByKindAndLevel(Global.Enum.gameType.DZ, level);
                if (!gameTypeInfo){
                    Global.DialogManager.addPopDialog("房间未开启，请选择进入其他房间");
                    return;
                }
                Global.DialogManager.createDialog("Match/MatchGameDialog", {gameTypeID: gameTypeInfo.gameTypeID});
                break;
            case "record":
                Global.DialogManager.createDialog("Game/DeZhouPoker/RoomLayer/DZGameRecordDialog");
                break;
            case "help":
                Global.DialogManager.createDialog("Game/DeZhouPoker/RoomLayer/DZGameRuleDialog");
                break;
            case "back":
                Global.DialogManager.destroyDialog(this, true);
                break;
            case "preHelp":
                Global.DialogManager.createDialog("Game/DeZhouPoker/RoomLayer/DZPreBetRuleDialog");
                break;
        }
    }

    // update (dt) {},
});
