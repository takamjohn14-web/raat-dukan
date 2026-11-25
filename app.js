(function(){
var KEY="raatdukan.stores.v1";
var me={lat:27.0844,lng:93.6053,live:false},filter="open",stores=[],pin=null,editId=null;
var $=function(i){return document.getElementById(i)};
function num(v){var n=Number(v);return Number.isFinite(n)?n:NaN}
function validPoint(lat,lng){return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180}
function tm(v,d){v=String(v||"");return /^([01]\\d|2[0-3]):[0-5]\\d$/.test(v)?v:d}
function cph(v){return String(v||"").replace(/[^0-9+()\\- ]/g,"").trim().slice(0,20)}
var TYPES=["Grocery","Medical / Pharmacy","Petrol pump","Food / Dhaba","Other"];
function clean(s){if(!s||typeof s!=="object"||Array.isArray(s))return null;
var lat=num(s.lat),lng=num(s.lng),id=num(s.id),n=String(s.n||"").trim().slice(0,80),t=String(s.t||"");
if(!n||!validPoint(lat,lng)||!Number.isSafeInteger(id)||id<1)return null;
return {id:id,n:n,t:TYPES.indexOf(t)>=0?t:"Other",ph:cph(s.ph),ar:String(s.ar||"").slice(0,120),h24:s.h24===true,o:tm(s.o,"09:00"),c:tm(s.c,"23:59"),lat:lat,lng:lng}}
function load(){try{var a=JSON.parse(localStorage.getItem(KEY)||"[]");stores=Array.isArray(a)?a.map(clean).filter(Boolean).slice(0,300):[]}catch(e){stores=[]}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(stores));return true}catch(e){return false}}
function dist(a,b,c,d){var R=6371,r=Math.PI/180,x=(c-a)*r,y=(d-b)*r;
var h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)*Math.sin(y/2);
return 2*R*Math.asin(Math.sqrt(h))}
function mins(t){var p=t.split(":");return +p[0]*60+ +p[1]}
function isOpen(s){if(s.h24)return true;var n=new Date(),m=n.getHours()*60+n.getMinutes(),o=mins(s.o),c=mins(s.c);
return o<=c?(m>=o&&m<=c):(m>=o||m<=c)}
var curQ="24 hour store",lastSrc="",lastQ="",lastMapT=0,gmBuilt="",raf=0,resume=false;
function gmLinks(){
if(gmBuilt!==curQ){gmBuilt=curQ;
var q=[["🏪 24-hour store","24 hour store"],["💊 Pharmacy","pharmacy open now"],["⛽ Petrol pump","petrol pump"],["🍜 Food","restaurant open now"]];
$("gm").innerHTML=q.map(function(x){return '<button class="chip'+(x[1]===curQ?' on':'')+'" data-q="'+x[1]+'">'+x[0]+'</button>'}).join("")
+'<a class="btn gl" target="_blank" rel="noopener noreferrer" href="#">Open in Google Maps ↗</a>'}
$("gm").querySelector(".gl").href="https://www.google.com/maps/search/"+encodeURIComponent(curQ)+"/@"+me.lat+","+me.lng+",15z";
var s="https://maps.google.com/maps?q="+encodeURIComponent(curQ+" near "+me.lat.toFixed(3)+","+me.lng.toFixed(3))+"&z=15&output=embed",now=Date.now();
if(s!==lastSrc&&(!me.live||curQ!==lastQ||now-lastMapT>15000)){lastSrc=s;lastQ=curQ;lastMapT=now;$("map").src=s}}
function sched(){if(!raf)raf=requestAnimationFrame(function(){raf=0;render()})}
$("gm").onclick=function(e){var q=e.target.getAttribute("data-q");if(q){curQ=q;gmLinks()}};
function render(){
gmLinks();
var arr=stores.map(function(s){return Object.assign({d:dist(me.lat,me.lng,s.lat,s.lng),open:isOpen(s)},s)})
.sort(function(a,b){return a.d-b.d});
var f=arr.filter(function(s){return filter==="all"||(filter==="open"&&s.open)||(filter==="24h"&&s.h24)});
$("list").innerHTML=f.length?f.map(function(s){
var dd=s.d<1?Math.round(s.d*1000)+" m":s.d.toFixed(1)+" km";
return '<div class="item"><div class="row" style="justify-content:space-between"><span class="nm">'+esc(s.n)+'</span><span class="tag '+(s.open?"open":"closed")+'">'+(s.h24?"24 HRS":s.open?"OPEN":"CLOSED")+'</span></div>'
+'<div class="meta">'+esc(s.t)+(s.ar?" · "+esc(s.ar):"")+" · "+dd+" away"+(s.h24?"":" · "+esc(s.o)+"–"+esc(s.c))+'</div>'
+'<div class="row" style="margin-top:6px"><a class="btn" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/dir/?api=1&destination='+num(s.lat)+','+num(s.lng)+'">Directions</a>'
+(s.ph?'<a class="btn" href="tel:'+esc(s.ph)+'">Call</a>':"")
+'<button data-edit="'+num(s.id)+'">Edit</button><button data-del="'+num(s.id)+'">Remove</button></div></div>'}).join("")
:'<div class="empty">No stores to show yet. Use the Google Maps buttons above for live results, or add a store below.</div>';
radar(arr)}
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function radar(arr){
var far=Math.max(1,Math.ceil(Math.max.apply(null,arr.map(function(s){return s.d}).concat([0.5]))));
var R=140,g='<rect width="320" height="320" rx="14" fill="var(--acc2)"/>';
[1,.66,.33].forEach(function(k){g+='<circle cx="160" cy="160" r="'+R*k+'" fill="none" stroke="var(--bd)" stroke-dasharray="3 4"/>';
g+='<text x="'+(160+R*k*.72)+'" y="'+(160-R*k*.72)+'" font-size="9" fill="var(--mut)">'+(far*k).toFixed(1)+' km</text>'});
g+='<text x="160" y="22" text-anchor="middle" font-size="11" fill="var(--mut)">N</text>';
arr.forEach(function(s){
var dx=(s.lng-me.lng)*111.32*Math.cos(me.lat*Math.PI/180),dy=(s.lat-me.lat)*110.57;
var x=160+dx/far*R,y=160-dy/far*R;
g+='<circle cx="'+x+'" cy="'+y+'" r="7" fill="'+(s.open?"var(--acc)":"var(--mut)")+'"/><text x="'+(x>200?x-10:x+10)+'" y="'+(y+4)+'" text-anchor="'+(x>200?"end":"start")+'" font-size="10" fill="var(--ink)">'+esc(s.n.slice(0,16))+'</text>'});
g+='<circle cx="160" cy="160" r="8" fill="#2a6df4" stroke="#fff" stroke-width="2"/><text x="160" y="184" text-anchor="middle" font-size="10" fill="var(--ink)">You</text>';
$("radar").innerHTML=g}
function setLive(){
if(!navigator.geolocation){$("locst").textContent="Live location is not supported on this device.";return}
$("locst").textContent="Requesting your location once…";
navigator.geolocation.getCurrentPosition(function(p){
var lat=p.coords.latitude,lng=p.coords.longitude;
if(!validPoint(lat,lng)){$("locst").textContent="Invalid coordinates received.";return}
me={lat:lat,lng:lng,live:true};
$("locst").textContent="One-time location received. Your location is not continuously tracked.";
render()},
function(e){$("locst").textContent="Could not get location ("+e.message+"). Allow location access, or pick your city.";},
{enableHighAccuracy:false,maximumAge:60000,timeout:15000})}
$("live").onclick=setLive;
$("city").onchange=function(){var p=this.value.split(",");me={lat:+p[0],lng:+p[1],live:false};
$("locst").textContent="Using approximate city centre.";render()};
document.querySelectorAll(".chip[data-f]").forEach(function(b){b.onclick=function(){
document.querySelectorAll(".chip[data-f]").forEach(function(x){x.classList.remove("on")});b.classList.add("on");filter=b.dataset.f;render()}});
$("here").onclick=function(){
if(!navigator.geolocation){$("addst").textContent="Location not supported.";return}
navigator.geolocation.getCurrentPosition(function(p){if(!validPoint(p.coords.latitude,p.coords.longitude)){$("addst").textContent="Invalid coordinates received.";return}pin={lat:p.coords.latitude,lng:p.coords.longitude};
$("addst").textContent="Location captured for this store."},function(){$("addst").textContent="Could not get location."},{enableHighAccuracy:true,timeout:15000})};
$("add").onclick=function(){
var n=$("n").value.trim().slice(0,80);
if(!n){$("addst").textContent="Please enter a store name.";return}
var cur=editId?stores.filter(function(s){return s.id===editId})[0]:null;
var at=pin||(cur?{lat:cur.lat,lng:cur.lng}:null)||(me.live?{lat:me.lat,lng:me.lng}:null);
if(at&&!validPoint(num(at.lat),num(at.lng))){$("addst").textContent="Invalid store location.";return}
if(!at){$("addst").textContent="Tap “Store is where I am now” first, so the store has a location.";return}
if(!cur&&stores.length>=300){$("addst").textContent="Store limit reached on this device.";return}
var rec={n:n,t:$("t").value,ph:cph($("ph").value),ar:$("ar").value.trim().slice(0,120),h24:$("h24").checked,o:tm($("o").value,"09:00"),c:tm($("c").value,"23:59"),lat:at.lat,lng:at.lng};
if(cur){Object.assign(cur,rec)}else{rec.id=Date.now();while(stores.some(function(x){return x.id===rec.id}))rec.id++;stores.push(rec)}
var ok=save();pin=null;editId=null;$("add").textContent="Add store";$("h24").checked=false;$("n").value="";$("ph").value="";$("ar").value="";$("addst").textContent=ok?(cur?"Store updated.":"Store added."):"Could not save on this device (storage full or blocked).";render()};
$("list").onclick=function(e){var d=e.target.getAttribute("data-del"),ed=e.target.getAttribute("data-edit");
if(d){if(!confirm("Remove this store?"))return;stores=stores.filter(function(s){return String(s.id)!==d});if(String(editId)===d){editId=null;$("add").textContent="Add store"}save();render();return}
if(ed){var s=stores.filter(function(x){return String(x.id)===ed})[0];if(!s)return;
$("n").value=s.n;$("t").value=s.t;$("ph").value=s.ph||"";$("ar").value=s.ar||"";$("h24").checked=!!s.h24;$("o").value=s.o;$("c").value=s.c;
editId=s.id;pin=null;$("add").textContent="Save changes";
$("addst").textContent="Editing “"+s.n+"”. Tap “Store is where I am now” only if you want to change its location.";
$("n").scrollIntoView({behavior:"smooth",block:"center"})}};
setInterval(function(){if(!document.hidden)render()},60000);
document.addEventListener("visibilitychange",function(){if(!document.hidden)render()});
load();render();
})();