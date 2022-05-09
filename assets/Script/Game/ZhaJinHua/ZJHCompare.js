let ZJHAudio = require('./ZJHAudio');

cc.Class({
    extends: cc.Component,

    properties: {
        chairPos: cc.Node,
        comparePos: cc.Node,
        pkUIGroup: cc.Node,
        mask: cc.Node
    },
    
    startCompare: function (startChairCtrl, compareChairCtrl, callback, isStartLose) {
        this.callback = callback;

        this.mask.runAction(cc.fadeTo(0.3, 255 * 0.6));

        this.chairAnimation(startChairCtrl, false, isStartLose);
        this.chairAnimation(compareChairCtrl, true, !isStartLose);
    },

    chairAnimation: function (chair_, isCompare, isLose) {
        let originalParent = chair_.node.parent;
        let originalPos = {x: chair_.node.x,  y: chair_.node.y};
        let chair = chair_;

        chair.node.getChildByName('otherGroup').active = false;

        let actions = [];
        actions[actions.length] = cc.callFunc(function () {
            chair.node.parent = this.node;
            chair.node.x = originalParent.x;
            chair.node.y = originalParent.y;
        }.bind(this));
        actions[actions.length] = cc.scaleTo(0.2, 1.5, 1.5);
        actions[actions.length] = cc.delayTime(0.2);
        actions[actions.length] = cc.scaleTo(0.2, 1, 1);
        actions[actions.length] = cc.callFunc(function () {
            if (!!isCompare) {
                this.node.getComponent(cc.Animation).play('compare');
                this.pkUIGroup.active = true;
            }
        }.bind(this));

        let destPos = {
            x: this.chairPos.x,
            y: this.chairPos.y
        };
        if (!!isCompare) {
            destPos = {
                x: this.comparePos.x,
                y: this.comparePos.y
            }
        }

        actions[actions.length] = cc.moveTo(0.2, destPos.x, destPos.y).easing(cc.easeBackIn());
        actions[actions.length] = cc.delayTime(0.2);
        if (isLose) {
            actions[actions.length] = cc.callFunc(function () {
                ZJHAudio.compareDian();
                chair.showLoseEff();
            }.bind(this));
        }
        actions[actions.length] = cc.delayTime(2);
        actions[actions.length] = cc.callFunc(function () {
            chair.node.parent = originalParent;
            chair.node.x -= originalParent.x;
            chair.node.y -= originalParent.y;

            if (!!isCompare) {
                this.node.active = false;
            }
        }.bind(this));
        actions[actions.length] = cc.moveTo(0.2, originalPos.x, originalPos.y);

        actions[actions.length] = cc.callFunc(function () {
            chair.node.getChildByName('otherGroup').active = true;
            if (!!isCompare)  Global.Utils.invokeCallback(this.callback);
        }.bind(this));

        let sequence = cc.sequence(actions);
        chair.node.runAction(sequence);
    },

    onLoad: function () {
        this.pkUIGroup.active = false;
    }
});
