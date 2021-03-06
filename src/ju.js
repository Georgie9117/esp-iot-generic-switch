function StringBuffer() {
	this.res = [];
}
StringBuffer.prototype = {
	toString : function() {
		return this.res.join('');
	},
	push : function(v) {
		if(v) this.res.push(v);
	},
	pushPadded : function(v, len, ch) {
		if(!ch) ch = '0';
		v = (v ? v.toString() : "");
		if(v.length < len) {
			for(var i = v.length; i < len; ++i) {
				this.push(ch);
			}
		}
		this.push(v);
	},
	pushTimestamp : function() {
		var d = new Date();
		var t = this;
		function p1(v, l, s) {
			t.pushPadded(v, l);
			t.push(s);
		}
		p1(d.getDate(), 2, '.');
		p1(d.getMonth() + 1, 2, '.');
		p1(d.getFullYear(), 4, ' ');
		p1(d.getHours(), 2, ':');
		p1(d.getMinutes(), 2, ':');
		p1(d.getSeconds(), 2, ':');
		p1(d.getMilliseconds(), 3);
	},
}

function getTimestamp() {
	var b = new StringBuffer();
	b.pushTimestamp();
	return b.toString();
}

function empty(s) {
	return (!s || s.length == 0);
}

function fixRN(s) {
	return s ? s.replace( /\r?\n/g, "\r\n" ) : s;
}

function createXmlHttp(handler) {
	var x = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
	x.onreadystatechange = function() {
		if(x.readyState == 4) {
			handler(x.responseText, x.status);
		}
	}
	return x;
}

function http(u, b, f) {
	if(empty(u) || !f) return false;
	b = fixRN(b);
	var q = createXmlHttp(function(t, s) {
		if(s == 200) {
			f(t, s);
		} else {
			f("" + s + ": " + t, s);
		}
	});
	q.open(b ? "POST" : "GET", u, true);
	try {
		q.send(b);
	} catch(e) {
		f(e, -1);
	}
}

function upload(n, b, f) {
	if(empty(n) || empty(b) || !f) return false;
	b = fixRN(b);
	var p = 0;
	var CHS = 512;
	function sCh() {
		var q = "/fSave?name=" + uri(n) + "&pos=" + p;
		var d = CHS;
		while(true) {
			if((p + d) >= b.length) {
				q += "&flush=1";
				break;
			} else {
				if(b.charAt(p + d - 1) == '\r') ++d;
				else break;
			}
		}
		return http(q, b.substr(p, d), function(re, s) {
			if(s == 200) {
				p += d;
				(p < b.length) ? sCh() : f(true);
			} else {
				confirm("Error when uploading " + n + ": " + re + ". Try again?") ? sCh() : f(false);
			}
		});
	};
	sCh();
}

dc = document;
function hT(v,t,a) {return "<"+ t + (a ? " " + a : "") + (v ? ">" + v + "</" + t + ">" : "/>");}
function hO(v) {return hT(v, "option") + "\n";}
function hArg(n,v) {return ((v != null) ? ' ' + n + '="' + v + '"' : '');}
function hB(v) {return hT(v, "b");}
function hTd(v, a) {return hT(v, "td", a);}
function hTr(v, a) {return hT(v, "tr", a) + "\n";}
function hInput(t,i,n,v,a){return hT(null, 'input', hArg('type', t) + hArg('id', i) + hArg('name', n) + hArg('value', v) + (a?" " + a:""));}
function hRadio(l,v,i,n,s,c) {return hInput('radio', i, n, v, hArg('onclick', c) + hArg('checked', (s?"checked":null))) + hT(l, "label", 'for="' + i + '"');}
function hInputH(i,n,v,a) {return hInput("hidden",i,n,v,a);}
function hInputB(i,n,v,a) {return hInput("button",i,n,v,a);}
function hInputC(i,n,v,a) {return hInput("checkbox",i,n,v,a);}
function hInputT(i,n,v,a) {return hInput("text",i,n,v,a);}
function hInputP(i,n,v,a) {return hInput("password",i,n,v,a);}
function hButton(t,l,n,v,a) {return hT(l, 'button', hArg('type', t) + hArg('value', v) + hArg('name', n) + (a?" " + a:""));}
function hButtonS(l,n,v) {return hButton('submit',l,n,v);}
function hFRow(l,c,h) {return hTr(hTd(hB(l)) + hTd(c) + (h?hTd(h):''));}
function ce(c, t) {
	var e = dc.createElement(t ? t : 'div');
	if(c) e.className = c;
	return e;
}
function ge(id) {return dc.getElementById(id);}
function gt(o, tag) {return o.getElementsByTagName(tag);}
function euri(v) {return encodeURIComponent(v);}
function duri(v) {return decodeURIComponent(v);}
function uri(v) {return euri(v).replace(/%20/g,'+');}
function escp(v) {return v.replace(/\\/g,'\\\\').replace(/\"/g,'\\\"');}

function getFormValue(e) {
	var t = null;
	if(e.length != null) t = e[0].type;
	if(!t) t = e.type;
	if(!t) return null;

	switch(t) {
	case 'radio':
		for(var i = 0; i < e.length; ++i) {
			if(e[i].checked) return e[i].value;
		}
		return null;
	case 'select-multiple':
		var r = [];
		for(var i = 0; i < e.length; ++i) {
			if(e[i].selected) r.push(e[i].value);
		}
		return r.join(',');
	case 'checkbox':
		return e.checked;
	default:
		return e.value;
	}
}

function getEncodeType(n) {
	if(n == 'l' || n == 'f') return 2;
	if(n == 'p' || n == 'i' || n == 'v' || n == 'u') return 0;
	return 1;
}

function getForm(f, m, eq) {
	var r = [];
	var n = false;
	function p(v) {r.push(v);}
	p('{');
	for(var i = 0; i < f.elements.length; ++i) {
		var e = f.elements[i];
		if(!e.name) continue;
		var v = getFormValue(e);
		if(m) v = m(f, e.name, v);
		if(!v) continue;
		if(n) p(',');
		p('"' + e.name + '"' + eq);
		if(v === true) {
			p(1);
		} else if(v === false) {
			p(0);
		} else if(typeof v.replace === 'undefined') {
		        p(v);
		} else {
			var t = getEncodeType(e.name);
			if(t > 0) {
				p('"' + (t > 1 ? euri(v) : escp(v)) + '"');
			} else {
				p(v);
			}
		}
		n = true;
	}
	p('}');
	return r.join("");
}

function getFormJson(f, m) {
	return getForm(f, m, ":");
}

function postForm(f, u, v, vv, r, h, m) {
	if(v) {
		if(!v(f, vv)) return false;
	}
	var d = getFormJson(f, m);
	http(u, d, function(re, s) {
		if(!empty(r)) {
			ge(r).value = re;
		}
		if(h) h(re, s);
	});
	return false;
}

