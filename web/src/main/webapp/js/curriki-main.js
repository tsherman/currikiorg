Array.prototype.contains = function(A) {
	return this.indexOf(A) !== -1
};
Ext.namespace("Ext.ux");
Ext.ux.DDView = function(B) {
	if (!B.itemSelector) {
		var A = B.tpl;
		if (this.classRe.test(A)) {
			B.tpl = A.replace(this.classRe, "class=$1x-combo-list-item $2$1")
		} else {
			B.tpl = A.replace(this.tagRe, '$1 class="x-combo-list-item" $2')
		}
		B.itemSelector = ".x-combo-list-item"
	}
	Ext.ux.DDView.superclass.constructor.call(this, Ext.apply(B, {
		border : false
	}))
};
Ext.extend(Ext.ux.DDView, Ext.DataView, {
	sortDir : "ASC",
	isFormField : true,
	classRe : /class=(['"])(.*)\1/,
	tagRe : /(<\w*)(.*?>)/,
	reset : Ext.emptyFn,
	clearInvalid : Ext.form.Field.prototype.clearInvalid,
	msgTarget : "qtip",
	afterRender : function() {
		Ext.ux.DDView.superclass.afterRender.call(this);
		if (this.dragGroup) {
			this.setDraggable(this.dragGroup.split(","))
		}
		if (this.dropGroup) {
			this.setDroppable(this.dropGroup.split(","))
		}
		if (this.deletable) {
			this.setDeletable()
		}
		this.isDirtyFlag = false;
		this.addEvents("drop")
	},
	validate : function() {
		return true
	},
	destroy : function() {
		this.purgeListeners();
		this.getEl().removeAllListeners();
		this.getEl().remove();
		if (this.dragZone) {
			if (this.dragZone.destroy) {
				this.dragZone.destroy()
			}
		}
		if (this.dropZone) {
			if (this.dropZone.destroy) {
				this.dropZone.destroy()
			}
		}
	},
	getName : function() {
		return this.name
	},
	setValue : function(A) {
		if (!this.store) {
			throw "DDView.setValue(). DDView must be constructed with a valid Store"
		}
		var B = {};
		B[this.store.reader.meta.root] = A ? [].concat(A) : [];
		this.store.proxy = new Ext.data.MemoryProxy(B);
		this.store.load()
	},
	getValue : function() {
		var A = "(";
		this.store.each(function(B) {
			A += B.id + ","
		});
		return A.substr(0, A.length - 1) + ")"
	},
	getIds : function() {
		var B = 0, A = new Array(this.store.getCount());
		this.store.each(function(C) {
			A[B++] = C.id
		});
		return A
	},
	isDirty : function() {
		return this.isDirtyFlag
	},
	getTargetFromEvent : function(B) {
		var A = B.getTarget();
		while ((A !== null) && (A.parentNode != this.el.dom)) {
			A = A.parentNode
		}
		if (!A) {
			A = this.el.dom.lastChild || this.el.dom
		}
		return A
	},
	getDragData : function(D) {
		var C = this.findItemFromChild(D.getTarget());
		if (C) {
			if (!this.isSelected(C)) {
				delete this.ignoreNextClick;
				this.onItemClick(C, this.indexOf(C), D);
				this.ignoreNextClick = true
			}
			var B = {
				sourceView : this,
				viewNodes : [],
				records : [],
				copy : this.copy || (this.allowCopy && D.ctrlKey)
			};
			if (this.getSelectionCount() == 1) {
				var A = this.getSelectedIndexes()[0];
				var E = this.getNode(A);
				B.viewNodes.push(B.ddel = E);
				B.records.push(this.store.getAt(A));
				B.repairXY = Ext.fly(E).getXY()
			} else {
				B.ddel = document.createElement("div");
				B.ddel.className = "multi-proxy";
				this.collectSelection(B)
			}
			return B
		}
		return false
	},
	getRepairXY : function(A) {
		return this.dragData.repairXY
	},
	collectSelection : function(B) {
		B.repairXY = Ext.fly(this.getSelectedNodes()[0]).getXY();
		if (this.preserveSelectionOrder === true) {
			Ext.each(this.getSelectedIndexes(), function(C) {
				var E = this.getNode(C);
				var D = E.cloneNode(true);
				D.id = Ext.id();
				B.ddel.appendChild(D);
				B.records.push(this.store.getAt(C));
				B.viewNodes.push(E)
			}, this)
		} else {
			var A = 0;
			this.store.each(function(D) {
				if (this.isSelected(A)) {
					var E = this.getNode(A);
					var C = E.cloneNode(true);
					C.id = Ext.id();
					B.ddel.appendChild(C);
					B.records.push(this.store.getAt(A));
					B.viewNodes.push(E)
				}
				A++
			}, this)
		}
	},
	setDraggable : function(A) {
		if (A instanceof Array) {
			Ext.each(A, this.setDraggable, this);
			return
		}
		if (this.dragZone) {
			this.dragZone.addToGroup(A)
		} else {
			this.dragZone = new Ext.dd.DragZone(this.getEl(), {
				containerScroll : true,
				ddGroup : A
			});
			if (!this.multiSelect) {
				this.singleSelect = true
			}
			this.dragZone.getDragData = this.getDragData.createDelegate(this);
			this.dragZone.getRepairXY = this.getRepairXY;
			this.dragZone.onEndDrag = this.onEndDrag
		}
	},
	setDroppable : function(A) {
		if (A instanceof Array) {
			Ext.each(A, this.setDroppable, this);
			return
		}
		if (this.dropZone) {
			this.dropZone.addToGroup(A)
		} else {
			this.dropZone = new Ext.dd.DropZone(this.getEl(), {
				owningView : this,
				containerScroll : true,
				ddGroup : A
			});
			this.dropZone.getTargetFromEvent = this.getTargetFromEvent
					.createDelegate(this);
			this.dropZone.onNodeEnter = this.onNodeEnter.createDelegate(this);
			this.dropZone.onNodeOver = this.onNodeOver.createDelegate(this);
			this.dropZone.onNodeOut = this.onNodeOut.createDelegate(this);
			this.dropZone.onNodeDrop = this.onNodeDrop.createDelegate(this)
		}
	},
	getDropPoint : function(D, G, B) {
		if (G == this.el.dom) {
			return "above"
		}
		var C = Ext.lib.Dom.getY(G), A = C + G.offsetHeight;
		var F = C + (A - C) / 2;
		var E = Ext.lib.Event.getPageY(D);
		if (E <= F) {
			return "above"
		} else {
			return "below"
		}
	},
	isValidDropPoint : function(B, D, A) {
		if (!A.viewNodes || (A.viewNodes.length != 1)) {
			return true
		}
		var C = A.viewNodes[0];
		if (C == D) {
			return false
		}
		if ((B == "below") && (D.nextSibling == C)) {
			return false
		}
		if ((B == "above") && (D.previousSibling == C)) {
			return false
		}
		return true
	},
	onNodeEnter : function(D, A, C, B) {
		if (this.highlightColor && (B.sourceView != this)) {
			this.el.highlight(this.highlightColor)
		}
		return false
	},
	onNodeOver : function(G, A, F, D) {
		var B = this.dropNotAllowed;
		var E = this.getDropPoint(F, G, A);
		if (this.isValidDropPoint(E, G, D)) {
			if (this.appendOnly || this.sortField) {
				return "x-tree-drop-ok-below"
			}
			if (E) {
				var C;
				if (E == "above") {
					B = G.previousSibling
							? "x-tree-drop-ok-between"
							: "x-tree-drop-ok-above";
					C = "x-view-drag-insert-above"
				} else {
					B = G.nextSibling
							? "x-tree-drop-ok-between"
							: "x-tree-drop-ok-below";
					C = "x-view-drag-insert-below"
				}
				if (this.lastInsertClass != C) {
					Ext.fly(G).replaceClass(this.lastInsertClass, C);
					this.lastInsertClass = C
				}
			}
		}
		return B
	},
	onNodeOut : function(D, A, C, B) {
		this.removeDropIndicators(D)
	},
	onNodeDrop : function(C, I, G, E) {
		if (this.fireEvent("drop", this, C, I, G, E) === false) {
			return false
		}
		var J = this.getDropPoint(G, C, I);
		var D = (this.appendOnly || (C == this.el.dom))
				? this.store.getCount()
				: C.viewIndex;
		if (J == "below") {
			D++
		}
		if (E.sourceView == this) {
			if (J == "below") {
				if (E.viewNodes[0] == C) {
					E.viewNodes.shift()
				}
			} else {
				if (E.viewNodes[E.viewNodes.length - 1] == C) {
					E.viewNodes.pop()
				}
			}
			if (!E.viewNodes.length) {
				return false
			}
			if (D > this.store.indexOf(E.records[0])) {
				D--
			}
		}
		if (E.node instanceof Ext.tree.TreeNode) {
			var A = E.node.getOwnerTree().recordFromNode(E.node);
			if (A) {
				E.records = [A]
			}
		}
		if (!E.records) {
			alert("Programming problem. Drag data contained no Records");
			return false
		}
		for (var F = 0; F < E.records.length; F++) {
			var A = E.records[F];
			var B = this.store.getById(A.id);
			if (B && (I != this.dragZone)) {
				if (!this.allowDup && !this.allowTrash) {
					Ext.fly(this.getNode(this.store.indexOf(B)))
							.frame("red", 1);
					return true
				}
				var H = new Ext.data.Record();
				A.id = H.id;
				delete H
			}
			if (E.copy) {
				this.store.insert(D++, A.copy())
			} else {
				if (E.sourceView) {
					E.sourceView.isDirtyFlag = true;
					E.sourceView.store.remove(A)
				}
				if (!this.allowTrash) {
					this.store.insert(D++, A)
				}
			}
			if (this.sortField) {
				this.store.sort(this.sortField, this.sortDir)
			}
			this.isDirtyFlag = true
		}
		this.dragZone.cachedTarget = null;
		return true
	},
	onEndDrag : function(A, B) {
		var C = Ext.get(this.dragData.ddel);
		if (C && C.hasClass("multi-proxy")) {
			C.remove()
		}
	},
	removeDropIndicators : function(A) {
		if (A) {
			Ext.fly(A).removeClass(["x-view-drag-insert-above",
					"x-view-drag-insert-left", "x-view-drag-insert-right",
					"x-view-drag-insert-below"]);
			this.lastInsertClass = "_noclass"
		}
	},
	setDeletable : function(A) {
		if (!this.singleSelect && !this.multiSelect) {
			this.singleSelect = true
		}
		var B = this.getContextMenu();
		this.contextMenu.on("itemclick", function(C) {
			switch (C.id) {
				case "delete" :
					this.remove(this.getSelectedIndexes());
					break
			}
		}, this);
		this.contextMenu.add({
			icon : A || AU.resolveUrl("/images/delete.gif"),
			id : "delete",
			text : AU.getMessage("deleteItem")
		})
	},
	getContextMenu : function() {
		if (!this.contextMenu) {
			this.contextMenu = new Ext.menu.Menu({
				id : this.id + "-contextmenu"
			});
			this.el.on("contextmenu", this.showContextMenu, this)
		}
		return this.contextMenu
	},
	disableContextMenu : function() {
		if (this.contextMenu) {
			this.el.un("contextmenu", this.showContextMenu, this)
		}
	},
	showContextMenu : function(B, A) {
		A = this.findItemFromChild(B.getTarget());
		if (A) {
			B.stopEvent();
			this.select(this.getNode(A), this.multiSelect && B.ctrlKey, true);
			this.contextMenu.showAt(B.getXY())
		}
	},
	remove : function(B) {
		B = [].concat(B);
		for (var A = 0; A < B.length; A++) {
			var C = this.store.getAt(B[A]);
			this.store.remove(C)
		}
	},
	onDblClick : function(E) {
		var D = this.findItemFromChild(E.getTarget());
		if (D) {
			if (this.fireEvent("dblclick", this, this.indexOf(D), D, E) === false) {
				return false
			}
			if (this.dragGroup) {
				var A = Ext.dd.DragDropMgr.getRelated(this.dragZone, true);
				while (A.contains(this.dropZone)) {
					A.remove(this.dropZone)
				}
				if ((A.length == 1) && (A[0].owningView)) {
					this.dragZone.cachedTarget = null;
					var B = Ext.get(A[0].getEl());
					var C = B.getBox(true);
					A[0].onNodeDrop(B.dom, {
						target : B.dom,
						xy : [C.x, C.y + C.height - 1]
					}, null, this.getDragData(E))
				}
			}
		}
	},
	onItemClick : function(B, A, C) {
		if (this.ignoreNextClick) {
			delete this.ignoreNextClick;
			return
		}
		if (this.fireEvent("beforeclick", this, A, B, C) === false) {
			return false
		}
		if (this.multiSelect || this.singleSelect) {
			if (this.multiSelect && C.shiftKey && this.lastSelection) {
				this.select(this.getNodes(this.indexOf(this.lastSelection), A),
						false)
			} else {
				if (this.isSelected(B) && C.ctrlKey) {
					this.deselect(B)
				} else {
					this.deselect(B);
					this.select(B, this.multiSelect && C.ctrlKey);
					this.lastSelection = B
				}
			}
			C.preventDefault()
		}
		return true
	}
});
Ext.ux.Multiselect = Ext.extend(Ext.form.Field, {
	store : null,
	dataFields : [],
	data : [],
	width : 100,
	height : 100,
	displayField : 0,
	valueField : 1,
	allowBlank : true,
	minLength : 0,
	maxLength : Number.MAX_VALUE,
	blankText : Ext.form.TextField.prototype.blankText,
	minLengthText : "Minimum {0} item(s) required",
	maxLengthText : "Maximum {0} item(s) allowed",
	copy : false,
	allowDup : false,
	allowTrash : false,
	legend : null,
	focusClass : undefined,
	delimiter : ",",
	view : null,
	dragGroup : null,
	dropGroup : null,
	tbar : null,
	appendOnly : false,
	sortField : null,
	sortDir : "ASC",
	defaultAutoCreate : {
		tag : "div"
	},
	initComponent : function() {
		Ext.ux.Multiselect.superclass.initComponent.call(this);
		this.addEvents({
			dblclick : true,
			click : true,
			change : true,
			drop : true
		})
	},
	onRender : function(E, B) {
		var A, C, D;
		Ext.ux.Multiselect.superclass.onRender.call(this, E, B);
		C = "ux-mselect";
		A = new Ext.form.FieldSet({
			renderTo : this.el,
			title : this.legend,
			height : this.height,
			width : this.width,
			style : "padding:1px;",
			tbar : this.tbar
		});
		if (!this.legend) {
			A.el.down("." + A.headerCls).remove()
		}
		A.body.addClass(C);
		D = '<tpl for="."><div class="' + C + "-item";
		if (Ext.isIE || Ext.isIE7) {
			D += '" unselectable=on'
		} else {
			D += ' x-unselectable"'
		}
		D += ">{" + this.displayField + "}</div></tpl>";
		if (!this.store) {
			this.store = new Ext.data.SimpleStore({
				fields : this.dataFields,
				data : this.data
			})
		}
		this.view = new Ext.ux.DDView({
			multiSelect : true,
			store : this.store,
			selectedClass : C + "-selected",
			tpl : D,
			allowDup : this.allowDup,
			copy : this.copy,
			allowTrash : this.allowTrash,
			dragGroup : this.dragGroup,
			dropGroup : this.dropGroup,
			itemSelector : "." + C + "-item",
			isFormField : false,
			applyTo : A.body,
			appendOnly : this.appendOnly,
			sortField : this.sortField,
			sortDir : this.sortDir
		});
		A.add(this.view);
		this.view.on("click", this.onViewClick, this);
		this.view.on("beforeClick", this.onViewBeforeClick, this);
		this.view.on("dblclick", this.onViewDblClick, this);
		this.view.on("drop", function(H, K, G, J, I) {
			return this.fireEvent("drop", H, K, G, J, I)
		}, this);
		this.hiddenName = this.name;
		var F = {
			tag : "input",
			type : "hidden",
			value : "",
			name : this.name
		};
		if (this.isFormField) {
			this.hiddenField = this.el.createChild(F)
		} else {
			this.hiddenField = Ext.get(document.body).createChild(F)
		}
		A.doLayout()
	},
	initValue : Ext.emptyFn,
	onViewClick : function(D, B, C, E) {
		var A = this.preClickSelections.indexOf(B);
		if (A != -1) {
			this.preClickSelections.splice(A, 1);
			this.view.clearSelections(true);
			this.view.select(this.preClickSelections)
		}
		this.fireEvent("change", this, this.getValue(),
				this.hiddenField.dom.value);
		this.hiddenField.dom.value = this.getValue();
		this.fireEvent("click", this, E);
		this.validate()
	},
	onViewBeforeClick : function(C, A, B, D) {
		this.preClickSelections = this.view.getSelectedIndexes();
		if (this.disabled) {
			return false
		}
	},
	onViewDblClick : function(C, A, B, D) {
		return this.fireEvent("dblclick", C, A, B, D)
	},
	getValue : function(A) {
		var D = [];
		var C = this.view.getSelectedIndexes();
		if (C.length == 0) {
			return ""
		}
		for (var B = 0; B < C.length; B++) {
			D.push(this.store.getAt(C[B]).get(((A != null)
					? A
					: this.valueField)))
		}
		return D.join(this.delimiter)
	},
	setValue : function(A) {
		var B;
		var D = [];
		this.view.clearSelections();
		this.hiddenField.dom.value = "";
		if (!A || (A == "")) {
			return
		}
		if (!(A instanceof Array)) {
			A = A.split(this.delimiter)
		}
		for (var C = 0; C < A.length; C++) {
			B = this.view.store.indexOf(this.view.store.query(this.valueField,
					new RegExp("^" + A[C] + "$", "i")).itemAt(0));
			D.push(B)
		}
		this.view.select(D);
		this.hiddenField.dom.value = this.getValue();
		this.validate()
	},
	reset : function() {
		this.setValue("")
	},
	getRawValue : function(A) {
		var B = this.getValue(A);
		if (B.length) {
			B = B.split(this.delimiter)
		} else {
			B = []
		}
		return B
	},
	setRawValue : function(A) {
		setValue(A)
	},
	validateValue : function(A) {
		if (A.length < 1) {
			if (this.allowBlank) {
				this.clearInvalid();
				return true
			} else {
				this.markInvalid(this.blankText);
				return false
			}
		}
		if (A.length < this.minLength) {
			this.markInvalid(String.format(this.minLengthText, this.minLength));
			return false
		}
		if (A.length > this.maxLength) {
			this.markInvalid(String.format(this.maxLengthText, this.maxLength));
			return false
		}
		return true
	}
});
Ext.reg("multiselect", Ext.ux.Multiselect);
Ext.ux.ItemSelector = Ext.extend(Ext.form.Field, {
	msWidth : 200,
	msHeight : 300,
	hideNavIcons : false,
	imagePath : "",
	iconUp : "up2.gif",
	iconDown : "down2.gif",
	iconLeft : "left2.gif",
	iconRight : "right2.gif",
	iconTop : "top2.gif",
	iconBottom : "bottom2.gif",
	drawUpIcon : true,
	drawDownIcon : true,
	drawLeftIcon : true,
	drawRightIcon : true,
	drawTopIcon : true,
	drawBotIcon : true,
	fromStore : null,
	toStore : null,
	fromData : null,
	toData : null,
	displayField : 0,
	valueField : 1,
	switchToFrom : false,
	allowDup : false,
	focusClass : undefined,
	delimiter : ",",
	readOnly : false,
	toLegend : null,
	fromLegend : null,
	toSortField : null,
	fromSortField : null,
	toSortDir : "ASC",
	fromSortDir : "ASC",
	toTBar : null,
	fromTBar : null,
	bodyStyle : null,
	border : false,
	defaultAutoCreate : {
		tag : "div"
	},
	initComponent : function() {
		Ext.ux.ItemSelector.superclass.initComponent.call(this);
		this.addEvents({
			rowdblclick : true,
			change : true
		})
	},
	onRender : function(D, A) {
		Ext.ux.ItemSelector.superclass.onRender.call(this, D, A);
		this.fromMultiselect = new Ext.ux.Multiselect({
			legend : this.fromLegend,
			delimiter : this.delimiter,
			allowDup : this.allowDup,
			copy : this.allowDup,
			allowTrash : this.allowDup,
			dragGroup : this.readOnly ? null : "drop2-" + this.el.dom.id,
			dropGroup : this.readOnly ? null : "drop1-" + this.el.dom.id,
			width : this.msWidth,
			height : this.msHeight,
			dataFields : this.dataFields,
			data : this.fromData,
			displayField : this.displayField,
			valueField : this.valueField,
			store : this.fromStore,
			isFormField : false,
			tbar : this.fromTBar,
			appendOnly : true,
			sortField : this.fromSortField,
			sortDir : this.fromSortDir
		});
		this.fromMultiselect.on("dblclick", this.onRowDblClick, this);
		if (!this.toStore) {
			this.toStore = new Ext.data.SimpleStore({
				fields : this.dataFields,
				data : this.toData
			})
		}
		this.toStore.on("add", this.valueChanged, this);
		this.toStore.on("remove", this.valueChanged, this);
		this.toStore.on("load", this.valueChanged, this);
		this.toMultiselect = new Ext.ux.Multiselect({
			legend : this.toLegend,
			delimiter : this.delimiter,
			allowDup : this.allowDup,
			dragGroup : this.readOnly ? null : "drop1-" + this.el.dom.id,
			dropGroup : this.readOnly ? null : "drop2-" + this.el.dom.id
					+ ",drop1-" + this.el.dom.id,
			width : this.msWidth,
			height : this.msHeight,
			displayField : this.displayField,
			valueField : this.valueField,
			store : this.toStore,
			isFormField : false,
			tbar : this.toTBar,
			sortField : this.toSortField,
			sortDir : this.toSortDir
		});
		this.toMultiselect.on("dblclick", this.onRowDblClick, this);
		var G = new Ext.Panel({
			bodyStyle : this.bodyStyle,
			border : this.border,
			layout : "table",
			layoutConfig : {
				columns : 3
			}
		});
		G.add(this.switchToFrom ? this.toMultiselect : this.fromMultiselect);
		var C = new Ext.Panel({
			header : false
		});
		G.add(C);
		G.add(this.switchToFrom ? this.fromMultiselect : this.toMultiselect);
		G.render(this.el);
		C.el.down("." + C.bwrapCls).remove();
		if (this.imagePath != ""
				&& this.imagePath.charAt(this.imagePath.length - 1) != "/") {
			this.imagePath += "/"
		}
		this.iconUp = this.imagePath + (this.iconUp || "up2.gif");
		this.iconDown = this.imagePath + (this.iconDown || "down2.gif");
		this.iconLeft = this.imagePath + (this.iconLeft || "left2.gif");
		this.iconRight = this.imagePath + (this.iconRight || "right2.gif");
		this.iconTop = this.imagePath + (this.iconTop || "top2.gif");
		this.iconBottom = this.imagePath + (this.iconBottom || "bottom2.gif");
		var F = C.getEl();
		if (!this.toSortField) {
			this.toTopIcon = F.createChild({
				tag : "img",
				src : this.iconTop,
				style : {
					cursor : "pointer",
					margin : "2px"
				}
			});
			F.createChild({
				tag : "br"
			});
			this.upIcon = F.createChild({
				tag : "img",
				src : this.iconUp,
				style : {
					cursor : "pointer",
					margin : "2px"
				}
			});
			F.createChild({
				tag : "br"
			})
		}
		this.addIcon = F.createChild({
			tag : "img",
			src : this.switchToFrom ? this.iconLeft : this.iconRight,
			style : {
				cursor : "pointer",
				margin : "2px"
			}
		});
		F.createChild({
			tag : "br"
		});
		this.removeIcon = F.createChild({
			tag : "img",
			src : this.switchToFrom ? this.iconRight : this.iconLeft,
			style : {
				cursor : "pointer",
				margin : "2px"
			}
		});
		F.createChild({
			tag : "br"
		});
		if (!this.toSortField) {
			this.downIcon = F.createChild({
				tag : "img",
				src : this.iconDown,
				style : {
					cursor : "pointer",
					margin : "2px"
				}
			});
			F.createChild({
				tag : "br"
			});
			this.toBottomIcon = F.createChild({
				tag : "img",
				src : this.iconBottom,
				style : {
					cursor : "pointer",
					margin : "2px"
				}
			})
		}
		if (!this.readOnly) {
			if (!this.toSortField) {
				this.toTopIcon.on("click", this.toTop, this);
				this.upIcon.on("click", this.up, this);
				this.downIcon.on("click", this.down, this);
				this.toBottomIcon.on("click", this.toBottom, this)
			}
			this.addIcon.on("click", this.fromTo, this);
			this.removeIcon.on("click", this.toFrom, this)
		}
		if (!this.drawUpIcon || this.hideNavIcons) {
			this.upIcon.dom.style.display = "none"
		}
		if (!this.drawDownIcon || this.hideNavIcons) {
			this.downIcon.dom.style.display = "none"
		}
		if (!this.drawLeftIcon || this.hideNavIcons) {
			this.addIcon.dom.style.display = "none"
		}
		if (!this.drawRightIcon || this.hideNavIcons) {
			this.removeIcon.dom.style.display = "none"
		}
		if (!this.drawTopIcon || this.hideNavIcons) {
			this.toTopIcon.dom.style.display = "none"
		}
		if (!this.drawBotIcon || this.hideNavIcons) {
			this.toBottomIcon.dom.style.display = "none"
		}
		var B = G.body.first();
		this.el.setWidth(G.body.first().getWidth());
		G.body.removeClass();
		this.hiddenName = this.name;
		var E = {
			tag : "input",
			type : "hidden",
			value : "",
			name : this.name
		};
		this.hiddenField = this.el.createChild(E);
		this.valueChanged(this.toStore)
	},
	initValue : Ext.emptyFn,
	toTop : function() {
		var C = this.toMultiselect.view.getSelectedIndexes();
		var A = [];
		if (C.length > 0) {
			C.sort();
			for (var B = 0; B < C.length; B++) {
				record = this.toMultiselect.view.store.getAt(C[B]);
				A.push(record)
			}
			C = [];
			for (var B = A.length - 1; B > -1; B--) {
				record = A[B];
				this.toMultiselect.view.store.remove(record);
				this.toMultiselect.view.store.insert(0, record);
				C.push(((A.length - 1) - B))
			}
		}
		this.toMultiselect.view.refresh();
		this.toMultiselect.view.select(C)
	},
	toBottom : function() {
		var C = this.toMultiselect.view.getSelectedIndexes();
		var A = [];
		if (C.length > 0) {
			C.sort();
			for (var B = 0; B < C.length; B++) {
				record = this.toMultiselect.view.store.getAt(C[B]);
				A.push(record)
			}
			C = [];
			for (var B = 0; B < A.length; B++) {
				record = A[B];
				this.toMultiselect.view.store.remove(record);
				this.toMultiselect.view.store.add(record);
				C.push((this.toMultiselect.view.store.getCount())
						- (A.length - B))
			}
		}
		this.toMultiselect.view.refresh();
		this.toMultiselect.view.select(C)
	},
	up : function() {
		var A = null;
		var C = this.toMultiselect.view.getSelectedIndexes();
		C.sort();
		var D = [];
		if (C.length > 0) {
			for (var B = 0; B < C.length; B++) {
				A = this.toMultiselect.view.store.getAt(C[B]);
				if ((C[B] - 1) >= 0) {
					this.toMultiselect.view.store.remove(A);
					this.toMultiselect.view.store.insert(C[B] - 1, A);
					D.push(C[B] - 1)
				}
			}
			this.toMultiselect.view.refresh();
			this.toMultiselect.view.select(D)
		}
	},
	down : function() {
		var A = null;
		var C = this.toMultiselect.view.getSelectedIndexes();
		C.sort();
		C.reverse();
		var D = [];
		if (C.length > 0) {
			for (var B = 0; B < C.length; B++) {
				A = this.toMultiselect.view.store.getAt(C[B]);
				if ((C[B] + 1) < this.toMultiselect.view.store.getCount()) {
					this.toMultiselect.view.store.remove(A);
					this.toMultiselect.view.store.insert(C[B] + 1, A);
					D.push(C[B] + 1)
				}
			}
			this.toMultiselect.view.refresh();
			this.toMultiselect.view.select(D)
		}
	},
	fromTo : function() {
		var D = this.fromMultiselect.view.getSelectedIndexes();
		var B = [];
		if (D.length > 0) {
			for (var C = 0; C < D.length; C++) {
				record = this.fromMultiselect.view.store.getAt(D[C]);
				B.push(record)
			}
			if (!this.allowDup) {
				D = []
			}
			for (var C = 0; C < B.length; C++) {
				record = B[C];
				if (this.allowDup) {
					var A = new Ext.data.Record();
					record.id = A.id;
					delete A;
					this.toMultiselect.view.store.add(record)
				} else {
					this.fromMultiselect.view.store.remove(record);
					this.toMultiselect.view.store.add(record);
					D.push((this.toMultiselect.view.store.getCount() - 1))
				}
			}
		}
		this.toMultiselect.view.refresh();
		this.fromMultiselect.view.refresh();
		if (this.toSortField) {
			this.toMultiselect.store.sort(this.toSortField, this.toSortDir)
		}
		if (this.allowDup) {
			this.fromMultiselect.view.select(D)
		} else {
			this.toMultiselect.view.select(D)
		}
	},
	toFrom : function() {
		var C = this.toMultiselect.view.getSelectedIndexes();
		var A = [];
		if (C.length > 0) {
			for (var B = 0; B < C.length; B++) {
				record = this.toMultiselect.view.store.getAt(C[B]);
				A.push(record)
			}
			C = [];
			for (var B = 0; B < A.length; B++) {
				record = A[B];
				this.toMultiselect.view.store.remove(record);
				if (!this.allowDup) {
					this.fromMultiselect.view.store.add(record);
					C.push((this.fromMultiselect.view.store.getCount() - 1))
				}
			}
		}
		this.fromMultiselect.view.refresh();
		this.toMultiselect.view.refresh();
		if (this.fromSortField) {
			this.fromMultiselect.store.sort(this.fromSortField,
					this.fromSortDir)
		}
		this.fromMultiselect.view.select(C)
	},
	valueChanged : function(C) {
		var A = null;
		var B = [];
		for (var D = 0; D < C.getCount(); D++) {
			A = C.getAt(D);
			B.push(A.get(this.valueField))
		}
		this.hiddenField.dom.value = B.join(this.delimiter);
		this.fireEvent("change", this, this.getValue(),
				this.hiddenField.dom.value)
	},
	getValue : function() {
		return this.hiddenField.dom.value
	},
	onRowDblClick : function(C, A, B, D) {
		return this.fireEvent("rowdblclick", C, A, B, D)
	},
	reset : function() {
		range = this.toMultiselect.store.getRange();
		this.toMultiselect.store.removeAll();
		if (!this.allowDup) {
			this.fromMultiselect.store.add(range);
			this.fromMultiselect.store.sort(this.displayField, "ASC")
		}
		this.valueChanged(this.toMultiselect.store)
	}
});
Ext.reg("itemselector", Ext.ux.ItemSelector);
Ext.namespace("Ext.ux.Andrie");
Ext.ux.Andrie.pPageSize = function(A) {
	Ext.apply(this, A)
};
Ext.extend(Ext.ux.Andrie.pPageSize, Ext.util.Observable, {
	beforeText : "Show",
	afterText : "items",
	addBefore : "-",
	addAfter : null,
	dynamic : false,
	variations : [5, 10, 20, 50, 100, 200, 500, 1000],
	comboCfg : undefined,
	init : function(A) {
		this.pagingToolbar = A;
		this.pagingToolbar.pageSizeCombo = this;
		this.pagingToolbar.setPageSize = this.setPageSize.createDelegate(this);
		this.pagingToolbar.getPageSize = function() {
			return this.pageSize
		};
		this.pagingToolbar.on("render", this.onRender, this)
	},
	addSize : function(A) {
		if (A > 0) {
			this.sizes.push([A])
		}
	},
	updateStore : function() {
		if (this.dynamic) {
			var B = this.pagingToolbar.pageSize, E;
			B = (B > 0) ? B : 1;
			this.sizes = [];
			var C = this.variations;
			for (var D = 0, A = C.length; D < A; D++) {
				this.addSize(B - C[C.length - 1 - D])
			}
			this.addToStore(B);
			for (var D = 0, A = C.length; D < A; D++) {
				this.addSize(B + C[D])
			}
		} else {
			if (!this.staticSizes) {
				this.sizes = [];
				var C = this.variations;
				var B = 0;
				for (var D = 0, A = C.length; D < A; D++) {
					this.addSize(B + C[D])
				}
				this.staticSizes = this.sizes.slice(0)
			} else {
				this.sizes = this.staticSizes.slice(0)
			}
		}
		this.combo.store.loadData(this.sizes);
		this.combo.collapse();
		this.combo.setValue(this.pagingToolbar.pageSize)
	},
	setPageSize : function(E, H) {
		var I = this.pagingToolbar;
		this.combo.collapse();
		E = parseInt(E) || parseInt(this.combo.getValue());
		E = (E > 0) ? E : 1;
		if (E == I.pageSize) {
			return
		} else {
			if (E < I.pageSize) {
				I.pageSize = E;
				var A = Math.round(I.cursor / E) + 1;
				var G = (A - 1) * E;
				var F = I.store;
				if (G > F.getTotalCount()) {
					this.pagingToolbar.pageSize = E;
					this.pagingToolbar.doLoad(G - E)
				} else {
					F.suspendEvents();
					for (var B = 0, C = G - I.cursor; B < C; B++) {
						F.remove(F.getAt(0))
					}
					while (F.getCount() > E) {
						F.remove(F.getAt(F.getCount() - 1))
					}
					F.resumeEvents();
					F.fireEvent("datachanged", F);
					I.cursor = G;
					var D = I.getPageData();
					I.afterTextEl.el.innerHTML = String.format(I.afterPageText,
							D.pages);
					I.field.dom.value = A;
					I.first.setDisabled(A == 1);
					I.prev.setDisabled(A == 1);
					I.next.setDisabled(A == D.pages);
					I.last.setDisabled(A == D.pages);
					I.updateInfo()
				}
			} else {
				this.pagingToolbar.pageSize = E;
				this.pagingToolbar.doLoad(Math.floor(this.pagingToolbar.cursor
						/ this.pagingToolbar.pageSize)
						* this.pagingToolbar.pageSize)
			}
		}
		this.updateStore()
	},
	onRender : function() {
		this.combo = Ext.ComponentMgr.create(Ext.applyIf(this.comboCfg || {}, {
			store : new Ext.data.SimpleStore({
				fields : ["pageSize"],
				data : []
			}),
			displayField : "pageSize",
			valueField : "pageSize",
			mode : "local",
			triggerAction : "all",
			width : 50,
			xtype : "combo"
		}));
		this.combo.on("select", this.setPageSize, this);
		this.updateStore();
		if (this.addBefore) {
			this.pagingToolbar.add(this.addBefore)
		}
		if (this.beforeText) {
			this.pagingToolbar.add(this.beforeText)
		}
		this.pagingToolbar.add(this.combo);
		if (this.afterText) {
			this.pagingToolbar.add(this.afterText)
		}
		if (this.addAfter) {
			this.pagingToolbar.add(this.addAfter)
		}
	}
});
Ext.BLANK_IMAGE_URL = "/xwiki/skins/curriki8/extjs/resources/images/default/s.gif";
Ext.Ajax.defaultHeaders = {
	Accept : "application/json",
	"Content-Type" : "application/json; charset=utf-8;"
};
Ext.Ajax.disableCaching = false;
try {
	console.log("init")
} catch (e) {
	console = {
		log : Ext.emptyFn,
		debug : Ext.emptyFn,
		info : Ext.emptyFn,
		warn : Ext.emptyFn,
		error : Ext.emptyFn,
		assert : Ext.emptyFn,
		dir : Ext.emptyFn,
		dirxml : Ext.emptyFn,
		trace : Ext.emptyFn,
		group : Ext.emptyFn,
		groupEnd : Ext.emptyFn,
		time : Ext.emptyFn,
		timeEnd : Ext.emptyFn,
		profile : Ext.emptyFn,
		profileEnd : Ext.emptyFn,
		count : Ext.emptyFn
	}
}
Ext.onReady(function() {
			Ext.QuickTips.init()
		});
Ext.ns("Curriki");
Ext.ns("Curriki.module");
Ext.onReady(function() {
			Curriki.loadingMask = new Ext.LoadMask(Ext.getBody(), {
				msg : _("loading.loading_msg")
			});
			Ext.Ajax.on("beforerequest", function(B, A) {
				console.log("beforerequest", B, A);
				Curriki.showLoading(A.waitMsg)
			});
			Ext.Ajax.on("requestcomplete", function(C, A, B) {
				console.log("requestcomplete", C, A, B);
				Curriki.hideLoading()
			});
			Ext.Ajax.on("requestexception", function(C, A, B) {
				console.log("requestexception", C, A, B);
				Curriki.hideLoading()
			})
		});
Curriki.id = function(A) {
	return Ext.id("", A + ":")
};
Curriki.showLoading = function(A) {
	if (!Ext.isEmpty(Curriki.loadingMask)) {
		A = A || "loading.loading_msg";
		Curriki.loadingMask.msg = _(A);
		Curriki.loadingMask.enable();
		Curriki.loadingMask.show()
	}
};
Curriki.hideLoading = function() {
	if (!Ext.isEmpty(Curriki.loadingMask)) {
		Curriki.loadingMask.hide();
		Curriki.loadingMask.disable()
	}
};
Curriki.start = function(callback) {
	console.log("Start Callback: ", callback);
	var args = {};
	if ("object" === typeof callback) {
		if (callback.args) {
			args = callback.args
		}
		if (callback.callback) {
			callback = callback.callback
		} else {
			if (callback.module) {
				callback = callback.module
			}
		}
	}
	if ("string" === typeof callback) {
		var module = eval("(Curriki.module." + callback.toLowerCase() + ")");
		if (module && "function" === typeof module.init) {
			module.init(args);
			if ("function" === typeof module.start) {
				callback = module.start
			} else {
				callback = Ext.emptyFn
			}
		} else {
			switch (callback) {
				default :
					callback = Ext.emptyFn;
					break
			}
		}
	}
	if ("function" === typeof callback) {
		callback(args)
	}
};
Curriki.init = function(A) {
	console.log("Curriki.init: ", A);
	if (Ext.isEmpty(Curriki.initialized)) {
		Curriki.data.user.GetUserinfo(function() {
			Curriki.start(A)
		});
		Curriki.initialized = true
	} else {
		Curriki.start(A)
	}
};
Ext.ns("Curriki.data.user");
Curriki.data.user = {
	me : {
		username : "XWiki.XWikiGuest",
		fullname : "Guest"
	},
	collections : [],
	groups : [],
	collectionChildren : [],
	groupChildren : [],
	json_prefix : "/xwiki/curriki/users/",
	user_try : 0,
	GetUserinfo : function(A) {
		this.user_try++;
		Ext.Ajax.request({
			url : this.json_prefix + "me",
			method : "GET",
			disableCaching : true,
			headers : {
				Accept : "application/json"
			},
			scope : this,
			success : function(B, C) {
				var D = B.responseText;
				var E = D.evalJSON(true);
				if (!E) {
					console.warn("Cannot get user information");
					if (this.user_try < 5) {
						this.GetUserinfo(A)
					} else {
						console.error("Cannot get user information", B, C);
						alert("Error: "
								+ (B.responseText || "Unknown server error getting user information."))
					}
				} else {
					this.user_try = 0;
					this.me = E;
					this.GetCollections(A)
				}
			},
			failure : function(B, C) {
				console.error("Cannot get user information", B, C);
				alert("Error: "
						+ (B.responseText || ("Server error getting user information.  " + (B.statusText || ""))))
			}
		})
	},
	collection_try : 0,
	GetCollections : function(A) {
		this.collection_try++;
		Ext.Ajax.request({
			url : this.json_prefix + this.me.username + "/collections",
			method : "GET",
			disableCaching : true,
			headers : {
				Accept : "application/json"
			},
			scope : this,
			success : function(B, C) {
				var D = B.responseText;
				var E = D.evalJSON(true);
				if (!E) {
					console.warn("Cannot read user's collection information");
					if (this.collection_try < 5) {
						this.GetCollections(A)
					} else {
						console.error(
								"Cannot get user's collection information", B,
								C);
						alert("Error: "
								+ (B.responseText || "Unknown server error getting user collections."))
					}
				} else {
					this.collection_try = 0;
					this.collections = E;
					this.collectionChildren = this.CreateCollectionChildren();
					console.log("Collections: ", this.collectionChildren);
					this.GetGroups(A)
				}
			},
			failure : function(B, C) {
				console.error("Cannot get user's collection information", B, C);
				alert("Error: "
						+ (B.responseText || ("Server error getting user collections.  " + (B.statusText || ""))));
				this.collections = [];
				this.GetGroups(A)
			}
		})
	},
	group_try : 0,
	GetGroups : function(A) {
		Ext.Ajax.request({
			url : this.json_prefix + this.me.username + "/groups",
			method : "GET",
			disableCaching : true,
			headers : {
				Accept : "application/json"
			},
			scope : this,
			success : function(B, C) {
				var D = B.responseText;
				var E = D.evalJSON(true);
				if (!E) {
					console.warn("Cannot read user's group information");
					if (this.group_try < 5) {
						this.GetGroups(A)
					} else {
						throw {
							message : "GetUserinfo: Json object not found"
						};
						console.error("Cannot get user's group information", B,
								C);
						alert("Error: "
								+ (B.responseText || "Unknown server error getting user groups."))
					}
				} else {
					this.group_try = 0;
					this.groups = E;
					this.groupChildren = this.CreateGroupChildren();
					A()
				}
			},
			failure : function(B, C) {
				console.error("Cannot get user's group information", B, C);
				alert("Error: "
						+ (B.responseText || ("Server error getting user groups.  " + (B.statusText || ""))));
				this.groups = [];
				A()
			}
		})
	},
	CreateCollectionChildren : function() {
		var A = [];
		this.collections.each(function(C) {
			var D = {
				id : C.collectionPage,
				text : C.displayTitle,
				qtip : C.description,
				cls : "resource-" + C.assetType,
				allowDrag : false,
				allowDrop : true
			};
			if (Ext.isArray(C.children) && C.children.length > 0) {
				var B = [];
				C.children.each(function(F) {
					var E = {
						id : F.assetpage,
						order : F.order,
						text : F.displayTitle,
						qtip : F.description,
						cls : "ctv-resource resource-" + F.assetType,
						allowDrag : false,
						allowDrop : false
					};
					if ("undefined" === typeof F.rights || !F.rights.view) {
						E.text = _("resource.unviewable");
						E.qtip = undefined;
						E.disabled = true;
						E.leaf = true;
						E.cls = E.cls + " rights-unviewable"
					} else {
						if (F.assetType.search(/Composite$/) === -1) {
							E.leaf = true
						} else {
							E.leaf = false;
							E.allowDrop = true;
							E.disallowDropping = (F.rights.edit ? null : true)
						}
					}
					B.push(E)
				});
				D.children = B
			} else {
				D.leaf = false;
				D.children = []
			}
			A.push(D)
		});
		return A
	},
	CreateGroupChildren : function() {
		var A = [];
		this.groups.each(function(B) {
			if (B.editableCollectionCount > 0) {
				var C = {
					id : B.groupSpace,
					currikiNodeType : "group",
					text : B.displayTitle,
					qtip : B.description,
					cls : "curriki-group",
					allowDrag : false,
					allowDrop : true,
					disallowDropping : true
				};
				A.push(C)
			}
		});
		return A
	}
};
Ext.ns("Curriki.data.ict");
Curriki.data.ict.list = ["activity_exercise", "activity_lab",
		"activity_worksheet", "activity_problemset", "book_fiction",
		"book_nonfiction", "book_readings", "book_textbook",
		"curriculum_assessment", "curriculum_course", "curriculum_unit",
		"curriculum_lp", "curriculum_scope", "curriculum_standards",
		"curriculum_syllabus", "curriculum_workbook", "resource_animation",
		"resource_diagram", "resource_index", "resource_photograph",
		"resource_presentation", "resource_collection", "resource_script",
		"resource_speech", "resource_table", "other"];
Curriki.data.ict.data = [];
Curriki.data.ict.list.each(function(A) {
			Curriki.data.ict.data.push([A,
					_("XWiki.AssetClass_instructional_component2_" + A)])
		});
Curriki.data.ict.store = new Ext.data.SimpleStore({
	fields : ["id", "ict"],
	data : Curriki.data.ict.data
});
Ext.ns("Curriki.data.el");
Curriki.data.el.list = ["prek", "gr-k-2", "gr-3-5", "gr-6-8", "gr-9-10",
		"gr-11-12", "college_and_beyond", "professional_development",
		"special_education", "na"];
Curriki.data.el.data = [];
Curriki.data.el.list.each(function(A) {
			Curriki.data.el.data.push({
				inputValue : A,
				boxLabel : _("XWiki.AssetClass_educational_level2_" + A)
			})
		});
Ext.ns("Curriki.data.rights");
Curriki.data.rights.list = ["public", "members", "private"];
Curriki.data.rights.initial = Curriki.data.rights.list[0];
Curriki.data.rights.data = [];
Curriki.data.rights.list.each(function(A) {
			Curriki.data.rights.data.push({
				inputValue : A,
				boxLabel : _("XWiki.AssetClass_rights_" + A),
				checked : Curriki.data.rights.initial == A ? true : false
			})
		});
Ext.ns("Curriki.data.language");
Curriki.data.language.list = ["eng", "zho", "nld", "fra", "deu", "ita", "jpn",
		"kor", "por", "rus", "spa"];
Curriki.data.language.initial = Curriki.data.language.list[0];
Curriki.data.language.data = [];
Curriki.data.language.list.each(function(A) {
			Curriki.data.language.data.push([A,
					_("XWiki.AssetClass_language_" + A)])
		});
Curriki.data.language.store = new Ext.data.SimpleStore({
	fields : ["id", "language"],
	data : Curriki.data.language.data
});
Ext.ns("Curriki.data.licence");
Curriki.data.licence.list = ["Licences.CurrikiLicense",
		"Licences.PublicDomain",
		"Licences.CreativeCommonsAttributionNon-Commercial",
		"Licences.CreativeCommonsAttributionNoDerivatives",
		"Licences.CreativeCommonsAttributionNon-CommercialNoDerivatives",
		"Licences.CreativeCommonsAttributionSharealike",
		"Licences.CreativeCommonsAttributionNon-CommercialShareAlike"];
Curriki.data.licence.initial = Curriki.data.licence.list[0];
Curriki.data.licence.data = [];
Curriki.data.licence.list.each(function(A) {
			Curriki.data.licence.data.push([A,
					_("XWiki.AssetLicenseClass_licenseType2_" + A)])
		});
Curriki.data.licence.store = new Ext.data.SimpleStore({
	fields : ["id", "licence"],
	data : Curriki.data.licence.data
});
Ext.ns("Curriki.data.fw_item");
Curriki.data.fw_item.fwCheckListener = function(C, B) {
	var A = Ext.getCmp("fw_items-validation");
	if (A) {
		A.setValue(A.getValue() + (B ? 1 : -1))
	}
	if (B) {
		if ("undefined" !== typeof C.parentNode) {
			if (!C.parentNode.ui.isChecked()) {
				C.parentNode.ui.toggleCheck()
			}
		}
	} else {
		if (Ext.isArray(C.childNodes)) {
			C.childNodes.each(function(D) {
				if (D.ui.isChecked()) {
					D.ui.toggleCheck()
				}
			})
		}
	}
};
Curriki.data.fw_item.fwMap = {
	"FW_masterFramework.LanguageArts" : [{
		id : "FW_masterFramework.Alphabet_0",
		parent : "FW_masterFramework.LanguageArts"
	}, {
		id : "FW_masterFramework.Careers_2",
		parent : "FW_masterFramework.LanguageArts"
	}, {
		id : "FW_masterFramework.Journalism",
		parent : "FW_masterFramework.LanguageArts"
	}, {
		id : "FW_masterFramework.Listening&Speaking",
		parent : "FW_masterFramework.LanguageArts"
	}, {
		id : "FW_masterFramework.Literature",
		parent : "FW_masterFramework.LanguageArts"
	}, {
		id : "FW_masterFramework.Phonics",
		parent : "FW_masterFramework.LanguageArts"
	}, {
		id : "FW_masterFramework.ReadingComprehension",
		parent : "FW_masterFramework.LanguageArts"
	}, {
		id : "FW_masterFramework.Research",
		parent : "FW_masterFramework.LanguageArts"
	}, {
		id : "FW_masterFramework.Spelling_0",
		parent : "FW_masterFramework.LanguageArts"
	}, {
		id : "FW_masterFramework.StoryTelling",
		parent : "FW_masterFramework.LanguageArts"
	}, {
		id : "FW_masterFramework.Vocabulary",
		parent : "FW_masterFramework.LanguageArts"
	}, {
		id : "FW_masterFramework.Writing",
		parent : "FW_masterFramework.LanguageArts"
	}],
	"FW_masterFramework.Information&MediaLiteracy" : [{
		id : "FW_masterFramework.EvaluatingSources",
		parent : "FW_masterFramework.Information&MediaLiteracy"
	}, {
		id : "FW_masterFramework.MediaEthics",
		parent : "FW_masterFramework.Information&MediaLiteracy"
	}, {
		id : "FW_masterFramework.OnlineSafety",
		parent : "FW_masterFramework.Information&MediaLiteracy"
	}, {
		id : "FW_masterFramework.ResearchMethods",
		parent : "FW_masterFramework.Information&MediaLiteracy"
	}],
	"FW_masterFramework.SocialStudies" : [{
		id : "FW_masterFramework.Anthropology",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.Careers_5",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.Civics",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.CurrentEvents",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.Economics",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.Entrepreneurship",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.Geography",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.GlobalAwareness",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.Government",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.History Local",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.PoliticalSystems",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.Psychology",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.Research_0",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.Sociology",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.StateHistory",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.Technology_1",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.Thinking&ProblemSolving",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.UnitedStatesGovernment",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.UnitedStatesHistory",
		parent : "FW_masterFramework.SocialStudies"
	}, {
		id : "FW_masterFramework.WorldHistory",
		parent : "FW_masterFramework.SocialStudies"
	}],
	"FW_masterFramework.Health" : [{
		id : "FW_masterFramework.BodySystems&Senses",
		parent : "FW_masterFramework.Health"
	}, {
		id : "FW_masterFramework.Careers_1",
		parent : "FW_masterFramework.Health"
	}, {
		id : "FW_masterFramework.EnvironmentalHealth",
		parent : "FW_masterFramework.Health"
	}, {
		id : "FW_masterFramework.HumanSexuality",
		parent : "FW_masterFramework.Health"
	}, {
		id : "FW_masterFramework.MentalEmotionalHealth",
		parent : "FW_masterFramework.Health"
	}, {
		id : "FW_masterFramework.Nutrition",
		parent : "FW_masterFramework.Health"
	}, {
		id : "FW_masterFramework.SafetySmokingSubstanceAbusePrevention",
		parent : "FW_masterFramework.Health"
	}],
	"FW_masterFramework.Mathematics" : [{
		id : "FW_masterFramework.Algebra",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Appliedmathematics",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Arithmetic",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Calculus",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Careers_3",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.DataAnalysis&Probability",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Equations",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Estimation",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Geometry",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Graphing",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Measurement",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.NumberSense&Operations",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Patterns",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.ProblemSolving",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Statistics",
		parent : "FW_masterFramework.Mathematics"
	}, {
		id : "FW_masterFramework.Trigonometry",
		parent : "FW_masterFramework.Mathematics"
	}],
	"FW_masterFramework.ForeignLanguages" : [{
		id : "FW_masterFramework.Alphabet",
		parent : "FW_masterFramework.ForeignLanguages"
	}, {
		id : "FW_masterFramework.Careers_7",
		parent : "FW_masterFramework.ForeignLanguages"
	}, {
		id : "FW_masterFramework.CulturalAwareness",
		parent : "FW_masterFramework.ForeignLanguages"
	}, {
		id : "FW_masterFramework.Grammar",
		parent : "FW_masterFramework.ForeignLanguages"
	}, {
		id : "FW_masterFramework.InformalEducation",
		parent : "FW_masterFramework.ForeignLanguages"
	}, {
		id : "FW_masterFramework.Linguistics",
		parent : "FW_masterFramework.ForeignLanguages"
	}, {
		id : "FW_masterFramework.ListeningComprehension",
		parent : "FW_masterFramework.ForeignLanguages"
	}, {
		id : "FW_masterFramework.Reading",
		parent : "FW_masterFramework.ForeignLanguages"
	}, {
		id : "FW_masterFramework.Speaking",
		parent : "FW_masterFramework.ForeignLanguages"
	}, {
		id : "FW_masterFramework.Spelling",
		parent : "FW_masterFramework.ForeignLanguages"
	}, {
		id : "FW_masterFramework.VocabularyWriting",
		parent : "FW_masterFramework.ForeignLanguages"
	}],
	"FW_masterFramework.Science" : [{
		id : "FW_masterFramework.Agriculture",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Astronomy",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Biology",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Botany",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Careers_4",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Chemistry",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Earthscience",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Ecology",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Engineering",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Generalscience",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Geology",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.HistoryofScience",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.LifeSciences",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Meteorology",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.NaturalHistory",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Oceanography",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Paleontology",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.PhysicalSciences",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Physics",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.ProcessSkills",
		parent : "FW_masterFramework.Science"
	}, {
		id : "FW_masterFramework.Technology_0",
		parent : "FW_masterFramework.Science"
	}],
	"FW_masterFramework.EducationalTechnology" : [{
		id : "FW_masterFramework.Careers_0",
		parent : "FW_masterFramework.EducationalTechnology"
	}, {
		id : "FW_masterFramework.IntegratingTechnologyintotheClassroom",
		parent : "FW_masterFramework.EducationalTechnology"
	}, {
		id : "FW_masterFramework.UsingMultimedia&theInternet",
		parent : "FW_masterFramework.EducationalTechnology"
	}],
	"FW_masterFramework.WebHome" : [{
		id : "FW_masterFramework.Arts",
		parent : "FW_masterFramework.WebHome"
	}, {
		id : "FW_masterFramework.VocationalEducation",
		parent : "FW_masterFramework.WebHome"
	}, {
		id : "FW_masterFramework.EducationalTechnology",
		parent : "FW_masterFramework.WebHome"
	}, {
		id : "FW_masterFramework.ForeignLanguages",
		parent : "FW_masterFramework.WebHome"
	}, {
		id : "FW_masterFramework.Health",
		parent : "FW_masterFramework.WebHome"
	}, {
		id : "FW_masterFramework.Information&MediaLiteracy",
		parent : "FW_masterFramework.WebHome"
	}, {
		id : "FW_masterFramework.LanguageArts",
		parent : "FW_masterFramework.WebHome"
	}, {
		id : "FW_masterFramework.Mathematics",
		parent : "FW_masterFramework.WebHome"
	}, {
		id : "FW_masterFramework.Science",
		parent : "FW_masterFramework.WebHome"
	}, {
		id : "FW_masterFramework.SocialStudies",
		parent : "FW_masterFramework.WebHome"
	}],
	"FW_masterFramework.Arts" : [{
		id : "FW_masterFramework.Architecture",
		parent : "FW_masterFramework.Arts"
	}, {
		id : "FW_masterFramework.Careers",
		parent : "FW_masterFramework.Arts"
	}, {
		id : "FW_masterFramework.Dance",
		parent : "FW_masterFramework.Arts"
	}, {
		id : "FW_masterFramework.DramaDramatics",
		parent : "FW_masterFramework.Arts"
	}, {
		id : "FW_masterFramework.Film",
		parent : "FW_masterFramework.Arts"
	}, {
		id : "FW_masterFramework.History",
		parent : "FW_masterFramework.Arts"
	}, {
		id : "FW_masterFramework.Music",
		parent : "FW_masterFramework.Arts"
	}, {
		id : "FW_masterFramework.Photography",
		parent : "FW_masterFramework.Arts"
	}, {
		id : "FW_masterFramework.PopularCulture",
		parent : "FW_masterFramework.Arts"
	}, {
		id : "FW_masterFramework.Technology",
		parent : "FW_masterFramework.Arts"
	}, {
		id : "FW_masterFramework.VisualArts",
		parent : "FW_masterFramework.Arts"
	}],
	"FW_masterFramework.VocationalEducation" : [{
		id : "FW_masterFramework.Agriculture_0",
		parent : "FW_masterFramework.VocationalEducation"
	}, {
		id : "FW_masterFramework.Business",
		parent : "FW_masterFramework.VocationalEducation"
	}, {
		id : "FW_masterFramework.Careers_6",
		parent : "FW_masterFramework.VocationalEducation"
	}, {
		id : "FW_masterFramework.Education&Teaching",
		parent : "FW_masterFramework.VocationalEducation"
	}, {
		id : "FW_masterFramework.OccupationalHomeEconomics",
		parent : "FW_masterFramework.VocationalEducation"
	}, {
		id : "FW_masterFramework.School-to-work",
		parent : "FW_masterFramework.VocationalEducation"
	}, {
		id : "FW_masterFramework.Technology_2",
		parent : "FW_masterFramework.VocationalEducation"
	}, {
		id : "FW_masterFramework.Trade&Industrial",
		parent : "FW_masterFramework.VocationalEducation"
	}],
	TREEROOTNODE : [{
		id : "FW_masterFramework.WebHome",
		parent : ""
	}]
};
var fwItem = "FW_masterFramework.WebHome";
Curriki.data.fw_item.fwAddNode = function(C, D) {
	var B = {
		id : D,
		text : _("XWiki.AssetClass_fw_items_" + D),
		checked : false,
		listeners : {
			checkchange : Curriki.data.fw_item.fwCheckListener
		}
	};
	if ("undefined" !== typeof C[D]) {
		var A = [];
		C[D].each(function(E) {
			A.push(Curriki.data.fw_item.fwAddNode(C, E.id))
		});
		B.children = A;
		B.cls = "fw-item fw-item-parent"
	} else {
		B.leaf = true;
		B.cls = "fw-item fw-item-bottom"
	}
	return B
};
Curriki.data.fw_item.fwChildren = Curriki.data.fw_item.fwAddNode(
		Curriki.data.fw_item.fwMap, "FW_masterFramework.WebHome").children;
Ext.ns("Curriki.ui.component.asset");
Curriki.ui.component.asset.getFwTree = function() {
	return {
		xtype : "treepanel",
		loader : new Ext.tree.TreeLoader({
			preloadChildren : true
		}),
		id : "fw_items-tree",
		useArrows : true,
		autoHeight : true,
		border : false,
		cls : "fw-tree",
		animate : true,
		enableDD : false,
		containerScroll : true,
		rootVisible : true,
		root : new Ext.tree.AsyncTreeNode({
			text : _("XWiki.AssetClass_fw_items_FW_masterFramework.WebHome"),
			id : "FW_masterFramework.WebHome",
			cls : "fw-item-top fw-item-parent fw-item",
			leaf : false,
			expanded : true,
			children : Curriki.data.fw_item.fwChildren
		})
	}
};
Ext.ns("Curriki.assets");
Curriki.assets = {
	json_prefix : "/xwiki/curriki/assets",
	CreateAsset : function(A, B, C) {
		Ext.Ajax.request({
			url : this.json_prefix,
			method : "POST",
			headers : {
				Accept : "application/json",
				"Content-type" : "application/json"
			},
			jsonData : {
				parent : A || "",
				publishSpace : B || ""
			},
			scope : this,
			success : function(D, E) {
				var F = D.responseText;
				var G = F.evalJSON(true);
				if (!G || !G.assetPage) {
					console.warn("Cannot create resource", D.responseText, E);
					alert("Error creating resource: "
							+ (D.responseText || "Unknown server error"))
				} else {
					C(G)
				}
			},
			failure : function(D, E) {
				console.error("Cannot create resource", D, E);
				alert("Error: "
						+ (D.responseText || ("Server error creating resource.  " + (D.statusText || ""))))
			}
		})
	},
	GetAssetInfo : function(A, B) {
		Ext.Ajax.request({
			url : this.json_prefix + "/" + A,
			method : "GET",
			headers : {
				Accept : "application/json",
				"Content-type" : "application/json"
			},
			scope : this,
			success : function(C, D) {
				var E = C.responseText;
				var F = E.evalJSON(true);
				if (!F) {
					console.warn("Cannot get resource metadata",
							C.responseText, D);
					alert("Error getting resource information: "
							+ (C.responseText || "Unknown server error"))
				} else {
					B(F)
				}
			},
			failure : function(C, D) {
				console.error("Cannot get resource metadata", C, D);
				alert("Error: "
						+ (C.responseText || ("Server error getting resource information.  " + (C.statusText || ""))))
			}
		})
	},
	GetMetadata : function(A, B) {
		Ext.Ajax.request({
			url : this.json_prefix + "/" + A + "/metadata",
			method : "GET",
			headers : {
				Accept : "application/json",
				"Content-type" : "application/json"
			},
			scope : this,
			success : function(C, D) {
				var E = C.responseText;
				var F = E.evalJSON(true);
				if (!F) {
					console.warn("Cannot get resource metadata",
							C.responseText, D);
					alert("Error getting resource metadata: "
							+ (C.responseText || "Unknown server error"))
				} else {
					B(F)
				}
			},
			failure : function(C, D) {
				console.error("Cannot get resource metadata", C, D);
				alert("Error: "
						+ (C.responseText || ("Server error getting resource metadata.  " + (C.statusText || ""))))
			}
		})
	},
	SetMetadata : function(A, B, C) {
		Ext.Ajax.request({
			url : this.json_prefix + "/" + A + "/metadata",
			method : "PUT",
			headers : {
				Accept : "application/json",
				"Content-type" : "application/json"
			},
			jsonData : B,
			scope : this,
			success : function(D, E) {
				var F = D.responseText;
				var G = F.evalJSON(true);
				if (!G) {
					console.warn("Cannot set resource metadata",
							D.responseText, E);
					alert("Error setting resource metadata: "
							+ (D.responseText || "Unknown server error"))
				} else {
					C(G)
				}
			},
			failure : function(D, E) {
				console.error("Cannot set resource metadata", D, E);
				alert("Error: "
						+ (D.responseText || ("Server error setting resource metadata.  " + (D.statusText || ""))))
			}
		})
	},
	CreateExternal : function(B, A, C) {
		Ext.Ajax.request({
			url : this.json_prefix + "/" + B + "/externals",
			method : "POST",
			headers : {
				Accept : "application/json",
				"Content-type" : "application/json"
			},
			jsonData : {
				link : A
			},
			scope : this,
			success : function(D, E) {
				var F = D.responseText;
				var G = F.evalJSON(true);
				if (!G) {
					console.warn("Cannot create external link", D.responseText,
							E);
					alert("Error creating external link: "
							+ (D.responseText || "Unknown server error"))
				} else {
					C(G)
				}
			},
			failure : function(D, E) {
				console.error("Cannot create external link", D, E);
				alert("Error: "
						+ (D.responseText || ("Server error creating external resource.  " + (D.statusText || ""))))
			}
		})
	},
	CreateSubasset : function(B, D, A, C) {
		Ext.Ajax.request({
			url : this.json_prefix + "/" + B + "/subassets",
			method : "POST",
			headers : {
				Accept : "application/json",
				"Content-type" : "application/json"
			},
			jsonData : {
				page : D,
				order : A
			},
			scope : this,
			success : function(E, F) {
				var G = E.responseText;
				var H = G.evalJSON(true);
				if (!H) {
					console.warn("Cannot add subasset", E.responseText, F);
					alert("Error adding subasset: "
							+ (E.responseText || "Unknown server error"))
				} else {
					Curriki.data.user.GetCollections(function() {
						C(H)
					})
				}
			},
			failure : function(E, F) {
				console.error("Cannot add subasset", E, F);
				alert("Error: "
						+ (E.responseText || ("Server error adding resource to folder.  " + (E.statusText || ""))))
			}
		})
	},
	CreateFolder : function(A, B) {
		Ext.Ajax.request({
			url : this.json_prefix + "/" + A + "/subassets",
			method : "POST",
			headers : {
				Accept : "application/json",
				"Content-type" : "application/json"
			},
			jsonData : {
				collectionType : "folder"
			},
			scope : this,
			success : function(C, D) {
				var E = C.responseText;
				var F = E.evalJSON(true);
				if (!F) {
					console.warn("Cannot create folder", C.responseText, D);
					alert("Error creating folder: "
							+ (C.responseText || "Unknown server error"))
				} else {
					B(F)
				}
			},
			failure : function(C, D) {
				console.error("Cannot create folder", C, D);
				alert("Error: "
						+ (C.responseText || ("Server error creating folder.  " + (C.statusText || ""))))
			}
		})
	},
	CreateCollection : function(A, B) {
		Ext.Ajax.request({
			url : this.json_prefix + "/" + A + "/subassets",
			method : "POST",
			headers : {
				Accept : "application/json",
				"Content-type" : "application/json"
			},
			jsonData : {
				collectionType : "collection"
			},
			scope : this,
			success : function(C, D) {
				var E = C.responseText;
				var F = E.evalJSON(true);
				if (!F) {
					console.warn("Cannot create collection", C.responseText, D);
					alert("Error creating collection: "
							+ (C.responseText || "Unknown server error"))
				} else {
					B(F)
				}
			},
			failure : function(C, D) {
				console.error("Cannot create collection", C, D);
				alert("Error: "
						+ (C.responseText || ("Server error creating collection.  " + (C.statusText || ""))))
			}
		})
	},
	CreateVIDITalk : function(A, B, C) {
		Ext.Ajax.request({
			url : this.json_prefix + "/" + A + "/viditalks",
			method : "POST",
			headers : {
				Accept : "application/json",
				"Content-type" : "application/json"
			},
			jsonData : {
				page : A,
				videoId : B
			},
			scope : this,
			success : function(D, E) {
				var F = D.responseText;
				var G = F.evalJSON(true);
				if (!G) {
					console.warn("Cannot add video", D.responseText, E);
					alert("Error adding video: "
							+ (D.responseText || "Unknown server error"))
				} else {
					C(G)
				}
			},
			failure : function(D, E) {
				console.error("Cannot add video", D, E);
				alert("Error: "
						+ (D.responseText || ("Server error creating VIDITalk resource.  " + (D.statusText || ""))))
			}
		})
	},
	Publish : function(A, B, C) {
		Ext.Ajax.request({
			url : this.json_prefix + "/" + A + "/published",
			method : "PUT",
			headers : {
				Accept : "application/json",
				"Content-type" : "application/json"
			},
			jsonData : {
				space : B
			},
			scope : this,
			success : function(D, E) {
				var F = D.responseText;
				var G = F.evalJSON(true);
				if (!G) {
					console.warn("Cannot publish resource", D.responseText, E);
					alert("Error publishing resource: "
							+ (D.responseText || "Unknown server error"))
				} else {
					C(G)
				}
			},
			failure : function(D, E) {
				console.error("Cannot publish resource", D, E);
				alert("Error: "
						+ (D.responseText || ("Server error publishing resource.  " + (D.statusText || ""))))
			}
		})
	},
	UnnominateAsset : function(assetPage, callback) {
		Ext.Ajax.request({
			url : this.json_prefix + '/' + assetPage + '/unnominate',
			method : 'PUT',
			headers : {
				'Accept' : 'application/json',
				'Content-type' : 'application/json'
			},
			jsonData : {},
			scope : this,
			success : function(response, options) {
				var json = response.responseText;
				var o = json.evalJSON(true);
				if (!o) {
					console.warn('Cannot unnominate resource',
							response.responseText, options);
					alert('Error unnominating resource: '
							+ (response.responseText || 'Unknown server error'));
				} else {
					callback(o);
				}
			},
			failure : function(response, options) {
				console.error('Cannot unnominate resource', response, options);
				alert('Error: '
						+ (response.responseText || ('Server error unnominating resource.  ' + (response.statusText || ''))));
			}
		});
	},
	NominateAsset : function(A, B, C) {
		Ext.Ajax.request({
			url : this.json_prefix + "/" + A + "/nominate",
			method : "PUT",
			headers : {
				Accept : "application/json",
				"Content-type" : "application/json"
			},
			jsonData : {
				comments : B
			},
			scope : this,
			success : function(D, E) {
				var F = D.responseText;
				var G = F.evalJSON(true);
				if (!G) {
					console.warn("Cannot nominate resource", D.responseText, E);
					alert("Error nominating resource: "
							+ (D.responseText || "Unknown server error"))
				} else {
					C(G)
				}
			},
			failure : function(D, E) {
				console.error("Cannot nominate resource", D, E);
				alert("Error: "
						+ (D.responseText || ("Server error nominating resource.  " + (D.statusText || ""))))
			}
		})
	},
	PartnerAsset : function(assetPage, callback) {
		Ext.Ajax.request({
			url : this.json_prefix + '/' + assetPage + '/partner',
			method : 'PUT',
			headers : {
				'Accept' : 'application/json',
				'Content-type' : 'application/json'
			},
			jsonData : {},
			scope : this,
			success : function(response, options) {
				var json = response.responseText;
				var o = json.evalJSON(true);
				if (!o) {
					console.warn('Cannot set as Partner resource',
							response.responseText, options);
					alert('Error set as Partner resource: '
							+ (response.responseText || 'Unknown server error'));
				} else {
					callback(o);
				}
			},
			failure : function(response, options) {
				console.error('Cannot set as Partner resource', response, options);
				alert('Error: '
						+ (response.responseText || ('Server error set as Partner resource.  ' + (response.statusText || ''))));
			}
		});
	}
};
Ext.ns("Curriki.ui");
Curriki.ui.InfoImg = "/xwiki/skins/curriki8/icons/exclamation.png";
Ext.ns("Curriki.ui.dialog");
Curriki.ui.dialog.Base = Ext.extend(Ext.Window, {
	title : _("Untitled"),
	border : false,
	modal : true,
	width : 634,
	minWidth : 400,
	minHeight : 100,
	maxHeight : 575,
	autoScroll : false,
	constrain : true,
	collapsible : false,
	closable : false,
	resizable : false,
	shadow : false,
	defaults : {
		border : false
	},
	listeners : {
		afterlayout : function(B, A) {
			if (this.afterlayout_maxheight) {
			} else {
				if (B.getBox().height > B.maxHeight) {
					B.setHeight(B.maxHeight);
					B.center();
					this.afterlayout_maxheight = true
				} else {
					B.setHeight("auto")
				}
			}
		}
	},
	initComponent : function() {
		Curriki.ui.dialog.Base.superclass.initComponent.call(this)
	}
});
Curriki.ui.dialog.Actions = Ext.extend(Curriki.ui.dialog.Base, {
	width : 634,
	initComponent : function() {
		Curriki.ui.dialog.Actions.superclass.initComponent.call(this)
	}
});
Ext.reg("dialogueactions", Curriki.ui.dialog.Actions);
Curriki.ui.dialog.Messages = Ext.extend(Curriki.ui.dialog.Base, {
	width : 500,
	initComponent : function() {
		Curriki.ui.dialog.Messages.superclass.initComponent.call(this)
	}
});
Ext.reg("dialoguemessages", Curriki.ui.dialog.Messages);
Curriki.ui.show = function(D, A) {
	var C = {
		xtype : D
	};
	Ext.apply(C, A);
	var B = Ext.ComponentMgr.create(C);
	B.show();
	Ext.ComponentMgr.register(B)
};
Ext.ns("Curriki.ui.treeLoader");
Curriki.ui.treeLoader.Base = function(A) {
	Curriki.ui.treeLoader.Base.superclass.constructor.call(this)
};
Ext.extend(Curriki.ui.treeLoader.Base, Ext.tree.TreeLoader, {
	dataUrl : "DYNAMICALLY DETERMINED",
	createNode : function(attr) {
		console.log("createNode: ", attr);
		if ("string" === typeof attr.id) {
			var parent = Curriki.ui.treeLoader.Base.superclass.createNode.call(
					this, attr);
			console.log("createNode: parent", parent);
			return parent
		}
		var childInfo = {
			id : attr.assetpage || attr.collectionPage,
			text : attr.displayTitle,
			qtip : attr.description,
			cls : "resource-" + attr.assetType,
			allowDrag : false,
			allowDrop : false
		};
		if (attr.rights && !attr.rights.view) {
			childInfo.text = _("TODO: Translation string about not viewable here");
			childInfo.qtip = undefined;
			childInfo.disabled = true;
			childInfo.allowDrop = false;
			childInfo.leaf = true;
			childInfo.cls = childInfo.cls + " rights-unviewable"
		} else {
			if (attr.assetType && attr.assetType.search(/Composite$/) === -1) {
				childInfo.leaf = true
			} else {
				if (attr.assetType) {
					childInfo.leaf = false;
					childInfo.allowDrop = (attr.rights && attr.rights.edit)
				}
			}
		}
		Ext.apply(childInfo, attr);
		if (this.baseAttrs) {
			Ext.applyIf(childInfo, this.baseAttrs)
		}
		if (this.applyLoader !== false) {
			childInfo.loader = this
		}
		if (typeof attr.uiProvider == "string") {
			childInfo.uiProvider = this.uiProviders[attr.uiProvider]
					|| eval(attr.uiProvider)
		}
		console.log("createNode: End ", childInfo);
		return (childInfo.leaf
				? new Ext.tree.TreeNode(childInfo)
				: new Ext.tree.AsyncTreeNode(childInfo))
	},
	requestData : function(A, B) {
		if (A.attributes.currikiNodeType === "group") {
			this.dataUrl = "/xwiki/curriki/groups/" + A.attributes.id
					+ "/collections"
		} else {
			this.dataUrl = "/xwiki/curriki/assets/" + A.attributes.id
					+ "/subassets"
		}
		if (this.fireEvent("beforeload", this, A, B) !== false) {
			this.transId = Ext.Ajax.request({
				method : "GET",
				url : this.dataUrl,
				disableCaching : true,
				headers : {
					Accept : "application/json"
				},
				success : this.handleResponse,
				failure : this.handleFailure,
				scope : this,
				argument : {
					callback : B,
					node : A
				},
				params : ""
			})
		} else {
			if (typeof B == "function") {
				B()
			}
		}
	}
});