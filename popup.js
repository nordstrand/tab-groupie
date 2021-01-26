// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let groupButton = document.getElementById('groupButton');

/*
let logger = chrome.extension.getBackgroundPage().console.log
let bgPage = chrome.extension.getBackgroundPage();

groupButton.onclick = (element) => {
  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({ windowId: currentWindow.id, groupId: -1 }, function (tabs) {
      logger("Creating groups..")

      let tabsGroupedByHostname = bgPage.groupByHost(tabs.filter((el) => el.groupId == -1))

      Object.keys(tabsGroupedByHostname).forEach(hostname => {
        let tabsForHostname = tabsGroupedByHostname[hostname]
        if (tabsForHostname.length > 1) {          
          chrome.tabs.group({ tabIds: tabsForHostname.map((t) => t.id) }, (groupId) => {
            logger(`Created group ${groupId} for ${ bgPage.getHost(tabsForHostname[0])} (${tabsForHostname.length})`) 
          })
        }
      });
    });
  });
};

*/
