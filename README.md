# Polymer Apollo Client

## Installation

	npm install
	
## Build
	
	gulp build
	
## Query Example

In \<head>:

	<link rel="import" href="dist/apollo-client.html">

In \<body>:

	<script>
		class TestElement extends Polymer.Element {
			static get is() { return 'test-element'; }

			static get properties() {
				return {

					value: {
						type: Object,
						notify: false,
						reflectToAttribute: false,
						value: {}
					}
				}
			}
			
			
			let client = thisElem.shadowRoot.querySelector('apollo-client');
            
			client.set('query', `query timeSeries($database:String!,$dataset:String!,$startDate:String!,$endDate:String!) {
				timeseries(database:$database,dataset:$dataset,startDate:$startDate,endDate:$endDate) {
				dataset,
				data {
					date,
					high,
					close,
					low,
					volume,
					value
					}
				}
			}`);

			client.set('variables', {
				"database":"fred",
				"dataset":"DGS10",
				"startDate":"2018-03-01",
				"endDate":"2018-04-26"
			});
		}
	</script>
	<apollo-client ws-uri="ws://localhost:8000/graphql" http-uri="http://localhost:8000/graphql" data="{{value}}"></apollo-client>

	<div style="position: relative; top: 50px; left: 0;">{{value.timeseries.dataset}}</div>
		<div>
			<template is="dom-repeat" items="[[value.timeseries.data]]">
				<div>First name: <span>{{item.date}}</span></div>
				<div>Last name: <span>{{item.value}}</span></div>
			</template>
		</div>
	</div>
	
## Subscription Example

In \<head>:

	<link rel="import" href="dist/apollo-client.html">

In \<body>:

	<script>
		class TestElement extends Polymer.Element {
			static get is() { return 'test-element'; }

			static get properties() {
				return {

					value: {
						type: Object,
						notify: false,
						reflectToAttribute: false,
						value: {}
					}
				}
			}
		}
	</script>

	<apollo-client subscription="true" ws-uri="ws://localhost:8000/graphql" 
		query="subscription($database:String!,$dataset:String!) {
			series(database:$database,dataset:$dataset) {
			value
			volume
			high
			low
			close
			}
			}"
		variables='{"database": "mydb", "dataset": "datasetname"}' data="{{value}}"></apollo-client>
		
	<div>
		Volume: {{value.series.volume}}
		Value: {{value.series.value}}
	</div>