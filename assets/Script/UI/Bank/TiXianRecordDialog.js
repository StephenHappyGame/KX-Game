// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
        recordContent: cc.Node,
        recordItem: cc.Prefab
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    onScrollEvent: function (target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                if (this.maxCount) {
                    cc.log('已加载所有数据');
                    return;
                }
                cc.log('请求新数据');
                this.updateList();
                break;
        }
    },

    updateList () {
        Global.DialogManager.addLoadingCircle();
        Global.API.hall.getRecordDataRequest(Global.Enum.recordType.WITHDRAWALS, this.startIndex, this.perCount, function (msg) {
            let totalCount = msg.msg.totalCount;
            let data = msg.msg.recordArr;
            for (let i = 0; i < data.length; i ++) {
                let item = cc.instantiate(this.recordItem);
                item.parent = this.recordContent;
                item.getComponent('TiXianRecordItem').updateUI(data[i]);
            }

            this.startIndex += this.perCount;
            if (this.startIndex > totalCount) {
                this.maxCount = true;
            }

            Global.DialogManager.removeLoadingCircle();
        }.bind(this));
    },

    start () {
        this.startIndex = 0;
        this.perCount = 10;
        this.maxCount = false;

        this.updateList();
    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
        }
    },

    // update (dt) {},
});
