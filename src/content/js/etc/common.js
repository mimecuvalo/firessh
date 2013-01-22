Components = null;  // we're on Chrome, not Mozilla

function $(el) {
  return document.getElementById(el);
}

function inherit(derived, base) {
  for (property in base) {
    if (!derived[property]) {
      derived[property] = base[property];
    }
  }
}

_ = chrome.i18n.getMessage;
