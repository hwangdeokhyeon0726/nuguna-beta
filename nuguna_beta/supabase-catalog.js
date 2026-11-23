/* Read-only catalogue connection. Orders and accounts remain local beta data. */
(function(root){
'use strict';
const URL='https://elatrejbijybdppnozah.supabase.co/rest/v1/products?select=id,name,description,price,image_url,shipping_info&status=eq.approved&order=created_at.desc&limit=30';
const KEY='sb_publishable_CoB7V1yUa6pkO1AOqLdQfw_WhmXgQP1';
function text(tag,value,className){const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;}
function imageUrl(value){try{const u=new URLConstructor(value);return u.protocol==='https:'?u.href:null;}catch{return null;}}
const URLConstructor=root.URL;
async function load(){const host=document.getElementById('serverCatalog'),status=document.getElementById('serverCatalogStatus');if(!host||!status)return;status.textContent='서버 상품을 불러오는 중입니다.';host.replaceChildren();try{const response=await root.fetch(URL,{headers:{apikey:KEY,Authorization:'Bearer '+KEY},cache:'no-store'});if(!response.ok)throw new Error('상품 조회 실패');const rows=await response.json();if(!Array.isArray(rows))throw new Error('응답 형식 오류');if(!rows.length){status.textContent='서버에 공개된 승인 상품이 없습니다. 현재 아래의 기존 상품은 브라우저 시연 데이터입니다.';return;}status.textContent='Supabase에서 읽은 승인 상품입니다. 현재는 조회만 가능하며 주문과 링크는 연결되지 않았습니다.';for(const row of rows){const article=document.createElement('article');article.className='serverProduct';const url=imageUrl(row.image_url);if(url){const img=document.createElement('img');img.src=url;img.alt='';img.loading='lazy';article.append(img);}const body=document.createElement('div');body.append(text('h3',String(row.name||'이름 없는 상품')));if(row.description)body.append(text('p',String(row.description)));const price=Number(row.price);body.append(text('strong',Number.isFinite(price)?new Intl.NumberFormat('ko-KR').format(price)+'원':'가격 정보 없음'));if(row.shipping_info)body.append(text('p',String(row.shipping_info)));article.append(body);host.append(article);}}catch{status.textContent='서버 상품을 불러오지 못했습니다. 연결 상태를 확인해 주세요. 기존 시연 데이터는 그대로 유지됩니다.';}}
root.NugunaServerCatalog={load};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})(window);
