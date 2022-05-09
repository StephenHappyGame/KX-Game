/**
 * 
 * 
 * @category Models
 * @exports AgentProfit
 */
let AgentProfit = module.exports = {};

AgentProfit.init = function (data) {
    console.log("AgentProfit");
    console.log(data);

    this.data = data;
};

AgentProfit.getProportionByNum = function (num) {
    let minData = this.data[0];

    for (let i = 0; i < this.data.length; i ++) {
        let data = this.data[i];

        if (minData.min > data.min) {
            minData = data;
        }

        //达到最高
        if (data.max === -1) {
            if (num >= data.min) {
                return data;
            }
        }

        if (num >= data.min && num < data.max) {
            return data;
        }
    }

    return minData;
};