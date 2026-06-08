const RESULT_MARKS = ['◎', '○', '▲', '△', '×'];

export function renderSetupScreen({ state, config }) {
  const quickOptions = config.app.quickRunnerOptions
    .map((count) => {
      const selectedClass = count === state.runnerCount ? ' is-selected' : '';
      return `<button class="chip${selectedClass}" type="button" data-runner-quick="${count}" aria-pressed="${count === state.runnerCount}">${count}頭</button>`;
    })
    .join('');

  const favoritePicker = state.favoriteModeEnabled ? renderFavoritePicker(state.runnerCount, state.favoriteRunner) : '';
  const startDisabled = state.favoriteModeEnabled && !state.favoriteRunner;

  return `
    <section class="screen setup-screen">
      ${renderTitle(config)}
      ${renderNotice(state)}

      <section class="panel" aria-labelledby="runner-count-title">
        <h2 id="runner-count-title">出走頭数</h2>
        <div class="runner-control">
          <button class="square-button" type="button" data-runner-step="-1" aria-label="出走頭数を1頭減らす" ${state.runnerCount <= config.app.minRunners ? 'disabled' : ''}>−</button>
          <label class="runner-input-label">
            <span class="visually-hidden">出走頭数</span>
            <input class="runner-input" type="number" inputmode="numeric" min="${config.app.minRunners}" max="${config.app.maxRunners}" step="1" value="${state.runnerCount}" data-runner-input>
            <span>頭</span>
          </label>
          <button class="square-button" type="button" data-runner-step="1" aria-label="出走頭数を1頭増やす" ${state.runnerCount >= config.app.maxRunners ? 'disabled' : ''}>＋</button>
        </div>
        <div class="chip-row" aria-label="出走頭数のクイック選択">${quickOptions}</div>
      </section>

      <section class="panel" aria-labelledby="favorite-title">
        <div class="panel-heading">
          <h2 id="favorite-title">推し馬指定</h2>
          <label class="switch">
            <input type="checkbox" data-favorite-toggle ${state.favoriteModeEnabled ? 'checked' : ''}>
            <span>ON</span>
          </label>
        </div>
        <p class="subtle">注目している番号を1着に固定できます。</p>
        ${favoritePicker}
        <p class="caution">※ONの場合、選択した番号が1着になります。</p>
      </section>

      <button class="primary-button" type="button" data-start-race ${startDisabled ? 'disabled' : ''}>レースを開始する</button>
      ${startDisabled ? '<p class="inline-error">推し馬指定をONにした場合は、番号を1つ選択してください。</p>' : ''}
      ${renderPreviousResult(state.previousResult)}
      <p class="policy-note">本アプリは番号を使ったエンターテインメント型シミュレーターです。表示結果は実際のレース結果を保証しません。</p>
    </section>
  `;
}

export function renderRaceScreen({ state }) {
  const lanes = Array.from({ length: state.raceResult.runnerCount }, (_, index) => {
    const runner = index + 1;
    const isFavorite = state.raceResult.favoriteModeEnabled && runner === state.raceResult.favoriteRunner;

    return `
      <div class="race-lane" data-favorite="${isFavorite}" data-runner-lane="${runner}">
        <span class="lane-number">${runner}</span>
        <span class="horse-token" data-runner-token="${runner}" style="--progress: 5">
          ${renderHorseIllustration()}
        </span>
        <span class="lane-goal-number">${runner}</span>
      </div>
    `;
  }).join('');

  return `
    <section class="screen race-screen">
      <div class="race-topbar">
        <h1>レース開催中</h1>
        <button class="secondary-button compact" type="button" data-skip-race>結果を見る</button>
      </div>
      <div class="race-track" data-runner-count="${state.raceResult.runnerCount}">
        <div class="goal-line" aria-hidden="true">GOAL</div>
        ${lanes}
      </div>
      <section class="commentary-box" aria-live="polite">
        <p class="commentary-label">実況</p>
        <p data-commentary-text>各馬一斉にスタートしました！</p>
      </section>
    </section>
  `;
}

function renderHorseIllustration() {
  return `
    <img class="horse-illustration" src="./assets/images/horse-face.png?v=horse-face-png-20260608" alt="" aria-hidden="true" loading="eager" decoding="async">
  `;
}

export function renderResultScreen({ state, donationModel }) {
  const result = state.raceResult;
  const resultRows = result.topFive
    .map((runner, index) => `
      <li class="result-row place-${index + 1}">
        <span class="place">${index + 1}着</span>
        <span class="runner-result">${runner}番</span>
      </li>
    `)
    .join('');

  const marks = result.topFive
    .map((runner, index) => `<span class="memo-mark"><strong>${RESULT_MARKS[index]}</strong>${runner}</span>`)
    .join('');

  return `
    <section class="screen result-screen">
      <header class="result-header">
        <p class="small-label">レース結果</p>
        <h1>1着は ${result.topFive[0]}番</h1>
      </header>

      <ol class="result-list">${resultRows}</ol>

      <section class="memo-panel" aria-label="シミュレーション結果メモ">
        <p class="memo-title">シミュレーション結果メモ</p>
        <div class="memo-row">${marks}</div>
      </section>

      ${result.favoriteModeEnabled ? `<p class="favorite-result-note">推し馬指定モード: ${result.favoriteRunner}番。選択した番号を1着として表示しています。</p>` : ''}
      <p class="policy-note">表示結果は実際のレース結果を保証しません。</p>

      <div class="action-stack">
        <button class="primary-button" type="button" data-replay>もう一度レースをする</button>
        <button class="secondary-button" type="button" data-change-settings>頭数・推し馬を変更する</button>
      </div>

      ${renderDonationCard(donationModel)}
    </section>
  `;
}

function renderTitle(config) {
  return `
    <header class="app-title">
      <p class="small-label">レトロ競走シミュレーター</p>
      <h1>${escapeHtml(config.app.title)}</h1>
      <p>${escapeHtml(config.app.subtitle)}</p>
    </header>
  `;
}

function renderNotice(state) {
  if (!state.notice) {
    return '';
  }

  return `<p class="notice" role="alert">${escapeHtml(state.notice)}</p>`;
}

function renderFavoritePicker(runnerCount, favoriteRunner) {
  const buttons = Array.from({ length: runnerCount }, (_, index) => {
    const runner = index + 1;
    const selectedClass = runner === favoriteRunner ? ' is-selected' : '';
    return `<button class="runner-pick${selectedClass}" type="button" data-favorite-runner="${runner}" aria-pressed="${runner === favoriteRunner}">${runner}</button>`;
  }).join('');

  return `<div class="runner-grid" aria-label="推し馬番号">${buttons}</div>`;
}

function renderPreviousResult(previousResult) {
  if (!previousResult) {
    return '';
  }

  const runners = previousResult.topFive.map((runner) => `<span class="previous-runner">${escapeHtml(runner)}</span>`).join('');
  const modeLabel = previousResult.mode === 'favorite' ? `推し馬 ${previousResult.favoriteRunner}番` : '通常';

  return `
    <section class="panel previous-panel" aria-labelledby="previous-title">
      <h2 id="previous-title">前回の結果</h2>
      <div class="previous-runners">${runners}</div>
      <p>${escapeHtml(previousResult.runnerCount)}頭 / ${escapeHtml(modeLabel)} / ${escapeHtml(formatDateTime(previousResult.completedAt))}</p>
    </section>
  `;
}

function renderDonationCard(donationModel) {
  if (!donationModel) {
    return '';
  }

  const relAttribute = donationModel.rel ? ` rel="${escapeHtml(donationModel.rel)}"` : '';

  return `
    <section class="donation-card" aria-label="カンパ">
      <p>このゲームの運営を応援していただけると、今後の開発の励みになります。</p>
      <a class="donation-button" href="${escapeHtml(donationModel.url)}" target="${escapeHtml(donationModel.target)}"${relAttribute} data-donation-link>${escapeHtml(donationModel.buttonLabel)}</a>
      <p class="subtle">カンパの有無で抽選結果や機能は変わりません。</p>
    </section>
  `;
}

function formatDateTime(isoString) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
