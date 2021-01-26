// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

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

let getHost = (tab) => new URL(tab.url).hostname

 let groupByHost = (tabs) => tabs.reduce((hash, obj) => ({...hash, [  getHost(obj) ]:( hash[  getHost(obj) ] || [] ).concat(obj)}), {})

 window.groupByHost = groupByHost
 window.getHost = getHost