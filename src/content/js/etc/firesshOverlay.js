/* ideas for this bit of gpl'ed code came from ieview (http://ieview.mozdev.org)
 * and that team is... Paul Roub, Ted Mielczarek, and Fabricio Campos Zuardi
 * thanks to Scott Bentley for the suggestion
 */

function loadFireSSH() {
  var prefService    = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
  var prefSvc        = prefService.getBranch(null);

  var loadMode = 0;
  try {
    loadMode = prefSvc.getIntPref("extensions.firessh.loadmode");
  } catch (ex) {
    loadMode = 1;
  }

  if (loadMode == 1) {
    var theTab          = gBrowser.addTab('chrome://firessh/content/');
    theTab.label        = "FireSSH";
    gBrowser.selectedTab = theTab;
  } else if (loadMode == 2) {
    toOpenWindowByType('mozilla:firessh', 'chrome://firessh/content/');
  } else {
    var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
    var win = ww.getWindowByName("FireSSH", null);
    if (win) {
      var theTab          = win.gBrowser.addTab('chrome://firessh/content/');
      theTab.label        = "FireSSH";
      win.gBrowser.selectedTab = theTab;
      win.focus();
    } else {
      var sa = Components.classes["@mozilla.org/supports-array;1"].createInstance(Components.interfaces.nsISupportsArray);
      var wuri = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
      wuri.data = "chrome://firessh/content/";
      sa.AppendElement(wuri);
      var win = ww.openWindow(null, "chrome://browser/content/browser.xul", "FireSSH", null, sa);
    }
  }
}

function fireSSHInitListener(event) {
  // If 'Web Developer' menu is available (introduced in Firefox 6)
  // Remove the old entry in Tools menu.
  if (document.getElementById("menu_webDeveloper_firessh")) {
    var menuFiressh = document.getElementById("firesshtoolsmenu");
    if (menuFiressh) {
      menuFiressh.parentNode.removeChild(menuFiressh);
    }
  }
}

/*
function fireSSHContextListener(event) {
  if (!gContextMenu) {
    return;
  }

  var func = function() {
    var isFireSSH = !gContextMenu.onLink && gBrowser.currentURI.spec == "chrome://firessh/content/blank.html";

    var contextPaste = document.getElementById("context-paste");
    contextPaste.hidden = !isFireSSH;
    contextPaste.collapsed = false;
  }

  setTimeout(func, 100);
}*/

window.addEventListener("load",             fireSSHInitListener,        false);

