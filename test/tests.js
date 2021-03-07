
let customGroups=[
    {name: 'agrp', domains: "vw.com,bmw.com"},
    {name: 'bgrp', domains: "cnn.com,foxnews.com"}]


it('hostToCustomGroup should find group matching domain exactly',  () => {
    assert(0 === hostToCustomGroupIndex("vw.com", customGroups))
    assert(1 === hostToCustomGroupIndex("foxnews.com", customGroups))
});

it('hostToCustomGroup should return null if group not found',  () => {
    assert(-1 === hostToCustomGroupIndex("whatever", customGroups))
});

it('hostToCustomGroup should treat domains in list independently',  () => {
    assert(-1 === hostToCustomGroupIndex("vw.com,b", customGroups))
});

it('hostToCustomGroup should match domain suffix',  () => {
    assert(0 === hostToCustomGroupIndex("whatever.vw.com", customGroups))
});

it('hostToCustomGroup should not match domain prefix',  () => {
    assert(-1 === hostToCustomGroupIndex("vw.com.evil.com", customGroups))
});

it('hostToCustomGroup should trim whitespace from domains',  () => {
    assert(0 === hostToCustomGroupIndex("bmw.com",  [{name: 'agrp', domains: "vw.com, bmw.com  "}],))
});


it('getGroupingActions should return no action for one ungrouped tab',  () => {

    let currentTabs = [{id: 1,  groupId: -1, url: "https://vw.com"}]
    let currentGroups = []
    let customGroupRules = []

    let actions = getGroupingActions(currentTabs, currentGroups, customGroupRules)
    
    assert(actions.length === 0)
});

it('getGroupingActions should return no action for two unmatching tabs',  () => {

    let currentTabs = [{id: 1,  groupId: -1, url: "https://vw.com"},
                       {id: 2,  groupId: -1, url: "https://vvw.com"}]
    let currentGroups = []
    let customGroupRules = []

    let actions = getGroupingActions(currentTabs, currentGroups, customGroupRules)
    
    assert(actions.length === 0)
});

it('getGroupingActions should return action for two ungrouped tab with same host',  () => {

    let currentTabs = [{id: 1,  groupId: -1, url: "https://vw.com/a"},
                       {id: 2,  groupId: -1, url: "https://vw.com/b"}]
    
    let currentGroups = []
    let customGroupRules = []

    let actions = getGroupingActions(currentTabs, currentGroups, customGroupRules)
    
    assert(JSON.stringify(actions) === `[{"title":"vw.com","tabIds":[1,2]}]`)
});


it('getGroupingActions should reuse existing implicit group',  () => {

    let currentTabs = [{id: 1,  groupId: 100, url: "https://vw.com/a"},
                       {id: 2,  groupId: -1,  url: "https://vw.com/b"}]
    
    let currentGroups = [{id: 100, color: "blue", title: "vw.com" }]
    let customGroupRules = []

    let actions = getGroupingActions(currentTabs, currentGroups, customGroupRules)
        
    assert(JSON.stringify(actions) === `[{"groupId":100,"tabIds":[2]}]`)
});

it('getGroupingActions should use customGroupRules in preference to implicit current groups',  () => {

    let currentTabs = [{id: 1,  groupId: 100, url: "https://vw.com/a"},
                       {id: 2,  groupId: -1,  url: "https://vw.com/b"}]
    
    let currentGroups = [{id: 100, color: "blue", title: "vw.com" }]
    let customGroupRules = [{domains: "vw.com", color:"red", name: "car" }]

    let actions = getGroupingActions(currentTabs, currentGroups, customGroupRules)
        
    assert(JSON.stringify(actions) === `[{"color":"red","title":"car","matchedCustomGroupRule":0,"tabIds":[2]}]`)
});

it('getGroupingActions should reuse existing customGroup',  () => {

    let currentTabs = [{id: 1,  groupId: 100, url: "https://vw.com/a"},
                       {id: 2,  groupId: -1,  url: "https://vw.com/b"}]
    
    let currentGroups = [{id: 100, color: "red", title: "car" }]
    let customGroupRules = [{domains: "vw.com", color:"red", name: "car", groupId: 100 }]

    let actions = getGroupingActions(currentTabs, currentGroups, customGroupRules)
        
    assert(JSON.stringify(actions) === `[{"groupId":100,"tabIds":[2]}]`)
});


it('getGroupingActions should create one and only one customGroup for matching hosts also when hosts are different',  () => {

    let currentTabs = [{id: 1,  groupId: -1, url: "https://gm.com/"},
                       {id: 2,  groupId: -1, url: "https://vw.com/"}]
    
    let currentGroups = []
    let customGroupRules = [{domains: "vw.com,gm.com", color:"red", name: "car" }]

    let actions = getGroupingActions(currentTabs, currentGroups, customGroupRules)
        
    assert(JSON.stringify(actions) === `[{"color":"red","title":"car","matchedCustomGroupRule":0,"tabIds":[1,2]}]`)
});