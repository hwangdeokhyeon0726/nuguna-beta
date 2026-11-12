/* NUGUNA static-beta shipping helpers. All orders are fictional browser data. */
(function (root) {
  'use strict';
  const HEADERS = ['주문번호','주문일시','수취인 이름','수취인 연락처','우편번호','배송지 주소','상세주소','배송 요청사항','상품명','상품 옵션','주문 수량','결제금액','택배사','운송장번호'];
  const text = value => String(value == null ? '' : value).trim();
  const demo = order => !!order && order.guestDemo === true && order.guestIdentity === 'nuguna-fictitious-v1';
  const isCancelled = order => ['cancelled','refunded'].includes(order.status) || ['취소','반품'].includes(order.dispute?.kind) && order.dispute?.state === 'pending';
  const total = order => (Number(order.amount)||0)+(Number(order.shippingFee)||0);
  function stage(order) {
    if (isCancelled(order)) return 'cancelled';
    if (order.dispute?.state === 'pending' || (order.review && order.review !== 'clear')) return 'hold';
    if (order.deliveredAt || order.shippingState === 'delivered') return 'delivered';
    if (order.shippingState === 'shipping') return 'shipping';
    if (order.carrier && order.trackingNumber) return 'invoice';
    if (order.shippingState === 'preparing') return 'preparing';
    return 'paid';
  }
  const labels = {paid:'결제완료',preparing:'배송준비',invoice:'송장등록',shipping:'배송중',delivered:'배송완료',cancelled:'취소·반품',hold:'검토 보류'};
  function downloadRows(orders) {
    return orders.filter(demo).map(o => [
      text(o.id), text(o.createdAtTime || o.createdAt), '테스트 수령인', '010-0000-0000', '00000', '테스트 주소', '가상 상세주소', '없음', text(o.productName), text(o.optionName || '기본 옵션'), Number(o.qty)||0, total(o), text(o.carrier), text(o.trackingNumber)
    ]);
  }
  function makeWorkbook(orders) {
    if (!root.XLSX) throw new Error('엑셀 기능을 불러올 수 없습니다.');
    const rows = [HEADERS, ...downloadRows(orders)];
    const sheet = root.XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [36,24,18,20,13,26,24,20,25,18,12,16,20,24].map(wch => ({wch}));
    for(let row=1;row<rows.length;row++) for(const col of [0,3,4,12,13]) {
      const cell=root.XLSX.utils.encode_cell({r:row,c:col});
      sheet[cell]={t:'s',v:text(rows[row][col]),z:'@'};
    }
    const book=root.XLSX.utils.book_new();
    root.XLSX.utils.book_append_sheet(book,sheet,'주문');
    root.XLSX.utils.book_append_sheet(book,root.XLSX.utils.aoa_to_sheet([
      ['사용 안내'],['가상 주문 데이터입니다. 실제 고객 정보를 사용하지 마세요.'],['주문번호는 변경하지 마세요.'],['택배사와 운송장번호 두 칸을 모두 채워 저장한 다음 업로드하세요.'],['운송장번호는 숫자가 아니라 텍스트 형식으로 입력하세요.'],['운송장 등록은 배송중이나 배송완료를 뜻하지 않습니다.']
    ]),'안내');
    return book;
  }
  function parseWorkbook(buffer) {
    if(!root.XLSX) throw new Error('엑셀 기능을 불러올 수 없습니다.');
    if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<4||buffer.byteLength>2*1024*1024) throw new Error('2MB 이하의 .xlsx 파일을 선택해 주세요.');
    const signature=new Uint8Array(buffer,0,4);
    if(signature[0]!==0x50||signature[1]!==0x4b) throw new Error('올바른 .xlsx 파일이 아닙니다.');
    let book;try{book=root.XLSX.read(buffer,{type:'array',sheetRows:2002,cellNF:true,cellFormula:false,bookVBA:false});}catch{throw new Error('엑셀 파일을 읽을 수 없습니다.');}
    const ws=book.Sheets[book.SheetNames.includes('주문')?'주문':book.SheetNames[0]];
    if(!ws)throw new Error('주문 시트를 찾을 수 없습니다.');
    const rows=root.XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:'',blankrows:false});
    if(rows.length>2001||ws['!fullref']&&root.XLSX.utils.decode_range(ws['!fullref']).e.r>2000)throw new Error('한 번에 최대 2,000개 주문을 업로드할 수 있습니다.');
    if(rows.length<2)throw new Error('업로드할 주문 행이 없습니다.');
    const headers=rows[0].map(x=>text(x).replace(/^\ufeff/,''));
    const needed=['주문번호','택배사','운송장번호'];
    for(const h of needed)if(headers.filter(x=>x===h).length!==1)throw new Error(`${h} 열이 없거나 중복되었습니다.`);
    const indices=needed.map(h=>headers.indexOf(h));
    return rows.slice(1).map((row,i)=>({row:i+2,orderId:text(row[indices[0]]),carrier:text(row[indices[1]]),tracking:text(row[indices[2]])})).filter(r=>r.orderId||r.carrier||r.tracking);
  }
  function plan(rows, orders, brandId) {
    const result={total:rows.length,valid:[],duplicates:[],errors:[]}, seen=new Set();
    for(const r of rows){
      const item={...r};
      if(!r.orderId){item.reason='주문번호가 비어 있습니다.';result.errors.push(item);continue;}
      if(seen.has(r.orderId)){item.reason='파일에 주문번호가 중복되었습니다.';result.duplicates.push(item);continue;}
      seen.add(r.orderId);
      const o=orders.find(x=>x.id===r.orderId);
      if(!demo(o)||o.brandId!==brandId){item.reason='해당 브랜드의 주문을 찾을 수 없습니다.';result.errors.push(item);continue;}
      if(!r.carrier||!r.tracking){item.reason='택배사와 운송장번호를 모두 입력해 주세요.';result.errors.push(item);continue;}
      if(r.carrier.length>40||!/^[-A-Za-z0-9]{3,40}$/.test(r.tracking)){item.reason='택배사 또는 운송장번호 형식이 올바르지 않습니다.';result.errors.push(item);continue;}
      if(o.carrier||o.trackingNumber){if(text(o.carrier)===r.carrier&&text(o.trackingNumber)===r.tracking){item.reason='동일한 운송장이 이미 등록되었습니다.';result.duplicates.push(item);}else{item.reason='기존 운송장이 있어 변경할 수 없습니다. 관리자에게 문의해 주세요.';result.errors.push(item);}continue;}
      if(isCancelled(o)){item.reason='취소·반품 주문은 등록할 수 없습니다.';result.errors.push(item);continue;}
      if(stage(o)==='hold'){item.reason='분쟁 또는 부정거래 검토 중인 주문입니다.';result.errors.push(item);continue;}
      if(['shipping','delivered'].includes(stage(o))){item.reason='이미 배송이 진행된 주문입니다.';result.errors.push(item);continue;}
      result.valid.push(item);
    }
    return result;
  }
  root.NugunaShipping={HEADERS,stage,labels,demo,isCancelled,total,downloadRows,makeWorkbook,parseWorkbook,plan};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.NugunaShipping;
})(typeof window!=='undefined'?window:globalThis);
