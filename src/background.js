chrome.runtime.onInstalled.addListener(function() { 
  chrome.storage.local.set({
    "passwordmode": 1,
    "network": 30,
    "timeoutmode": 1,
    "retry": 10,
    "attempts": 40,
    "debugmode": 0,
    "keepalivemode": 1,
    "donated": 0,
    "loadurl": "",
    "compressmode": 1,
    "audible": 1,
    "fgColor": "#33FF33",
    "bgColor": "#000000",
    "size": "12",
    "font": "Andale Mono",
    "credits": 1
  });
});

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('content/firessh.html', {
    'width': 800,
    'height': 600
  });
});
