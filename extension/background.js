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

  console.log("Looking up grouping actions to perform for tabs:", tabs.map(t => ({ id: t.id, groupId: t.groupId, url: t.url }) ))
  let groupingActions = getGroupingActions(tabs, currentTabGroups, customTabGroupRules)
  console.log("Actions", groupingActions)
  
  groupingActions.forEach(executeAction)
}

let executeAction = (action) => {
  chrome.tabs.group({ groupId: action.groupId, tabIds: action.tabIds }, async (groupId) => {
    console.log(`Tab(s) ${action.tabIds} added to ${!!action.groupId ? "pre-existing" : "just created"} tab group ${groupId}`)

    if (!action.groupId) {
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
    console.log('Storage key "%s" in namespace "%s" changed. ' +
      'Old value was "%s", new value is "%s".',
      key,
      namespace,
      JSON.stringify(storageChange.oldValue),
      JSON.stringify(storageChange.newValue));

    if (key == 'mode') {
      chrome.action.setBadgeText({ text: storageChange.newValue })
    }

    if (key == 'customGroups') {


      var nameChanged = false;
      if (storageChange.oldValue.length === storageChange.newValue.length) {
        storageChange.oldValue.some((oldGroup, index) => {
          if (!(oldGroup.name === storageChange.newValue[index].name)) {
            console.log(`Group ${oldGroup.name} is now ${storageChange.newValue[index].name}`)
            nameChanged = true
            chrome.tabGroups.query({ title: oldGroup.name }, (foundGroups) => {
              foundGroups[0] && chrome.tabGroups.update(foundGroups[0].id, { title: storageChange.newValue[index].name })
            })
            return true
          } else {
            return false
          }
        })
      }

      if (nameChanged) {
        return
      }

      let oldColorsByGroup = storageChange.oldValue.reduce((agg, el) => ({ ...agg, [el.name]: el.color }), {})
      let newColorsByGroup = storageChange.newValue.reduce((agg, el) => ({ ...agg, [el.name]: el.color }), {})

      for (var group in newColorsByGroup) {
        if (!(newColorsByGroup[group] === oldColorsByGroup[group])) {
          console.log(`Group ${group} change color from ${oldColorsByGroup[group]} to ${newColorsByGroup[group]}`)

          chrome.tabGroups.query({ title: group }, (foundGroups) => {
            foundGroups[0] && chrome.tabGroups.update(foundGroups[0].id, { color: newColorsByGroup[group] })
          })
          break;
        }
      }
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


