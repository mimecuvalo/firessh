// Bite me, Chrome.  Why is this not automagic?

var i18ns = document.querySelectorAll('[i18n]');
for (var x = 0; x < i18ns.length; ++x) {
  i18ns[x].textContent = chrome.i18n.getMessage(i18ns[x].getAttribute('i18n'));
}
