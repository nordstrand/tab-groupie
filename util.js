const MODE = { "AUTO": 1, "MAN": 2 }
Object.freeze(MODE)

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}


let storedField = (storageApi, fieldName) =>
({
  get: () =>
    new Promise((resolve, reject) => {
      storageApi.get([fieldName], (result) => {
        resolve(result[fieldName])
      })
    })
  ,
  set: (value) => {
    storageApi.set({ [fieldName]: value })
  }
})

let hostToCustomGroup = (hostname, customGroups) => {
  let g = customGroups.find(customGroup =>
    customGroup.domains.split(",").filter(x => x !== "").some(domain =>
      !!hostname.match(`${domain}$`)))
  return !!g ? g.name : null
}

let getHost = (tab) => new URL(tab.url).hostname  
let groupByHost = (tabs) => tabs.reduce((hash, obj) => ({ ...hash, [getHost(obj)]: (hash[getHost(obj)] || []).concat(obj) }), {})

let groupColors = ["blue", "red", "yellow", "green", "pink", "purple", "cyan"]

let stringModuloColor = (s) => {
  var hash = hashStr(s);
  var index = hash % groupColors.length;
  return groupColors[index];

  function hashStr(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var charCode = str.charCodeAt(i);
      hash += charCode;
    }
    return hash;
  }
}

let getGroupTitle = (groupId) => new Promise((resolve, reject) => {
  chrome.tabGroups.get(groupId, (groupDetails) => {
    resolve({id: groupId, title: groupDetails.title})
  })
})

let findPrexistingGroupIdForHostname =  async (tabs, hostname, customGroups) => {
  let existingGroupIDs = [...new Set(tabs.map((t) => t.groupId).filter((groupId) => groupId != -1))]

  let existingGroups = await Promise.all(existingGroupIDs.map(getGroupTitle))

  let matchingGroup = existingGroups.find( (group) => {
    function shouldBeGroupedTogetherAccordingToCurrentTabUrls() {
      return tabs
      .filter((t) => t.groupId == group.id)
      .every((t) => getHost(t, customGroups) == hostname);
    }
    
    let groupName =  group.title
    let matchesCustomGroup = !!groupName &&  groupName === hostToCustomGroup(hostname, customGroups)
    
    return matchesCustomGroup || shouldBeGroupedTogetherAccordingToCurrentTabUrls()
  })      

  return !!matchingGroup ? matchingGroup.id : null
}

