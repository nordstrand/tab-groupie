


console.log("DOH")


chrome.action.setBadgeText({ text: "AUTO" })

chrome.runtime.onMessage.addListener(({ type, name }) => {
  console.log("Message received: " + name)
  chrome.storage.local.set({ name });

});

chrome.tabs.onCreated.addListener((createdTab) => {
  console.log("New tab", createdTab)

  let listener = (tabId, _, tab) => {
    if (tabId == createdTab.id && tab.url.startsWith("http")) {
      chrome.tabs.onUpdated.removeListener(listener)
      console.log("Update", tab, getHost(tab))
      group()
    }
  }

  chrome.tabs.onUpdated.addListener(listener)
})

/*
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log('The color is green!.');
  });
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'developer.chrome.com'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });

});
*/

let getHost = (tab) => new URL(tab.url).hostname
let groupByHost = (tabs) => tabs.reduce((hash, obj) => ({ ...hash, [getHost(obj)]: (hash[getHost(obj)] || []).concat(obj) }), {})
let logger = console.log

let group = async () => {  
  let currentWindow = await chrome.windows.getCurrent()
  let tabs = await chrome.tabs.query({ windowId: currentWindow.id, groupId: -1 })
  logger("Creating groups..", tabs)

  let unGroupedTabsByHostname = groupByHost(tabs.filter((el) => el.groupId == -1))

  Object.keys(unGroupedTabsByHostname).forEach(hostname => {
    let tabsForHostname = unGroupedTabsByHostname[hostname]
    let preExistingGroupId = findGroupIdForHostname(tabs, hostname)
    if (tabsForHostname.length > 1 || !!preExistingGroupId) {  //Do not group if there only ONE tab with a certain hostname
      chrome.tabs.group({ groupId: preExistingGroupId, tabIds: tabsForHostname.map((t) => t.id) }, (groupId) => {
        logger(`${!!preExistingGroupId ? "Added to" : "Created"} group ${groupId} for ${getHost(tabsForHostname[0])} (${tabsForHostname.length})`)
      });
    }
  })
}

let findGroupIdForHostname = (tabs, hostname) => {
  let existingGroups = [...new Set(tabs.map((t) => t.groupId).filter((groupId) => groupId != -1))]
  console.log("existing groups", existingGroups)
  return existingGroups.find(groupId =>
    tabs
      .filter((t) => t.groupId == groupId)
      .every((t) => getHost(t) == hostname))
}

chrome.action.onClicked.addListener(group)


chrome.storage.local.get(["mode"], (result)  => {
  let value = result.mode
  console.log("INIT mote", value)
  if (! value) {
    chrome.storage.local.set({'mode': 'AUTO'})
  }  
})

chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (var key in changes) {
    var storageChange = changes[key];
    console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
    if (key=='mode') {
      chrome.action.setBadgeText({ text: storageChange.newValue })
    }
  }
});

let toggleMode = () => {
  chrome.storage.local.get(["mode"], (result)  => {
    let value = result.mode
    console.log("INIT mode", value )
    if (!!value) {
      chrome.storage.local.set({'mode':  value == 'AUTO' ? 'MAN' : 'AUTO'})
    }
  })
} 


chrome.commands.onCommand.addListener((command) => {
  console.log('Command:', command);
  toggleMode()
});