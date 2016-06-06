(function(){
	function Benchmarker(id) {
		this.el = document.getElementById(id);
		this.table = this.el.getElementsByTagName('tbody')[0];
		this.packetsPerSecondSpan = this.el.getElementsByClassName('packets-per-second')[0];
		this.ellapsedMsSpan = this.el.getElementsByClassName('average-ellapsed-ms')[0];
		this.packetsCountSpan = this.el.getElementsByClassName('packets-count')[0];
		
		this.packetCount = 0;
		this.firstPacketArrivedAt = 0;
		this.averageEllapsedMs = 0;
		
		this.maxRows = 100;
	}
	
	Benchmarker.prototype.add = function(desc, time, includeEllapsedMs) {
		this.packetsCountSpan.innerText = ++this.packetCount;
		var now = Date.now();
		
		if (this.packetCount === 1) {
			this.firstPacketArrivedAt = time;
		} else {
			this.packetsPerSecondSpan.innerText = this.packetCount / ((now - this.firstPacketArrivedAt) / 1000);
		}
		
		var row = this.table.insertRow(0);
		row.insertCell(0).innerText = desc;
		row.insertCell(1).innerText = time;
		
		if (includeEllapsedMs) {
			var ellapsedMs = now - time;
			row.insertCell(2).innerText = ellapsedMs;
			this.averageEllapsedMs = this.averageEllapsedMs + (ellapsedMs - this.averageEllapsedMs) / this.packetCount;
			this.ellapsedMsSpan.innerText = this.averageEllapsedMs;
		}
		
		var rowCount = this.table.rows.length;
		if (rowCount > this.maxRows) {
			this.table.deleteRow(rowCount - 1);
		}
	};
	
	window.Benchmarker = Benchmarker;
})();