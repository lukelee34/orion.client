/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define window*/
/*jslint regexp:false browser:true forin:true*/

define(['i18n!orion/search/nls/messages', 'require', 'dojo', 'orion/commands', 'orion/searchExplorer', 'orion/searchUtils', 'orion/crawler/searchCrawler'], function(messages, require, dojo, mCommands, mSearchExplorer, mSearchUtils, mSearchCrawler){

	/**
	 * Creates a new search results generator.
	 * @name orion.searchResults.SearchResultsGenerator
	 * @class A search results generator for display search results to an end user
	 */
	function SearchResultsGenerator(serviceRegistry, resultsId, commandService, fileService, crawling) {
		this.registry = serviceRegistry;
		this.fileService = fileService;
		this.resultsId = resultsId;
		this.commandService = commandService;
		this.crawling = crawling;
		this.explorer = new mSearchExplorer.SearchResultExplorer(this.registry, this.commandService);
	}

	SearchResultsGenerator.prototype = /** @lends orion.searchResults.SearchResultsGenerator.prototype */ {

		_renderSearchResult: function(resultsNode, query, jsonData) {
			var foundValidHit = false;
			var resultLocation = [];
			dojo.empty(resultsNode);
			if (jsonData.response.numFound > 0) {
				for (var i=0; i < jsonData.response.docs.length; i++) {
					var hit = jsonData.response.docs[i];
					if (!hit.Directory) {
						if (!foundValidHit) {
							foundValidHit = true;
						}
						var loc = hit.Location;
						resultLocation.push({linkLocation: require.toUrl("edit/edit.html") +"#" + loc, location: loc, path: hit.Path ? hit.Path : loc, name: hit.Name, lastModified: hit.LastModified}); //$NON-NLS-1$ //$NON-NLS-0$
						
					}
				}
			}
			this.explorer.setResult(resultsNode, resultLocation, query, jsonData.response.numFound);
			this.explorer.startUp();
		},

		/**
		 * Runs a search and displays the results under the given DOM node.
		 * @public
		 * @param {DOMNode} resultsNode Node under which results will be added.
		 * @param {String} query URI of the query to run.
		 * @param {String} [excludeFile] URI of a file to exclude from the result listing.
		 * @param {Boolean} [generateHeading] generate a heading for the results
		 * @param {Function(DOMNode)} [onResultReady] If any results were found, this is called on the resultsNode.
		 * @param {Boolean} [hideSummaries] Don't show the summary of what matched beside each result.
		 * @param {Boolean} [useSimpleFormat] Use simple format that only shows the file name to show the result, other wise use a complex format with search details.
		 */
		_search: function(resultsNode, query) {
			//For crawling search, temporary
			//TODO: we need a better way to render the progress and allow user to be able to cancel hte crawling search
			if(this.crawling){
				var self = this;
				var crawler = new mSearchCrawler.SearchCrawler(this.registry, this.fileService, query);
				crawler.search(function(jsonData){self._renderSearchResult(resultsNode, query, jsonData);});
			} else {
				var qObj = mSearchUtils.parseQueryStr(query);
				try{
					this.fileService.search(qObj.location, query).then(
						dojo.hitch(this, function(jsonData) {
							this._renderSearchResult(resultsNode, query, jsonData);
						}));
				}
				catch(error){
					this.registry.getService("orion.page.message").setErrorMessage(error);	 //$NON-NLS-0$
				}
			}
		},

		/**
		 * Performs the given query and generates the user interface 
		 * representation of the search results.
		 * @param {String} query The search query
		 */
		loadResults: function(query) {
			// console.log("loadResourceList old " + this._lastHash + " new " + path);
			var parent = dojo.byId(this.resultsId);
			dojo.place(document.createTextNode(messages["Searching..."]), parent, "only"); //$NON-NLS-1$
			this._search(parent, query);
		}
		
	};
	SearchResultsGenerator.prototype.constructor = SearchResultsGenerator;
	//return module exports
	return {SearchResultsGenerator:SearchResultsGenerator};
});