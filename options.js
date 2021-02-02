import { h, Component, render } from './lib/preact.js';
import htm from './lib/htm.js'

const html = htm.bind(h);
let mode =  storedField(chrome.storage.local, "mode")
let color =  storedField(chrome.storage.local, "color")
let title =  storedField(chrome.storage.local, "title")

class OptionsPage extends Component {  
  async componentDidMount() {
    this.setState({
      mode: MODE[await mode.get()],
      color: await color.get(),
      title: await title.get()
    })

    let self = this
    chrome.runtime.onMessage.addListener( (message) => { 
      if(!!message.mode) {
        message.mode = MODE[message.mode]
      } 

      self.setState(message)    
    });
  }

  setAuto = _ => mode.set(getKeyByValue(MODE, MODE.AUTO))
  setMan  = _ => mode.set(getKeyByValue(MODE, MODE.MAN))
  toggleTitle = _ => title.set(! this.state.title)
  toggleColor = _ => color.set(! this.state.color)
  
  render() {
    let platformSuperKey = navigator.platform === "MacIntel" ? String.fromCodePoint(8984) : "Ctrl"

    return html`
    <div>
      <div>
        <h3>Tabs are put in groups</h3>
        <label class=${this.state.mode == MODE.AUTO && "active"}>
          <input type="radio" class="mode" name="mode" value="AUTO" onClick=${this.setAuto} checked=${this.state.mode == MODE.AUTO} />
          <strong>Automatically.</strong> Recently opened tabs are automatically grouped by
          domain.
        </label>
        <label class=${this.state.mode == MODE.MAN && "active"}>
          <input type="radio" class="mode" name="mode" value="MAN" onClick=${this.setMan} checked=${this.state.mode == MODE.MAN}/>
          <strong>Manually.</strong> Tabs are grouped by domain when the icon in the tool bar is clicked or
          <span style="white-space:nowrap"><kbd>${platformSuperKey}</kbd>+<kbd>Shift</kbd>+<kbd>L</kbd></span>
          is pressed.
        </label>
      </div>
      <br/><br/>
      <div>
        <h3>New groups get</h3>
        <label class=${this.state.title && "active"}>
          <input type="checkbox" class="mode"  onClick=${this.toggleTitle} checked=${this.state.title}/>
          <strong>A title.</strong> Set to the domain of sites in that group.
        </label>
        <label class=${this.state.color && "active"}>
          <input type="checkbox" class="mode"  onClick=${this.toggleColor} checked=${this.state.color}/>
          <strong>An unique color.</strong> Based on the domain.
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
