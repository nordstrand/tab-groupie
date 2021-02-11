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
      !! hostname.match(`${domain}$`)))
  return !!g ? g.name : null
}

let getHost = (tab, customGroups) => {
  let host = new URL(tab.url).hostname.match(/([^\.]+\.[^\.]+)$/)[0] 
  
  if (!host) {
    return null
  } 

  let group = hostToCustomGroup(host, customGroups)
  return !!group ? group : host
}

let groupByHost = (tabs, customGroups) => tabs.reduce((hash, obj) => ({ ...hash, [getHost(obj, customGroups)]: (hash[getHost(obj, customGroups)] || []).concat(obj) }), {})

let findGroupIdForHostname = (tabs, hostname, customGroups) => {
  let existingGroups = [...new Set(tabs.map((t) => t.groupId).filter((groupId) => groupId != -1))]  
  return existingGroups.find(groupId =>
    tabs
      .filter((t) => t.groupId == groupId)
      .every((t) => getHost(t, customGroups) == hostname))
}
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

