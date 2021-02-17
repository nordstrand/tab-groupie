import htm from './lib/htm.js'
import { h  } from './lib/preact.js';
const html = htm.bind(h);

const CustomGroupRow = (props) => {
    let group = props.group
    let { onGroupRemove, onGroupNameInput, onGroupColorInput, onGroupDomainInput } = props.callbacks
  
    return html`
    <div class="customgroup-row">
      <div style="display: flex; flex-direction: column; justify-content: flex-end;"><button class="remove" onClick=${onGroupRemove}/></div>
      <label>Name<br/>
        <input class="tabcolor-${group.color}" style="width: 80px; color: white;" value=${group.name} onInput=${onGroupNameInput} required type="text" placeholder="Car" />
      </label>
      <label>Color<br/>
        <select value=${group.color} onChange=${onGroupColorInput}>
          ${groupColors.map(color =>
      html`<option value=${color}>${color}</option>`)}
        </select>
      </label>
      <label>Domains<br/>
        <input style="width: 200px;" value=${group.domains} onInput=${onGroupDomainInput} required pattern="([A-Za-z0-9\.-]+.[A-Za-z0-9]{2,3})(,[A-Za-z0-9\.-]+.[A-Za-z0-9]{2,3})*" type="text" placeholder="gm.com,vw.com,bmw.com"/>
      </label>
    </div>`
}

  export default CustomGroupRow