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

  var callback = function() {
    if (gCreditsMode) {
      // Sigh.  Fun times.
      var frag = gCli.doc.createDocumentFragment();
      var div = gCli.doc.createElement('div');
      var a = gCli.doc.createElement('a');
      a.setAttribute('style', 'cursor:pointer;text-decoration:underline;color:blue;');
      a.setAttribute('href', "http://firessh.net");
      a.setAttribute('target', '_blank');
      a.textContent = 'FireSSH';
      div.appendChild(a);
      div.appendChild(gCli.doc.createTextNode(" " + gVersion + " '"));
      a = gCli.doc.createElement('a');
      a.setAttribute('style', 'cursor:pointer;color:blue;text-decoration:underline;');
      a.setAttribute('href', "http://en.wikipedia.org/wiki/Playfair_cipher");
      a.setAttribute('target', '_blank');
      a.textContent = "Playfair";
      div.appendChild(a);
      var span = gCli.doc.createElement('span');
      span.setAttribute('style', 'color:orange');
      span.textContent = "' designed by ";
      div.appendChild(span);
      a = gCli.doc.createElement('a');
      a.setAttribute('style', 'cursor:pointer;text-decoration:underline;color:orange');
      a.setAttribute('href', "http://www.nightlight.ws");
      a.setAttribute('target', '_blank');
      a.textContent = 'Mime Čuvalo';
      div.appendChild(a);
      span = gCli.doc.createElement('span');
      span.setAttribute('style', 'color:orange');
      span.textContent = ' in ';
      div.appendChild(span);
      a = gCli.doc.createElement('a');
      a.setAttribute('style', 'cursor:pointer;text-decoration:underline;color:orange');
      a.setAttribute('href', "http://en.wikipedia.org/wiki/Croatia");
      a.setAttribute('target', '_blank');
      a.textContent = 'Croatia';
      div.appendChild(a);
      var br = gCli.doc.createElement('br');
      br.setAttribute('style', 'font-size:5pt');
      div.appendChild(br);
      frag.appendChild(div);
      appendLog('', 'blue', 'info', frag);

      frag = gCli.doc.createDocumentFragment();
      div = gCli.doc.createElement('div');
      div.appendChild(gCli.doc.createTextNode('SSH component is ported from '));
      a = gCli.doc.createElement('a');
      a.setAttribute('style', 'cursor:pointer;text-decoration:underline;color:blue');
      a.setAttribute('href', "http://www.lag.net/paramiko/");
      a.setAttribute('target', '_blank');
      a.textContent = 'Paramiko';
      div.appendChild(a);
      div.appendChild(gCli.doc.createTextNode(' 1.7.7.1, '));
      span = gCli.doc.createElement('span');
      span.setAttribute('style', 'color:orange');
      span.textContent = 'created by ';
      div.appendChild(span);
      a = gCli.doc.createElement('a');
      a.setAttribute('style', 'cursor:pointer;text-decoration:underline;color:orange');
      a.setAttribute('href', "http://robey.lag.net/");
      a.setAttribute('target', '_blank');
      a.textContent = 'Robey Pointer';
      div.appendChild(a);
      br = gCli.doc.createElement('br');
      br.setAttribute('style', 'font-size:5pt');
      div.appendChild(br);
      frag.appendChild(div);
      appendLog('', 'blue', 'info', frag);
    }

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
