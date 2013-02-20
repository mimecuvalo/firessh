function init() {
  $('cacheText').textContent = _('sftpCache').replace('%S', window.parent.gCacheKey);
}

function cacheCancel() {
  window.parent.gCacheCallback();
}

function cacheNo() {
  window.parent.gCacheCallback('n');
}

function cacheYes() {
  window.parent.gCacheCallback('y');
}

document.body.onload = init;
$('cacheCancel').onclick = cacheCancel;
$('cacheNo').onclick = cacheNo;
$('cacheYes').onclick = cacheYes;
