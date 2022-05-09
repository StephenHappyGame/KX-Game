let utils = require('../../Shared/utils');
cc.Class({
    extends: cc.Component,

    properties: {
        pointsNode: cc.Node,
        armNode: cc.Node
    },

    start () {

    },

    updateLine (targetWorldPos){
        let targetLocationPos = this.node.parent.convertToNodeSpaceAR(targetWorldPos);
        let dist = utils.getDist(this.node.position, targetLocationPos);
        let unitVector = utils.getUnitVector(this.node.position, targetLocationPos);
        let mathRote = Math.acos(unitVector.x)/Math.PI * 180;
        if (unitVector.y < 0) mathRote *= -1;

        this.node.rotation = mathRote * -1 + 90;
        this.armNode.position = this.node.convertToNodeSpaceAR(targetWorldPos);
        this.pointsNode.height = dist - this.armNode.height/2;
    }
});
