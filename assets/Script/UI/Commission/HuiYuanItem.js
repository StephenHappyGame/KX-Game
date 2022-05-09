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
        nicknameText: cc.Label,
        headIcon: cc.Sprite,
        idText: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'detail':
                //代理
                if (!!this.data.directlyMemberCount) {
                    Global.DialogManager.createDialog('Commission/DaiLiDetailDialog', {data: this.data});
                //直属会员
                } else {
                    Global.DialogManager.createDialog('Commission/HuiYuanDetailDialog', {data: this.data});
                }
                break;
        }
    },

    updateUI (data) {
        this.data = data;

        this.idText.string = data.uid;
        this.nicknameText.string = data.nickname;
        Global.CCHelper.updateSpriteFrame(data.avatar, this.headIcon);
    }

    // update (dt) {},
});
