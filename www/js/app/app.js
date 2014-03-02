define([
	"./HoodieStoreAdapter",
	"./viewController",
	"./BoxView",
	"./MainView",
	"./NewEntryView",
	"./ListView"
], function(HoodieStoreAdapter, viewController, BoxView, MainView, NewEntryView, ListView){

var hoodieStoreAdapter = new HoodieStoreAdapter()
var store = hoodieStoreAdapter.store

var obj = {

	box: localStorage.getItem("box") || "",

	store: store,

	init: function(){
		var viewName, view,
			views = {
				"box": new BoxView({app: obj, controller: viewController}),
				"main": new MainView({app: obj, controller: viewController}),
				"newEntry": new NewEntryView({app: obj, controller: viewController}),
				"list": new ListView({app: obj, controller: viewController})
			},
			initData = function(){
				hoodie.store.findAll("transaction").then(function(data){
					store.setData(data)
					viewController.refreshAll()

					hoodie.store.on("add:todo", addData)
					hoodie.store.on("remove:todo", removeData)
				})
			},
			addData = function(data){
				store.put(data)
				viewController.refreshAll()
			},
			removeData = function(data){
				store.remove(data.id)
				viewController.refreshAll()
			},
			emptyData = function(){
				store.setData([])
				viewController.refreshAll()
				viewController.selectView(views["box"])
			}

		for(viewName in views){
			view = views[viewName]
			viewController.addView(view)
		}
		viewController.selectView(obj.box ? views["main"] : views["box"])

		initData()
		hoodie.account.on("signout", emptyData)
	},

	getAccounts: function(transactions){
		var costs = 0, share = 0, accounts = {}
		store.query({"box": obj.box}).forEach(function(transaction){
			transaction.payments.forEach(function(payment){
				costs += payment.amount
				share = payment.amount / transaction.participants.length
				transaction.participants.forEach(function(participant){
					accounts[participant] = accounts[participant] || 0
					accounts[participant] -= share
					if(payment.participant == participant){
						accounts[participant] += payment.amount
					}
				})
			})
		})
		return accounts
	},

	setBox: function(boxName){
		obj.box = boxName
		localStorage.setItem("box", boxName)
	},

	saveEntry: function(data){
		hoodieStoreAdapter.put(data)
	},

	deleteEntry: function(id){
		hoodieStoreAdapter.remove(id)
	}
}

return obj

})
