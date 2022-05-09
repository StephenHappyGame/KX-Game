/**
 * Constant values.
 * 
 * @category Constants
 * @exports Constant
 */
let Constant = module.exports = {};

/**
 * @property
 * 
 * Game server address used for HTTP requests.
 */
Constant.gameServerAddress = 'http://8.245.7.189:13009';

/**
 * @property
 * 
 * Web server address used for HTTP requests.
 */
Constant.webServerAddress = 'http://8.245.7.189:14009';

Constant.imgServerAddress = Constant.webServerAddress + '/';          // 图片缓存服务器

Constant.test = false;


/*Tools.httpIp = Global.Constant.httpRequestIP;
Tools.httpPort = Global.Constant.httpRequestPort;

Tools.http = 'http://' + Tools.httpIp + ':' + Tools.httpPort;
Tools.transferHttpGet = Tools.http + '/httpGet?url=';//转发httpGet
Tools.transferHttpPost = Tools.http + '/httpPost?url=';//转发httpPost
Tools.httpGetUserInfo = Tools.http + '/GetUserInfo';//获取用户微信信息
Tools.httpGetJSSDKSignature = Tools.http + '/GetJSSDKSignature';//获取JSSDK签名
Tools.httpGetPhoneCode = Tools.http + '/GetSMSCode';//获取手机验证码

//图片
Tools.httpGetQRCode = Tools.http + '/GetQRCode';//获取推广二维码
Tools.httpGetQRCodeWithUrl = Tools.http + '/GetQRCodeImgWithUrl';//获取带链接的二维码
Tools.httpGetImgCode = Tools.http + '/GetImgCode';//获取验证码图片*/
