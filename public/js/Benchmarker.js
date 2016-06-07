(function(){
	function Benchmarker(id, type) {
		this.type = type;
		this.el = document.getElementById(id);
		this.table = this.el.getElementsByTagName('tbody')[0];

		if (type === 'resource') {
			this.updateCount = 0;
			this.totalLoad = 0;
			this.totalMem = 0;
		} else {
			this.packetsPerSecondSpan = this.el.getElementsByClassName('packets-per-second')[0];
			this.ellapsedMsSpan = this.el.getElementsByClassName('average-ellapsed-ms')[0];
			this.packetsCountSpan = this.el.getElementsByClassName('packets-count')[0];
			
			this.packetCount = 0;
			this.firstPacketArrivedAt = 0;
			this.averageEllapsedMs = 0;
			this.maxRows = 5;
		}

		this.add = this.type === 'resource' ? resourceAdd : timeAdd;
	}


	function resourceAdd(resources) {
		this.updateCount++;
		this.totalLoad += resources.load;
		this.totalMem += resources.freeMemory;

		var updatedTable = document.createElement('tbody');

		var memRow = updatedTable.insertRow(0);
			memRow.insertCell(0).innerText = 'Memory';
			memRow.insertCell(1).innerText = (100 - resources.freeMemory / resources.totalMemory * 100).toFixed(2);
			memRow.insertCell(2).innerText = (100 - this.totalMem / this.updateCount / resources.totalMemory * 100).toFixed(2);

		var cpuRow = updatedTable.insertRow(0);
			cpuRow.insertCell(0).innerText = 'CPU';
			cpuRow.insertCell(1).innerText = (resources.load).toFixed(2);
			cpuRow.insertCell(2).innerText = (this.totalLoad / this.updateCount).toFixed(2);

		this.table.parentNode.replaceChild(updatedTable, this.table);
		this.table = updatedTable;
	};

	function timeAdd(desc, time) {
		this.packetsCountSpan.innerText = ++this.packetCount;
		var now = Date.now();
		
		if (this.packetCount === 1) {
			this.firstPacketArrivedAt = time;
		} else {
			this.packetsPerSecondSpan.innerText = (this.packetCount / ((now - this.firstPacketArrivedAt) / 1000)).toFixed(2);
		}
		
		var date = new Date(time);
		var formattedDate = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds();

		var row = this.table.insertRow(0);
		row.insertCell(0).innerText = desc;
		row.insertCell(1).innerText = formattedDate;
		
		if (this.type === 'in') {
			var ellapsedMs = now - time;
			row.insertCell(2).innerText = ellapsedMs;
			this.ellapsedMsSpan.innerText = (this.averageEllapsedMs += (ellapsedMs - this.averageEllapsedMs) / this.packetCount).toFixed(2);
		}
		
		var rowCount = this.table.rows.length;
		if (rowCount > this.maxRows) {
			this.table.deleteRow(rowCount - 1);
		}
	};
	
	window.Benchmarker = Benchmarker;
})();