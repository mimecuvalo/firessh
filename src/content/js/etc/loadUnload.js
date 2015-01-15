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

  // Sigh.  Fun times.
  var frag = gCli.doc.createDocumentFragment();
  var div = gCli.doc.createElement('div');
  var span = gCli.doc.createElement('span');
  span.style = 'cursor:pointer;text-decoration:underline;color:blue;';
  span.setAttribute('onclick', "window.open('http://firessh.net','FireSSH');");
  span.textContent = 'FireSSH';
  div.appendChild(span);
  div.appendChild(gCli.doc.createTextNode(" " + gVersion + " '"));
  span = gCli.doc.createElement('span');
  span.style = 'cursor:pointer;text-decoration:underline;';
  span.setAttribute('onclick', "window.open('http://en.wikipedia.org/wiki/Playfair_cipher','wikipedia');");
  span.textContent = "Playfair";
  div.appendChild(span);
  span = gCli.doc.createElement('span');
  span.style = 'color:orange';
  span.textContent = "' designed by ";
  div.appendChild(span);
  span = gCli.doc.createElement('span');
  span.style = 'cursor:pointer;text-decoration:underline;color:orange';
  span.setAttribute('onclick', "window.open('http://www.nightlight.ws','nightlight');");
  span.textContent = 'Mime Čuvalo';
  div.appendChild(span);
  span = gCli.doc.createElement('span');
  span.style = 'color:orange';
  span.textContent = ' in ';
  div.appendChild(span);
  span = gCli.doc.createElement('span');
  span.style = 'cursor:pointer;text-decoration:underline;color:orange';
  span.setAttribute('onclick', "window.open('http://en.wikipedia.org/wiki/Croatia','croatia');");
  span.textContent = 'Croatia';
  div.appendChild(span);
  var br = gCli.doc.createElement('br');
  br.style = 'font-size:5pt';
  div.appendChild(br);
  frag.appendChild(div);
  appendLog('', 'blue', 'info', frag);

  frag = gCli.doc.createDocumentFragment();
  div = gCli.doc.createElement('div');
  div.appendChild(gCli.doc.createTextNode('SSH component is ported from '));
  span = gCli.doc.createElement('span');
  span.style = 'cursor:pointer;text-decoration:underline;color:blue';
  span.setAttribute('onclick', "window.open('http://www.lag.net/paramiko/','Paramiko')");
  span.textContent = 'Paramiko';
  div.appendChild(span);
  div.appendChild(gCli.doc.createTextNode(' 1.7.7.1, '));
  span = gCli.doc.createElement('span');
  span.style = 'color:orange';
  span.textContent = 'created by ';
  div.appendChild(span);
  span = gCli.doc.createElement('span');
  span.style = 'cursor:pointer;text-decoration:underline;color:orange';
  span.setAttribute('onclick', "window.open('http://robey.lag.net/','rp');");
  span.textContent = 'Robey Pointer';
  div.appendChild(span);
  br = gCli.doc.createElement('br');
  br.style = 'font-size:5pt';
  div.appendChild(br);
  frag.appendChild(div);
  appendLog('', 'blue', 'info', frag);

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
window.onresize = function() { if (gCli) gCli.onResize() };
