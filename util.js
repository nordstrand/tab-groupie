
const MODE = {"AUTO":1, "MAN":2}


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

