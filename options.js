

let reflectCurrentMode = async () => {
  let mode = MODE[await storedField(chrome.storage.local, "mode").get()]
  console.log("Current mode", mode)
  updateDom(mode)
}


let updateDom = (mode) =>  {
  document.querySelectorAll("input.mode").forEach(el => { 
    el.checked = el.id === getKeyByValue(MODE, mode)
    el.parentElement.classList.toggle("active", el.checked)
    console.log(`${el.id} == ${getKeyByValue(MODE, mode)}`) 
  })
}


chrome.runtime.onMessage.addListener( (message) => { 
  if(!!message.mode) {
    updateDom(MODE[message.mode])
  }
  console.log("Options page", message)
});

document.addEventListener("DOMContentLoaded", reflectCurrentMode)

document.getElementById("modes").addEventListener("click", (e) => {
  console.log("CLICK", e)
  document.querySelectorAll("input.mode").forEach(el => {     
    console.log(`${el.id} == ${el.checked}`) 
    el.parentElement.classList.toggle("active", el.checked)
    if (el.checked) {
      storedField(chrome.storage.local, "mode").set(getKeyByValue(MODE, MODE[el.id]))
    }
  })
})

console.log("DONE")
