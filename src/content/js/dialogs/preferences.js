function readPreferences() {
  window.sizeToContent();
  proxyChange();
  timeoutChange();
  $('version').value = "FireSSH " + gVersion + "   ";

  var fontList = $('font');
  FontBuilder.buildFontList(null, 'monospace', fontList);
  var systemHasDefaultFont = false;
  for (var x = 0; x < fontList.itemCount; ++x) {
    if ($('fontpref').defaultValue == fontList.getItemAtIndex(x).value) {
      systemHasDefaultFont = true;
      break;
    }
  }
  if ($('fontpref').value == $('fontpref').defaultValue && !systemHasDefaultFont) {
    fontList.value = "Courier New";
  } else {
    fontList.value = $('fontpref').value;
  }
}

function proxyChange() {
  $('proxyhost').disabled      =  $('proxytype').value == "";
  $('proxyport').disabled      =  $('proxytype').value == "";
  $('proxyhostlabel').disabled =  $('proxytype').value == "";
  $('proxyportlabel').disabled =  $('proxytype').value == "";
}

function timeoutChange() {
  $('retrylabel').disabled     = !$('timeoutmode').checked;
  $('retry').disabled          = !$('timeoutmode').checked;
  $('attemptslabel').disabled  = !$('timeoutmode').checked;
  $('attempts').disabled       = !$('timeoutmode').checked;
}
