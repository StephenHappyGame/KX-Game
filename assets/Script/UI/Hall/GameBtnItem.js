const Translator = require("Translator");

cc.Class({
    extends: cc.Component,

    properties: {
        spBtn1: sp.Skeleton,
        spBtn2: sp.Skeleton
    },

    onLoad: function () {
    },

    /**
     * This function will replace specified **skeleton** with SkeletonData loaded from
     * *'Hall/Games/btn_game_**gameId**'*. Default skin will be assigned as *en* and animation will
     * be set to *animation*.
     * 
     * @param {number} gameId - Game ID
     * @param {sp.Skeleton} skeleton - SkeletonData will be attached to this Skeleton
     */
    _replaceSpine(gameId, skeleton) {
        cc.loader.loadRes('Hall/Games/btn_game_' + gameId, sp.SkeletonData, (error, asset) => {
            if(error) {
                console.error(error);
                return;
            }

            skeleton.skeletonData = asset;

            // The game buttons are disabled by default, so this should be the first activation and it will invoke
            // onLoad function.
            skeleton.node.active = true;
        });
    },
    
    updateUI: function (data, callback) {
        this.data = data;
        this.callback = callback;

        if(data.game1) this._replaceSpine(data.game1, this.spBtn1);
        if(data.game2) this._replaceSpine(data.game2, this.spBtn2);
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
});
