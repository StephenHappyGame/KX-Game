/**
 * Functions used to access / set various properties.
 * 
 * @category Models
 * @exports Data
 */
var Data = module.exports = {};

/**
 * Initialize with *datas* data (received from server).
 * 
 * @param {any} datas - Received data
 */
Data.init = function (datas) {
    this.setDatas(datas);
};

/**
 * Get property with name *key*.
 * 
 * @param {string} key - Property name
 */
Data.getData = function (key) {
    return this[key];
};

/**
 * Set properties from *datas*.
 * 
 * @param {any} datas - Properties to set.
 */
Data.setDatas = function (datas) {
    for (var key in datas) {
        if (datas.hasOwnProperty(key)) {
            this[key] = datas[key];
        }
    }
};
