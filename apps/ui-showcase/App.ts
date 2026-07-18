import { config, define, html, signal } from "@ga-ut/ce/web";
import { gaUiStyles } from "@ga-ut/ui";
import { icon } from "./icons";
import { showcaseStyles } from "./styles";

type Task = {
  id: number;
  title: string;
  done: boolean;
};

type InputDetail = CustomEvent<{ value: string }>;

const navItems = [
  { id: "intro", label: "소개", icon: "home" },
  { id: "foundations", label: "Foundations", icon: "layers" },
  { id: "components", label: "Components", icon: "cube" },
  { id: "patterns", label: "Patterns", icon: "grid" },
];

const utilityItems = [
  { label: "토큰 가이드", icon: "list" },
  { label: "아이콘", icon: "smile" },
  { label: "변경 로그", icon: "history" },
];

const colors = [
  { name: "Brand 500", value: "#E84D3D", className: "brand-500" },
  { name: "Sand 50", value: "#F1EEE8", className: "sand" },
  { name: "Sage 100", value: "#DDE4DA", className: "sage-100" },
  { name: "Sage 300", value: "#B6C9BD", className: "sage-300" },
  { name: "Forest 700", value: "#205A3F", className: "forest" },
  { name: "Ink 950", value: "#1B1D1C", className: "ink" },
  { name: "Neutral 500", value: "#979797", className: "neutral-500" },
  { name: "Neutral 300", value: "#B6B6B6", className: "neutral-300" },
  { name: "White", value: "#FFFFFF", className: "white" },
];

const componentExamples: Record<
  string,
  { tag: string; code: string; display: string }
> = {
  switch: {
    tag: "ga-switch",
    code: "<ga-switch checked>활성</ga-switch>",
    display: "&lt;ga-switch checked&gt;활성&lt;/ga-switch&gt;",
  },
  actions: {
    tag: "ga-button",
    code: '<ga-button variant="primary">저장하기</ga-button>',
    display:
      "&lt;ga-button variant=&quot;primary&quot;&gt;저장하기&lt;/ga-button&gt;",
  },
  forms: {
    tag: "ga-text-field",
    code: '<ga-text-field label="이메일"></ga-text-field>',
    display:
      "&lt;ga-text-field label=&quot;이메일&quot;&gt;&lt;/ga-text-field&gt;",
  },
  feedback: {
    tag: "ga-feedback",
    code: '<ga-feedback tone="success" title="활성">완료되었습니다.</ga-feedback>',
    display:
      "&lt;ga-feedback tone=&quot;success&quot; title=&quot;활성&quot;&gt;완료되었습니다.&lt;/ga-feedback&gt;",
  },
};

function GaUtShowcase({ host }: { host: HTMLElement }) {
  const isDark = signal(false);
  const menuOpen = signal(false);
  const activeSection = signal("intro");
  const inspectorTab = signal<"preview" | "code">("preview");
  const selectedComponent = signal("switch");
  const tasks = signal<Task[]>([
    { id: 1, title: "새 제품 흐름 검토", done: false },
  ]);
  let emailValue = "team@ga-ut.com";
  const marketing = signal(true);
  const inspectorSwitch = signal(true);
  const inspectorFilter = signal("all");
  const inspectorChoice = signal("option-a");
  const inspectorToastVisible = signal(true);
  const dismissedFeedback = signal<string[]>([]);
  const toast = signal("");
  let nextTaskId = 2;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  const showToast = (value: string) => {
    toast.set(value);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.set(""), 2400);
  };

  const scrollToSection = (sectionId: string) => {
    activeSection.set(sectionId);
    menuOpen.set(false);
    host.shadowRoot
      ?.querySelector(`#${sectionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleUtility = (label: string) => {
    if (label === "토큰 가이드") {
      scrollToSection("foundations");
      showToast("GA-UT의 색상, 타이포그래피, 공간 토큰으로 이동했습니다.");
      return;
    }

    if (label === "아이콘") {
      scrollToSection("patterns");
      showToast("아이콘을 포함한 조합 패턴으로 이동했습니다.");
      return;
    }

    showToast("v0.1 · Foundations, Components, Patterns를 처음 공개했습니다.");
  };

  const copyTokens = async () => {
    const tokenText = "--ga-color-accent: #E84D3D;";
    try {
      await navigator.clipboard.writeText(tokenText);
      showToast("토큰이 클립보드에 복사되었습니다.");
    } catch {
      showToast("토큰: --ga-color-accent · #E84D3D");
    }
  };

  const copyComponentCode = async () => {
    const example = componentExamples[selectedComponent()] ?? componentExamples.switch;
    try {
      await navigator.clipboard.writeText(example.code);
      showToast(`${example.tag} 코드를 복사했습니다.`);
    } catch {
      showToast(example.code);
    }
  };

  const addTask = () => {
    tasks.update((current) => [
      ...current,
      { id: nextTaskId++, title: "디자인 토큰 문서화", done: false },
    ]);
    showToast("오늘 할 일을 추가했습니다.");
  };

  const toggleTask = (id: number) => {
    tasks.update((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  const dismissFeedback = (tone: string) => {
    dismissedFeedback.update((current) =>
      current.includes(tone) ? current : [...current, tone]
    );
  };

  const selectComponent = (component: string) => {
    selectedComponent.set(component);
    inspectorTab.set("preview");
  };

  const handleEmail = (event: Event) => {
    emailValue = (event as InputDetail).detail?.value ?? "";
  };

  const updateMessageCount = (event: Event) => {
    const value = (event.target as HTMLTextAreaElement).value;
    const counter = host.shadowRoot?.querySelector<HTMLElement>("[data-message-count]");
    if (counter) counter.textContent = `${value.length} / 200`;
  };

  return () => {
    const activeToast = toast();
    const selected = selectedComponent();
    const selectedExample = componentExamples[selected] ?? componentExamples.switch;
    const taskList = tasks();
    const hiddenFeedback = dismissedFeedback();
    const darkClass = isDark() ? "ga-dark" : "";
    const marketingSwitch = marketing()
      ? html`<ga-switch checked onclick=${() => marketing.set(false)}>활성</ga-switch>`
      : html`<ga-switch onclick=${() => marketing.set(true)}>비활성</ga-switch>`;
    const previewSwitch = inspectorSwitch()
      ? html`<ga-switch checked onclick=${() => inspectorSwitch.set(false)}>활성</ga-switch>`
      : html`<ga-switch onclick=${() => inspectorSwitch.set(true)}>비활성</ga-switch>`;
    const renderTab = (
      label: string,
      value: string,
      current: string,
      onSelect: () => void
    ) =>
      value === current
        ? html`<ga-tab selected onclick=${onSelect}>${label}</ga-tab>`
        : html`<ga-tab onclick=${onSelect}>${label}</ga-tab>`;
    const renderActionState = (state: string, index: number) =>
      index === 3
        ? html`
            <div class="${`demo-cell state-${state.toLowerCase()}`}">
              <span>${state}</span>
              <div class="button-frame"><ga-button variant="primary" size="sm" disabled>저장하기</ga-button></div>
              <div class="button-frame"><ga-button variant="outline" size="sm" disabled>초대하기</ga-button></div>
              <div class="button-frame"><ga-button variant="ghost" size="sm" disabled>취소</ga-button></div>
            </div>
          `
        : html`
            <div class="${`demo-cell state-${state.toLowerCase()}`}">
              <span>${state}</span>
              <div class="button-frame"><ga-button variant="primary" size="sm">저장하기</ga-button></div>
              <div class="button-frame"><ga-button variant="outline" size="sm">초대하기</ga-button></div>
              <div class="button-frame"><ga-button variant="ghost" size="sm">취소</ga-button></div>
            </div>
          `;

    return html`
      <div class="${`showcase-app ${darkClass}`}">
        <aside class="sidebar" aria-label="GA-UT UI 탐색">
          <button class="brand" type="button" aria-label="GA-UT UI" onclick=${() => scrollToSection("intro")}>
            <ga-mark size="lg" aria-hidden="true"></ga-mark>
            <span>GA-UT UI</span>
          </button>

          <nav class="side-nav" aria-label="주요 섹션">
            ${navItems.map(
              (item) => html`
                <button
                  class="${`side-nav-item ${activeSection() === item.id ? "is-active" : ""}`}"
                  type="button"
                  onclick=${() => scrollToSection(item.id)}
                >
                  ${icon(item.icon)}<span>${item.label}</span>
                </button>
              `
            )}
          </nav>

          <div class="side-divider"></div>
          <nav class="side-nav utility-nav" aria-label="리소스">
            ${utilityItems.map(
              (item) => html`
                <button type="button" class="side-nav-item" onclick=${() => handleUtility(item.label)}>
                  ${icon(item.icon)}<span>${item.label}</span>
                </button>
              `
            )}
          </nav>

          <div class="sidebar-meta">
            <div class="meta-row">
              <span>테마</span>
              <div class="theme-pair" aria-label="테마 선택">
                <button class="${isDark() ? "" : "is-active"}" type="button" aria-label="밝은 테마" onclick=${() => isDark.set(false)}>${icon("sun")}</button>
                <button class="${isDark() ? "is-active" : ""}" type="button" aria-label="어두운 테마" onclick=${() => isDark.set(true)}>${icon("moon")}</button>
              </div>
            </div>
            <div class="meta-row language-row"><span>언어</span><button type="button" aria-label="현재 언어: 한국어" onclick=${() => showToast("GA-UT UI는 한국어를 기본 언어로 사용합니다.")}>한국어 ${icon("chevron")}</button></div>
            <button class="company-row" type="button" onclick=${() => showToast("GA-UT 제품 엔지니어링 팀의 내부 UI 시스템입니다.")}><strong>GA-UT</strong><span>제품 엔지니어링 팀</span>${icon("chevron")}</button>
          </div>
        </aside>

        <header class="topbar">
          <button class="mobile-brand" type="button" aria-label="GA-UT UI" onclick=${() => scrollToSection("intro")}>
            <ga-mark size="lg" aria-hidden="true"></ga-mark><span>GA-UT UI</span>
          </button>
          <nav class="top-tabs" aria-label="라이브러리 범주">
            <button type="button" onclick=${() => scrollToSection("foundations")}>Foundations</button>
            <button type="button" class="is-active" onclick=${() => scrollToSection("components")}>Components</button>
            <button type="button" onclick=${() => scrollToSection("patterns")}>Patterns</button>
          </nav>
          <div class="top-actions">
            <button class="version-button" type="button" aria-label="현재 버전 v0.1" onclick=${() => handleUtility("변경 로그")}>v0.1 ${icon("chevron")}</button>
            <button class="icon-button desktop-only" type="button" aria-label="토큰 복사" onclick=${copyTokens}>${icon("copy")}</button>
            <button class="icon-button" type="button" aria-label="테마 변경" onclick=${() => isDark.update((value) => !value)}>${icon(isDark() ? "moon" : "sun")}</button>
            <button class="icon-button menu-button" type="button" aria-label="메뉴 열기" aria-expanded="${menuOpen()}" onclick=${() => menuOpen.update((value) => !value)}>${icon(menuOpen() ? "close" : "menu")}</button>
          </div>
        </header>

        <div class="${`mobile-menu ${menuOpen() ? "is-open" : ""}`}" aria-hidden="${!menuOpen()}">
          <nav aria-label="모바일 탐색">
            ${navItems.map(
              (item) => html`<button type="button" tabindex="${menuOpen() ? 0 : -1}" onclick=${() => scrollToSection(item.id)}>${icon(item.icon)}<span>${item.label}</span></button>`
            )}
          </nav>
          <button class="mobile-copy" type="button" onclick=${copyTokens}>${icon("copy")} 토큰 복사</button>
        </div>

        <main class="workspace">
          <div class="primary-content">
            <section class="hero" id="intro">
              <div class="hero-copy">
                <h1><span>하나의 언어로,</span><br />모든 제품을.</h1>
                <p>CE 위에 세운 GA-UT의 인터페이스 시스템.<br />빠르게 조합하고, 오래 일관되게.</p>
                <div class="hero-actions">
                  <ga-button variant="primary" size="lg" onclick=${() => scrollToSection("components")}>컴포넌트 보기 ${icon("arrow")}</ga-button>
                  <ga-button variant="outline" size="lg" onclick=${copyTokens}>${icon("copy")} 토큰 복사</ga-button>
                </div>
              </div>

              <article class="today-panel" aria-labelledby="today-title">
                <div class="panel-heading">
                  <h2 id="today-title">Today</h2>
                  <div><button class="add-button" type="button" onclick=${addTask}>${icon("plus")} 추가</button><button class="more-button" type="button" aria-label="Today 패턴 설명" onclick=${() => showToast("할 일, 상태, 피드백을 한 흐름으로 묶은 GA-UT 작업 패턴입니다.")}>${icon("more")}</button></div>
                </div>
                <div class="task-body">
                  <span class="today-label">오늘</span>
                  <div class="task-list">
                    ${taskList.map(
                      (task) => html`
                        <div class="${`task-row ${task.done ? "is-done" : ""}`}">
                          <button class="task-check" type="button" aria-label="${task.done ? "완료 취소" : "완료"}" onclick=${() => toggleTask(task.id)}>${task.done ? icon("check") : ""}</button>
                          <span class="task-title">${task.title}</span>
                          <ga-badge tone="success">${task.done ? "완료" : "활성"}</ga-badge>
                          <button class="more-button" type="button" aria-label="${`${task.title} 설명`}" onclick=${() => showToast(`${task.title} · 상태 변경과 후속 동작을 제품 맥락에 맞게 연결합니다.`)}>${icon("more")}</button>
                        </div>
                      `
                    )}
                  </div>
                </div>
              </article>
            </section>

            <section class="library-section foundations-section" id="foundations">
              <div class="section-title"><span>FOUNDATIONS</span><i></i></div>
              <div class="foundation-grid">
                <article class="foundation-card color-foundation">
                  <h2>Color</h2>
                  <div class="swatches">
                    ${colors.map(
                      (color) => html`<button class="${`swatch ${color.className}`}" type="button" title="${`${color.name} ${color.value}`}" aria-label="${`${color.name} 복사`}" onclick=${() => {
                        navigator.clipboard?.writeText(color.value);
                        showToast(`${color.name} ${color.value} 복사됨`);
                      }}></button>`
                    )}
                  </div>
                  <div class="token-caption"><code>--ga-color-accent</code><code>#E84D3D</code></div>
                </article>
                <article class="foundation-card typography-foundation">
                  <h2>Typography</h2>
                  <div class="type-demo"><strong>Aa</strong><div><b>GA-UT Serif</b><span>Pretendard</span><small>System UI</small></div></div>
                  <p>Display <i>/</i> Heading <i>/</i> Body <i>/</i> Caption</p>
                </article>
                <article class="foundation-card shape-foundation">
                  <h2>Space &amp; shape</h2>
                  <div class="shape-layout"><div class="shape-stage"><span></span></div><div class="shape-values"><p>4&nbsp;&nbsp;/&nbsp;&nbsp;8&nbsp;&nbsp;/&nbsp;&nbsp;12&nbsp;&nbsp;/&nbsp;&nbsp;16<br />20&nbsp;&nbsp;/&nbsp;&nbsp;24&nbsp;&nbsp;/&nbsp;&nbsp;32<br />40&nbsp;&nbsp;/&nbsp;&nbsp;48&nbsp;&nbsp;/&nbsp;&nbsp;64</p><small>Radius</small><p>6&nbsp;&nbsp;/&nbsp;&nbsp;8&nbsp;&nbsp;/&nbsp;&nbsp;12&nbsp;&nbsp;/&nbsp;&nbsp;16</p></div></div>
                </article>
              </div>
            </section>

            <section class="library-section components-section" id="components">
              <div class="section-title"><span>COMPONENTS</span><i></i></div>
              <div class="component-grid">
                <article class="component-card actions-card">
                  <h2>Actions</h2>
                  <div class="action-state-grid">
                    ${["Default", "Hover", "Focus", "Disabled"].map(renderActionState)}
                  </div>
                  <button class="text-link" type="button" onclick=${() => selectComponent("actions")}>모든 액션 컴포넌트 보기 ${icon("arrow")}</button>
                </article>

                <article class="component-card forms-card">
                  <h2>Forms</h2>
                  <ga-text-field label="이메일" value="${emailValue}" placeholder="team@ga-ut.com" onga-input=${handleEmail}></ga-text-field>
                  <label class="message-field"><span>메시지</span><textarea maxlength="200" placeholder="메시지를 입력하세요." oninput=${updateMessageCount}></textarea><small data-message-count>0 / 200</small></label>
                  <div class="form-options"><span>옵션</span><div><div>${marketingSwitch}</div><label class="check-label"><input type="checkbox" checked onchange=${() => {}} /><span></span>마케팅 수신 동의</label><label class="radio-label"><input type="radio" name="showcase-option" /><span></span>옵션 선택</label></div></div>
                  <button class="text-link" type="button" onclick=${() => selectComponent("forms")}>모든 폼 컴포넌트 보기 ${icon("arrow")}</button>
                </article>

                <article class="component-card feedback-card">
                  <h2>Feedback</h2>
                  ${hiddenFeedback.includes("success") ? "" : html`<ga-feedback tone="success" title="활성" dismiss onga-dismiss=${() => dismissFeedback("success")}>작업이 성공적으로 완료되었습니다.</ga-feedback>`}
                  ${hiddenFeedback.includes("warning") ? "" : html`<ga-feedback tone="warning" title="검토 필요" dismiss onga-dismiss=${() => dismissFeedback("warning")}>추가 확인이 필요한 항목이 있습니다.</ga-feedback>`}
                  ${hiddenFeedback.includes("danger") ? "" : html`<ga-feedback tone="danger" title="제품 업데이트" dismiss onga-dismiss=${() => dismissFeedback("danger")}>새 버전이 배포되었습니다.</ga-feedback>`}
                  ${hiddenFeedback.length ? html`<button class="restore-feedback" type="button" onclick=${() => dismissedFeedback.set([])}>알림 복원</button>` : ""}
                  <button class="text-link" type="button" onclick=${() => selectComponent("feedback")}>모든 피드백 컴포넌트 보기 ${icon("arrow")}</button>
                </article>
              </div>
            </section>

            <section class="library-section patterns-section" id="patterns">
              <div class="section-title"><span>PATTERNS</span><i></i></div>
              <div class="pattern-list">
                <article>
                  <span>01 · FLOW</span>
                  <h2>행동에서 피드백까지</h2>
                  <p>명확한 명령, 즉시 보이는 상태, 다음 행동을 알려주는 피드백을 한 흐름으로 연결합니다.</p>
                  <code>action → state → feedback</code>
                </article>
                <article>
                  <span>02 · COMPOSITION</span>
                  <h2>작게 조합하고 크게 확장</h2>
                  <p>CE 컴포넌트의 독립성을 유지하면서 제품 화면에서는 같은 토큰과 간격으로 조합합니다.</p>
                  <code>primitive → pattern → product</code>
                </article>
                <article>
                  <span>03 · ACCESS</span>
                  <h2>키보드와 상태를 기본값으로</h2>
                  <p>포커스, 비활성, 오류, 완료 상태를 시각 표현과 의미 구조에 함께 담습니다.</p>
                  <code>focus · disabled · status</code>
                </article>
              </div>
            </section>
          </div>

          <aside class="inspector" aria-label="컴포넌트 미리보기">
            <div class="inspector-tabs" role="tablist" aria-label="Inspector 보기">
              <span class="inspector-mobile-label">COMPONENTS</span>
              ${renderTab("미리보기", "preview", inspectorTab(), () => inspectorTab.set("preview"))}
              ${renderTab("코드", "code", inspectorTab(), () => inspectorTab.set("code"))}
            </div>
            ${inspectorTab() === "preview"
              ? html`
                  <div class="inspector-content" role="tabpanel" aria-label="컴포넌트 미리보기">
                    <div class="inspector-group"><strong>스위치</strong><div class="inline-preview"><span>활성</span>${previewSwitch}</div></div>
                    <div class="inspector-group"><strong>탭</strong><div class="tab-preview" role="tablist" aria-label="작업 상태">${renderTab("전체", "all", inspectorFilter(), () => inspectorFilter.set("all"))}${renderTab("활성", "active", inspectorFilter(), () => inspectorFilter.set("active"))}${renderTab("보관됨", "archived", inspectorFilter(), () => inspectorFilter.set("archived"))}</div></div>
                    <div class="inspector-group"><strong>선택</strong><label class="select-wrap"><select onchange=${(event: Event) => showToast(`${(event.target as HTMLSelectElement).value} 선택됨`)}><option>옵션 선택</option><option>팀 워크스페이스</option><option>개인 워크스페이스</option></select>${icon("chevron")}</label></div>
                    <div class="inspector-group"><strong>토큰 그룹</strong><div class="segmented"><button class="${inspectorChoice() === "option-a" ? "is-active" : ""}" type="button" onclick=${() => inspectorChoice.set("option-a")}>옵션 A</button><button class="${inspectorChoice() === "option-b" ? "is-active" : ""}" type="button" onclick=${() => inspectorChoice.set("option-b")}>옵션 B</button><button class="${inspectorChoice() === "option-c" ? "is-active" : ""}" type="button" onclick=${() => inspectorChoice.set("option-c")}>옵션 C</button></div></div>
                    <div class="inspector-group toast-preview"><strong>토스트</strong>${inspectorToastVisible()
                      ? html`<div class="inline-toast">${icon("check")}<span>토큰이 클립보드에 복사되었습니다.</span><button type="button" aria-label="미리보기 토스트 닫기" onclick=${() => inspectorToastVisible.set(false)}>${icon("close")}</button></div>`
                      : html`<button class="restore-toast" type="button" onclick=${() => inspectorToastVisible.set(true)}>토스트 다시 보기</button>`}</div>
                    <p class="selection-note">선택됨 · ${selected}</p>
                  </div>
                `
              : html`
                  <div class="code-panel" role="tabpanel" aria-label="컴포넌트 코드"><span>선택한 컴포넌트</span><strong>&lt;${selectedExample.tag}&gt;</strong><pre><code>${selectedExample.display}</code></pre><button type="button" onclick=${copyComponentCode}>${icon("copy")} 코드 복사</button></div>
                `}
          </aside>
        </main>

        ${activeToast
          ? html`<div class="live-toast is-visible" role="status" aria-live="polite">${icon("check")}<span>${activeToast}</span><button type="button" aria-label="알림 닫기" onclick=${() => toast.set("")}>${icon("close")}</button></div>`
          : ""}
      </div>
    `;
  };
}

const appTag = define(GaUtShowcase, { styles: [showcaseStyles] });

const mountApp = () => {
  const existingRoot = document.querySelector<HTMLElement>("[data-ga-ut-ui-root]");
  const root = existingRoot ?? document.createElement("div");
  root.dataset.gaUtUiRoot = "true";

  if (!existingRoot) document.body.append(root);
  if (!window.location.hash) window.location.hash = "#/";

  config({
    globalStyles: gaUiStyles,
    entryPoint: {
      selector: "ga-ut-ui-root",
      rootElement: root,
      hydrate: false,
    },
    routes: [{ path: "/", tag: appTag }],
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountApp, { once: true });
} else {
  mountApp();
}
