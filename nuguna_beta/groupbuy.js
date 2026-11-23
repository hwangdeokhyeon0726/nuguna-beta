/* Browser-only collective-purchase rules. No real payment or shared inventory. */
(function(root){'use strict';
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 function validate(c,price,stock){if(!c||!integer(c.price)||c.price<1||c.price>price)return '공동구매 가격은 1원 이상 일반 판매가 이하여야 합니다.';if(!integer(c.target)||c.target<1||!integer(c.quota)||c.quota<c.target)return '목표 수량과 배정 재고를 확인해 주세요.';if(stock===null||c.quota>stock)return '재고를 설정하고 배정 수량이 총 재고 이하인지 확인해 주세요.';if(!Number.isFinite(Date.parse(c.startAt))||!Number.isFinite(Date.parse(c.endAt))||Date.parse(c.startAt)>=Date.parse(c.endAt))return '시작·마감 일시를 확인해 주세요.';if(!integer(c.minSettlement))return '브랜드 희망 정산액을 확인해 주세요.';if(c.successPercent!=null&&(!integer(c.successPercent)||c.successPercent<30||c.successPercent>100))return '최소 성사 비율은 30~100%의 정수로 설정해 주세요.';if(c.finalizeMode!=null&&!['target','deadline'].includes(c.finalizeMode))return '공동구매 확정 시점을 확인해 주세요.';return '';}
 function validOrders(c,orders){return orders.filter(o=>o.campaignId===c.id&&o.purchaseMode==='group'&&o.groupState==='waiting'&&o.paid&&!['cancelled','refunded'].includes(o.status)&&o.review!=='fraud'&&o.dispute?.state!=='pending');}
 function count(c,orders){return Number.isSafeInteger(c.finalCount)?c.finalCount:validOrders(c,orders).reduce((a,o)=>a+(Number(o.qty)||0),0);}
 function phase(c,now){if(!c)return 'none';if(c.status!=='approved')return c.status;if(now<Date.parse(c.startAt))return 'scheduled';if(now>=Date.parse(c.endAt))return 'ended';return 'active';}
 function reserved(c,orders){return orders.filter(o=>o.campaignId===c.id&&o.purchaseMode==='group'&&o.groupState==='waiting'&&o.paid&&!['cancelled','refunded'].includes(o.status)).reduce((n,o)=>n+(Number(o.qty)||0),0);}
 function canJoin(c,orders,now,qty){return phase(c,now)==='active'&&Number.isSafeInteger(qty)&&qty>0&&reserved(c,orders)+qty<=c.quota;}
 function threshold(c){return Math.ceil(c.target*(c.successPercent??100)/100);}
 function decision(c,orders,now){if(!c||c.status!=='approved')return null;const n=count(c,orders);if(now>=Date.parse(c.endAt))return n>=threshold(c)?'succeeded':'failed';if(now>=Date.parse(c.startAt)&&c.finalizeMode==='target'&&n>=c.target)return 'succeeded';return null;}
 root.NugunaGroupBuy={validate,count,reserved,phase,canJoin,validOrders,threshold,decision};if(typeof module==='object'&&module.exports)module.exports=root.NugunaGroupBuy;
})(typeof window==='object'?window:globalThis);
