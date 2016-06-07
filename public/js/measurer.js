(function() {
	function Measurer(type) {
		this.type = type;
		this.logs = [];
		this.averageSize = 0;
		this.start = performance.now();
		this.listeners = [];
	}
	
	Measurer.prototype.add = function (endpoint, size, data) {
		var log = {
			endpoint: endpoint,
			size: size || 0,
			data: data || '',
			time: performance.now()
		};
		
		this.logs.push(log);
		this.averageSize = ((this.averageSize * (this.logs.length - 1)) + log.size) / this.logs.length;
		
		for (var i = 0; i < this.listeners.length; i++) {
			var listener = this.listeners[i];
			listener.fn.apply(listener.context, [log, this]);
		}
	};

	Measurer.prototype.addListener = function(fn, context) {
		this.listeners.push({fn: fn, context: context || null});
	};
	
	var _measurers = {};	
	window.getMeasurer = function (type) {
		return _measurers[type] || (_measurers[type] = new Measurer(type));
	};
})();