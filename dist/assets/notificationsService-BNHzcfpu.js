import{c as n,h as i}from"./index-C_r-VHGD.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]],f=n("bell",o),c="notifications:received";function l(e){window.dispatchEvent(new CustomEvent(c,{detail:e}))}const g={getNotifications:e=>{const t=new URLSearchParams;return e!=null&&e.page&&t.set("page",String(e.page)),t.set("per_page",String((e==null?void 0:e.perPage)??50)),e!=null&&e.unreadOnly&&t.set("unread_only","1"),e!=null&&e.type&&t.set("type",e.type),i.get(`/notifications?${t}`)},markAsRead:e=>i.post(`/notifications/${e}/read`),markAllAsRead:()=>i.post("/notifications/read-all")};export{f as B,c as N,l as e,g as n};
