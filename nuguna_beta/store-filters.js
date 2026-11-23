/* Store filters: direct purchase and admin-designated negotiated offers. */
(function(root){'use strict';
function available(p){return p?.status==='active'&&Number.isFinite(Number(p.price))&&Number(p.price)>0;}
function discount(p){const list=Number(p?.listPrice),sale=Number(p?.price);return Number.isFinite(list)&&Number.isFinite(sale)&&list>sale&&sale>0?Math.round((list-sale)*100/list):null;}
function matches(p,filter,campaign,isActive,stock=null){if(!available(p))return false;switch(filter){case 'group':return !!campaign&&isActive;case 'normal':return stock!==0;case 'special':return p.specialSale===true;case 'drop':return !!campaign&&isActive&&campaign.exclusiveDemo===true;case 'all':return true;default:return false;}}
root.NugunaStoreFilters={available,discount,matches};if(typeof module==='object'&&module.exports)module.exports=root.NugunaStoreFilters;
})(typeof window==='object'?window:globalThis);
