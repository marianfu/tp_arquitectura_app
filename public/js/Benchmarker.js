(function(){
	function Benchmarker(id, type) {
		this.type = type;
		this.el = document.getElementById(id);
		this.table = this.el.getElementsByTagName('tbody')[0];

		if (type === 'resource') {
			this.systemMemorySpan = this.el.getElementsByClassName('system-memory')[0];

			this.updateCount = 0;
		} else {
			this.packetsPerSecondSpan = this.el.getElementsByClassName('packets-per-second')[0];
			this.clientToServerEllapsedMsSpan = this.el.getElementsByClassName('client-to-server-ellapsed-ms')[0];
			this.serverToClientEllapsedMsSpan = this.el.getElementsByClassName('server-to-client-ellapsed-ms')[0];
			this.packetsCountSpan = this.el.getElementsByClassName('packets-count')[0];
			
			this.packetCount = 0;
			this.firstPacketArrivedAt = 0;
			this.averageClientToServerEllapsedMs = 0;
			this.averageServerToClientEllapsedMs = 0;
			this.maxRows = 3;
		}

		this.add = this.type === 'resource' ? resourceAdd : timeAdd;
	}


	function resourceAdd(resources) {
		this.updateCount++;

		this.systemMemorySpan.innerText = resources.systemMemory / 1024 / 1024 + ' MB';

		var updatedTable = document.createElement('tbody');

		var memRow = updatedTable.insertRow(0);
			memRow.insertCell(0).innerText = 'Memory';
			memRow.insertCell(1).innerText = (resources.freeMemory / resources.systemMemory * 100).toFixed(2) + '%';
			memRow.insertCell(2).innerText = (resources.averageFreeMemory / resources.systemMemory * 100).toFixed(2) + '%';

		var cpuRow = updatedTable.insertRow(0);
			cpuRow.insertCell(0).innerText = 'CPU';
			cpuRow.insertCell(1).innerText = (resources.load).toFixed(2) + '%';
			cpuRow.insertCell(2).innerText = (resources.averageLoad).toFixed(2) + '%';

		this.table.parentNode.replaceChild(updatedTable, this.table);
		this.table = updatedTable;
	};

	function timeAdd(desc, clientToServerTime, clientTransport, serverToClientTime, serverTransport) {
		var now = Date.now();
		this.packetsCountSpan.innerText = ++this.packetCount;
		
		if (this.packetCount === 1) {
			this.firstPacketArrivedAt = clientToServerTime;
		} else {
			this.packetsPerSecondSpan.innerText = (this.packetCount / ((now - this.firstPacketArrivedAt) / 1000)).toFixed(2);
		}
		
		var date = new Date(clientToServerTime);
		var formattedDate = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds();

		var row = this.table.insertRow(0);
		row.insertCell(0).innerText = desc;
		row.insertCell(1).innerText = formattedDate;
		
		if (this.type === 'in') {
			var clientToServerEllapsedMs = serverToClientTime - clientToServerTime;
			var serverToClientEllapsedMs = now - serverToClientTime;
			console.log(clientToServerEllapsedMs);
			row.insertCell(2).innerText = clientToServerEllapsedMs + 'ms (' + clientTransport + ')';
			row.insertCell(3).innerText = serverToClientEllapsedMs + 'ms (' + serverTransport + ')';
			
			this.clientToServerEllapsedMsSpan.innerText = (this.averageClientToServerEllapsedMs += (clientToServerEllapsedMs - this.averageClientToServerEllapsedMs) / this.packetCount).toFixed(2);
			this.serverToClientEllapsedMsSpan.innerText = (this.averageServerToClientEllapsedMs += (serverToClientEllapsedMs - this.averageServerToClientEllapsedMs) / this.packetCount).toFixed(2);
		}
		
		var rowCount = this.table.rows.length;
		if (rowCount > this.maxRows) {
			this.table.deleteRow(rowCount - 1);
		}
	};
	
	window.Benchmarker = Benchmarker;
})();