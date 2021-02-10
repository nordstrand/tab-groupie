
let customGroups=[
    {name: 'agrp', domains: "vw.com,bmw.com"},
    {name: 'bgrp', domains: "cnn.com,foxnews.com"}]


it('hostToCustomGroup should find group matching domain exactly',  () => {
    assert("agrp" === hostToCustomGroup("vw.com", customGroups))
    assert("bgrp" === hostToCustomGroup("foxnews.com", customGroups))
});

it('hostToCustomGroup should return null if group not found',  () => {
    assert(null === hostToCustomGroup("whatever", customGroups))
});

it('hostToCustomGroup should treat domains in list independently',  () => {
    assert(null === hostToCustomGroup("vw.com,b", customGroups))
});

it('hostToCustomGroup should match domain suffix',  () => {
    assert("agrp" === hostToCustomGroup("whatever.vw.com", customGroups))
});

it('hostToCustomGroup should not match domain prefix',  () => {
    assert(null === hostToCustomGroup("vw.com.evil.com", customGroups))
});