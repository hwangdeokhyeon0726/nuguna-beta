/* Professional group-purchase incentive: browser-local beta calculations only. */
(function(root){'use strict';
function valid(p){return p&&Number.isSafeInteger(p.level1Qty)&&p.level1Qty>0&&Number.isSafeInteger(p.level2Qty)&&p.level2Qty>p.level1Qty&&Number.isFinite(p.level1Rate)&&Number.isFinite(p.level2Rate)&&p.level1Rate>=5&&p.level2Rate>=p.level1Rate&&p.level2Rate<=13;}
function candidates(o,orders){return orders.filter(x=>x.campaignId===o.campaignId&&x.sellerId===o.sellerId&&x.referralType==='direct'&&x.proPolicy);}
function excluded(o){return ['cancelled','refunded'].includes(o.status)||o.review==='fraud'||o.selfReferral||!o.sellerId;}
function units(o){if(excluded(o)||!Number.isFinite(o.unitPrice)||o.unitPrice<=0)return 0;return Math.max(0,Math.min(o.qty,Math.floor((o.amount-(o.refundAmount||0))/o.unitPrice)));}
function volume(o,orders,recognized){return candidates(o,orders).filter(x=>recognized(x)).reduce((sum,x)=>sum+units(x),0);}
function rate(o,orders,recognized){if(!valid(o.proPolicy))return null;const n=volume(o,orders,recognized),p=o.proPolicy;return n>=p.level2Qty?p.level2Rate:n>=p.level1Qty?p.level1Rate:5;}
function ready(o,orders,recognized){return candidates(o,orders).every(x=>excluded(x)||recognized(x));}
root.NugunaProIncentive={valid,units,volume,rate,ready};if(typeof module==='object'&&module.exports)module.exports=root.NugunaProIncentive;
})(typeof window==='object'?window:globalThis);
