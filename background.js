importScripts("./util.js")

let mode = storedField(chrome.storage.local, "mode")
let color =  storedField(chrome.storage.local, "color")
let title =  storedField(chrome.storage.local, "title")
let customGroups =  storedField(chrome.storage.local, "customGroups")

let initializeOptions = async () => {
  let value = await mode.get()

  if (!!value) {
    chrome.action.setBadgeText({ text: value })   
  } else {
    mode.set(getKeyByValue(MODE, MODE.AUTO))
    color.set(true)
    title.set(true)
    customGroups.set([{name: "", domains: ""}])
  }
}

chrome.tabs.onCreated.addListener(createdTab => {
  console.log("New tab", createdTab)

  let listener = async (tabId, _, tab) => {
    if (tabId == createdTab.id && tab.url.startsWith("http")) {
      chrome.tabs.onUpdated.removeListener(listener)
      let m = MODE[await mode.get()] 
      let groups =  await customGroups.get()
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
  let tabs = await chrome.tabs.query({ windowId: currentWindow.id, groupId: -1, pinned: false})
  console.log("Creating groups for tabs:", tabs)

  let tabsToBeGrouped = tabs
    .filter((el) => el.groupId == -1)
    .filter((el) => el.url.startsWith("http"))

  let groups = await customGroups.get()
  let unGroupedTabsByHostname = groupByHost(tabsToBeGrouped)

  Object.keys(unGroupedTabsByHostname).forEach(async (hostname) => {
    let tabsForHostname = unGroupedTabsByHostname[hostname]
    let preExistingGroupId = await findPrexistingGroupIdForHostname(tabs.filter((el) => el.url.startsWith("http")), hostname, groups)
    if (tabsForHostname.length > 1 || !!preExistingGroupId) {  //Do not group if there only ONE tab with a certain hostname
      chrome.tabs.group({ groupId: preExistingGroupId, tabIds: tabsForHostname.map((t) => t.id) }, async (groupId) => {
        console.log(`(${tabsForHostname.length}) tab(s) added to ${!!preExistingGroupId ? "pre-existing" : "just created"} group ${groupId} for ${getHost(tabsForHostname[0])}`)
        if(! preExistingGroupId) {
          let groupName = hostToCustomGroup(getHost(tabsForHostname[0]), groups) || getHost(tabsForHostname[0])
          let groupUsed = groups.find(g => g.name === groupName)
          let colorToSet = (groupUsed && groupUsed.color) || stringModuloColor(groupName) 

          let groupOptions = {
            color: (await color.get()) ? colorToSet : "grey",
            ...(await title.get()) && {title: groupName}
          }          
          console.log(`For group ${groupId} updating with options ${JSON.stringify(groupOptions)}`)
          chrome.tabGroups.update(groupId, groupOptions)
        }
      });
    }
  })
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (var key in changes) {
    var storageChange = changes[key];
    console.log('Storage key "%s" in namespace "%s" changed. ' +
      'Old value was "%s", new value is "%s".',
      key,
      namespace,
      storageChange.oldValue,
      storageChange.newValue);

    if (key == 'mode') {     
      chrome.action.setBadgeText({ text: storageChange.newValue })
    }

    chrome.runtime.sendMessage({ [key]: storageChange.newValue })
  }
});


chrome.action.onClicked.addListener(async() => {
  if(MODE[await mode.get()] == MODE.AUTO) {
    chrome.runtime.openOptionsPage()  
  } else {
    group()
  }
})

chrome.commands.onCommand.addListener(group)
chrome.runtime.onInstalled.addListener(initializeOptions)
chrome.runtime.onStartup.addListener(initializeOptions)


