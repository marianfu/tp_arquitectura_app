(function(){
	function Benchmarker(id, type) {
		this.el = document.getElementById(id);
		this.table = this.el.getElementsByTagName('tbody')[0];
		this.packetsPerSecondSpan = this.el.getElementsByClassName('packets-per-second')[0];
		this.ellapsedMsSpan = this.el.getElementsByClassName('average-ellapsed-ms')[0];
		this.packetsCountSpan = this.el.getElementsByClassName('packets-count')[0];
		
		this.type = type;
		this.packetCount = 0;
		this.firstPacketArrivedAt = 0;
		this.averageEllapsedMs = 0;
		this.maxRows = 5;
	}
	
	Benchmarker.prototype.add = function(desc, time) {
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
		
		if (this.type === 'in') {
			var ellapsedMs = now - time;
			row.insertCell(2).innerText = ellapsedMs;
			this.ellapsedMsSpan.innerText = (this.averageEllapsedMs += (ellapsedMs - this.averageEllapsedMs) / this.packetCount);
		}
		
		var rowCount = this.table.rows.length;
		if (rowCount > this.maxRows) {
			this.table.deleteRow(rowCount - 1);
		}
	};
	
	window.Benchmarker = Benchmarker;
})();