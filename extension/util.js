// The ID of the group that the tabs are in, or $(ref:tabGroups.TAB_GROUP_ID_NONE) for ungrouped tabs."
const TAB_GROUP_ID_NONE = -1

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

let hostToCustomGroupIndex = (hostname, customGroups) => {
  let g = customGroups.findIndex(customGroup =>
    customGroup.domains.split(",").map(s => s.trim()).filter(x => x !== "").some(domain =>
      !!hostname.match(`${domain}$`)))
  return g
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

let uniqueId = () =>  (Date.now().toString(36) + Math.random().toString(36).substring(2))


let getGroupIds = (tabs) => [...new Set(tabs.map((t) => t.groupId).filter((groupId) => groupId != TAB_GROUP_ID_NONE))]

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
    .filter((el) => el.groupId === TAB_GROUP_ID_NONE)
    .filter((el) => el.url.startsWith("http"))

    let unGroupedTabsByHostname = groupByHost(unGroupedTabs)
    var actions = []

    Object.keys(unGroupedTabsByHostname).forEach((hostname) => {
      let tabsForHostname = unGroupedTabsByHostname[hostname]

      let preexistingImplictGroup = findPrexistingImplicitGroup(currentTabs, currentGroups, hostname)

      let customGroupIndex = hostToCustomGroupIndex(hostname, customGroupRules)

      let prexistingCustomGroup = currentGroups.find(g =>  
        (customGroupIndex != -1 && customGroupRules[customGroupIndex].groupId == g.id)) 
      
      let tabIds = tabsForHostname.map( t => t.id )

      if (!! prexistingCustomGroup) {
        // Reuse existing custom group
        actions = [...actions, {groupId: prexistingCustomGroup.id, tabIds}]
      } else if (customGroupIndex != -1) {
         // Create new custom group         
         let customGroup = customGroupRules[customGroupIndex]
        actions = [...actions, {color: customGroup.color, title: customGroup.name, customGroupIndex, tabIds}]
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
      if(a.hasOwnProperty("customGroupIndex")) {
        consolidatedCustomGroupCreating[a.customGroupIndex] = {
          color: a.color,
          title: a.title,
          matchedCustomGroupRule: a.customGroupIndex,
          tabIds: [...( consolidatedCustomGroupCreating[a.title] ? consolidatedCustomGroupCreating[a.title].tabIds : []), ...a.tabIds]
        }
      }
    })
    

    return [...actions.filter(a => ! a.hasOwnProperty("customGroupIndex")), ...Object.values(consolidatedCustomGroupCreating)]
    
}