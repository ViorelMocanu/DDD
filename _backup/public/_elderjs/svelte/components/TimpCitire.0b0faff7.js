import{S as t,i as s,s as a,e as i,t as e,c as n,b as r,m as l,f as c,h as o,j as f,v as u}from"../index-1df284fa.js";function x(t){let s,a;return{c(){s=i("span"),a=e(t[0])},l(i){s=n(i,"SPAN",{});var e=r(s);a=l(e,t[0]),e.forEach(c)},m(t,i){o(t,s,i),f(s,a)},p:u,i:u,o:u,d(t){t&&c(s)}}}function p(t,s,a){let{textOriginal:i}=s;const e=i.trim().split(/\s+/).length,n=Math.ceil(e/225);return t.$$set=t=>{"textOriginal"in t&&a(1,i=t.textOriginal)},[n,i]}export default class extends t{constructor(t){super(),s(this,t,p,x,a,{textOriginal:1})}}