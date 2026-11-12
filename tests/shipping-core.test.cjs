const test = require('node:test');
const assert = require('node:assert/strict');
global.XLSX = require('../nuguna_beta/vendor/xlsx.full.min.js');
const S = require('../nuguna_beta/shipping.js');
const sample = (id, brandId='B-1', extra={}) => ({id,brandId,guestDemo:true,guestIdentity:'nuguna-fictitious-v1',status:'paid',shippingState:'paid',createdAt:'2026-11-13',productName:'테스트 상품',optionName:'100ml',qty:2,amount:12000,...extra});

test('a real xlsx workbook round-trips headers and tracking as text', () => {
  const book=S.makeWorkbook([sample('O-1')]);
  const sheet=book.Sheets['주문'];
  assert.deepEqual(S.HEADERS.slice(-2),['택배사','운송장번호']);
  assert.equal(sheet.N2.z,'@');
  sheet.M2={t:'s',v:'가상택배'};sheet.N2={t:'s',v:'001234567890',z:'@'};
  const bytes=XLSX.write(book,{type:'array',bookType:'xlsx'});
  const rows=S.parseWorkbook(bytes);
  assert.deepEqual(rows,[{row:2,orderId:'O-1',carrier:'가상택배',tracking:'001234567890'}]);
});

test('matching is brand-scoped, validates details and distinguishes duplicates', () => {
  const orders=[sample('O-1'),sample('O-2','B-2'),sample('O-3','B-1',{carrier:'가상택배',trackingNumber:'000321'}),sample('O-4','B-1',{status:'cancelled'}),sample('O-5','B-1',{shippingState:'shipping'})];
  const rows=[{row:2,orderId:'O-1',carrier:'가상택배',tracking:'001234'},{row:3,orderId:'O-1',carrier:'가상택배',tracking:'001234'},{row:4,orderId:'O-2',carrier:'가상택배',tracking:'001234'},{row:5,orderId:'O-3',carrier:'가상택배',tracking:'000321'},{row:6,orderId:'O-4',carrier:'가상택배',tracking:'123456'},{row:7,orderId:'O-5',carrier:'가상택배',tracking:'123456'},{row:8,orderId:'NOPE',carrier:'가상택배',tracking:'123456'},{row:9,orderId:'O-6',carrier:'',tracking:''}];
  const before=JSON.stringify(orders),plan=S.plan(rows,orders,'B-1');
  assert.equal(plan.total,8);assert.equal(plan.valid.length,1);assert.equal(plan.duplicates.length,2);assert.equal(plan.errors.length,5);assert.equal(JSON.stringify(orders),before);
});

test('label registration is distinct from shipping and delivery', () => {
  assert.equal(S.stage(sample('A','B-1',{carrier:'x'})), 'paid');
  assert.equal(S.stage(sample('A','B-1',{carrier:'택배',trackingNumber:'0001',shippingState:'invoice'})), 'invoice');
  assert.equal(S.stage(sample('A','B-1',{carrier:'택배',trackingNumber:'0001',shippingState:'shipping'})), 'shipping');
  assert.equal(S.stage(sample('A','B-1',{deliveredAt:'2026-11-13'})), 'delivered');
  assert.equal(S.stage(sample('A','B-1',{dispute:{kind:'반품',state:'pending'}})), 'cancelled');
  assert.equal(S.stage(sample('A','B-1',{review:'pending'})), 'hold');
  assert.equal(S.stage(sample('A','B-1',{dispute:{kind:'교환',state:'pending'}})), 'hold');
});

test('invalid, oversized or wrong-header inputs are rejected', () => {
  assert.throws(()=>S.parseWorkbook(new Uint8Array([1,2,3,4]).buffer),/xlsx/);
  const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['not the header'],['x']]),'주문');
  assert.throws(()=>S.parseWorkbook(XLSX.write(book,{type:'array',bookType:'xlsx'})),/주문번호/);
  assert.throws(()=>S.parseWorkbook(new ArrayBuffer(2*1024*1024+1)),/2MB/);
});

test('exported product names are string cells, never formulas', () => {
  const book=S.makeWorkbook([sample('O-X','B-1',{productName:'=1+1'})]);
  const cell=book.Sheets['주문'].I2;
  assert.equal(cell.t,'s');
  assert.equal(cell.v,'=1+1');
  assert.equal(cell.f,undefined);
});

test('held orders cannot receive a tracking number and totals include shipping', () => {
  const order=sample('O-H','B-1',{review:'pending',shippingFee:2500});
  const plan=S.plan([{row:2,orderId:'O-H',carrier:'택배',tracking:'001234'}],[order],'B-1');
  assert.equal(plan.valid.length,0);
  assert.match(plan.errors[0].reason,/검토 중/);
  assert.equal(S.downloadRows([order])[0][11],14500);
});
