'use strict';
const request = require('request');
const r = require('readability-node');
const Readability = require("readability");
const jsdom = require('jsdom');
const tidy = require('htmltidy2').tidy;
const { JSDOM } = jsdom;
const Iconv  = require('iconv').Iconv;
const url = require("url");

var tidyopts =  {
  doctype: 'html5',
  hideComments: true, //  multi word options can use a hyphen or "camel case"
  indent: true,
  outputXml: true,
  // TidyEscapeScripts: true,
  escapeScripts: true,
}


var urljoin = function(base, href){
  var newurl = new url.URL(href, base);
  return newurl.toString();
};

var resolve_links = function(doc, tag, attr){
  var metas = doc.querySelectorAll(tag);
  metas.forEach(el => {
    el.setAttribute(attr, urljoin(uri, el.getAttribute(attr)) );
  });
}

var remove_scripts = function(doc){
  doc.querySelectorAll("script").forEach(el => {
    el.remove();
  });
};

// It seems that the document charset isn't detected correctly by JSDOM sometimes
var get_charset = function(doc){
  // use the default document encoding
  var enc = doc.characterSet || "UTF-8";
  var charsets = doc.querySelectorAll("meta[charset]");
  charsets.forEach(function(ch){
    enc = ch.getAttribute("charset");
  });
  // try the http-equiv header
  doc.querySelectorAll("meta[http-equiv=content-type]").forEach(function(el){
    var content = el.getAttribute("content");
    var newenc = /charset=(.*)/.exec(content);
    if(newenc) enc = newenc[1];

    // <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  });
  return enc;
};

var get_doc = function(src, uri){
  var make_doc = function(src, uri){
    var dom = new JSDOM(src,{
      url: uri,
      features: {
        FetchExternalResources: false,
        ProcessExternalResources: false
      }})
    return dom.window.document;
  };
  var doc = make_doc(src, uri);
  var charset = get_charset(doc);
  if(charset !=="UTF-8") {
    // for different charsets than utf-8, we must convert it to that
    // charset and parse again
    // console.log("We got charset", charset);
    var buffer = Buffer.from(src);
    var iconv = new Iconv(charset, "UTF-8");
    var newsrc  = iconv.convert(buffer).toString();
    return make_doc(newsrc, uri);
  }
};

// var uri = "https://therealmovement.wordpress.com/2018/01/07/notes-for-a-talk-on-communism-and-free-time/"
var uri = "https://zpravy.idnes.cz/youtube-alexej-navalny-google-video-volby-rusko-fuw-/zahranicni.aspx?c=A180909_082252_zahranicni_hell"
// var uri = "https://www.root.cz/clanky/muzeme-verit-prekladacum-projekty-resici-schema-duverive-duvery/"
request(uri, {encoding:null}, (err, res, src) =>{
  // var src = '';
  // res.on('data', function(d){ src += d; });
  // res.on('end', function(){
  // try{
  // tidy(src, tidyopts, function(err, tidysrc){
  //
  // }
  var doc = get_doc(src, uri);
  // convert relative urls to absolute ones
  resolve_links(doc, "a", "href");
  resolve_links(doc, "img", "src");
  remove_scripts(doc)
  // console.log(dom.serialize());
  // var article = new r.Readability(uri, doc).parse();
  var article = new Readability(doc).parse();
  console.log(article.title);
  console.log(article.byline);
  console.log(article.excerpt);

  // console.log(tidysrc)
  // console.log(article.content);
  tidy(article.content, tidyopts, function(err, html) {
    console.log(html);
    // console.log(charset);

    // 
  });
  // });
});
