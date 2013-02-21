function startup() {
  if (gCli) {                            // we get two onload events b/c of the embedded browser
    return;
  }

  if (!$('cmdlog').contentWindow.document.getElementById('terminal')) { // not finished loading embedded browser
    return;
  }

  window.onerror         = detailedError;

  gCli = new cli($('cmdlog').contentWindow);
  gPlatform = getPlatform();
  chrome.storage.local.get("loadurl", function(value) {
    //externalLink();
  });

  var wikipedia = 'http://en.wikipedia.org/wiki/Tap_code';
  appendLog("<span id='opening'><a style='cursor:pointer;text-decoration:underline;color:blue;' href=\"http://firessh.net\" target=\"_blank\">"
      + "FireSSH</a> <span>" + gVersion
      + "  '</span><a style='cursor:pointer;text-decoration:underline;color:blue;' href=\"" + wikipedia + "\" target=\"_blank\">"
      + "Tap</a>'"
      + " " + _("opening")
      + "</span><br style='font-size:5pt'/>", 'blue', "info", true);

  setTimeout(function() { gCli.body.scrollTop = 0; }, 0);
  
  try {
    appendLog(_("paramiko").replace('%S', "1.7.7.1")
      + "<br style='font-size:5pt'/>", 'blue', "info", true);
  } catch(ex) {}  // if we haven't had it translated yet

  var callback = function() {
    var hashUsed = false;
    var hashAccount;
    if (!gLoadUrl && window.location.protocol == 'chrome-extension:' && window.location.hash) {
      gDefaultAccount = getArgument('?' + window.location.hash.substring(1), 'account');
      for (var x = 0; x < gSiteManager.length; ++x) {
        if (gSiteManager[x].account == gDefaultAccount) {
          hashUsed = true;
          hashAccount = gSiteManager[x];
          break;
        }
      }
    }

    // disabled for now
    if (false && hashUsed) {
      accountChangeHelper(hashAccount);
    } else {
      makePopup();
    }
  };

  readPreferences(true, callback);
}

function makePopup() {
  var iframe = document.createElement('iframe');
  iframe.src = 'accountManager.html';
  iframe.id = 'account-manager-iframe';

  var iframePopup = document.createElement('div');
  iframePopup.id = 'account-manager-popup';
  iframePopup.appendChild(iframe);
  document.body.appendChild(iframePopup);
}

function beforeUnload() {
  return "";
}

function unload() {
  if (gConnection && gConnection.isConnected) {
    gConnection.disconnect();
  }
}

document.body.onload = startup;
document.body.onunload = unload;
document.body.onresize = function() { if (gCli) gCli.onResize() };
