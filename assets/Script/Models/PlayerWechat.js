/**
 * Created by 苏永富 on 2017/6/26.
 */

//PlayerWechat 属性一览
// city:""
// country:"中国"
// headimgurl:"http://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTIu8qB5G5pxEra87EGpXxPia4zjib7T3IwnKE1fWg8zdp1hcpNojSZWiaA3SJyTib82P3kxuZD4lvolibg/0"
// language:"zh_CN"
// nickname:"艾弗尤"
// openid:"oO0fEwceEDWoB8z7PfqqTXXv2WsE"
// privilege:[]
// province:""
// sex:1

var PlayerWechat = module.exports = {};

PlayerWechat.init = function (data) {
    //玩家微信数据初始化
    this.setProperties(data);
};

PlayerWechat.setProperties = function (properties) {
    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            this[key] = properties[key];
        }
    }
};

//获取属性
PlayerWechat.getPy = function (property) {
    return this[property];
};

//设置属性
PlayerWechat.setPy = function (property, value) {
    this[property] = value;
};