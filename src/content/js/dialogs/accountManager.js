var gSite;
var gSiteManager;
var gAutoAccount = false;
var gOrigSite;
var gAccountField;
var gKeyField;
var gCli = null;
var gConnection = null;

function init() {
  gAccountField = $('toolbar-account');
  gKeyField = $('identity');

  var callback = function() {
    gOrigSite = null;
    onAccountChange(gDefaultAccount);
  };

  loadSiteManager(callback);
}

function loadSite(site) {
  gSite = site;

  $('account').value          = gSite.account;
  $('host').value             = gSite.host;
  $('port').value             = gSite.port;
  $('login').value            = gSite.login;
  $('password').value         = gSite.password;
  $('notes').value            = gSite.notes      || "";
  gKeyField.value             = gSite.privatekey;

  gOrigSite = gSite.account ? new cloneObject(site) : null;

  if (!$('account').value) {
    gAutoAccount = true;
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

function doDelete() {
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
        return false;
      }
    }
  }

  gSite.account          = $('account').value;
  gSite.host             = $('host').value.trim();
  gSite.port             = $('port').value;
  gSite.login            = $('login').value.trim();
  gSite.password         = $('password').value;
	gSite.protocol         = 'ssh2';
  gSite.notes            = $('notes').value;
  gSite.privatekey       = $('identity').value;

  if (!gOrigSite) {                             // new site
    gSiteManager.push(gSite);
  } else {                                      // or edited site
    for (var x = 0; x < gSiteManager.length; ++x) {
      if (gSiteManager[x].account == gOrigSite.account) {
        gSiteManager[x] = gSite;
        break;
      }
    }
  }

  accountHelper(gSite);

  window.parent.gLoadUrl = "ssh://" + $('login').value + ':' + $('password').value + '@' + $('host').value + ':' + $('port').value;
  //window.parent.externalLink();
  window.parent.accountChangeHelper(gSite);
}

function doCancel() {
  window.close();
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
      gSiteManager.splice(x, 1);
      break;
    }
  }

  saveSiteManager();
  loadSiteManager();

  onFolderChange();
}

function accountHelper(site) {
  saveSiteManager();                                                 // save site manager

  var callback = function() {
    for (var x = 0; x < gSiteManager.length; ++x) {                    // select the new site
      if (gSiteManager[x].account == site.account) {
        gAccountField.selectedIndex = x;
        onAccountChange(site.account);
        break;
      }
    }
  };
  loadSiteManager(callback);
}

function onFolderChange(dontSelect, click) {
  while (gAccountField.firstChild) {
    gAccountField.removeChild(gAccountField.firstChild);
  }

  var option = document.createElement('option');
  option.id = 'default-account';
  option.textContent = chrome.i18n.getMessage("createAccount");
  option.value = '';
  option.onclick = newSite;
  gAccountField.appendChild(option);

  if (gSiteManager.length) {
    option.style.borderBottom = '1px solid #ccc';
  }

  for (var x = 0; x < gSiteManager.length; ++x) {
    var option = document.createElement('option');
    option.textContent = gSiteManager[x].account;
    option.value = gSiteManager[x].account;
    gAccountField.appendChild(option);
  }

  if (!dontSelect && gSiteManager.length) {
    gAccountField.selectedIndex = 2;
    onAccountChange();
  }
}

function onAccountChangeClick(event) {
  onAccountChange();
}

function onAccountChange(account) {
  updateKeyMenu();

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
      onFolderChange();
      return;
    }

    onFolderChange();
    gAccountField.value = account;
  }

  var accountToLoad = gAccountField.value;
  if (!accountToLoad) {                // new site
    newSite();
    return;
  }

  for (var x = 0; x < gSiteManager.length; ++x) {                    // load up the new values into the global variables
    if (gSiteManager[x].account == accountToLoad) {
      loadSite(gSiteManager[x]);
      break;
    }
  }
}

function loadSiteManager(callback) {             // read gSiteManager data
  readPreferences(false, function() {
    loadSiteManagerCallback(callback);
  });
}

function loadSiteManagerCallback(callback) {             // read gSiteManager data
  gAccount = "";

  if (gSiteManager.length) {
    $('default-account').textContent = chrome.i18n.getMessage("chooseAccount");
  } else {
    $('default-account').textContent = chrome.i18n.getMessage("createAccount");
  }

  gAccountField.value = '';

  if (callback) {
    callback();
  }
}

function saveSiteManager(exportFile) {
  var tempSiteManagerArray = new Array();

  for (var x = 0; x < gSiteManager.length; ++x) {
    tempSiteManagerArray.push(new cloneObject(gSiteManager[x]));
  }

  for (var x = 0; x < tempSiteManagerArray.length; ++x) {          // we don't save out the passwords, those are saved in the passwordmanager
    tempSiteManagerArray[x].password = "";
  }

  chrome.storage.local.set({"siteManager": JSON.stringify(tempSiteManagerArray)});
}

function compareAccount(a, b) {
  if (a.account.toLowerCase() < b.account.toLowerCase())
    return -1;
  if (a.account.toLowerCase() > b.account.toLowerCase())
    return 1;
  return 0;
}

function openMenu() {
  var advMenu = $('advanced-menu');
  advMenu.setAttribute('open', 'open');
  document.body.onclick = function(event) {
    var el = event.target;
    while (el) {
      if (el == advMenu) {
        return;
      }
      el = el.parentNode;
    }

    advMenu.removeAttribute('open');
  };
}

function tab() {
  $('maintab-lbl').removeAttribute('selected');
  $('advancedtab-lbl').removeAttribute('selected');
  $('maintab').removeAttribute('selected');
  $('advancedtab').removeAttribute('selected');

  this.setAttribute('selected', 'selected');
  $(this.id.split('-')[0]).setAttribute('selected', 'selected');
}

function showPreferences() {
  window.setTimeout(function() {
    var advMenu = $('advanced-menu');
    advMenu.removeAttribute('open');
  }, 0);

  var iframe = document.createElement('iframe');
  iframe.src = '../fancy-settings/source/index.html';
  iframe.id = 'options-iframe';

  var iframePopup = document.createElement('div');
  iframePopup.id = 'options-popup';
  iframePopup.appendChild(iframe);
  document.body.appendChild(iframePopup);

  var closeButton = document.createElement('a');
  closeButton.href = '#';
  closeButton.id = 'options-close-button';
  closeButton.innerHTML = '×';
  closeButton.onclick = function() {
    document.body.removeChild(iframePopup);
    document.body.removeChild(closeButton);
    return false;
  };
  document.body.appendChild(closeButton);
}

function importKey() {
  var reader = new FileReader();
  var file = $('import').files[0];
  reader.onload = function(event) {
    var contents = event.target.result;
    gKeys[file.name] = contents;
    chrome.storage.local.set({"keys": JSON.stringify(gKeys)});
    updateKeyMenu();
    gKeyField.value = file.name;
  };
  reader.readAsText(file);
}

function updateKeyMenu() {
  while (gKeyField.firstChild) {
    gKeyField.removeChild(gKeyField.firstChild);
  }

  var option = document.createElement('option');
  option.id = 'default-identity';
  option.value = '';
  gKeyField.appendChild(option);

  option.style.borderBottom = '1px solid #ccc';

  for (var keyName in gKeys) {
    var option = document.createElement('option');
    option.textContent = keyName;
    option.value = keyName;
    gKeyField.appendChild(option);
  }
}

document.body.onload = init;
$('connect').onclick = doOk;
$('delete').onclick = doDelete;
$('advanced-menu').onclick = openMenu;
$('prefbutton').onclick = showPreferences;
$('helpbutton').onclick = function() { window.open('http://firessh.net/help.html') };
$('maintab-lbl').onclick = tab;
$('advancedtab-lbl').onclick = tab;
$('host').onkeyup = autoAccount;
$('password').onkeyup = function() { if (event.keyCode == 13) doOk(); };
$('import').onchange = importKey;
$('account').onfocus = autoAccountDisable;
$('toolbar-account').onfocus = createAccount;
$('toolbar-account').onchange = onAccountChangeClick;
//$('cancel').onclick = doCancel;
