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
        imgBtn1: cc.Sprite,
        imgBtn2: cc.Sprite
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad: function () {
    },
    
    updateUI: function (data, callback) {
        this.data = data;
        this.callback = callback;

        Global.CCHelper.updateSpriteFrame('Hall/btn_game_' + data.game1, this.imgBtn1);
        if (!!data.game2) {
            Global.CCHelper.updateSpriteFrame('Hall/btn_game_' + data.game2, this.imgBtn2);
        }

        this.imgBtn2.node.parent.active = !!data.game2;
    },
    
    onBtnClk: function (event, param) {
        let game = '';
        switch (param) {
            case 'game1':
                game = this.data.game1;
                break;
            case 'game2':
                game = this.data.game2;
                break;
        }

        if (!!this.callback) {
            this.callback(game);
        }
    }

    // start: function () {
    //
    // },

    // update (dt) {},
});
