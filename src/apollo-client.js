import gql from 'graphql-tag';
import { ApolloClient } from 'apollo-client';
import { getMainDefinition } from 'apollo-utilities';
import { ApolloLink, split } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { InMemoryCache } from 'apollo-cache-inmemory';

class ApolloClientElement extends Polymer.Element {
	static get is() { return 'apollo-client'; }

	static get properties() {
		return {
			wsUri: {
				type: String,
				notify: true,
				reflectToAttribute: true,
				observer: '_setClient'
			},
			httpUri: {
				type: String,
				notify: true,
				reflectToAttribute: true,
				observer: '_setClient'
			},
			link: {
				type: String,
				notify: true,
				reflectToAttribute: true,
				value() {
					return 'split';
				},
				observer: '_setClient'
			},
			subscription: {
				type: Boolean,
				notify: true,
				reflectToAttribute: true,
				value() {
					return false;
				},
			},
			localClient: {
				type: Boolean,
				notify: true,
				reflectToAttribute: true,
				readOnly: true
			},
			query: {
				type: String,
				notify: true,
				reflectToAttribute: true,
				observer: '_queryChanged'
			},
			variables: {
				type: String,
				notify: true,
				reflectToAttribute: true,
				observer: '_queryChanged'
			},
			data: {
				type: Object,
				notify: true,
				reflectToAttribute: true,
				value: {}
			}
		}
	}

	static get observers() {
		return [
		];
	}

	constructor() {
		if(!Array.isArray(window._apolloClients))
			window._apolloClients = [];

		super();
	}

	ready() {
		window._apolloClients.push(this);
		super.ready();
	}

	_queryChanged() {
		const thisElem = this;
		if(typeof thisElem.get('query') !== 'undefined' && typeof thisElem.get('variables') !== 'undefined') {
			let queryFunction = thisElem.get('subscription') ? 'serverSubscribe' : 'serverQuery';

			thisElem[queryFunction].call(thisElem, {
				query: thisElem.get('query'),
				variables: thisElem.get('variables')
			}, function(error, data) {
				thisElem.setProperties({
					error: error,
					data: data
				});
			});
		}
	}

	_parseOptions(options) {
		let optionsCopy = options;
		optionsCopy.query = gql(optionsCopy.query);

		if(typeof optionsCopy.variables === 'string')
			optionsCopy.variables = JSON.parse(optionsCopy.variables);

		return optionsCopy;
	}

	serverSubscribe(options, callback) {
		let optionsCopy = this._parseOptions(options);

		const subscriptionObservable = this.client.subscribe(optionsCopy);

		return subscriptionObservable.subscribe({
			next(response) {
				callback(null, response.data);
			},
			error(err) {
				callback(error, null);
			},
		});
	}

	serverQuery(options, callback) {
		let optionsCopy = this._parseOptions(options);

		this.client.query(optionsCopy)
		.then(function(response) {
			callback(null, response.data);
		})
		.catch(function(error) {
			callback(error, null);
		});
	}

	_setClient() {
		const thisElem = this;

		let params = {
			httpUri: this.httpUri,
			wsUri: this.wsUri,
			link: this.link
		};

		// Try find already-load
		let registeredClient = this._findRegisteredApolloClient(params);

		if(registeredClient) {
			thisElem._setLocalClient(false);
			this.client = registeredClient.client;

			// Listen to parameter changes to registered client
			function registeredParamChanged() {
				Object.keys(params).forEach(function(paramKey) {
					registeredClient.removeEventListener(thisElem._camelCaseToDash(paramKey) + '-changed', registeredParamChanged)
				});
				thisElem._setClient();
			}

			Object.keys(params).forEach(function(paramKey) {
				registeredClient.addEventListener(thisElem._camelCaseToDash(paramKey) + '-changed', registeredParamChanged)
			});
		}
		else if(!thisElem._objectContainsObject(this._clientParams, params)) {
			this._clientParams = params;
			thisElem._setLocalClient(true);
			thisElem.client = this._createLocalClient(params);
		}
	}

	_createLocalClient(params) {
		let links = {};

		links.ws = ((['ws', 'split'].indexOf(params.link) >= 0) && (typeof params.wsUri !== 'undefined')) ? new WebSocketLink({
			uri: params.wsUri,
			options: {
				reconnect: true,
			},
		}) : null;

		links.http = ((['http', 'split'].indexOf(params.link) >= 0) && (typeof params.httpUri !== 'undefined')) ? new HttpLink({
			uri: params.httpUri
		}) : null;

		links.split = (links.http && links.ws) ? split(
			({ query }) => {
				const { kind, operation } = getMainDefinition(query);
				return (
					kind === 'OperationDefinition' && operation === 'subscription'
				);
			},
			links.ws,
			links.http,
		) : null;

		const link = ApolloLink.from([links[params.link]]);
		const cache = new InMemoryCache();

		return new ApolloClient({
			link,
			cache,
		});
	}

	_findRegisteredApolloClient(params) {
		const clients = window._apolloClients;

		for(let index = 0; index < clients.length; index++) {
			let client = clients[index];
			if(client !== this && client.localClient && this._objectContainsObject(client, params)) {
				return client;
			}
		}

		return null;
	}

	_objectContainsObject(containerObject, object) {
		if(typeof containerObject != 'object' || typeof object != 'object')
			return false;
		for(let property in object) { // pull keys before looping through?
			if(object.hasOwnProperty(property) && (typeof containerObject[property] !== typeof object[property] || containerObject[property] != object[property]))
				return false;
		}
		return true;
	};

	_camelCaseToDash(str) {
		return str.replace(/(?:^|\.?)([A-Z])/g, function (x,y){return "_" + y.toLowerCase()}).replace(/^_/, "");
	}

	disconnectedCallback() {
		//console.log('disconnected');
	}
}

customElements.define(ApolloClientElement.is, ApolloClientElement);