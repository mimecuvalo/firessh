function startup() {
  if (gStrbundle || !window['gFocused']) {                            // we get two onload events b/c of the embedded browser
    return;
  }

  if (!$('cmdlog').contentWindow.document.getElementById('terminal')) { // not finished loading embedded browser
    return;
  }

  window.onerror         = detailedError;

  gStrbundle             = $("strings");

  gCli = new cli($('cmdlog').contentWindow);

  gProfileDir            = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                                     .get("ProfD", Components.interfaces.nsILocalFile);
  gAtomService           = Components.classes["@mozilla.org/atom-service;1"].getService            (Components.interfaces.nsIAtomService);
  gLoginManager          = Components.classes["@mozilla.org/login-manager;1"].getService           (Components.interfaces.nsILoginManager);
  gIos                   = Components.classes["@mozilla.org/network/io-service;1"].getService      (Components.interfaces.nsIIOService);
  gPromptService         = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
  gPrefsService          = Components.classes["@mozilla.org/preferences-service;1"].getService     (Components.interfaces.nsIPrefService);
  gLoginInfo             = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",     Components.interfaces.nsILoginInfo, "init");

  gPrefs                 = gPrefsService.getBranch("extensions.firessh.");
  gPlatform              = getPlatform();

  if (gPrefsService instanceof Components.interfaces.nsIPrefBranchInternal) {
    gPrefsService.addObserver("extensions.firessh", prefsObserver, false);
  }

  gLoadUrl               = gPrefs.getComplexValue("loadurl", Components.interfaces.nsISupportsString).data;
  gCreditsMode           = gPrefs.getBoolPref("creditsmode")

  if(gCreditsMode) {
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
    span.style = 'cursor:pointer;color:blue;text-decoration:underline;';
    span.setAttribute('onclick', "window.open('http://en.wikipedia.org/wiki/Playfair_cipher','wikipedia');");
    span.textContent = "Playfair";
    div.appendChild(span);
    span = gCli.doc.createElement('span');
    span.style = 'color:orange';
    span.textContent = "' designed by ";
    div.appendChild(span);
    span = gCli.doc.createElement('span');
    span.style = 'cursor:pointer;text-decoration:underline;color:orange';
    span.setAttribute('onclick', "window.open('http://www.nite-lite.net','nightlight');");
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
  }

  readPreferences(true);

  //tipJar();

  var hashUsed = false;
  var hashAccount;
  if (!gLoadUrl && window.location.protocol == 'chrome:' && window.location.hash) {
    gDefaultAccount = getArgument('?' + window.location.hash.substring(1), 'account');
    gSiteManager = new Array();
    gProfileDir            = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                                     .get("ProfD", Components.interfaces.nsILocalFile);
    gLoginManager          = Components.classes["@mozilla.org/login-manager;1"].getService           (Components.interfaces.nsILoginManager);
    gLoginInfo             = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",     Components.interfaces.nsILoginInfo, "init");
    var file = gProfileDir.clone();
    file.append("fireSSHsites.dat");

    if (file.exists()) {
      try {
        var fstream  = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
        var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);
        fstream.init(file, 1, 0, false);
        cstream.init(fstream, "UTF-8", 0, 0);

        var siteData = "";
        {
          let str = {};
          let read = 0;
          do { 
            read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
            siteData += str.value;
          } while (read != 0);
        }
        cstream.close();

        gSiteManager = jsonParseWithToSourceConversion(siteData);
        getPasswords();

      } catch(ex) {
        alert(ex);
      }
    }

    for (var x = 0; x < gSiteManager.length; ++x) {
      if (gSiteManager[x].account == gDefaultAccount) {
        hashUsed = true;
        hashAccount = gSiteManager[x];
        break;
      }
    }
  }

  var connectCallback = function(site) {
    accountChangeHelper(site);
    connect();
    var func = function() {
      $('cmdlog').focus();
    };
    setTimeout(func, 0);
  };

  if (gLoadUrl) {
    setTimeout(externalLink, 1000);
  } else if (hashUsed) {
    connectCallback(hashAccount);
  } else {
    var connectCancelCallback = function() {
      window.close();
    };

    var params = { callback       : connectCallback,
                   cancelCallback : connectCancelCallback }
    gAccountDialog = window.openDialog("chrome://firessh/content/accountManager.xul", "accountManager", "chrome,dialog,resizable,centerscreen", params);
  }
}

function beforeUnload() {
  return "";
}

function unload() {
  try {
    if (gAccountDialog && !gAccountDialog.closed) {
      gAccountDialog.close();
    }
  } catch (ex) { }

  if (gPrefsService instanceof Components.interfaces.nsIPrefBranchInternal) {
    gPrefsService.removeObserver("extensions.firessh", prefsObserver, false);
  }

  if (gConnection && gConnection.isConnected) {
    gConnection.disconnect();
  }
}
