function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(text) {
  return String(text ?? "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[\\/?#[\]@!$&'()*+,;:=]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function withFallback(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatDate(value) {
  if (!value) return "날짜 미입력";
  const parts = String(value).split("-");
  if (parts.length !== 3) return String(value);
  return `${Number(parts[0])}년 ${Number(parts[1])}월 ${Number(parts[2])}일`;
}

function nl2br(text) {
  return escapeHtml(text).replaceAll("\n", "<br>");
}

function renderText(value, fallback) {
  return nl2br(withFallback(value, fallback));
}

function renderActivities(text) {
  const lines = String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return '<li class="placeholder">세부 활동을 입력하지 않았습니다.</li>';
  }

  return lines
    .map((line) => `<li><span class="bullet"></span><span>${escapeHtml(line)}</span></li>`)
    .join("");
}

export function normalizeFeedbackData(raw = {}) {
  const name = withFallback(raw.name, "학생");
  const slug = slugify(raw.slug) || `코딩쏙학원_${slugify(name)}_피드백`;

  return {
    slug,
    name,
    date: String(raw.date ?? "").trim(),
    learn: String(raw.learn ?? "").trim(),
    activities: String(raw.activities ?? ""),
    reaction: String(raw.reaction ?? "").trim(),
    progress: String(raw.progress ?? "").trim(),
    homework: String(raw.homework ?? "").trim(),
    next: String(raw.next ?? "").trim(),
    extra: String(raw.extra ?? "").trim()
  };
}

export function renderFeedbackPageHtml(raw = {}, options = {}) {
  const data = normalizeFeedbackData(raw);
  const logoSrc = options.logoSrc || "../logo.png";
  const displayDate = formatDate(data.date);
  const studentName = escapeHtml(withFallback(data.name, "학생"));
  const slug = escapeHtml(data.slug);
  const todayFocus = renderText(data.learn, "오늘 배운 내용을 입력하지 않았습니다.");
  const coverLead = `코딩쏙 학원입니다.<br><strong>${studentName} 학생</strong>의 오늘의 수업 피드백 안내드립니다.`;
  const coverSub = `${escapeHtml(displayDate)} 수업 내용을 다음 페이지에서 확인하실 수 있습니다.`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${slug}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Noto+Sans+KR:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #f4efe5;
      --bg-deep: #ece2d0;
      --panel: rgba(255, 252, 247, 0.84);
      --panel-strong: rgba(255,255,255,0.9);
      --ink: #163026;
      --ink-soft: #5e7569;
      --forest: #1f4838;
      --forest-deep: #10251d;
      --gold: #bc8a4d;
      --gold-soft: rgba(188, 138, 77, 0.18);
      --line: rgba(22, 48, 38, 0.1);
      --shadow: 0 28px 90px rgba(16, 37, 29, 0.18);
      --radius-xl: 34px;
      --radius-lg: 26px;
      --radius-md: 20px;
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }

    body {
      font-family: "Noto Sans KR", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(188, 138, 77, 0.26), transparent 30%),
        radial-gradient(circle at top right, rgba(31, 72, 56, 0.18), transparent 32%),
        linear-gradient(180deg, var(--bg-deep) 0%, var(--bg) 46%, #efe8dc 100%);
      overflow-x: hidden;
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px);
      background-size: 26px 26px;
      opacity: 0.18;
      mix-blend-mode: soft-light;
    }

    .shell {
      min-height: 100vh;
      padding: 24px 18px 40px;
    }

    .viewer-nav {
      position: sticky;
      top: 16px;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      max-width: 1020px;
      margin: 0 auto 18px;
      padding: 14px 16px;
      border-radius: 22px;
      background: rgba(255,252,247,0.7);
      border: 1px solid rgba(22, 48, 38, 0.08);
      backdrop-filter: blur(16px);
      box-shadow: 0 16px 44px rgba(16, 37, 29, 0.08);
    }

    .viewer-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      color: var(--ink-soft);
      font-size: 12px;
      font-weight: 700;
    }

    .page-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 92px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(31, 72, 56, 0.08);
      color: var(--forest);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    #page-caption {
      min-width: 0;
      line-height: 1.55;
    }

    .viewer-buttons {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    button {
      appearance: none;
      border: 1px solid rgba(31, 72, 56, 0.12);
      border-radius: 999px;
      padding: 12px 16px;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
      background: rgba(31, 72, 56, 0.08);
      color: var(--forest);
      transition: transform 0.18s ease, opacity 0.18s ease, background 0.18s ease;
    }

    button:hover { transform: translateY(-1px); }
    button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .sheet {
      position: relative;
      max-width: 1020px;
      margin: 0 auto;
      padding: clamp(24px, 3.8vw, 40px);
      border-radius: var(--radius-xl);
      background:
        linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,242,234,0.96));
      border: 1px solid rgba(22, 48, 38, 0.08);
      box-shadow: var(--shadow);
      overflow: hidden;
      isolation: isolate;
    }

    .sheet::before,
    .sheet::after {
      content: "";
      position: absolute;
      border-radius: 50%;
      z-index: -1;
    }

    .sheet::before {
      width: 360px;
      height: 360px;
      right: -150px;
      top: -150px;
      background: radial-gradient(circle, rgba(188, 138, 77, 0.24), transparent 70%);
    }

    .sheet::after {
      width: 420px;
      height: 420px;
      left: -210px;
      bottom: -220px;
      background: radial-gradient(circle, rgba(31, 72, 56, 0.16), transparent 72%);
    }

    .page { display: none; }
    .page.is-active { display: block; }

    .cover-page {
      min-height: 720px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cover-card {
      width: 100%;
      max-width: 820px;
      padding: clamp(30px, 5vw, 54px);
      border-radius: 38px;
      background:
        radial-gradient(circle at top, rgba(255,255,255,0.1), transparent 30%),
        linear-gradient(145deg, rgba(16, 37, 29, 0.98), rgba(31, 72, 56, 0.95));
      color: white;
      text-align: center;
      box-shadow: 0 34px 90px rgba(16, 37, 29, 0.26);
      position: relative;
      overflow: hidden;
    }

    .cover-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        repeating-linear-gradient(
          -35deg,
          rgba(255,255,255,0.05) 0 1px,
          transparent 1px 18px
        );
      opacity: 0.5;
      pointer-events: none;
    }

    .cover-card > * { position: relative; }

    .cover-logo-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }

    .cover-logo-shell {
      width: 168px;
      height: 168px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background:
        linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02));
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow:
        0 18px 46px rgba(0,0,0,0.18),
        inset 0 0 0 12px rgba(255,255,255,0.04);
      backdrop-filter: blur(8px);
    }

    .cover-logo {
      width: 104px;
      height: auto;
      filter: drop-shadow(0 16px 22px rgba(0,0,0,0.22));
    }

    .cover-kicker {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .cover-kicker::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f3cb8c, #c9954a);
      box-shadow: 0 0 0 6px rgba(243, 203, 140, 0.14);
    }

    .cover-title {
      margin: 24px 0 14px;
      font-family: "Cormorant Garamond", serif;
      font-size: clamp(48px, 7vw, 82px);
      line-height: 0.9;
      letter-spacing: -0.04em;
    }

    .cover-message {
      margin: 0 auto;
      max-width: 25ch;
      font-size: clamp(22px, 3vw, 36px);
      font-weight: 700;
      line-height: 1.46;
    }

    .cover-message strong {
      color: #f2cb90;
      font-weight: 800;
    }

    .cover-sub {
      margin: 20px auto 0;
      max-width: 48ch;
      color: rgba(255,255,255,0.72);
      font-size: 14px;
      line-height: 1.85;
    }

    .detail-head {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
      gap: 18px;
      margin-bottom: 18px;
    }

    .welcome-card {
      padding: 24px;
      border-radius: var(--radius-lg);
      background:
        linear-gradient(145deg, rgba(16, 37, 29, 0.98), rgba(31, 72, 56, 0.92));
      color: white;
      min-height: 260px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .welcome-card .eyebrow {
      width: fit-content;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .welcome-card h2 {
      margin: 20px 0 10px;
      font-family: "Cormorant Garamond", serif;
      font-size: clamp(38px, 4vw, 60px);
      line-height: 0.9;
      letter-spacing: -0.04em;
    }

    .welcome-card p {
      margin: 0;
      color: rgba(255,255,255,0.76);
      line-height: 1.8;
    }

    .summary-stack {
      display: grid;
      gap: 18px;
    }

    .summary-card,
    .focus-card,
    .meta-card,
    .section-card {
      padding: 20px;
      border-radius: var(--radius-lg);
      background: var(--panel);
      border: 1px solid rgba(22, 48, 38, 0.08);
    }

    .summary-card {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: start;
    }

    .meta-kicker {
      color: var(--forest);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .student-name {
      margin-top: 10px;
      color: var(--ink);
      font-family: "Cormorant Garamond", serif;
      font-size: clamp(32px, 4vw, 44px);
      line-height: 0.92;
      letter-spacing: -0.03em;
    }

    .student-name span {
      display: block;
      margin-top: 10px;
      color: var(--ink-soft);
      font-family: "Noto Sans KR", sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .date-chip {
      padding: 11px 14px;
      border-radius: 18px;
      background: var(--gold-soft);
      color: #6d4a1f;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .focus-card {
      background:
        linear-gradient(180deg, rgba(31, 72, 56, 0.07), rgba(31, 72, 56, 0.03));
    }

    .focus-card strong,
    .meta-card strong,
    .section-card strong {
      display: block;
      margin-bottom: 8px;
      color: var(--forest);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .focus-body,
    .meta-value,
    .body-text {
      margin: 0;
      color: var(--ink-soft);
      font-size: 14px;
      line-height: 1.85;
      white-space: pre-wrap;
      word-break: keep-all;
    }

    .meta-value {
      color: var(--ink);
      font-weight: 700;
      word-break: break-all;
    }

    .section-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .section-card {
      min-height: 196px;
      display: grid;
      gap: 14px;
      align-content: start;
    }

    .section-card.span-2 { grid-column: span 2; }

    .section-index {
      color: rgba(188, 138, 77, 0.9);
      font-family: "Cormorant Garamond", serif;
      font-size: 34px;
      line-height: 1;
    }

    .section-title {
      margin: 0;
      color: var(--ink);
      font-size: 21px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .activity-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 12px;
    }

    .activity-list li {
      display: grid;
      grid-template-columns: 14px 1fr;
      gap: 10px;
      color: var(--ink-soft);
      font-size: 14px;
      line-height: 1.75;
    }

    .bullet {
      width: 10px;
      height: 10px;
      margin-top: 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--gold), #e2c08e);
      box-shadow: 0 0 0 6px rgba(188, 138, 77, 0.12);
    }

    .placeholder {
      color: rgba(94, 117, 105, 0.64);
      font-style: italic;
    }

    .foot {
      margin-top: 22px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      color: var(--ink-soft);
      font-size: 12px;
      line-height: 1.7;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--forest);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .brand::before {
      content: "";
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--forest), var(--gold));
    }

    @media (max-width: 920px) {
      .viewer-nav,
      .summary-card,
      .foot {
        flex-direction: column;
        align-items: start;
      }

      .viewer-buttons {
        width: 100%;
      }

      .viewer-buttons button {
        flex: 1;
      }

      .detail-head,
      .section-grid {
        grid-template-columns: 1fr;
      }

      .section-card.span-2 {
        grid-column: span 1;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="viewer-nav">
      <div class="viewer-meta">
        <div class="page-pill" id="page-pill">Page 1 / 2</div>
        <div id="page-caption">첫 페이지는 안내 표지이고, 다음 버튼을 누르면 실제 피드백 내용이 열립니다.</div>
      </div>
      <div class="viewer-buttons">
        <button id="btn-prev-page" type="button">이전 페이지</button>
        <button id="btn-next-page" type="button">피드백 보기</button>
      </div>
    </div>

    <article class="sheet">
      <section class="page is-active" data-page="1">
        <section class="cover-page">
          <div class="cover-card">
            <div class="cover-logo-wrap">
              <div class="cover-logo-shell">
                <img class="cover-logo" src="${escapeHtml(logoSrc)}" alt="코딩쏙 학원 로고">
              </div>
            </div>
            <div class="cover-kicker">Lesson Letter</div>
            <h1 class="cover-title">학부모님<br>안녕하세요.</h1>
            <p class="cover-message">${coverLead}</p>
            <p class="cover-sub">${coverSub}</p>
          </div>
        </section>
      </section>

      <section class="page" data-page="2">
        <div class="detail-head">
          <section class="welcome-card">
            <div class="eyebrow">Detail Page</div>
            <div>
              <h2>오늘의 수업을<br>한 장에 담았습니다.</h2>
              <p>첫 페이지에서 안내를 확인한 뒤, 이 페이지에서 실제 수업 피드백과 이후 학습 계획을 이어서 보실 수 있습니다.</p>
            </div>
          </section>

          <div class="summary-stack">
            <section class="summary-card">
              <div>
                <div class="meta-kicker">Student Record</div>
                <div class="student-name">${studentName}<span>Class Progress Snapshot</span></div>
              </div>
              <div class="date-chip">${escapeHtml(displayDate)}</div>
            </section>

            <section class="meta-card">
              <strong>URL Name</strong>
              <div class="meta-value">${slug}</div>
            </section>

            <section class="focus-card">
              <strong>Today Focus</strong>
              <p class="focus-body">${todayFocus}</p>
            </section>
          </div>
        </div>

        <section class="section-grid">
          <section class="section-card">
            <div class="section-index">01</div>
            <h3 class="section-title">세부 활동</h3>
            <ul class="activity-list">${renderActivities(data.activities)}</ul>
          </section>

          <section class="section-card">
            <div class="section-index">02</div>
            <h3 class="section-title">아이의 반응 및 태도</h3>
            <p class="body-text">${renderText(data.reaction, "아이의 반응 및 태도를 입력하지 않았습니다.")}</p>
          </section>

          <section class="section-card">
            <div class="section-index">03</div>
            <h3 class="section-title">이해도 및 진행 상황</h3>
            <p class="body-text">${renderText(data.progress, "이해도 및 진행 상황을 입력하지 않았습니다.")}</p>
          </section>

          <section class="section-card">
            <div class="section-index">04</div>
            <h3 class="section-title">숙제</h3>
            <p class="body-text">${renderText(data.homework, "숙제를 입력하지 않았습니다.")}</p>
          </section>

          <section class="section-card span-2">
            <div class="section-index">05</div>
            <h3 class="section-title">다음 수업 계획</h3>
            <p class="body-text">${renderText(data.next, "다음 수업 계획을 입력하지 않았습니다.")}</p>
          </section>

          <section class="section-card span-2">
            <div class="section-index">06</div>
            <h3 class="section-title">추가 전달사항</h3>
            <p class="body-text">${renderText(data.extra, "추가 전달사항을 입력하지 않았습니다.")}</p>
          </section>
        </section>

        <footer class="foot">
          <div class="brand">Class Feedback Letter</div>
          <div>코딩쏙 학원 수업 피드백 안내 페이지입니다.</div>
        </footer>
      </section>
    </article>
  </div>

  <script>
    const pages = Array.from(document.querySelectorAll(".page"));
    const pagePill = document.getElementById("page-pill");
    const pageCaption = document.getElementById("page-caption");
    const prevButton = document.getElementById("btn-prev-page");
    const nextButton = document.getElementById("btn-next-page");
    let currentPage = 1;

    function updatePage(page) {
      currentPage = Math.max(1, Math.min(2, page));
      pages.forEach((section) => {
        section.classList.toggle("is-active", Number(section.dataset.page) === currentPage);
      });

      pagePill.textContent = "Page " + currentPage + " / 2";
      pageCaption.textContent = currentPage === 1
        ? "첫 페이지는 안내 표지이고, 다음 버튼을 누르면 실제 피드백 내용이 열립니다."
        : "둘째 페이지에서 실제 피드백 내용을 이어서 봅니다.";
      prevButton.disabled = currentPage === 1;
      nextButton.disabled = currentPage === 2;
      prevButton.textContent = currentPage === 1 ? "이전 페이지" : "첫 페이지로";
      nextButton.textContent = currentPage === 1 ? "피드백 보기" : "마지막 페이지";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    prevButton.addEventListener("click", () => updatePage(currentPage - 1));
    nextButton.addEventListener("click", () => updatePage(currentPage + 1));
    updatePage(1);
  </script>
</body>
</html>`;
}
