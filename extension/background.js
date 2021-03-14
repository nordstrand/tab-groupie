importScripts("./util.js")

let mode = storedField(chrome.storage.local, "mode")
let color = storedField(chrome.storage.local, "color")
let title = storedField(chrome.storage.local, "title")
let customGroups = storedField(chrome.storage.local, "customGroups")

let initializeOptions = async () => {
  let value = await mode.get()

  if (!!value) {
    chrome.action.setBadgeText({ text: value })
  } else {
    mode.set(getKeyByValue(MODE, MODE.AUTO))
    color.set(true)
    title.set(true)
    customGroups.set([])
  }
}

chrome.tabs.onCreated.addListener(createdTab => {
  console.log("New tab", createdTab)

  let listener = async (tabId, _, tab) => {
    if (tabId == createdTab.id && tab.url.startsWith("http")) {
      chrome.tabs.onUpdated.removeListener(listener)
      let m = MODE[await mode.get()]
      let groups = await customGroups.get()
      console.log(`Potential group "${getHost(tab, groups)}" for tab ${tab.id} (${tab.url}). Mode: ${getKeyByValue(MODE, m)}`)
      if (m == MODE.AUTO) {
        group()
      }
    }
  }

  chrome.tabs.onUpdated.addListener(listener)
})


let group = async () => {
  let currentWindow = await chrome.windows.getCurrent()

  let tabs = await chrome.tabs.query({ windowId: currentWindow.id, pinned: false })  
  let currentTabGroups = await Promise.all(getGroupIds(tabs).map(getGroupDetails))
  let customTabGroupRules = await customGroups.get()  

  console.log("Looking up grouping actions to perform for tabs:", tabs.map(t => ({ id: t.id, groupId: t.groupId, index: t.index, url: t.url }) ))
  let groupingActions = getGroupingActions(tabs, currentTabGroups, customTabGroupRules)
  console.log("Actions", groupingActions)
  
  groupingActions.forEach(executeAction)
  sort()
}

let sort = async() => {
  let currentWindow = await chrome.windows.getCurrent()
  var tabs = await chrome.tabs.query({ windowId: currentWindow.id, pinned: false })  
  let currentTabGroups = await Promise.all(getGroupIds(tabs).map(getGroupDetails))
  let customTabGroupRules = await customGroups.get()  

  

  let firstActiveCustomGroupRule = customTabGroupRules.find(r => currentTabGroups.some(c => r.groupId === c.id))
  if (!! firstActiveCustomGroupRule) {
   // let firstCustomGroupId = currentTabGroups.find(g => g.title == firstActiveCustomGroup.name).id
    var currentIndex = tabs.find(t => t.groupId === firstActiveCustomGroupRule.groupId).index
  
    console.log(tabs.map(t => ({url: t.url, groupId: t.groupId, index: t.index })))
    for (const customRule of customTabGroupRules) {
        let customGroup = currentTabGroups.find(g => g.id === customRule.groupId)

        if (!!customGroup) {

          await new Promise((resolve) => {
            chrome.tabGroups.move(customGroup.id, {index: -1 }, () => { resolve() })
          })


          /* TODO.. Fix

          let indexOfGroupBeeingMoved = tabs.find(t => t.groupId === customGroup.id).index

          let delta = indexOfGroupBeeingMoved < currentIndex ?   tabs.filter(t => t.groupId === customGroup.id).length : 0        

          console.log(`${customRule.name} (${customGroup.id}): ${indexOfGroupBeeingMoved} -> ${currentIndex} ${delta}` )

          if (indexOfGroupBeeingMoved != currentIndex) {
            await new Promise((resolve) => {
               chrome.tabGroups.move(customGroup.id, {index: -1 }, () => { resolve() })
            })
            console.log("MOVE DONE")
          } else {
            console.log("MOVE SKIP")
          }

          tabs = await chrome.tabs.query({ windowId: currentWindow.id, pinned: false })  
          console.log(tabs.map(t => ({url: t.url, groupId: t.groupId, index: t.index })))
          currentIndex = tabs.find(t => t.groupId === customGroup.id).index +  tabs.filter(t => t.groupId === customGroup.id).length          
          */

        }
    }
  }
}

let executeAction = (action) => {
  chrome.tabs.group({ groupId: action.groupId, tabIds: action.tabIds }, async (groupId) => {
    console.log(`Tab(s) ${action.tabIds} added to ${!!action.groupId ? "pre-existing" : "just created"} tab group ${groupId}`)

    if (!action.groupId) {

      let applyToCustomGroups = async (fn) => customGroups.set(fn(await customGroups.get()))
      if (action.hasOwnProperty('matchedCustomGroupRule')) {
        applyToCustomGroups(groups => groups.map( (g, index) => index === action.matchedCustomGroupRule ? { ...g, groupId: groupId } : g))
      }
      
      let colorToSet = action.color || stringModuloColor(action.title)

      let groupOptions = {
        color: (await color.get()) ? colorToSet : "grey",
        ...(await title.get()) && { title: action.title }
      }
      console.log(`Tab group ${groupId} updating with options ${JSON.stringify(groupOptions)}`)
      chrome.tabGroups.update(groupId, groupOptions)
    }
  })
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (var key in changes) {
    var storageChange = changes[key];
    console.log('Storage key "%s" in namespace "%s" changed. Old value was %s, new value is %s.',
      key, namespace, JSON.stringify(storageChange.oldValue),JSON.stringify(storageChange.newValue));

    if (key == 'mode') {
      chrome.action.setBadgeText({ text: storageChange.newValue })
    }

    if (key == 'customGroups') {
      storageChange.newValue.forEach(newGroup => {
        let oldGroup = storageChange.oldValue.find(g => g.id === newGroup.id)
        if (!! oldGroup && ! (newGroup.name === oldGroup.name)) {
          console.log(`Grouping rule ${oldGroup.name} is now ${newGroup.name}. Attempting reconcile tab group ${newGroup.groupId}.`)
          if (newGroup.groupId >= 0) {
            chrome.tabGroups.update(newGroup.groupId || -1 , { title: newGroup.name })         
          }
        }

        if (!! oldGroup && ! (newGroup.color === oldGroup.color)) {
          console.log(`Grouping rule ${newGroup.name} has changed color from ${oldGroup.color} to ${newGroup.color}. Attempting reconcile tab group ${newGroup.groupId}.`)
          if (newGroup.groupId >= 0) {
            chrome.tabGroups.update(newGroup.groupId || -1, { color: newGroup.color })
          }
        }
      })
    }

    chrome.runtime.sendMessage({ [key]: storageChange.newValue })
  }
});

chrome.action.onClicked.addListener(async () => {
  if (MODE[await mode.get()] == MODE.AUTO) {
    chrome.runtime.openOptionsPage()
  } else {
    group()
  }
})

chrome.commands.onCommand.addListener(group)
chrome.runtime.onInstalled.addListener(initializeOptions)
chrome.runtime.onStartup.addListener(initializeOptions)


