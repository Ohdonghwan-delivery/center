
(()=>{
'use strict';

const origin='https://deliverycenter.baemin.com';
const $=id=>document.getElementById(id);

const state=$('state');
const list=$('list');
const search=$('search');

let baeminWindow=null;
let last=0;
let allRows=[];

// 기사별 실적 항목
const labels=['완료','거절','취소','귀책'];

// 북마크 수집 데이터 기준
// 완료: 총 배달완료
// 거절: SLA 거절 합계
// 취소: SLA 배차취소 합계
// 귀책: SLA 배달취소(라이더 귀책) 합계 - 추후 확인
const metricIndices=[2,10,15,null];

function text(v){
  return v==null?'':String(v);
}

function metric(row,index){
  if(index==null)return '—';

  const value=text(row[index]).trim();

  return /^\d[\d,]*$/.test(value)?value:'—';
}

function showState(message,kind='wait'){
  if(state)state.textContent=message;

  const dot=$('status-dot');

  if(dot){
    dot.className='dot'+
      (kind==='ok'?' ok':
       kind==='stale'?' stale':'');
  }
}

function make(tag,className,content){
  const el=document.createElement(tag);

  if(className)el.className=className;
  if(content!==undefined)el.textContent=content;

  return el;
}

function render(){
  const term=search?.value.trim().toLocaleLowerCase('ko-KR')||'';

  const rows=allRows.filter(row=>
    Array.isArray(row)&&
    (!term||row.some(v=>
      text(v).toLocaleLowerCase('ko-KR').includes(term)
    ))
  );

  const visible=$('visible-count');

  if(visible){
    visible.textContent=rows.length+'명 표시';
  }

  list.replaceChildren();

  if(!rows.length){
    list.append(
      make(
        'div',
        'empty',
        allRows.length
          ?'검색 결과가 없습니다.'
          :'아직 수신된 기사 정보가 없습니다. 배민 비즈 로그인 후 연동 북마크를 실행하세요.'
      )
    );
    return;
  }

  for(const row of rows){

    const card=make('article','r');
    const head=make('div','r-head');

    const name=make(
      'div',
      'r-name',
      text(row[0])||'기사'
    );

    const statusText=text(row[1]).trim()||'상태 미확인';

    const status=make(
      'span',
      'r-status',
      statusText
    );

    head.append(name,status);
    card.append(head);

    // 완료 / 거절 / 취소 / 귀책 카드
    const grid=make('div','r-grid');

    for(let i=0;i<labels.length;i++){

      const cell=make('div','r-cell');

      const label=make(
        'small',
        '',
        labels[i]
      );

      const value=make(
        'strong',
        '',
        metric(row,metricIndices[i])
      );

      cell.append(label,value);
      grid.append(cell);
    }

    card.append(grid);

    // 원본 데이터 확인 기능
    const details=document.createElement('details');

    details.append(
      make('summary','','수집 원본 보기')
    );

    const raw=make(
      'div',
      'nums',
      row.map((v,i)=>`[${i}] ${text(v)}`).join(' | ')
    );

    details.append(raw);
    card.append(details);

    list.append(card);
  }
}

// 배민 비즈 로그인 버튼
$('open')?.addEventListener('click',()=>{

  baeminWindow=window.open(
    origin+'/delivery/history',
    '_blank'
  );

  showState(
    baeminWindow
      ?'배민 창이 열렸습니다. 로그인 후 기사 현황에서 북마크를 실행하세요.'
      :'새 탭이 차단됐습니다. Chrome의 팝업 허용 설정을 확인하세요.'
  );
});

// 기사 검색
search?.addEventListener('input',render);

// 검색 초기화
$('clear-search')?.addEventListener('click',()=>{

  if(!search)return;

  search.value='';
  render();
  search.focus();
});

// 북마크에서 전송한 기사 데이터 수신
window.addEventListener('message',event=>{

  if(event.origin!==origin)return;

  if(event.data?.type!=='KOREA_BAEMIN_RIDERS_V1')return;

  if(baeminWindow&&event.source!==baeminWindow)return;

  const rows=event.data.rows;

  if(!Array.isArray(rows)||rows.length>1000)return;

  allRows=rows.filter(Array.isArray);

  last=Date.now();

  $('count').textContent=String(allRows.length);

  $('time').textContent=
    new Date(last).toLocaleTimeString('ko-KR');

  if($('freshness')){
    $('freshness').textContent='정상';
  }

  showState(
    '수집 데이터 수신 중 · '+allRows.length+'명',
    'ok'
  );

  render();
});

// 데이터 수신 상태 확인
setInterval(()=>{

  if(!last)return;

  const age=Date.now()-last;

  if(age>15000){

    if($('freshness')){
      $('freshness').textContent='지연';
    }

    showState(
      '마지막 수신 후 15초 이상 경과 · 배민 탭/수집기를 확인하세요',
      'stale'
    );

  }else{

    if($('freshness')){
      $('freshness').textContent='정상';
    }
  }

},5000);

render();

})();
