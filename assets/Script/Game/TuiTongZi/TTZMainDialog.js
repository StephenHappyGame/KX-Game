var RoomMessageRouter = 'game.gameHandler.roomMessageNotify';
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';
var RoomProto = require('../../API/RoomProto');
var TTZProto = require('./TTZProto');
var TTZModel = require('./TTZModel');

cc.Class({
    extends: cc.Component,

    properties: {
		myHeadNode: cc.Node,
		cardsNode: cc.Node,
		touziNode: cc.Node,
		onLineMenu: cc.Node,
		deskLabel: cc.Label,
		cardLabel: cc.Label,
		coinButtons: cc.Node,
		tianmenAreaNode: cc.Node,
		zhongmenAreaNode: cc.Node,
		dimenAreaNode: cc.Node,
		audioItem: cc.Prefab,
    },

	start: function () {
		this.speed = 1500;
		this.pourCoinNodeArr = [];
		var myHeadCtrl = this.myHeadNode.getComponent('TTZHead');
		myHeadCtrl.setHeadMsg(TTZModel.getMyUid(), false);
		this.setCardLabel();
		this.reconnect();

		var audioItem = cc.instantiate(this.audioItem);
		audioItem.parent = this.node;
		this.audioManager = audioItem.getComponent('TTZAudioNode');
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
		Global.MessageCallback.addListener('ReConnectSuccess', this);
    },

	reconnect: function () {
		var gameStatus = TTZModel.getGameStatus();
		for(var i = this.pourCoinNodeArr.length-1; i >= 0; --i) {
			if(this.pourCoinNodeArr[i]) {
				this.pourCoinNodeArr[i].removeFromParent();
				this.pourCoinNodeArr.pop();
			}
		}
		if(gameStatus === TTZProto.GAME_STATUS_POUR){
			var dirArr = [TTZProto.TIANMEN, TTZProto.DIMEN, TTZProto.ZHONGMEN];
			for(i = 0; i < dirArr.length; ++i) {
				var pourGold = TTZModel.getPourGoldOnDir(dirArr[i]);
				this.playerPourGold(null, dirArr[i], pourGold);
			}
		}
		else if(gameStatus === TTZProto.GAME_STATUS_RESOUT){
			Global.DialogManager.createDialog('TuiTongZi/TTZResoutDialog', TTZModel.getResout());
		}
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
		Global.MessageCallback.removeListener('ReConnectSuccess', this);
	},

	messageCallbackHandler: function (router, msg) {
		var myUid = TTZModel.getMyUid();
		if(router === 'RoomMessagePush') {
			if(msg.type === RoomProto.USER_LEAVE_ROOM_RESPONSE) {
				if(msg.data.chairId === TTZModel.getMyChairId()) {
					Global.DialogManager.removeLoadingCircle();
				}
			}
			else if(msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				if(msg.data.roomUserInfo.userInfo.uid === myUid) {
				    this.exitGame();
				}
			}
			//else if(msg.type === RoomProto.USER_RECONNECT_PUSH) {
			//	TTZModel.setEntryRoomData(msg.data);
			//	this.reconnect();
			//}
		}
		else if(router === 'GameMessagePush') {
			if(msg.type === TTZProto.GAME_BANKERCHANGE_PUSH) {		// 换庄推送
				this.setCardLabel(msg.data.bureau);
			}
			else if(msg.type === TTZProto.GAME_POURGOLD_PUSH) {		// 下注推送
				this.playerPourGold(msg.data.uid, msg.data.direction, msg.data.pourGold);
			}
			else if(msg.type === TTZProto.GAME_RESOUT_PUSH) {		// 结果推送
				this.scheduleOnce(function() {
					this.answerGameResout(msg.data.resout);
				}.bind(this), 10);
			}
			else if(msg.type === TTZProto.GAME_BUREAU_PUSH) {		// 局数变化推送
				this.setCardLabel(msg.data.bureau);
			}
			else if(msg.type === RoomProto.USER_RECONNECT_PUSH) {
				Global.DialogManager.destroyDialog('TuiTongZi/TTZMainDialog');
				TTZModel.setGameData(msg.data.gameData);
				Global.DialogManager.createDialog('TuiTongZi/TTZMainDialog');
			}
		}
		else if(router === 'ReConnectSuccess') {
			//Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
			if(Global.Player.isInRoom()) {
				Global.API.hall.joinRoomRequest(TTZModel.getRoomId(), function() {
					Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
				});
			} else {
				Global.DialogManager.addPopDialog('当前房间已解散！', function () {
					this.exitGame();
				}.bind(this), null, true);
			}
		}
	},

	onButtonClick: function (event, param) {
		if(param === 'tianmen' || param === 'zhongmen' || param === 'dimen') {
			this.tempToPourGold(param);
		}
		else if(param === 'rule') {
			Global.DialogManager.createDialog('GameCommon/GameRule/GameRuleDialog', {kind: Global.Enum.gameType.TTZ});
		}
		else if(param === 'close') {
			Global.DialogManager.addPopDialog('确认退出游戏?', function() {
				Global.NetworkManager.notify(RoomMessageRouter, RoomProto.userLeaveRoomNotify());
				Global.DialogManager.addLoadingCircle();
			}, function() {});
		}
        else if(param === 'setting') {
			var self = this;
            Global.DialogManager.createDialog('Setting/SettingDialog', {
				callback: self.audioManager.setVolume.bind(self.audioManager)
			});
        }
		else if(param === 'on_line') {
            Global.DialogManager.createDialog("GameCommon/GameOnlineUser/GameOnlineUserDialog");
		}
	},

	// 尝试下注
	tempToPourGold: function (param) {
		var dir = TTZProto.DIMEN;
		if(param === 'tianmen') {
			dir = TTZProto.TIANMEN;
		} 
		else if(param === 'zhongmen') {
			dir = TTZProto.ZHONGMEN;
		} 

		var gameStatus = TTZModel.getGameStatus();
		if(gameStatus !== TTZProto.GAME_STATUS_POUR) {
			console.log('can not pour gold');
			return;
		}
		else if(TTZModel.getMyUid() === TTZModel.getBankerUid()) {
			console.log('banker can not pour gold');
			return;
		}
		var pourGold = TTZModel.getChooseCoin();
		var me = TTZModel.getMe();
		var alPourGold = TTZModel.getMyPourGold();
		if(pourGold > me.userInfo.gold - alPourGold) {
			console.log('error: not enough gold');
		} else {
			Global.NetworkManager.notify(GameMessageRouter, TTZProto.pourGoldRequestData(pourGold, dir));
		}
	},

	// 下注
	playerPourGold: function (uid, dir, pourGold) {
		var goldArr = [];
		var coinArr = [500, 100, 50, 10, 1];
		var count, startPos;
		for(var i = 0; i < coinArr.length; ++i) {
			count = Math.floor(pourGold/coinArr[i])%10;
			goldArr.push(count);
			pourGold -= count * coinArr[i];
		}
		if(uid === TTZModel.getMyUid()) {
			startPos = this.myHeadNode.getPosition();
			if(uid === TTZModel.getBankerUid()) {
				startPos = this.node.getChildByName('ReturnButton').getPosition();
			}
		}
		else if(uid === TTZModel.getBankerUid()) {
			startPos = this.node.getChildByName('WomanNode').getPosition();
		} else {
			startPos = this.onLineMenu.getPosition();
		}
		var node;
		for(i = 0; i < goldArr.length; ++i) {
			for(var j = 0; j < goldArr[i]; ++j) {
				node = this.getCoinNode(coinArr[i]);
				node.coin = coinArr[i];
				this.pourGoldAnimal(node, startPos, dir);
			}
		}
		pourGold = TTZModel.getPourGoldOnDir(dir);
		var myPour = TTZModel.getMyPourGoldOnDir(dir);
		if(dir === TTZProto.TIANMEN) {
			this.tianmenAreaNode.getChildByName('PourLabel').getComponent(cc.Label).string = pourGold;
			this.tianmenAreaNode.getChildByName('MyPourLabel').getComponent(cc.Label).string = myPour;
		} 
		else if (dir === TTZProto.ZHONGMEN) {
			this.zhongmenAreaNode.getChildByName('PourLabel').getComponent(cc.Label).string = pourGold;
			this.zhongmenAreaNode.getChildByName('MyPourLabel').getComponent(cc.Label).string = myPour;
		}
		else if (dir === TTZProto.DIMEN) {
			this.dimenAreaNode.getChildByName('PourLabel').getComponent(cc.Label).string = pourGold;
			this.dimenAreaNode.getChildByName('MyPourLabel').getComponent(cc.Label).string = myPour;
		}
	},

	myWinGold: function (dir, gold) {
		console.log('myWinGold', dir, gold);
		var chooseAreaNodeArr = [this.tianmenAreaNode, this.zhongmenAreaNode, this.dimenAreaNode];
		var chooseAreaNode = chooseAreaNodeArr[dir];
		var chooseAreaNodePos = chooseAreaNode.getPosition();
		var goldArr = [1000, 500, 100, 50, 10];
		var countArr = [];
		var count, node;
		for(var i = 0; i < goldArr.length; ++i) {
			count = Math.floor(gold/goldArr[i]);
			countArr.push(count);
			gold -= count * goldArr[i];
		}
		var startPos, endPos, moveTm;
		endPos = this.myHeadNode.getPosition();
		endPos = cc.v2(endPos.x-chooseAreaNodePos.x, endPos.y-chooseAreaNodePos.y);
		var recordNodeArr = [];
		var dirArr = [TTZProto.TIANMEN, TTZProto.ZHONGMEN, TTZProto.DIMEN];
		for(i = 0; i < countArr.length; ++i) {
			for(var j = this.pourCoinNodeArr.length-1; j >= 0 && countArr[i] > 0; --j) {
				node = this.pourCoinNodeArr[j];
				if(node.coin === goldArr[i] && countArr[i] > 0 && dirArr[dir] === node.dir) {
					this.pourCoinNodeArr.splice(j, 1);
					recordNodeArr.push(node);
					-- countArr[i];
					startPos = node.getPosition();
					moveTm = Global.Utils.getDist(startPos, endPos)/this.speed;
					node.runAction(cc.moveTo(moveTm, endPos));
				}
			}
		}
		this.scheduleOnce(function() {
			for(var i = recordNodeArr.length-1; i >= 0; --i) {
				recordNodeArr[i].removeFromParent();
				recordNodeArr[i] = null;
			}
		}, moveTm);
		chooseAreaNode.getChildByName('MyPourLabel').getComponent(cc.Label).string = '0';
	},

	othersWinGold: function (dir) {
		var node, startPosvar , endPos, moveTm;
		var chooseAreaNodeArr = [this.tianmenAreaNode, this.zhongmenAreaNode, this.dimenAreaNode];
		var chooseAreaNode = chooseAreaNodeArr[dir];
		var chooseAreaNodePos = chooseAreaNode.getPosition();
		endPos = this.onLineMenu.getPosition();
		endPos = cc.v2(endPos.x-chooseAreaNodePos.x, endPos.y-chooseAreaNodePos.y);
		var recordNodeArr = [];
		var dirArr = [TTZProto.TIANMEN, TTZProto.ZHONGMEN, TTZProto.DIMEN];
		for(var i = this.pourCoinNodeArr.length-1; i >= 0; --i) {
			node = this.pourCoinNodeArr[i];
			if(node && node.dir === dirArr[dir]) {
				this.pourCoinNodeArr.splice(i, 1);
				recordNodeArr.push(node);
				var startPos = node.getPosition();
				moveTm = Global.Utils.getDist(startPos, endPos)/this.speed;
				node.runAction(cc.moveTo(moveTm, endPos));
			}
		}
		this.scheduleOnce(function() {
			for(var i = recordNodeArr.length-1; i >= 0; --i) {
				recordNodeArr[i].removeFromParent();
				recordNodeArr[i] = null;
			}
		}, moveTm);
		chooseAreaNode.getChildByName('PourLabel').getComponent(cc.Label).string = '0';
	},

	bankerWinGold: function (dir) {
		var node, startPos, endPos, moveTm;
		var chooseAreaNodeArr = [this.tianmenAreaNode, this.zhongmenAreaNode, this.dimenAreaNode];
		var chooseAreaNode = chooseAreaNodeArr[dir];
		var chooseAreaNodePos = chooseAreaNode.getPosition();
		endPos = this.node.getChildByName('WomanNode').getPosition();
		endPos = cc.v2(endPos.x-chooseAreaNodePos.x, endPos.y-chooseAreaNodePos.y);
		var recordNodeArr = [];
		var dirArr = [TTZProto.TIANMEN, TTZProto.ZHONGMEN, TTZProto.DIMEN];
		for(var i = this.pourCoinNodeArr.length-1; i >= 0; --i) {
			node = this.pourCoinNodeArr[i];
			if(node && node.dir === dirArr[dir]) {
				this.pourCoinNodeArr.splice(i, 1);
				recordNodeArr.push(node);
				startPos = node.getPosition();
				moveTm = Global.Utils.getDist(startPos, endPos)/this.speed;
				node.runAction(cc.moveTo(moveTm, endPos));
			}
		}
		this.scheduleOnce(function() {
			for(var i = recordNodeArr.length-1; i >= 0; --i) {
				recordNodeArr[i].removeFromParent();
				recordNodeArr[i] = null;
			}
		}, moveTm);
		chooseAreaNode.getChildByName('PourLabel').getComponent(cc.Label).string = '0';
		chooseAreaNode.getChildByName('MyPourLabel').getComponent(cc.Label).string = '0';
	},

	getCoinNode: function (coin) {
		//var coinArr = [1, 10, 50, 100, 500];
		//var index = coinArr.indexOf(coin);
		var url = 'GameCommon/chip_'+coin;
		var node = new cc.Node();
		cc.loader.loadRes(url, cc.SpriteFrame, function(err, spriteFrame) {
			if(! err) {
				node.addComponent(cc.Sprite).spriteFrame = spriteFrame;
				node.width = 50;
				node.height = 50;
			} else {
				console.log('error getCoinNode', err.message);
			}
		});
		return node;
	},

	pourGoldAnimal: function (node, startPos, dir) {
		this.pourCoinNodeArr.push(node);
		node.dir = dir;
		var chooseAreaNodeArr = [0, this.tianmenAreaNode, this.zhongmenAreaNode, this.dimenAreaNode];
		var chooseAreaNode = chooseAreaNodeArr[dir];
		var pos = chooseAreaNode.getPosition();
		startPos = cc.v2(startPos.x-pos.x, startPos.y-pos.y);
		var endPos = cc.v2(chooseAreaNode.width*(Math.random()-0.5), chooseAreaNode.height*(Math.random()-0.5));
		node.parent = chooseAreaNode;
		node.setPosition(startPos);
		var moveTm = Global.Utils.getDist(startPos, endPos)/this.speed;
		node.runAction(cc.moveTo(moveTm, endPos));
	},

	setCardLabel: function (bureau) {
		if(! bureau) { bureau = TTZModel.getBureau(); }
		var cardCount = 40-bureau*8;
		this.cardLabel.string = bureau+'/'+TTZModel.getMaxBureau()+'('+cardCount+')';
	},

	answerGameResout: function (resout) {
		// 庄家先收
		var dirArr = [TTZProto.TIANMEN, TTZProto.ZHONGMEN, TTZProto.DIMEN];
		var self = this;
		var delayTime = 1;
		var bankerUid = TTZModel.getBankerUid();
		var myUid = TTZModel.getMyUid();
		for(var i = 0; i < resout.winArr.length; ++i) {
			if(resout.winArr[i] === true) {
				this.bankerWinGold(i);
			} else {
				var dirGold = TTZModel.getPourGoldOnDir(dirArr[i]);
				self.playerPourGoldDelay(bankerUid, dirArr[i], dirGold, 1);
				delayTime = 2;
			}
		}
		for(i = 0; i < dirArr.length; ++i) {
			if(resout.winArr[i] === false) {
				if(myUid === bankerUid) {
					self.othersWinGoldDelay(i, delayTime);
				} else {
					var myPour = TTZModel.getMyPourGoldOnDir(dirArr[i]);
					if(myPour > 0) {
						self.myWinGoldDelay(i, myPour*2, delayTime);
					}
					self.othersWinGoldDelay(i, delayTime);
				}
			}
		}
		var nodeArr = [this.tianmenAreaNode, this.zhongmenAreaNode, this.dimenAreaNode];
		this.scheduleOnce(function() {
			Global.DialogManager.createDialog('TuiTongZi/TTZResoutDialog', resout);
			for(var i = 0; i < nodeArr.length; ++i) {
				nodeArr[i].getChildByName('WinSprite').active = false;
			}
		}, 3);
		for(i = 0; i < nodeArr.length; ++i) {
			if(! resout.winArr[i]) {
				var node = nodeArr[i].getChildByName('WinSprite');
				node.active = true;
				node.runAction(cc.sequence(
					cc.fadeIn(0.3), cc.fadeOut(0.3),
					cc.fadeIn(0.3), cc.fadeOut(0.3),
					cc.fadeIn(0.3), cc.fadeOut(0.3),
					cc.fadeIn(0.3), cc.fadeOut(0.3)
				));
			}
		}
	},

	myWinGoldDelay: function (dir, pourGold, delay) {
		var self = this;
		this.scheduleOnce(function() {
			self.myWinGold(dir, pourGold);
		}, delay);
	},

	othersWinGoldDelay: function (dir, delay) {
		var self = this;
		this.scheduleOnce(function() {
			self.othersWinGold(dir);
		}, delay);
	},

	playerPourGoldDelay: function (uid, dir, pourGold, delay) {
		var self = this;
		this.scheduleOnce(function() {
			self.playerPourGold(uid, dir, pourGold);
		}, delay);
	},

	getAudioManager: function () {
		return this.audioManager;
	},

	exitGame: function () {
        Global.DialogManager.removeLoadingCircle();
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.destroyDialog(this, true);

            Global.CCHelper.releaseRes(['TuiTongZi']);
        }.bind(this));
    }
});
