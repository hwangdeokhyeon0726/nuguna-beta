/* Additional fictional products for the local browser demo. */
(function(root){'use strict';
const rows=[
 ['101','수분 젤 클렌저','뷰티',18900,'serum.webp'],['102','데일리 보습 토너','뷰티',22900,'serum.webp'],['103','소프트 크림','뷰티',25900,'serum.webp'],['104','모이스처 앰플','뷰티',31900,'serum.webp'],
 ['105','데일리 밸런스 케어 세트','웰니스',38900,'care.webp'],['106','릴랙스 케어 패키지','웰니스',42900,'care.webp'],['107','웰니스 스타터 키트','웰니스',35900,'care.webp'],['108','컴포트 케어 세트','웰니스',45900,'care.webp'],
 ['109','데일리 오브제 미니','라이프스타일',19900,'object.webp'],['110','홈 데스크 오브제','라이프스타일',27900,'object.webp'],['111','소프트 라이프 세트','라이프스타일',32900,'object.webp'],['112','홈 기프트 패키지','라이프스타일',39900,'object.webp']
];
function apply(db){if(!db||db.sampleCatalogExpansionV1||!Array.isArray(db.products)||!Array.isArray(db.accounts))return 0;const brand=db.accounts.find(a=>a.id==='B-101'&&a.role==='brand');if(!brand)return 0;let added=0;for(const [suffix,name,category,price,img] of rows){const id='P-NUGUNA-SAMPLE-'+suffix;if(db.products.some(p=>p.id===id))continue;db.products.push({id,brandId:brand.id,name:'[샘플] '+name,category,price,profit:Math.round(price*.05),rate:5,platform:13,img,desc:'시연용 가상 상품 · 대표 이미지는 예시입니다.',status:brand.status==='승인'?'active':'pending',sample:true,stock:100});added++;}db.sampleCatalogExpansionV1=true;return added;}
root.NugunaSampleCatalog={apply};if(typeof module==='object'&&module.exports)module.exports=root.NugunaSampleCatalog;
})(typeof window==='object'?window:globalThis);
