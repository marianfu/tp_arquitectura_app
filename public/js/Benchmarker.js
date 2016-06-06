/**
 * 
 *	Thoth: Performance benchmarker.
 *	
 *	@author gabrielprc
 *
 */

 (
 	var Benchmarker = function() {
 		/**
		 *	Object containing metrics stored in a key:object format
		 */
 		var __metrics = {};

 		/**
		 *	begin() starts benchmarking a certain <metricType> event
		 *	and returns a unique metricId,
		 *	used later on to end measuring said metric event.
		 *
		 *	@param {String} metricType
		 *	@param {Number} startTime <optional>
		 *	@return {String} metricId
		 */
 		function begin(metricType, startTime) {
 			//	Insert event type if unexisting
 			if (!__metrics[metricType]) {
 				__metrics[metricType] = {
 					inProgress: [],
 					eventsCount: 0,
 					totalTime: 0
 				};
 			}

 			//	Retrieve array of ongoing events for the type
 			var metricsArray = __metrics[metricType].inProgress;

 			var metric = {
 				id: generateId(metricType),
 				startTime: startTime ? startTime : (new Date()).getTime()
 			};

 			//	Insert new event in event type's array
 			metricsArray.push(metric);

 			//	Return id for the new event
 			return metric.id;
 		}

 		/**
		 *	end() finishes benchmarking a certain <metricType> event,
		 *	and returns its end results.
		 *
		 *	@param {String} metricType
		 */
 		function end(metricId) {
 			var metricType = metricId.match(/\d+\-(\w+)/)[1];

 			//	Retrieve object corresponding to the metricType
 			var metricData = __metrics[metricType];

 			if (!metricData) {
 				return;
 			}

 			//	Retrieve array of ongoing events for the type
 			var metricsArray = metricData.inProgress;

 			//	Search for the specific event in the array
 			var metric = null;
 			var index = -1;
 			for (var i = 0; i < metricsArray.length; i++) {
 				if (metricsArray[i].id === metricId) {
 					index = 1;
 					metric = metricsArray[i];
 					break;
 				}
 			}

 			if (!metric) {
 				return;
 			}

 			//	Remove event from the ongoing events array
 			metricsArray.splice(index, 1);

 			//	Calculate total duration of the event
 			//	and add said duration to the 'total' for its metric type
 			var endTime = (new Date()).getTime();
 			var totalTime = endTime - metric.startTime;

 			metricData.eventsCount++;
 			metricData.totalTime += totalTime;
 		}

 		/**
		 *	getCount() returns events count [for a given metric type]
		 *
		 *	@param {String} metricType <optional>
		 *	@return {Number} eventsCount
		 */
 		function getCount(metricType) {
 			if (metricType) {
 				var metricData = __metrics[metricType];
 				if (metricData) {
	 				return metricData.eventsCount;
	 			}
 			} else {
 				var eventsCount = 0;
 				var totalTime = 0;
 				for (var metricData in __metrics) {
				    if (__metrics.hasOwnProperty(metricData)) {
				        eventsCount += metricData.eventsCount;
				        totalTime += metricData.totalTime;
				    }
				}
 			}
 		}

 		/**
		 *	getTotalTime() returns total time [for a given metric type]
		 *
		 *	@param {String} metricType <optional>
		 *	@return {Number} totalTime
		 */
 		function getTotalTime(metricType) {
 			if (metricType) {
 				var metricData = __metrics[metricType];
	 			if (metricData) {
	 				return metricData.totalTime;
	 			}
 			} else {
 				var eventsCount = 0;
 				var totalTime = 0;
 				for (var metricData in __metrics) {
				    if (__metrics.hasOwnProperty(metricData)) {
				        totalTime += metricData.totalTime;
				    }
				}
				return totalTime;
 			}
 		}

 		/**
		 *	getAverageTime() returns the average time per event [for a given metric type]
		 *
		 *	@param {String} metricType <optional>
		 *	@return {Number} average
		 */
 		function getAverageTime(metricType) {
 			if (metricType) {
 				var metricData = __metrics[metricType];
	 			if (metricData) {
	 				return metricData.totalTime / metricData.eventsCount;
	 			}
 			} else {
 				var eventsCount = 0;
 				var totalTime = 0;
 				for (var metricData in __metrics) {
				    if (__metrics.hasOwnProperty(metricData)) {
				        eventsCount += metricData.eventsCount;
				        totalTime += metricData.totalTime;
				    }
				}
				return totalTime / eventsCount;
 			}
 		}


 		/**
 		 *
 		 *
		 *	Utility functions :)
		 *
		 *
		 */
 		function generateId(metricType) {
 			var num = (new Date()).getTime() + Math.floor((Math.random() * 100) + 1);
 			return num + '-' + metricType;
 		}


 		return {
 			begin: begin,
 			end: end,
 			getCount: getCount,
 			getTotalTime: getTotalTime,
 			getAverageTime: getAverageTime
 		}
 	}
 )();