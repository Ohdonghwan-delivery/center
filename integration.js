(()=>{'use strict';
const origin='https://deliverycenter.baemin.com';
const $=id=>document.getElementById(id);
const state=$('state'),list=$('list'),search=$('search');
let baeminWindow=null,last=0,allRows=[];
const labels=['완료','거절','취소','귀책'];
function text(v){return v==null?'':String(v)}
function showState(message,kind='wait') {state.textContent=message;$('status-dot').className='dot'+(kind==='ok'?' ok':kind==='stale'?' stale':'')}
function make(tag,className,content){const el=document.createElement(tag);if(className)el.className=className;if(content!==undefined)el.textContent=content;return el}
function render(){const term=search.value.trim().toLocaleLowerCase('ko-KR');const rows=allRows.filter(row=>Array.isArray(row)&&(!term||row.some(v=>text(v).toLocaleLowerCase('ko-KR').includes(term))));$('visible-count').textContent=rows.length+'명 표시';list.replaceChildren();if(!rows.length){list.append(make('div','empty',allRows.length?'검색 결과가 없습니다.':'아직 수신된 기사 정보가 없습니다. 배민 비즈 로그인 후 연동 북마크를 실행하세요.'));return}
for(const row of rows){const card=make('article','r');const head=make('div','r-head');const name=make('div','r-name',text(row[0])||'기사');const status=make('span','r-status','수신됨');head.append(name,status);card.append(head);
const grid=make('div','r-grid');for(const label of labels){const cell=make('div','r-cell');cell.append(make('small','',label),make('strong','','—'));grid.append(cell)}card.append(grid);
const details=document.createElement('details');details.append(make('summary','','수집 원본 보기'));const raw=make('div','nums',row.slice(1).map(text).join(' | '));details.append(raw);card.append(details);list.append(card)} }
$('open').addEventListener('click',()=>{baeminWindow=window.open(origin+'/delivery/history','_blank');showState(baeminWindow?'배민 창이 열렸습니다. 로그인 후 기사 현황에서 북마크를 실행하세요.':'새 탭이 차단됐습니다. Chrome의 팝업 허용 설정을 확인하세요.')});
search.addEventListener('input',render);$('clear-search').addEventListener('click',()=>{search.value='';render();search.focus()});
window.addEventListener('message',event=>{if(event.origin!==origin||event.data?.type!=='KOREA_BAEMIN_RIDERS_V1')return;if(baeminWindow&&event.source!==baeminWindow)return;const rows=event.data.rows;if(!Array.isArray(rows)||rows.length>1000)return;allRows=rows.filter(Array.isArray);last=Date.now();$('count').textContent=String(allRows.length);$('time').textContent=new Date(last).toLocaleTimeString('ko-KR');$('freshness').textContent='정상';showState('수집 데이터 수신 중 · '+allRows.length+'명','ok');render()});
setInterval(()=>{if(!last)return;const age=Date.now()-last;if(age>15000){$('freshness').textContent='지연';showState('마지막 수신 후 15초 이상 경과 · 배민 탭/수집기를 확인하세요','stale')}else{$('freshness').textContent='정상'}},5000);
render();
})();
