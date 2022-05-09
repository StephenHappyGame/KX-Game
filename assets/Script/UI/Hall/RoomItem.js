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
        bgImg: cc.Sprite,
        minGold: cc.Label,
        dizhu: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'enterRoom':
                Global.DialogManager.createDialog("Match/MatchGameDialog", {gameTypeID: this.data.gameTypeID});
                break;
        }
    },
    
    updateUI: function (data) {
        this.data = data;
        this.node.active = false;

        if (data.kind === Global.Enum.gameType.NN) {
            Global.CCHelper.updateSpriteFrame('Hall/item_bg' + data.level + '_nn', this.bgImg, function () {
                this.node.active = true;
            }.bind(this));
        } else {
            Global.CCHelper.updateSpriteFrame('Hall/item_bg' + data.level, this.bgImg, function () {
                this.node.active = true;
            }.bind(this));
        }

        this.minGold.string = '入场限制{0}元'.format(data.goldLowerLimit);
        this.dizhu.string = '{0}元底分'.format(data.baseScore);
    }

    // update (dt) {},
});
