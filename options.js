import { h, Component, render } from './lib/preact.js';
import htm from './lib/htm.js'
import { useState, useEffect } from './lib/preact-hooks.js'

const html = htm.bind(h);

let storage = {
  mode: storedField(chrome.storage.local, "mode"),
  color: storedField(chrome.storage.local, "color"),
  title: storedField(chrome.storage.local, "title"),
  customGroups: storedField(chrome.storage.local, "customGroups")
}

const OptionsPage = (props) =>  {    
  
  const [state, setState] = useState(props.initialValues)
  
  useEffect(() => {
    chrome.runtime.onMessage.addListener( (message) => { 
      if(!!message.mode) {
        message.mode = MODE[message.mode]
      } 

      setState({...state, ...message})
    });
  }, [])

  let {mode, color, title, customGroups} = state

  let setAuto = _ => storage.mode.set(getKeyByValue(MODE, MODE.AUTO))
  let setMan  = _ => storage.mode.set(getKeyByValue(MODE, MODE.MAN))
  let toggleTitle = _ => storage.title.set(! title)
  let toggleColor = _ => storage.color.set(! color)

  let onGroupNameInput = groupNumber => e => {
    const { value } = e.target;
    customGroups = [...customGroups]
    storage.customGroups.set( customGroups.map((g, index) => 
      index === groupNumber ? {name: value, domains: g.domains} : g))
  }

  let onGroupDomainInput = groupNumber =>  e => {
    const { value } = e.target;
    customGroups = [...customGroups]
    storage.customGroups.set( customGroups.map((g, index) => 
      index === groupNumber ? {name: g.name, domains: value} : g))
  }
  let onAddGroup = _ => {
     storage.customGroups.set([...customGroups,  {name: "", domains: ""}] )
  }

  let onGroupRemove = groupNumber => _ => {
    storage.customGroups.set(customGroups
    .map((g, index) => index === groupNumber? null : g)
    .filter( g => !!g )  ) 
  }

  
  let platformSuperKey = navigator.platform === "MacIntel" ? String.fromCodePoint(8984) : "Ctrl"


  return html`
  <div>
    <div class="options">
      <h3>Tabs are put in groups</h3>
      <label class=${mode == MODE.AUTO && "active"}>
        <input type="radio" class="mode" name="mode" value="AUTO" onClick=${setAuto} checked=${mode == MODE.AUTO} />
        <strong>Automatically.</strong> Recently opened tabs are automatically grouped by
        domain.
      </label>
      <label class=${mode == MODE.MAN && "active"}>
        <input type="radio" class="mode" name="mode" value="MAN" onClick=${setMan} checked=${mode == MODE.MAN}/>
        <strong>Manually.</strong> Tabs are grouped by domain when the icon in the tool bar is clicked or
        <span style="white-space:nowrap"><kbd>${platformSuperKey}</kbd>+<kbd>Shift</kbd>+<kbd>L</kbd></span>
        is pressed.
      </label>
    </div>
    <br/><br/>
    <div class="options">
      <h3>New groups get</h3>
      <label class=${title && "active"}>
        <input type="checkbox" class="mode"  onClick=${toggleTitle} checked=${title}/>
        <strong>A title.</strong> Set to the domain of sites in that group.
      </label>
      <label class=${color && "active"}>
        <input type="checkbox" class="mode"  onClick=${toggleColor} checked=${color}/>
        <strong>An unique color.</strong> Based on the domain.
      </label>
    </div>
    <div>
      <h3>Custom groups</h3>
      ${customGroups.map( (group, index) => 
        html`
      <div class="customgroup-row">
        <button onClick=${onGroupRemove(index)}>x</button>
        <label>Name<br/>
          <input value=${group.name} onInput=${onGroupNameInput(index)} required type="text" placeholder="Car" />
        </label>
        <label>Domains<br/>
          <input value=${group.domains} onInput=${onGroupDomainInput(index)} required pattern="([A-Za-z0-9]+\.[A-Za-z0-9]{2,3})(,[A-Za-z0-9]+\.[A-Za-z0-9]{2,3})*" type="text" placeholder="gm.com,vw.com,bmw.com"/>
        </label>
      </div>`
      )}

      <button onClick=${onAddGroup}>Add</button>
    </div>
    <section>
      <aside>
        <h3>How does all this work?</h3>
        <p>The exension will check the domain of the site in each tab, putting sites with the same domain in the same
          tab group.
        </p>
        <p>Only un-grouped tabs, not already in a group, will be grouped.
          Pinned tabs are never grouped.</p>
      </aside>
    </section>
  </div>`;
}

(async () => {
  let initialValues = {  
    mode: MODE[await storage.mode.get()],
    color: await storage.color.get(),
    title: await storage.title.get(),
    customGroups: await storage.customGroups.get()
  }

  render(html`<${OptionsPage} initialValues=${initialValues} />`, document.getElementById("mnt"));
}) ()