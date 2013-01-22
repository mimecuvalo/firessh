//
// version.js by Frank Kohlhepp
// Copyright (c) 2011 - 2012 Frank Kohlhepp
// https://github.com/frankkohlhepp/version-js
// License: MIT-license
//
(function(){this.v=function(c){var b=c.match(/([0-9]+)(a|b)([0-9]+)$/);if(b){if(b[3].length>9){throw"exceededLimits"}c=c.replace(/(a|b)([0-9]+)$/,"."+(((b[2]==="a")?-1000000000:-2000000000)-Number(b[3])))}else{c+=".0"}var e=c.split(".");c="";for(var d=0;d<e.length;d++){var a=e[d].replace("-","");if(e[d]<0){c+="-"}if(a.length>10){throw"exceededLimits"}if(a.length<10){c+=new Array(11-a.length).join("0")}c+=a+"."}return c.substring(0,c.length-1)}}());