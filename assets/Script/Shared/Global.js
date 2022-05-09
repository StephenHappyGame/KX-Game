/**
 * Gathers all systems in global object that can be accessed from any file by *Global* or *window.Global*.
 * The *Global* namespace is initialized in the {@link SceneInit#initGlobal} script.
 * 
 * @category Core
 * @namespace Global
 * @property { module:Constant } Constant
 * @property { module:MessageCallback } MessageCallback
 * @property { module:DialogManager } DialogManager
 * @property { module:AudioManager } AudioManager
 * @property { module:NetworkManager } NetworkManager

 * @property { module:CCHelper } CCHelper
 * @property { module:Utils } Utils

 * @property { module:NetworkLogic } NetworkLogic

 * @property { module:Enum } Enum
 * @property { module:Code } Code

 * @property { module:API } API

 * @property { module:Player } Player
 * @property { module:PlayerWechat } PlayerWechat
 * @property { module:GameTypes } GameTypes
 * @property { module:Data } Data

 * @property { module:Animation } Animation
 * @property { module:AgentProfit } AgentProfit
 */
window.Global = {}