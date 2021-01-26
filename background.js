// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


console.log("DOH")

chrome.action.setBadgeText({ text: "doh" })

chrome.runtime.onMessage.addListener(({ type, name }) => {
  console.log("Message received: " + name)
  chrome.storage.local.set({ name });

});

//chrome.action.onClicked.addListener(group);

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


  var tabIds = [] 

  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({  windowId: currentWindow.id }, function (activeTabs) {
  
      console.log(groupByHost(activeTabs))
    });
  });

});
*/

let getHost = (tab) => new URL(tab.url).hostname
let groupByHost = (tabs) => tabs.reduce((hash, obj) => ({ ...hash, [getHost(obj)]: (hash[getHost(obj)] || []).concat(obj) }), {})
let logger = console.log

let group = () => {
  console.log("do stuff")
  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({ windowId: currentWindow.id, groupId: -1 }, function (tabs) {
      logger("Creating groups..", tabs)

      let tabsGroupedByHostname = groupByHost(tabs.filter((el) => el.groupId == -1))

      Object.keys(tabsGroupedByHostname).forEach(hostname => {
        let tabsForHostname = tabsGroupedByHostname[hostname]

        findGroupIdForHostname(tabs, hostname, (preExistingGroupId) => {
          if (tabsForHostname.length > 1 || !!preExistingGroupId) {  //Do not group if there only ONE tab with hostname
            chrome.tabs.group({ groupId: preExistingGroupId, tabIds: tabsForHostname.map((t) => t.id) }, (groupId) => {
              logger(`${!!preExistingGroupId ? "Added to" : "Created"} group ${groupId} for ${getHost(tabsForHostname[0])} (${tabsForHostname.length})`)
            });
          }
        });

      });
    });
  });
}

let findGroupIdForHostname = (tabs, hostname, cb) => {
  let existingGroups = [...new Set(tabs.map((t) => t.groupId).filter((groupId) => groupId != -1))]
  console.log("existing groups", existingGroups)
  let g = existingGroups.find(groupId =>
    tabs
      .filter((t) => t.groupId == groupId)
      .every((t) => getHost(t) == hostname))
  console.log("USE", g)
  cb(g)
}

chrome.action.onClicked.addListener(group)