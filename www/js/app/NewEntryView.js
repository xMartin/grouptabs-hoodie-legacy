define([
	"dojo/_base/lang",
	"./_View",
	"dijit/registry",
	"dijit/form/ValidationTextBox",
	"dijit/form/DateTextBox",
	"./ParticipantFormWidget",
	"dojo/text!./templates/NewEntryView.html"
], function(lang, _View, dijitRegistry, ValidationTextBox, DateTextBox, ParticipantFormWidget, template){

return dojo.declare(_View, {

	templateString: template,

	name: "newEntry",

	constructor: function(){
		this._participantFormWidgets = []
	},

	postCreate: function(){
		// dijit doesn't support "onInput" so do it natively
		this.newParticipantInput.textbox.addEventListener("input", lang.hitch(this, this._onNewParticipantInput))
	},

	onShow: function(entryId){
		if(entryId !== undefined){
			var data = this.app.store.get(entryId)
			this._createParticipantFormWidgets(data)
			this._prefill(data)
			this._editEntry = entryId
			this._showDeleteButton()
			this.headingNode.innerHTML = "Edit transaction"
		}else{
			this._createParticipantFormWidgets()
			this._hideDeleteButton()
			this.headingNode.innerHTML = "New transaction"
		}
	},

	_prefill: function(data){
		dijitRegistry.byId("newEntryTitle").set("value", data.title)
		dijitRegistry.byId("newEntryDate").set("value", new Date(data.date))
	},

	_createParticipantFormWidgets: function(data){
		var accounts = this.app.getAccounts()
		var accountCount = (function(){
			var count = 0
			for(var key in accounts){
				count++
			}
			return count
		})()
		var isChecked = !data && accountCount == 2
		for(var account in accounts){
			this._createParticipantFormWidget(account, data, isChecked)
		}
	},

	_createParticipantFormWidget: function(participant, data, isChecked){
		var widgetParams = {
			name: "participants",
			participant: participant
		}
		if(data){
			data.payments.forEach(function(payment){
				if(payment.participant == participant){
					widgetParams.amount = payment.amount
				}
			})
		}
		var widget = new ParticipantFormWidget(widgetParams)
		if(isChecked || data && data.participants.indexOf(participant) !== -1){
			widget.checkBox.set("checked", true)
		}
		widget.placeAt(this.participantsNode)
		this._participantFormWidgets.push(widget)
	},

	_removeParticipantFormWidgets: function(){
		this._participantFormWidgets.forEach(function(widget){
			this.participantsNode.removeChild(widget.domNode)
			widget.destroy()
		}, this)
		this._participantFormWidgets = []
	},

	_onNewParticipantClick: function(){
		this._createParticipantFormWidget(this.newParticipantInput.get("value"), null, true)
		this.newParticipantInput.set("value", "")
	},

	_onNewParticipantInput: function(event){
		// take value of text field from event as the event is fired before the field is updated
		this.addNewParticipantButton.set("disabled", !event.target.value)
	},

	_onOkClick: function(){
		this._saveEntry()
		if(this._editEntry !== undefined){
			this.app.deleteEntry(this._editEntry)
		}
		this.reset()
		this.close(this, "main")
	},

	_onDeleteClick: function(){
		this.app.deleteEntry(this._editEntry)
		this.reset()
		this.close(this, "list")
	},

	_onCancelClick: function(){
		this.reset()
		this.close(this, "main")
	},

	_saveEntry: function(){
		var data = this.get("value")
		var participants = dojo.filter(data.participants, function(participant){
			return participant.participant
		})
		participants = dojo.map(participants, function(participant){
			return participant.participant
		})
		var payments = dojo.filter(data.participants, function(participant){
			return participant.participant && participant.amount
		})
		payments = dojo.map(payments, function(participant){
			return {participant: participant.participant, amount: participant.amount}
		})
		this.app.saveEntry({
			id: "" + new Date().getTime(),
			box: this.app.box,
			type: "spending",
			title: data.title,
			date: data.date.getTime(),
			participants: participants,
			payments: payments
		})
	},

	_showDeleteButton: function(){
		this.deleteButtonNode.style.display = ""
	},

	_hideDeleteButton: function(){
		this.deleteButtonNode.style.display = "none"
	},

	reset: function(){
		this.inherited(arguments)
		delete this._editEntry
		this.addNewParticipantButton.set("disabled", true)
		this._hideDeleteButton()
		this._removeParticipantFormWidgets()
	}

})

})
