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

let getGroupIds = (tabs) => [...new Set(tabs.map((t) => t.groupId).filter((groupId) => groupId != -1))]

let getGroupDetails = (groupId) => new Promise((resolve, reject) => {
  chrome.tabGroups.get(groupId, (groupDetails) => {
    resolve({id: groupId, title: groupDetails.title})
  })
})


let findPrexistingImplicitGroup =  (tabs, existingGroups, hostname) => {

  let matchingGroup = existingGroups.find( (group) => {
    function shouldBeGroupedTogetherAccordingToCurrentTabUrls() {
      return tabs
      .filter((t) => t.groupId == group.id)
      .every((t) => getHost(t, customGroups) == hostname);
    }
    
    return  shouldBeGroupedTogetherAccordingToCurrentTabUrls()
  })      

  return !!matchingGroup ? matchingGroup.id : null
}


/** 
 *   currentTabs, currentGroups, customGroupRules -> [actions]
 * 
 */
let getGroupingActions = (currentTabs, currentGroups, customGroupRules) => {

  let unGroupedTabs = currentTabs
    .filter((el) => el.groupId == -1)
    .filter((el) => el.url.startsWith("http"))

    let unGroupedTabsByHostname = groupByHost(unGroupedTabs)
    var actions = []

    Object.keys(unGroupedTabsByHostname).forEach((hostname) => {
      let tabsForHostname = unGroupedTabsByHostname[hostname]

      let preexistingImplictGroup = findPrexistingImplicitGroup(currentTabs, currentGroups, hostname)

      let customGroup = (() => {
        let gName = hostToCustomGroup(hostname, customGroupRules)
        return customGroupRules.find(g => g.name === gName)
      })()

      let prexistingCustomGroup = currentGroups.find(g => g.title === (customGroup && customGroup.name))
      let tabIds = tabsForHostname.map( t => t.id )

      if (!! prexistingCustomGroup) {
        // Reuse existing custom group
        actions = [...actions, {groupId: prexistingCustomGroup.id, tabIds }]
      } else if (!! customGroup) {
         // Create new gustom group         
        actions = [...actions, {color: customGroup.color, title: customGroup.name, isCustom: true, tabIds}]
      } else  if (!! preexistingImplictGroup) {
        // Reuse existing implicitly create tab group
        actions = [...actions, {groupId: preexistingImplictGroup, tabIds}]
      } else if (tabsForHostname.length > 1) {
        // Create new implicit group
        actions = [...actions, {title: hostname, tabIds: tabIds}]
      }
    })

    let consolidatedCustomGroupCreating = {}
    actions.forEach( a => {
      if(a.isCustom) {
        consolidatedCustomGroupCreating[a.title] = {
          color: a.color,
          title: a.title,
          tabIds: [...( consolidatedCustomGroupCreating[a.title] ? consolidatedCustomGroupCreating[a.title].tabIds : []), ...a.tabIds]
        }
      }
    })
    

    return [...actions.filter(a => ! a.isCustom), ...Object.values(consolidatedCustomGroupCreating)]
    
}