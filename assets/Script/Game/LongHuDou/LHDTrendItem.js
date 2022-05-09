let gameProto = null;
let trendHelper = require('../GameCommon/TrendHelper');

cc.Class({
	extends: cc.Component,

	properties: {
		zhupanContent: cc.Node,
		daluContent: cc.Node,
		dayanContent: cc.Node,
		tanglangContent: cc.Node,
		xiaoluContent: cc.Node,
	},

	onLoad: function() {
	    this.createdNodeArr = [];
	},

    init: function (dirRecordArr, gameType) {
        this.clearOldData();
        var zhupanArr = null;
		if (!!gameType && gameType === Global.Enum.gameType.HHDZ) {
            zhupanArr = this.convertToHHDZZhupanArr(dirRecordArr);
		} else {
            zhupanArr = this.convertToZhupanArr(dirRecordArr);
		}

        this.writeAllRoad(zhupanArr);
    },

	clearOldData: function () {
		for (let i = 0; i < this.createdNodeArr.length; ++i){
            this.createdNodeArr[i].destroy();
        }
        this.createdNodeArr = [];
    },

	convertToHHDZZhupanArr(dirRecordArr){
		gameProto = require('../HongHeiDaZhan/API/HHDZGameProto');
        let arr = [];
        let arrChild = [];
        for (let i = 0; i < dirRecordArr.length; ++i){
            let dir = dirRecordArr[i];
            if (dir === gameProto.BLACK){
                arrChild.push(trendHelper.TYPE_ZHUANG);
            }else if (dir === gameProto.RED){
                arrChild.push(trendHelper.TYPE_XIAN);
            }
            if (arrChild.length === 6){
                arr.push(arrChild);
                arrChild = [];
            }
        }
        if (arrChild.length !== 0) arr.push(arrChild);
        return arr;
	},

    convertToZhupanArr(dirRecordArr){
        gameProto = require('./LHDProto');
	    let arr = [];
	    let arrChild = [];
	    for (let i = 0; i < dirRecordArr.length; ++i){
	        let dir = dirRecordArr[i];
            if (dir === gameProto.LONG){
                arrChild.push(trendHelper.TYPE_ZHUANG);
            }else if (dir === gameProto.HU){
                arrChild.push(trendHelper.TYPE_XIAN);
            }else if (dir === gameProto.HE){
                arrChild.push(trendHelper.TYPE_HU);
            }
            if (arrChild.length === 6){
                arr.push(arrChild);
                arrChild = [];
            }
        }
        if (arrChild.length !== 0) arr.push(arrChild);
        return arr;
    },

	/*
	 * 写所有的路
	 */
	writeAllRoad: function(zhupanArr) {
		var daluArr = trendHelper.getDaluArr(zhupanArr);
		var dayanArr = trendHelper.getDayanArr(daluArr);
		var xiaoluArr = trendHelper.getXiaoluArr(daluArr);
		var tanglangArr = trendHelper.getTanglangArr(daluArr);
		this.writeZhuPan(zhupanArr);
		this.writeDalu(trendHelper.getFormatArr(daluArr));
		this.writeDayan(trendHelper.getFormatArr(dayanArr));
		this.writeTanglang(trendHelper.getFormatArr(tanglangArr));
		this.writeXiaolu(trendHelper.getFormatArr(xiaoluArr));
	},

	/*
	 * 朱盘路
	 */
	writeZhuPan: function(zhupanArr) {
	    let itemNode = this.zhupanContent.getChildByName("item");
        let width = itemNode.width, height = itemNode.height;
        let bgX = itemNode.x;
        let bgY = itemNode.y;
        let i, j, node;
		for(i = 0; i < zhupanArr.length; ++i) {
			for(j = 0; j < zhupanArr[i].length; ++j) {
				node = this.getZhupanNodeByType(zhupanArr[i][j]);
                node.active = true;
				node.parent = this.zhupanContent;
				node.x = bgX + width*i;
				node.y = bgY - height*j;
                this.createdNodeArr.push(node);
			}
		}
	},

	/*
	 * 朱盘路node
	 */
	getZhupanNodeByType: function(type) {
	    let node = null;
		if((type&trendHelper.TYPE_ZHUANG) > 0) {
            node = this.zhupanContent.getChildByName("zhuang");
		} 
		else if((type&trendHelper.TYPE_XIAN) > 0) {
            node = this.zhupanContent.getChildByName("xian");
		}
		else {
            node = this.zhupanContent.getChildByName("he");
		}
		return cc.instantiate(node);
	},

	/*
	 * 大路
	 */
	writeDalu: function(daluArr) {
        let itemNode = this.daluContent.getChildByName("item");
        let width = itemNode.width, height = itemNode.height;
        let bgX = itemNode.x;
        let bgY = itemNode.y;
		var i, j, node;
		for(i = 0; i < daluArr.length; ++i) {
			for(j = 0; j < daluArr[i].length; ++j) {
				if(!!daluArr[i][j]) {
					node = this.getDaluNodeByType(daluArr[i][j]);
                    node.active = true;
					node.parent = this.daluContent;
                    node.x = bgX + width*i;
                    node.y = bgY - height*j;
                    this.createdNodeArr.push(node);
				}
			}
		}
	},

	/*
	 * 大路node
	 */
	getDaluNodeByType: function(type) {
        let node = null;
        if((type&trendHelper.TYPE_ZHUANG) > 0) {
            node = this.daluContent.getChildByName("hong");
        }
        else{
            node = this.daluContent.getChildByName("lan");
        }
        node = cc.instantiate(node);
		let huNum = Math.floor(type/trendHelper.TYPE_HU);
		if(huNum > 0) {
			let labelNode = new cc.Node();
			labelNode.parent = node;
            let label = labelNode.addComponent(cc.Label);
            label.node.color = cc.Color.GREEN;
            label.fontSize = node.height - 2;
            label.lineHeight = node.height - 2;
			label.string = huNum;
		}
		return node;
	},

	/*
	 * 大眼仔路
	 */
	writeDayan: function(dayanArr) {
        let itemNode = this.dayanContent.getChildByName("item");
        let width = itemNode.width, height = itemNode.height;
        let bgX = itemNode.x;
        let bgY = itemNode.y;
		let i, j, node;
		for(i = 0; i < dayanArr.length; ++i) {
			for(j = 0; j < dayanArr[i].length; ++j) {
				if(!!dayanArr[i][j]) {
					node = this.getDayanNodeType(dayanArr[i][j]);
					node.active = true;
					node.parent = this.dayanContent;
                    node.x = bgX + width*i;
                    node.y = bgY - height*j;
                    this.createdNodeArr.push(node);
				}
			}
		}
	},

    getDayanNodeType: function (type) {
        let node = null;
        if(type === trendHelper.HONG) {
            node = this.dayanContent.getChildByName("hong");
        }
        else{
            node = this.dayanContent.getChildByName("lan");
        }
        return cc.instantiate(node);
    },

	/*
	 * 小路
	 */
	writeXiaolu: function(xiaoluArr) {
        let itemNode = this.xiaoluContent.getChildByName("item");
        let width = itemNode.width, height = itemNode.height;
        let bgX = itemNode.x;
        let bgY = itemNode.y;
		var i, j, node;
		for(i = 0; i < xiaoluArr.length; ++i) {
			for(j = 0; j < xiaoluArr[i].length; ++j) {
				if(!!xiaoluArr[i][j]) {
					node = this.getXiaoluNodeByType(xiaoluArr[i][j]);
                    node.active = true;
					node.parent = this.xiaoluContent;
                    node.x = bgX + width*i;
                    node.y = bgY - height*j;
                    this.createdNodeArr.push(node);
				}
			}
		}
	},

    getXiaoluNodeByType: function (type) {
        let node = null;
        if(type === trendHelper.HONG) {
            node = this.xiaoluContent.getChildByName("hong");
        }
        else{
            node = this.xiaoluContent.getChildByName("lan");
        }
        return cc.instantiate(node);
    },

	/*
	 * 螳螂路
	 */
	writeTanglang: function(tanglangArr) {
        let itemNode = this.tanglangContent.getChildByName("item");
        let width = itemNode.width, height = itemNode.height;
        let bgX = itemNode.x;
        let bgY = itemNode.y;
		var i, j, node;
		for(i = 0; i < tanglangArr.length; ++i) {
			for(j = 0; j < tanglangArr[i].length; ++j) {
				if(!!tanglangArr[i][j]) {
					node = this.getTanglangNodeByType(tanglangArr[i][j]);
					node.parent = this.tanglangContent;
                    node.active = true;
                    node.x = bgX + width*i;
                    node.y = bgY - height*j;
                    this.createdNodeArr.push(node);
				}
			}
		}
	},

    getTanglangNodeByType: function (type) {
        let node = null;
        if(type === trendHelper.HONG) {
            node = this.tanglangContent.getChildByName("hong");
        }
        else{
            node = this.tanglangContent.getChildByName("lan");
        }
        return cc.instantiate(node);
    },

	getNodeByType: function(type) {
		var node = new cc.Node();
		var url;
		if(type === trendHelper.HONG) {
			url = 'Common/btn_check_select';
		}
		else if(type === trendHelper.LAN) {
			url = 'Common/btn_check';
		}
		var sprite = node.addComponent(cc.Sprite);
		cc.loader.loadRes(url, cc.SpriteFrame, function(err, res) {
			if(! err) {
				sprite.spriteFrame = res;
			} else {
				console.log(err);
			}
		});
		return node;
	},
});
