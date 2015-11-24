var gStrbundle;
var gAnonymous;
var gSite;
var gSiteManager;
var gCallback;
var gCancelCallback;
var gAutoAccount = false;
var gOrigSite;
var gAccountField;
var gFolderField;
var gProfileDir;
var gLoginManager;
var gPrefsService;
var gLoginInfo;
var gPrefs;
var gConnection = null;
var gTunnels = [];

function init() {
  setTimeout(window.sizeToContent, 0);

  gAccountField          = $('toolbar-account');
  gFolderField           = $('toolbar-folder');
  gStrbundle             = $("strings");

  gProfileDir            = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties)
                                     .get("ProfD", Components.interfaces.nsILocalFile);
  gLoginManager          = Components.classes["@mozilla.org/login-manager;1"].getService           (Components.interfaces.nsILoginManager);
  gPrefsService          = Components.classes["@mozilla.org/preferences-service;1"].getService     (Components.interfaces.nsIPrefService);
  gLoginInfo             = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",     Components.interfaces.nsILoginInfo, "init");
  gPrefs                 = gPrefsService.getBranch("extensions.firessh.");

  loadSiteManager(true);

  gOrigSite                   = null;
  gCallback                   = window.arguments[0].callback;
  gCancelCallback             = window.arguments[0].cancelCallback;

  createFolders();

  $('accountManager').getButton("accept").label = gStrbundle.getString("connectButton");

  $('accountManager').getButton("extra2").collapsed = true;

  onAccountChange(gDefaultAccount);
}

function loadSite(site) {
  gSite = site;

  gAnonymous                  = gSite.anonymous;
  $('account').value          = gSite.account;
  $('host').value             = gSite.host;
  $('port').value             = gSite.port;
  $('login').value            = gSite.login;
  $('password').value         = gSite.password;
  $('anonymous').checked      = gAnonymous;
  $('login').disabled         = gAnonymous;
  $('password').disabled      = gAnonymous;
  $('notes').value            = gSite.notes      || "";
  $('folder').value           = gSite.folder     || "";
  $('privatekey').value       = gSite.privatekey || "";

  gTunnels = [];
  for (var x = $('tunnels').getRowCount() - 1; x >= 0; --x) {
    $('tunnels').removeItemAt(x);
  }
  var tunnels = gSite.tunnels ? gSite.tunnels.split(",") : [];

  for (var x = 0; x < tunnels.length; ++x) {
    $('tunnels').appendItem(tunnels[x], tunnels[x]);
    gTunnels.push(tunnels[x]);
  }

  gOrigSite = gSite.account ? new cloneObject(site) : null;

  if (!$('account').value) {
    gAutoAccount = true;
  }

  if (gSite.account) {
    $('accountManager').getButton("extra2").label = gStrbundle.getString("delete");
    $('accountManager').getButton("extra2").setAttribute("onclick", "doDelete()");
    $('accountManager').getButton("extra2").collapsed = false;
  } else {
    $('accountManager').getButton("extra2").collapsed = true;
  }

  $('accountManager').getButton("accept").focus();
}

function createFolders() {
  var folders = new Array();

  for (var x = 0; x < gSiteManager.length; ++x) {
    var found = false;
    gSiteManager[x].folder = gSiteManager[x].folder || "";

    for (var y = 0; y < folders.length; ++y) {
      if (gSiteManager[x].folder == folders[y]) {
        found = true;
        break;
      }
    }

    if (!found && gSiteManager[x].folder != "") {
      folders.push(gSiteManager[x].folder);
    }
  }

  folders.sort();

  for (var x = 0; x < folders.length; ++x) {
    $('folder').appendItem(folders[x], folders[x]);
  }
}

function autoAccount() {
  if (gAutoAccount) {
    $('account').value = $('host').value;
  }
}

function autoAccountDisable() {
  gAutoAccount = false;
}

function anonymousChange() {
  gAnonymous             = !gAnonymous;
  $('login').disabled    =  gAnonymous;
  $('password').disabled =  gAnonymous;
  $('login').value       =  gAnonymous ? "anonymous"           : "";
  $('password').value    =  gAnonymous ? "firessh@example.com" : "";
  $('privatekey').value  =  "";
}

function privateKeyBrowse() {
  var nsIFilePicker   = Components.interfaces.nsIFilePicker;
  var fp              = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.init(window, null, nsIFilePicker.modeOpen);

  if (getPlatform() != 'windows') {
    fp.displayDirectory = localFile.init("~/.ssh");
  }

  var res = fp.show();

  if (res != nsIFilePicker.returnOK) {
    return;
  }

  $('privatekey').value = fp.file.path;
}

function addTunnel() {
  if (!$('dest').value) {
    return;
  }

  var tunnel = $('source').value + ':' + $('dest').value;

  for (var x = 0; x < $('tunnels').getRowCount(); ++x) {
    if ($('tunnels').getItemAtIndex(x).value == tunnel) {
      return;
    }
  }

  for (var x = 0; x < $('tunnels').getRowCount(); ++x) {
    if ($('tunnels').getItemAtIndex(x).value > tunnel) {
      $('tunnels').insertItemAt(x, tunnel, tunnel);
      $('tunnels').ensureIndexIsVisible(x);
      $('tunnels').selectedIndex = x;
      gTunnels.splice(x, 0, tunnel);

      $('source').value = 0;
      $('dest').value = '';
      return;
    }
  }

  $('tunnels').appendItem(tunnel, tunnel);
  $('tunnels').ensureIndexIsVisible($('tunnels').getRowCount() - 1);
  $('tunnels').selectedIndex = $('tunnels').getRowCount() - 1;
  gTunnels.push(tunnel);

  $('source').value = 0;
  $('dest').value = '';
}

function removeTunnel() {
  if (!$('tunnels').selectedItem) {
    return;
  }

  var value = $('tunnels').selectedItem.value;
  $('tunnels').removeItemAt($('tunnels').getIndexOfItem($('tunnels').selectedItem));

  for (var x = 0; x < gTunnels.length; ++x) {
    if (gTunnels[x] == value) {
      gTunnels.splice(x, 1);
      break;
    }
  }

  if ($('tunnels').getRowCount()) {
    $('tunnels').ensureIndexIsVisible(0);
    $('tunnels').selectedIndex = 0;
  }
}

function doDelete() {
  if (!confirm(gStrbundle.getFormattedString("confirmDelete", [gSite.account]))) {
    return;
  }

  deleteSite(gSite);
}

function doOk() {
  $('host').value = $('host').value.replace(/^http:\/*/, '');
  $('host').removeAttribute('missing');
  $('account').removeAttribute('missing');

  if ($('host').value == "") {
    $('tabbox').selectedIndex = 0;

    if ($('host').value == "") {
      $('host').setAttribute('missing', true);
      $('host').focus();
    }

    return false;
  }

  if ((gOrigSite && gOrigSite.account != $('account').value) || !gOrigSite) {
    for (var x = 0; x < gSiteManager.length; ++x) {
      if (gSiteManager[x].account == $('account').value) {
        $('account').setAttribute('missing', true);
        $('account').select();
        alert(gStrbundle.getString("dupAccount"));
        return false;
      }
    }
  }

  gSite.account          = $('account').value;
  gSite.folder           = $('folder').value;
  gSite.host             = $('host').value.trim();
  gSite.port             = $('port').value;
  gSite.login            = $('login').value.trim();
  gSite.password         = $('password').value;
  gSite.anonymous        = $('anonymous').checked;
	gSite.protocol         = 'ssh2';
  gSite.notes            = $('notes').value;
  gSite.privatekey       = $('privatekey').value;

  var tunnelSetting = "";
  for (var x = 0; x < gTunnels.length; ++x) {
    if (tunnelSetting) {
      tunnelSetting += "," + gTunnels[x];
    } else {
      tunnelSetting = gTunnels[x];
    }
  }
  gSite.tunnels = tunnelSetting;

  if (!gSite.account) {                         // if account is blank, temporary account
    gSite.account = 'FireSSH-temp';
    gCallback(gSite);

    return true;
  }

  if (!gOrigSite) {                             // new site
    gSiteManager.push(gSite);
  } else {                                      // or edited site
    for (var x = 0; x < gSiteManager.length; ++x) {
      if (gSiteManager[x].account == gOrigSite.account) {
        gSiteManager[x] = gSite;
        break;
      }
    }

    try {                                                            // delete old password from list
      var recordedHost = (gOrigSite.host.indexOf("ssh.") == 0 ? '' : "ssh.") + gOrigSite.host + ':' + gOrigSite.port;
      var logins       = gLoginManager.findLogins({}, recordedHost, "FireSSH", null);
      for (var x = 0; x < logins.length; ++x) {
        if (logins[x].username == gOrigSite.login) {
          gLoginManager.removeLogin(logins[x]);
        }
      }
    } catch (ex) { }
  }

  accountHelper(gSite);

  gCallback(gSite);

  return true;
}

function doCancel() {
  if (gCancelCallback) {
    gCancelCallback();
  }

  return true;
}

// [------------------------------ Site manager --------------------------------]

function createAccount() {
  if (!gSiteManager.length) {
    newSite();
  }
}

function newSite() {
  var site  = { account  : "", host     : "",   port             : 22,    login          : "",    password : "",     anonymous : false,
                notes    : "", folder   : "",   privatekey       : "",    protocol       : "",    tunnels  : "" };

  loadSite(site);
  gAutoAccount = true;
  $('host').focus();
}

function deleteSite(site) {
  for (var x = 0; x < gSiteManager.length; ++x) {                    // delete the account
    if (gSiteManager[x].account == site.account) {
      try {                                                          // delete password from list
        var recordedHost = (gSiteManager[x].host.indexOf("ssh.") == 0 ? '' : "ssh.") + gSiteManager[x].host + ':' + gSiteManager[x].port;
        var logins       = gLoginManager.findLogins({}, recordedHost, "FireSSH", null);
        for (var y = 0; y < logins.length; ++y) {
          if (logins[y].username == gSiteManager[x].login) {
            gLoginManager.removeLogin(logins[y]);
          }
        }
      } catch (ex) { }

      gSiteManager.splice(x, 1);

      break;
    }
  }

  saveSiteManager();
  loadSiteManager();

  onFolderChange();
}

function accountHelper(site) {
  if (gPasswordMode && site.password) {
    try {                                                            // save username & password
      var recordedHost = (site.host.indexOf("ssh.") == 0 ? '' : "ssh.") + site.host + ':' + site.port;
      var loginInfo    = new gLoginInfo(recordedHost, "FireSSH", null, site.login, site.password, "", "");
      gLoginManager.addLogin(loginInfo);
    } catch (ex) { }
  }

  var tempPassword = site.password;
  saveSiteManager();                                                 // save site manager
  loadSiteManager();

  for (var x = 0; x < gSiteManager.length; ++x) {                    // select the new site
    if (gSiteManager[x].account == site.account) {
      gAccountField.selectedIndex = x;
      gSiteManager[x].password    = tempPassword;                    // if "Remember Passwords" is off we have to remember what it is temporarily
      onAccountChange(site.account);
      break;
    }
  }
}

function onFolderChange(dontSelect, click) {
  if (click && gFolder == gFolderField.value) {
    return;
  }

  gAccountField.removeAllItems();

  if (!gSiteManager.length) {
    gAccountField.setAttribute("label", gStrbundle.getString("createAccount"));
  }

  gAccountField.appendItem(gStrbundle.getString("createAccount"), "");
  gAccountField.firstChild.lastChild.setAttribute("oncommand", "newSite()");

  if (gSiteManager.length) {
    gAccountField.firstChild.appendChild(document.createElement("menuseparator"));
  }

  for (var x = 0; x < gSiteManager.length; ++x) {
    if (gSiteManager[x].folder == gFolderField.value || (!gSiteManager[x].folder && gFolderField.value == "")) {
      gAccountField.appendItem(gSiteManager[x].account, gSiteManager[x].account);
    }
  }

  if (!dontSelect && gSiteManager.length) {
    gAccountField.selectedIndex = 2;
    onAccountChange();
  }

  gFolder = gFolderField.value;
}

function onAccountChange(account) {
  if (account != null) {
    if (account == "") {                // new site
      newSite();
      return;
    }

    var found = -1;

    for (var x = 0; x < gSiteManager.length; ++x) {
      if (gSiteManager[x].account == account) {
        found = x;
        break;
      }
    }

    if (found == -1) {
      gFolderField.value = "";
      onFolderChange();
      return;
    }

    gFolderField.value  = gSiteManager[x].folder;
    onFolderChange(true);
    gAccountField.value = account;
  }

  var accountToLoad = gAccountField.value;

  for (var x = 0; x < gSiteManager.length; ++x) {                    // load up the new values into the global variables
    if (gSiteManager[x].account == accountToLoad) {
      loadSite(gSiteManager[x]);
      break;
    }
  }
}

function loadSiteManager(pruneTemp, importFile) {             // read gSiteManager data
  try {
    gFolderField.removeAllItems();

    readPreferences();
    gAccount = "";

    var file;
    if (importFile) {
      file = importFile;
    } else {
      file = gProfileDir.clone();
      file.append("fireSSHsites.dat");
    }

    var folders = new Array();
    if (!file.exists() && !importFile) {
      gSiteManager = new Array();
    } else if (file.exists()) {
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

      if (importFile) {
        try {
          var tempSiteManager = jsonParseWithToSourceConversion(siteData);
        } catch (ex) {
          alert(gStrbundle.getString("badImport"));
          return;
        }

        var passCheck = false;
        var toUTF8    = Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService(Components.interfaces.nsIUTF8ConverterService);
        var key;
        var cipherType = "arc4";
        for (var x = 0; x < tempSiteManager.length; ++x) {
          if (tempSiteManager[x].passcheck) {
            passCheck = true;
            cipherType = tempSiteManager[x].cipher || "arc4";
            var passwordObject       = new Object();
            passwordObject.returnVal = false;

            window.openDialog("chrome://firessh/content/password2.xul", "password", "chrome,modal,dialog,resizable,centerscreen", passwordObject);

            if (passwordObject.returnVal) {
              key = passwordObject.password;
            } else {
              return;
            }

            key = key ? key : "";
            var cipher = cipherType == "arc4" ? new kryptos.cipher.ARC4(key) : new kryptos.cipher.Blowfish(key, 2, "");
            if (cipher.decrypt(tempSiteManager[x].password).replace(/\0/g, '') != "check123") {
              alert(gStrbundle.getString("badPassword"));
              return;
            }
            break;
          }
        }

        for (var x = 0; x < tempSiteManager.length; ++x) {
          if (tempSiteManager[x].passcheck) {
            continue;
          }

          var found   = true;
          var count   = 0;
          var skip    = true;
          var account = tempSiteManager[x].account;

          while (found) {
            found = false;

            for (var y = 0; y < gSiteManager.length; ++y) {
              if (gSiteManager[y].account == account) {
                found = true;

                for (var i in gSiteManager[y]) {                         // if it's the exact same object skip it
                  if (i != "password" && gSiteManager[y][i] != tempSiteManager[x][i]) {
                    skip = false;
                    break;
                  }
                }

                if (skip) {
                  break;
                }

                ++count;
                account = tempSiteManager[x].account + '-' + count.toString();
                break;
              }
            }

            if (skip) {
              break;
            }
          }

          if (skip && found) {
            continue;
          }

          if (passCheck) {
            var cipher = cipherType == "arc4" ? new kryptos.cipher.ARC4(key) : new kryptos.cipher.Blowfish(key, 2, "");
            tempSiteManager[x].password = cipher.decrypt(tempSiteManager[x].password).replace(/\0/g, '');

            try {
              tempSiteManager[x].password = toUTF8.convertStringToUTF8(tempSiteManager[x].password, "UTF-8", 1);
            } catch (ex) {
              alert(ex);
            }
          }

          if (gPasswordMode && tempSiteManager[x].password) {
            try {                                                    // save username & password
              var recordedHost = (tempSiteManager[x].host.indexOf("ssh.") == 0 ? '' : "ssh.") + tempSiteManager[x].host + ':' + tempSiteManager[x].port;
              var loginInfo    = new gLoginInfo(recordedHost, "FireSSH", null, tempSiteManager[x].login, tempSiteManager[x].password, "", "");
              gLoginManager.addLogin(loginInfo);
            } catch (ex) { }
          }

          tempSiteManager[x].account = account;
          gSiteManager.push(tempSiteManager[x]);
        }
      } else {
        gSiteManager = jsonParseWithToSourceConversion(siteData);
      }

      getPasswords();

      if (pruneTemp) {
        for (var x = gSiteManager.length - 1; x >= 0; --x) {
          if (gSiteManager[x].temporary) {
            gSiteManager.splice(x, 1);
          }
        }
      }

      for (var x = 0; x < gSiteManager.length; ++x) {
        var found = false;
        gSiteManager[x].folder   = gSiteManager[x].folder || "";

        for (var y = 0; y < folders.length; ++y) {
          if (gSiteManager[x].folder == folders[y]) {
            found = true;
            break;
          }
        }

        if (!found) {
          folders.push(gSiteManager[x].folder);
        }
      }

      folders.sort();

      for (var x = 0; x < folders.length; ++x) {
        gFolderField.appendItem(folders[x] ? folders[x] : gStrbundle.getString("noFolder"), folders[x]);
      }
    }

    if (!folders.length) {
      gFolderField.appendItem(gStrbundle.getString("noFolder"), "");
    }

    gFolderField.selectedIndex = 0;
    $('folderItem').collapsed = !folders.length || (folders.length == 1 && folders[0] == "");

    if (gSiteManager.length) {
      gAccountField.setAttribute("label", gStrbundle.getString("chooseAccount"));
    } else {
      gAccountField.setAttribute("label", gStrbundle.getString("createAccount"));
    }
  } catch (ex) {
    alert(ex);
  }
}

function saveSiteManager(exportFile) {
  try {                                                              // write gSiteManager out to disk
    var tempSiteManagerArray = new Array();

    for (var x = 0; x < gSiteManager.length; ++x) {
      tempSiteManagerArray.push(new cloneObject(gSiteManager[x]));
    }

    var key;
    if (exportFile) {
      var passwordObject       = new Object();
      passwordObject.returnVal = false;

      window.openDialog("chrome://firessh/content/password2.xul", "password", "chrome,modal,dialog,resizable,centerscreen", passwordObject);

      if (passwordObject.returnVal) {
        key = passwordObject.password;
      } else {
        return;
      }

      key = key ? key : "";
      tempSiteManagerArray.push({ account: "a", passcheck: "check123", cipher: "blowfish", password: "check123" });
    }

    var fromUTF8     = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].getService(Components.interfaces.nsIScriptableUnicodeConverter);
    fromUTF8.charset = "UTF-8";
    for (var x = 0; x < tempSiteManagerArray.length; ++x) {          // we don't save out the passwords, those are saved in the passwordmanager
      if (exportFile) {
        try {
          tempSiteManagerArray[x].password = fromUTF8.ConvertFromUnicode(tempSiteManagerArray[x].password) + fromUTF8.Finish();
        } catch (ex) {
          alert(ex);
        }

        var cipher = new kryptos.cipher.Blowfish(key, 2, "");
        tempSiteManagerArray[x].password = cipher.encrypt(tempSiteManagerArray[x].password);
      } else {
        tempSiteManagerArray[x].password = "";
      }
    }

    var file;
    if (exportFile) {
      file = exportFile;
    } else {
      file = gProfileDir.clone();
      file.append("fireSSHsites.dat");
    }

    var foutstream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
    foutstream.init(file, 0x04 | 0x08 | 0x20, 0644, 0);
    tempSiteManagerArray.sort(compareAccount);
    var data = JSON.stringify(tempSiteManagerArray);
    var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                createInstance(Components.interfaces.nsIConverterOutputStream);
    converter.init(foutstream, "UTF-8", 0, 0);
    converter.writeString(data);
    converter.close();
  } catch (ex) {
    alert(ex);
  }
}

function importSites() {
  var nsIFilePicker   = Components.interfaces.nsIFilePicker;
  var fp              = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.defaultExtension = "dat";
  fp.appendFilter("FireSSH (*.dat)", "*.dat");
  fp.init(window, null, nsIFilePicker.modeOpen);
  var res = fp.show();

  if (res != nsIFilePicker.returnOK) {
    return;
  }

  var tempAccount = gAccountField.value;

  loadSiteManager(true, fp.file);
  saveSiteManager();                                                 // save site manager
  loadSiteManager();

  onAccountChange(tempAccount);                                      // select the new site
}


function exportSites() {
  var nsIFilePicker   = Components.interfaces.nsIFilePicker;
  var fp              = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  fp.defaultString    = "fireSSHsites.dat";
  fp.defaultExtension = "dat";
  fp.appendFilter("FireSSH (*.dat)", "*.dat");
  fp.init(window, null, nsIFilePicker.modeSave);
  var res = fp.show();

  if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace) {
    saveSiteManager(fp.file);
  }
}

function compareAccount(a, b) {
  if (a.account.toLowerCase() < b.account.toLowerCase())
    return -1;
  if (a.account.toLowerCase() > b.account.toLowerCase())
    return 1;
  return 0;
}
