/**
 * Gathers all API modules in one place.
 * 
 * @namespace API
 * @property { module:HallAPI } hall - Hall API
 * @property { module:AccountAPI } account - Account API
 * @property { module:RoomAPI } room - Room API
 * @property { module:HttpAPI } http - Http API
 * @property { any } roomProto - Room proto
 * 
 * @category API
 */
var API = module.exports = {};

API.hall = require('../API/HallAPI');
API.account = require('../API/AccountAPI');
API.room = require('../API/RoomAPI');
API.http = require('../API/HttpAPI');
API.roomProto = require('../API/RoomProto');