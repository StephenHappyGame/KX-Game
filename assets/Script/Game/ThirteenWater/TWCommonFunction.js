var twcf = module.exports;

twcf.numberToTimeMS = function(num) {
	var m, s;
	num = parseInt(num);
	m = Math.floor(num/60);
	s = Math.floor(num%60);
	if(m < 10) {
		m = '0' + m;
	}
	if(s < 10) {
		s = '0' + s;
	}
	return m + ':' + s;
};
