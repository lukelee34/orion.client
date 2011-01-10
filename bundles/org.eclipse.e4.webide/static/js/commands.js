/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 /*global dojo, document, window, eclipse, alert, Image */
 
/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * The command service manages the available commands.
 * @class The command service manages the available commands.
 */
eclipse.CommandService = (function() {
	/**
	 * Constructs a new command with the given options.
	 * @param {Object} options The command options object
	 * @class A command is an object visible to end users and performs some operation when invoked.
	 *  Define commands in terms of function (and presentation for now) and then use helpers to generate
	 *  DOM elements that perform these commands. What is the relationship to this and editor KeyBindings?
	 * @name eclipse.Command
	 */
	function CommandService(options) {
		this._globalScope = [];
		this._pageScope = [];
		this._domScope = [];
		this._objectScope = [];
		this._init(options);
	}
	CommandService.prototype = /** @lends eclipse.CommandService.prototype */ {
		_init: function(options) {
			this._registry = options.serviceRegistry;
		},
		
		addCommand: function(command, scope, scopeId) {
			switch (scope) {
			case "global":
				this._globalScope.push({scopeId: scopeId, command: command});
				break;
				
			case "page":
				this._pageScope.push({scopeId: scopeId, command: command});
				break;
				
			case "dom":
				this._domScope.push({scopeId: scopeId, command: command});
				break;
				
			case "object":
				this._objectScope.push({scopeId: scopeId, command: command});
				break;
			}
		},
		
		renderCommands: function(parent, scope, items, handler, style) {
			var i, command;
			switch (scope) {
			case "global":
				for (i = 0; i < this._globalScope.length; i++) { 
					command = this._globalScope[i].command;
					this._render(parent, command, items, handler, style);
				}
				break;
				
			case "page":
				for (i = 0; i < this._pageScope.length; i++) { 
					command = this._pageScope[i].command;
					if (window.document.id === this._pageScope[i].scopeId) {
						this._render(parent, command, items, handler, style);		
					}
				}
				break;
				
			case "dom":
				for (i = 0; i < this._domScope.length; i++) { 
					command = this._domScope[i].command;
					if (parent.id === this._domScope[i].scopeId) {
						this._render(parent, command, items, handler, style);		
					}
				}				
				break;
				
			case "object":
				for (i = 0; i < this._objectScope.length; i++) { 
					command = this._objectScope[i].command;
					if (!items) {
						var cmdService = this;
						this._registry.callService("ISelectionService", "getSelection", null, [function(selection) {
							cmdService._renderObjectScope(parent, command, selection, handler, style);
						}]);
					} else {
						this._renderObjectScope(parent, command, items, handler, style);		
					}
				}				
				break;
			}
		},
		
		_renderObjectScope: function(parent, command, items, handler, style) {
			if (!items) {
				return;
			}
			var render = true;
			if (command.visibleWhen) {
				render = command.visibleWhen(items);
			}
			if (render) {
				this._render(parent, command, items, handler, style);
			}
		},
		
		_render: function(parent, command, items, handler, style) {
			if (style === "image") {
				var image = command._asImage("image"+command.id, items, handler);
				dojo.place(image, parent, "last");	
			}
		}

	};  // end prototype
	return CommandService;
}());


eclipse.Command = (function() {
	/**
	 * Constructs a new command with the given options.
	 * @param {Object} options The command options object
	 * @class A command is an object visible to end users and performs some operation when invoked.
	 *  Define commands in terms of function (and presentation for now) and then use helpers to generate
	 *  DOM elements that perform these commands. What is the relationship to this and editor KeyBindings?
	 * @name eclipse.Command
	 */
	function Command (options) {
		this._init(options);
	}
	Command.prototype = /** @lends eclipse.Command.prototype */ {
		_init: function(options) {
			this.name = options.name || "Empty Command";
			this.tooltip = options.tooltip || "Empty Tooltip";
			this._callback = options.callback || function() { alert("Empty Command"); };
			this.image = options.image || "/images/none.png";
			this.hotImage = options.hotImage;
			this.visibleWhen = options.visibleWhen;
			this.id = options.id;
			// when false, affordances for commands are always shown.  When true,
			// they are shown on hover only.
			//how will we know this?
			this._deviceSupportsHover = false;  
		},
		_asImage: function(name, items, handler) {
			handler = handler || this;
			var image = new Image();
			image.alt = this.name;
			image.title = this.name;
			image.name = name;
			dojo.connect(image, "onclick", this, function() {
				this._callback.call(handler, items);
			});
			if (this._deviceSupportsHover) {
				image.src = "/images/none.png";
				dojo.connect(image, "onmouseover", this, function() {
					image.src = this.hotImage;
				});
				dojo.connect(image, "onmouseout", this, function() {
					image.src = "/images/none.png";
				});	
			} else {
				image.src = this.image;	
				if (this.hotImage) {
					dojo.connect(image, "onmouseover", this, function() {
						image.src = this.hotImage;
					});
					dojo.connect(image, "onmouseout", this, function() {
						image.src = this.image;
					});
				}
			}
			dojo.addClass(image, 'commandImage');
			return image;
		},
		_asLink: function(items, handler) {
			handler =  handler || this;
			var anchor = document.createElement('a');
			anchor.innerHTML = this.name;
			anchor.href="";
			dojo.connect(anchor, "onclick", this, function() {
				this._callback.call(handler, items);
			});
			dojo.addClass(anchor, 'commandLink');
			return anchor;
		}
		
	};  // end prototype
	return Command;
}());

