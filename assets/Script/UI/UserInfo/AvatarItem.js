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
        headIcon: cc.Sprite,
        select: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    showSelect () {
        this.select.active = true;
    },

    hideSelect () {
        this.select.active = false;
    },

    start () {

    },

    updateUI (data, index) {
        this.data = data;
        this.index = index;

        this.node.active = false;
        Global.CCHelper.updateSpriteFrame(data.icon, this.headIcon, function () {
            this.node.active = true;
        }.bind(this));
    },

    onBtnClk (event, param) {
        if (!!this.data.callback) {
            this.data.callback(this.index);
        }
    }

    // update (dt) {},
});
