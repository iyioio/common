
export const initConvoChromeService=()=>{
    chrome.action.onClicked.addListener(async tab=>{
        chrome.action.setPopup({
            popup:'popup.html'
        })
        console.log('tab clicked',tab)
    })
}
