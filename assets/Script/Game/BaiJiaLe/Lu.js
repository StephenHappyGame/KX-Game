var lu = module.exports;
lu.TYPE_DUI			= 1;	// 对
lu.TYPE_XIAN		= 2;	// 闲
lu.TYPE_ZHUANG		= 4;	// 庄
lu.TYPE_HU			= 8;	// 和

lu.HONG				= 1;	// 红(有规律)
lu.LAN				= 2;	// 蓝(无规律)

/*
 * 获取朱盘路
 */
lu.getZhupanArr = function(array) {
	var zhupanArr = [];
	var i;
	for(i = 0; i < array.length; ++i) {
		if(i%6 == 0) {
			zhupanArr.push([]);
		}
		zhupanArr[zhupanArr.length-1].push(array[i]);
	}
	return zhupanArr;
};

/*
 * 获取大路
 */
lu.getDaluArr = function(zhupanArr) {
	var daluArr = [];
	var i, j, m = 0, n = 0;

	for(i = 0; i < zhupanArr.length; ++i) {
		for(j = 0; j < zhupanArr[i].length; ++j) {
			if((zhupanArr[i][j]&this.TYPE_HU) > 0) {	 /*和牌*/ 
				if(daluArr[m] && daluArr[m][n]) {
					daluArr[m][n] += this.TYPE_HU;
				} 
			} else {
				if(daluArr[m] && daluArr[m][n]) {
					if((zhupanArr[i][j]&this.TYPE_ZHUANG) > 0 && (daluArr[m][n]&this.TYPE_ZHUANG) > 0) { /*与前一个相同时,不换行*/ 
						++ n;
					}
					else if((zhupanArr[i][j]&this.TYPE_XIAN) > 0 && (daluArr[m][n]&this.TYPE_XIAN) > 0) {
						++ n;
					} else {
						++ m;
						daluArr[m] = [];
						n = 0;
					}
					daluArr[m][n] = zhupanArr[i][j];
				} else {
					daluArr[m] = [];
					daluArr[m][n] = zhupanArr[i][j];
				}
			}
		}
	}
	return daluArr;
};


/*
 * 获取大眼仔路
 */
lu.getDayanArr = function(daluArr) {
	var dayanArr = [];
	var i, j;

	for(i = 1; i < daluArr.length; ++i) {
		j = (i===1)? 1:0; 
		while(j < daluArr[i].length) {
			var color;
			if(j === 0) {
				color = (daluArr[i-1].length === daluArr[i-2].length)? this.HONG:this.LAN;
			} else {
				if(!! daluArr[i-1][j]) {
					color = this.HONG;
				} else {
					if(!!daluArr[i-1][j-1]) {
						color = this.LAN;
					} else {
						color = this.HONG;
					}
				}
			}
			if(dayanArr.length === 0) {
				dayanArr.push([color]);
			} else {
				var lastArr = dayanArr[dayanArr.length-1];
				if(lastArr.length === 0) {
					lastArr.push(color);
				} else {
					if(lastArr[lastArr.length-1] !== color) {
						dayanArr.push([color]);
					} else {
						lastArr.push(color);
					}
				}
			}
			++ j;
		}
	}

	return dayanArr;
};

/*
 * 获取小路
 */
lu.getXiaoluArr = function(daluArr) {
	var xiaoluArr = [];
	var i, j;

	for(i = 2; i < daluArr.length; ++i) {
		j = (i===2)? 1:0; 
		while(j < daluArr[i].length) {
			var color;
			if(j === 0) {
				color = (daluArr[i-1].length === daluArr[i-3].length)? this.HONG:this.LAN;
			} else {
				if(!! daluArr[i-2][j]) {
					color = this.HONG;
				} else {
					if(!!daluArr[i-2][j-1]) {
						color = this.LAN;
					} else {
						color = this.HONG;
					}
				}
			}
			if(xiaoluArr.length === 0) {
				xiaoluArr.push([color]);
			} else {
				var lastArr = xiaoluArr[xiaoluArr.length-1];
				if(lastArr.length === 0) {
					lastArr.push(color);
				} else {
					if(lastArr[lastArr.length-1] !== color) {
						xiaoluArr.push([color]);
					} else {
						lastArr.push(color);
					}
				}
			}
			++ j;
		}
	}

	return xiaoluArr;
};

/*
 * 获取螳螂路
 */
lu.getTanglangArr = function(daluArr) {
	var tanglangArr = [];
	var i, j;

	for(i = 3; i < daluArr.length; ++i) {
		j = (i===3)? 1:0; 
		while(j < daluArr[i].length) {
			var color;
			if(j === 0) {
				color = (daluArr[i-1].length === daluArr[i-4].length)? this.HONG:this.LAN;
			} else {
				if(!! daluArr[i-3][j]) {
					color = this.HONG;
				} else {
					if(!!daluArr[i-3][j-1]) {
						color = this.LAN;
					} else {
						color = this.HONG;
					}
				}
			}
			if(tanglangArr.length === 0) {
				tanglangArr.push([color]);
			} else {
				var lastArr = tanglangArr[tanglangArr.length-1];
				if(lastArr.length === 0) {
					lastArr.push(color);
				} else {
					if(lastArr[lastArr.length-1] !== color) {
						tanglangArr.push([color]);
					} else {
						lastArr.push(color);
					}
				}
			}
			++ j;
		}
	}

	return tanglangArr;
};

/*
 * 获取转化后的大路
 */
lu.getFormatArr = function(array) {
	var i , j, m = 0, n = 0;
	var formatArr = [];
	for(i = 0; i < array.length; ++i) {
		m = i;
		if(! formatArr[m]) {
			formatArr[m] = [null, null, null, null, null, null];
		}
		for(j = 0; j < array[i].length; ++j) {
			if(j === 0) {
				n = 0;
				formatArr[m][n] = array[i][j];
			} else {
				if((formatArr[m][n+1] !== null) || (n === 5) || (formatArr[m][n-1] === null)) {
					++ m;
					if(!formatArr[m]) {
						formatArr[m] = [null, null, null, null, null, null];
					}
					formatArr[m][n] = array[i][j];
				} else {
					++ n;
					formatArr[m][n] = array[i][j];
				}
			}
		}
	}
	return formatArr;
};
