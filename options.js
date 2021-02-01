import { h, Component, render } from './lib/preact.js';
import htm from './lib/htm.js'

const html = htm.bind(h);
let mode =  storedField(chrome.storage.local, "mode")

class OptionsPage extends Component {  
  async componentDidMount() {
    this.setState({mode: MODE[await mode.get()]})

    let self = this
    chrome.runtime.onMessage.addListener( (message) => { 
      if(!!message.mode) {
        self.setState({mode: MODE[message.mode]})
      }      
    });
  }

  setAuto = _ => mode.set(getKeyByValue(MODE, MODE.AUTO))
  setMan  = _ => mode.set(getKeyByValue(MODE, MODE.MAN))
  
  render() {
    let platformSuperKey = navigator.platform === "MacIntel" ? String.fromCodePoint(8984) : "Ctrl"

    return html`
    <div>
      <h3>Tabs are put in groups</h3>    

      <div id="modes">
        <label style="border: 1px solid; padding: 3px;" class=${this.state.mode == MODE.AUTO && "active"}>
          <input type="radio" class="mode" name="mode" value="AUTO" onClick=${this.setAuto} checked=${this.state.mode == MODE.AUTO} />
          <strong>Automatically.</strong> Recently opened tabs are automatically grouped by
          domain.
        </label>
        <br />
        <label style="border: 1px solid; padding: 3px;"  class=${this.state.mode == MODE.MAN && "active"}>
          <input type="radio" class="mode" name="mode" value="MAN" onClick=${this.setMan} checked=${this.state.mode == MODE.MAN}/>
          <strong>Manually.</strong> Tabs are grouped by domain when the icon in the tool bar is clicked or
          <span style="white-space:nowrap"><kbd>${platformSuperKey}</kbd>+<kbd>Shift</kbd>+<kbd>L</kbd></span>
          is pressed.
        </label>
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
}

render(html`<${OptionsPage} />`, document.getElementById("mnt"));
