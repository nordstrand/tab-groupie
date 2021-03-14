import htm from './lib/htm.js'
import { h  } from './lib/preact.js';
import { useState } from './lib/preact-hooks.js'

const html = htm.bind(h);

var indexBeeingDragged = -1

const CustomGroupRow = (props) => {
    let group = props.group
    let index = props.index
    let { onGroupRemove, onGroupNameInput, onGroupColorInput, onGroupDomainInput, onGroupChangeOrder } = props.callbacks

    const [isBeeingDragged, setIsBeeingDragged] = useState(false)
    
    let dragStart = () => { 
      console.log(`Drag start ${group.name}, ${index}(${indexBeeingDragged})`); 
      setIsBeeingDragged(true)
      indexBeeingDragged = index
    }
    
    let dragEnter = () => { 
      console.log(`Drag enter ${group.name}`); 
      onGroupChangeOrder({sourceIndex: indexBeeingDragged, destinationIndex: index});
      
      indexBeeingDragged = index
    }
    
    let dragEnd = () => {
      console.log(`Drag end ${group.name}, ${index}(${indexBeeingDragged})`); 
      setIsBeeingDragged(false)
    }

    return html`
    <div class="customgroup-row ${isBeeingDragged ? "dragging" : ""} "
      draggable     
      onDragStart=${dragStart}
      onDragEnter=${dragEnter}
      onDragEnd=${dragEnd}      
      onDragOver=${(e) => e.preventDefault()}      
      >
      <div style="display: flex; flex-direction: column; justify-content: center; width: 30px; font-size: 1rem; cursor: move;">☰</div>
      
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
      <div style="width: 3px"/>
      <div style="display: flex; flex-direction: column; justify-content: flex-end;"><button class="remove" onClick=${onGroupRemove}/></div>
    </div>`
}

  export default CustomGroupRow