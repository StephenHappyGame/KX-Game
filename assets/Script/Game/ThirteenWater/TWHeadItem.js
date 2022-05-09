var TWModel = require('./TWModel');
let RoomProto = require('../../API/RoomProto');
let GameProto = require('./TWProto');

cc.Class({
	extends: cc.Component,
	properties: {
		nameLabel: cc.Label,
		scoreLabel: cc.Label,
        typeSprite: cc.Node,
	},

	onLoad: function() {
		this.nameLabel.string = '';
		this.scoreLabel.string = '';
	},

	setChairId: function(chairId) {
        this.chairId = chairId;
		let player = TWModel.getPlayerByChairId(chairId);
		if (!player) {
            this.node.active = false;
            return;
		}
		this.node.active = true;
		this.uid = player.userInfo.uid;

        this.unscheduleAllCallbacks();

		this.updateUserInfo();

		if (((player.userStatus & RoomProto.userStatusEnum.READY) !== 0) && (TWModel.gameStatus === GameProto.GAME_STATUS_NOTSTART)){
		    this.setReady(true);
        }
	},
    
    setReady: function (isReady) {
	    //this.typeSprite.active = isReady;
    },

    onGameStart: function () {
        let player = TWModel.getPlayerByChairId(this.chairId);
        if (!player) return;
        player.userStatus = RoomProto.userStatusEnum.PLAYING;
	    this.setReady(false);
    },

	updateUserInfo: function () {
        let player = TWModel.getPlayerByChairId(this.chairId);
        if (!player) return;
        this.nameLabel.string = Global.Player.convertNickname(player.userInfo.nickname);
        this.scoreLabel.string = parseFloat(player.userInfo.gold.toFixed(2)).toString();
        let headSprite = this.node.getChildByName('HeadSprite');
        Global.CCHelper.updateSpriteFrame(player.userInfo.avatar, headSprite.getComponent(cc.Sprite));
    },

	getDaqiangCount: function(resout) {
		var memberCount = resout.cardsArr.length;
		var daqiangArr = [];
		for(var i = 0; i < resout.daqiangArr.length; ++i) {
			daqiangArr[i] = [];
			for(var j = 0; j < resout.daqiangArr[i].length; ++j) {
				daqiangArr[i][j] = resout.daqiangArr[i][j];
			}
		}
		// 怪牌打枪数据添加
		for(var k = 0; k < daqiangArr.length; ++k) {
			if(TWModel.getMianbai(k)) {
				for(var m = 0; m < daqiangArr.length; ++m) {
					if(m !== k && !TWModel.getMianbai(m)) {
						daqiangArr[k][m] = 2;
					}
				}
			}
		}
		var count = 0;
		for(i = 0; i < daqiangArr.length; ++i) {
			for(j = 0; j < daqiangArr[i].length; ++j) {
				if(daqiangArr[i][j] > 1) {
					++ count;
				}
			}
		}
		return count;
	}
});
