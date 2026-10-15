
(() => {
  'use strict';

  const origin = 'https://deliverycenter.baemin.com';
  const $ = id => document.getElementById(id);

  const state = $('state');
  const list = $('list');
  const search = $('search');

  let baeminWindow = null;
  let last = 0;
  let allRows = [];

  // 배민 원본 데이터의 실적 합계 열
  // 완료, SLA 거절, SLA 배차취소, 라이더 귀책 취소
  const labels = ['완료', '거절', '배차취소', '기사귀책'];
  const metricIndices = [2, 10, 14, 18];

  const totalIds = [
    'total-completed',
    'total-rejected',
    'total-canceled',
    'total-fault'
  ];

  function text(value) {
    return value == null ? '' : String(value);
  }

  function numberAt(row, index) {
    if (!Array.isArray(row) || index == null) {
      return null;
    }

    const raw = text(row[index])
      .replace(/,/g, '')
      .trim();

    if (!/^\d+$/.test(raw)) {
      return null;
    }

    const number = Number(raw);

    return Number.isSafeInteger(number) ? number : null;
  }

  function metric(row, index) {
    const value = numberAt(row, index);

    return value == null
      ? '—'
      : value.toLocaleString('ko-KR');
  }

  function showState(message, kind = 'wait') {
    if (state) {
      state.textContent = message;
    }

    const dot = $('status-dot');

    if (dot) {
      dot.className =
        'dot' +
        (kind === 'ok'
          ? ' ok'
          : kind === 'stale'
          ? ' stale'
          : '');
    }
  }

  function make(tag, className, content) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (content !== undefined) {
      element.textContent = content;
    }

    return element;
  }

  // 전체 기사 통합 실적
  function renderTotals() {
    metricIndices.forEach((index, i) => {
      let sum = 0;
      let validCount = 0;

      for (const row of allRows) {
        const value = numberAt(row, index);

        if (value !== null) {
          sum += value;
          validCount++;
        }
      }

      const element = $(totalIds[i]);

      if (element) {
        // 아직 수신되지 않았거나 데이터 열이 없는 경우
        // 잘못된 0을 표시하지 않도록 처리
        element.textContent =
          allRows.length > 0 &&
          validCount === allRows.length
            ? sum.toLocaleString('ko-KR')
            : '—';
      }
    });
  }

  // 기사별 실적 카드
  function render() {
    renderTotals();

    const term =
      search?.value.trim().toLocaleLowerCase('ko-KR') || '';

    const rows = allRows.filter(row =>
      Array.isArray(row) &&
      (
        !term ||
        row.some(value =>
          text(value)
            .toLocaleLowerCase('ko-KR')
            .includes(term)
        )
      )
    );

    const visible = $('visible-count');

    if (visible) {
      visible.textContent = rows.length + '명 표시';
    }

    if (!list) {
      return;
    }

    list.replaceChildren();

    if (!rows.length) {
      list.append(
        make(
          'div',
          'empty',
          allRows.length
            ? '검색 결과가 없습니다.'
            : '아직 수신된 기사 정보가 없습니다. 배민 비즈 로그인 후 연동 북마크를 실행하세요.'
        )
      );

      return;
    }

    for (const row of rows) {
      const card = make('article', 'r');

      const head = make('div', 'r-head');

      const name = make(
        'div',
        'r-name',
        text(row[0]) || '기사'
      );

      const statusText =
        text(row[1]).trim() || '상태 미확인';

      const status = make(
        'span',
        'r-status',
        statusText
      );

      head.append(name, status);
      card.append(head);

      const grid = make('div', 'r-grid');

      for (let i = 0; i < labels.length; i++) {
        const cell = make('div', 'r-cell');

        cell.append(
          make('small', '', labels[i]),
          make(
            'strong',
            '',
            metric(row, metricIndices[i])
          )
        );

        grid.append(cell);
      }

      card.append(grid);

      const details = document.createElement('details');

      details.append(
        make('summary', '', '수집 원본 보기')
      );

      const raw = make(
        'div',
        'nums',
        row
          .map((value, index) =>
            `[${index}] ${text(value)}`
          )
          .join(' | ')
      );

      details.append(raw);
      card.append(details);
      list.append(card);
    }
  }

  // 배민 비즈 로그인 창 열기
  $('open')?.addEventListener('click', () => {
    baeminWindow = window.open(
      origin + '/delivery/history',
      '_blank'
    );

    showState(
      baeminWindow
        ? '배민 창이 열렸습니다. 로그인 후 기사 현황에서 북마크를 실행하세요.'
        : '새 탭이 차단됐습니다. Chrome의 팝업 허용 설정을 확인하세요.'
    );
  });

  // 기사 검색
  search?.addEventListener('input', render);

  // 검색 초기화
  $('clear-search')?.addEventListener('click', () => {
    if (!search) return;

    search.value = '';
    render();
    search.focus();
  });

  // 배민 북마크에서 데이터 수신
  window.addEventListener('message', event => {
    if (
      event.origin !== origin ||
      event.data?.type !== 'KOREA_BAEMIN_RIDERS_V1'
    ) {
      return;
    }

    if (
      baeminWindow &&
      event.source !== baeminWindow
    ) {
      return;
    }

    const rows = event.data.rows;

    if (
      !Array.isArray(rows) ||
      rows.length > 1000
    ) {
      return;
    }

    allRows = rows.filter(Array.isArray);

    last = Date.now();

    const count = $('count');
    const time = $('time');
    const freshness = $('freshness');

    if (count) {
      count.textContent = String(allRows.length);
    }

    if (time) {
      time.textContent =
        new Date(last).toLocaleTimeString('ko-KR');
    }

    if (freshness) {
      freshness.textContent = '정상';
    }

    showState(
      '수집 데이터 수신 중 · ' +
      allRows.length +
      '명',
      'ok'
    );

    render();
  });

  // 마지막 수신 상태 확인
  setInterval(() => {
    if (!last) return;

    const age = Date.now() - last;

    if (age > 15000) {
      const freshness = $('freshness');

      if (freshness) {
        freshness.textContent = '지연';
      }

      showState(
        '마지막 수신 후 15초 이상 경과 · 배민 탭/수집기를 확인하세요',
        'stale'
      );
    } else {
      const freshness = $('freshness');

      if (freshness) {
        freshness.textContent = '정상';
      }
    }
  }, 5000);

  render();
})();
