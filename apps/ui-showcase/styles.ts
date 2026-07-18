export const showcaseStyles = `
  :host(ga-ut-showcase) {
    display: block;
    min-height: 100vh;
  }

  .showcase-app,
  .showcase-app *,
  .showcase-app *::before,
  .showcase-app *::after {
    box-sizing: border-box;
  }

  .showcase-app {
    --chrome-height: 70px;
    --page: var(--ga-surface-canvas);
    --surface: var(--ga-surface-raised);
    --surface-subtle: var(--ga-surface-subtle);
    --ink: var(--ga-text-primary);
    --muted: var(--ga-text-secondary);
    --quiet: var(--ga-text-tertiary);
    --line: var(--ga-border-subtle);
    --line-strong: var(--ga-border-strong);
    --brand: #e84d3d;
    --brand-deep: #cf392c;
    --brand-soft: #fff0ed;
    --forest: #216445;
    --success-soft: #edf6f0;
    --warning: #de880d;
    --warning-soft: #fff7e8;
    --danger-soft: #fff2f0;
    --focus: #1677ff;
    min-height: 100vh;
    color: var(--ink);
    background: var(--page);
    font-family: var(--ga-font-sans);
    font-size: 14px;
    line-height: 1.45;
    transition: color 180ms ease, background 180ms ease;
  }

  .showcase-app.ga-dark {
    --page: #151716;
    --surface: #1c1e1d;
    --surface-subtle: #202321;
    --ink: #f6f5f2;
    --muted: #b7bab5;
    --quiet: #8d918c;
    --line: #393c39;
    --line-strong: #565a56;
    --brand-soft: #3b211e;
    --success-soft: #183528;
    --warning-soft: #392d18;
    --danger-soft: #3b211e;
    color-scheme: dark;
  }

  .showcase-app button,
  .showcase-app select,
  .showcase-app textarea {
    color: inherit;
    font: inherit;
  }

  .showcase-app button {
    border: 0;
    background: none;
    cursor: pointer;
  }

  .showcase-app button:focus-visible,
  .showcase-app select:focus-visible,
  .showcase-app textarea:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .showcase-app .icon {
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
    vertical-align: middle;
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 30;
    display: flex;
    width: 205px;
    flex-direction: column;
    border-right: 1px solid var(--line);
    background: var(--surface);
  }

  .brand,
  .mobile-brand {
    display: flex;
    align-items: center;
    color: var(--ink);
    font-size: 16px !important;
    font-weight: 720 !important;
    letter-spacing: 0.01em;
  }

  .brand {
    height: 131px;
    padding: 23px 22px 16px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 6px;
  }

  .brand ga-mark {
    width: 52px;
    height: 52px;
  }

  .brand ga-mark::part(mark),
  .mobile-brand ga-mark::part(mark) {
    width: 100%;
    height: 100%;
    color: var(--brand);
  }

  .side-nav {
    display: grid;
    gap: 3px;
    padding: 8px 7px;
  }

  .side-nav-item {
    position: relative;
    display: flex;
    width: 100%;
    height: 43px;
    align-items: center;
    gap: 13px;
    border-radius: 7px;
    padding: 0 17px;
    color: var(--ink);
    text-align: left;
    font-size: 14px !important;
  }

  .side-nav-item .icon {
    width: 19px;
    height: 19px;
  }

  .side-nav-item:hover {
    background: var(--surface-subtle);
  }

  .side-nav-item.is-active {
    background: var(--brand-soft);
  }

  .side-nav-item.is-active::before {
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    border-radius: 3px;
    background: var(--brand);
    content: "";
  }

  .side-divider {
    height: 1px;
    margin: 5px 17px 4px;
    background: var(--line);
  }

  .utility-nav {
    padding-top: 4px;
  }

  .sidebar-meta {
    margin-top: auto;
    border-top: 1px solid var(--line);
  }

  .meta-row {
    display: flex;
    min-height: 58px;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--line);
    padding: 0 18px 0 22px;
    color: var(--muted);
    font-size: 11px;
  }

  .theme-pair {
    display: flex;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 7px;
  }

  .theme-pair button {
    display: grid;
    width: 37px;
    height: 30px;
    place-items: center;
    color: var(--quiet);
  }

  .theme-pair button.is-active {
    background: var(--brand-soft);
    color: var(--brand);
  }

  .theme-pair .icon,
  .language-row .icon,
  .company-row .icon {
    width: 15px;
    height: 15px;
  }

  .language-row button {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px !important;
  }

  .company-row {
    position: relative;
    display: grid;
    width: 100%;
    min-height: 78px;
    align-content: center;
    padding: 10px 37px 10px 22px;
    text-align: left;
  }

  .company-row strong {
    font-size: 12px;
    font-weight: 600;
  }

  .company-row span {
    color: var(--quiet);
    font-size: 10px;
  }

  .company-row .icon {
    position: absolute;
    top: 25px;
    right: 18px;
  }

  .topbar {
    position: fixed;
    inset: 0 0 auto 205px;
    z-index: 25;
    display: flex;
    height: 70px;
    align-items: stretch;
    justify-content: space-between;
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--surface) 94%, transparent);
    backdrop-filter: blur(16px);
  }

  .mobile-brand,
  .menu-button {
    display: none !important;
  }

  .top-tabs {
    display: flex;
    height: 100%;
    align-items: stretch;
    gap: 17px;
    padding-left: 27px;
  }

  .top-tabs button {
    position: relative;
    min-width: 112px;
    padding: 1px 12px 0;
    font-size: 14px !important;
  }

  .top-tabs button.is-active {
    color: var(--brand);
  }

  .top-tabs button.is-active::after {
    position: absolute;
    inset: auto 0 -1px;
    height: 2px;
    background: var(--brand);
    content: "";
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: 15px;
    padding-right: 29px;
  }

  .version-button,
  .icon-button,
  .add-button {
    display: inline-flex;
    height: 34px;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line) !important;
    border-radius: 6px;
    background: var(--surface) !important;
  }

  .version-button {
    min-width: 75px;
    gap: 9px;
    padding: 0 12px;
    font-size: 13px !important;
  }

  .version-button .icon {
    width: 14px;
  }

  .icon-button {
    width: 36px;
  }

  .icon-button .icon {
    width: 19px;
    height: 19px;
  }

  .mobile-menu {
    display: none;
  }

  .workspace {
    min-height: 100vh;
    margin-left: 205px;
    padding-top: 70px;
    background: var(--page);
  }

  .primary-content {
    min-width: 0;
  }

  .hero {
    display: grid;
    min-height: 390px;
    grid-template-columns: minmax(0, 0.9fr) minmax(430px, 1.1fr);
    align-items: center;
    gap: 28px;
    border-bottom: 1px solid var(--line);
    padding: 49px 46px 24px 52px;
    scroll-margin-top: 70px;
  }

  .hero-copy {
    align-self: center;
  }

  .hero h1 {
    max-width: 610px;
    margin: -2px 0 16px;
    font-family: "AppleMyungjo", "Iowan Old Style", "Noto Serif KR", Georgia, serif;
    font-size: clamp(48px, 4vw, 61px);
    font-weight: 500;
    letter-spacing: -0.058em;
    line-height: 1.18;
  }

  .hero h1 span {
    white-space: nowrap;
  }

  .hero-copy p {
    margin: 0;
    color: var(--muted);
    font-size: 15px;
    line-height: 1.6;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 26px;
  }

  .hero-actions ga-button .icon {
    margin-left: 8px;
  }

  .today-panel {
    align-self: center;
    min-height: 313px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
  }

  .panel-heading {
    display: flex;
    height: 57px;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--line);
    padding: 0 17px 0 25px;
  }

  .panel-heading h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 680;
  }

  .panel-heading > div {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .add-button {
    gap: 7px;
    padding: 0 12px;
    font-size: 13px !important;
  }

  .add-button .icon,
  .more-button .icon {
    width: 17px;
    height: 17px;
  }

  .more-button {
    display: grid;
    width: 31px;
    height: 34px;
    place-items: center;
  }

  .task-body {
    padding: 27px 23px 22px;
  }

  .today-label {
    display: block;
    margin: 0 0 11px 3px;
    color: var(--quiet);
    font-size: 12px;
  }

  .task-list {
    display: grid;
    gap: 8px;
  }

  .task-row {
    display: grid;
    min-height: 61px;
    grid-template-columns: 24px 1fr auto 29px;
    align-items: center;
    gap: 12px;
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 0 11px 0 13px;
    transition: border 160ms ease, background 160ms ease;
  }

  .task-row:hover {
    border-color: var(--line-strong);
  }

  .task-row.is-done {
    background: var(--success-soft);
  }

  .task-row.is-done .task-title {
    color: var(--quiet);
    text-decoration: line-through;
  }

  .task-check {
    display: grid;
    width: 20px;
    height: 20px;
    place-items: center;
    border: 1px solid var(--line-strong) !important;
    border-radius: 5px;
    background: var(--surface) !important;
    color: var(--forest) !important;
  }

  .task-check .icon {
    width: 14px;
    height: 14px;
  }

  .task-title {
    color: var(--muted);
    font-size: 13px;
  }

  .library-section {
    margin-right: 352px;
    border-bottom: 1px solid var(--line);
    padding: 20px 44px 18px;
    scroll-margin-top: 70px;
  }

  .foundations-section {
    min-height: 222px;
  }

  .components-section {
    min-height: 374px;
    padding-top: 17px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 15px;
  }

  .section-title span {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .section-title i {
    height: 1px;
    flex: 1;
    background: var(--line);
  }

  .foundation-grid,
  .component-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .foundation-card,
  .component-card {
    min-width: 0;
    padding: 0 34px;
    border-left: 1px solid var(--line);
  }

  .foundation-card:first-child,
  .component-card:first-child {
    padding-left: 0;
    border-left: 0;
  }

  .foundation-card:last-child,
  .component-card:last-child {
    padding-right: 0;
  }

  .foundation-card h2,
  .component-card h2 {
    margin: 0 0 12px;
    font-family: "Iowan Old Style", "AppleMyungjo", Georgia, serif;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.2;
  }

  .swatches {
    display: flex;
    gap: 7px;
  }

  .swatch {
    width: 28px;
    height: 32px;
    flex: 1 1 28px;
    max-width: 31px;
    border: 1px solid transparent !important;
    border-radius: 4px;
    transition: transform 150ms ease;
  }

  .swatch:hover {
    transform: translateY(-3px);
  }

  .swatch.brand-500 { background: #e84d3d !important; }
  .swatch.sand { background: #f1eee8 !important; }
  .swatch.sage-100 { background: #dde4da !important; }
  .swatch.sage-300 { background: #b6c9bd !important; }
  .swatch.forest { background: #205a3f !important; }
  .swatch.ink { background: #1b1d1c !important; }
  .swatch.neutral-500 { background: #8e8f8d !important; }
  .swatch.neutral-300 { background: #b3b4b2 !important; }
  .swatch.white { border-color: #aaa !important; background: #fff !important; }

  .token-caption {
    display: flex;
    justify-content: space-between;
    margin-top: 27px;
    color: var(--muted);
  }

  .token-caption code {
    font-family: inherit;
    font-size: 10px;
  }

  .type-demo {
    display: flex;
    align-items: center;
    gap: 35px;
    margin-top: -4px;
  }

  .type-demo > strong {
    font-family: "Iowan Old Style", Georgia, serif;
    font-size: 67px;
    font-weight: 400;
    letter-spacing: -0.07em;
    line-height: 0.95;
  }

  .type-demo > div {
    display: grid;
    gap: 3px;
  }

  .type-demo b {
    font-family: "Iowan Old Style", Georgia, serif;
    font-size: 16px;
    font-weight: 400;
  }

  .type-demo span {
    font-size: 13px;
  }

  .type-demo small {
    color: var(--muted);
    font-size: 9px;
  }

  .typography-foundation > p {
    margin: 22px 0 0;
    color: var(--muted);
    font-size: 9px;
  }

  .typography-foundation > p i {
    margin: 0 8px;
    color: var(--quiet);
    font-style: normal;
  }

  .shape-layout {
    display: grid;
    grid-template-columns: minmax(78px, 98px) minmax(0, 1fr);
    gap: clamp(16px, 2vw, 31px);
  }

  .shape-stage {
    position: relative;
    display: grid;
    width: 100%;
    max-width: 98px;
    aspect-ratio: 1;
    height: auto;
    place-items: center;
    border: 1px dashed var(--brand);
  }

  .shape-stage::before,
  .shape-stage::after {
    position: absolute;
    background: var(--line);
    content: "";
  }

  .shape-stage::before { inset: 50% 0 auto; height: 1px; }
  .shape-stage::after { inset: 0 auto 0 50%; width: 1px; }

  .shape-stage span {
    z-index: 1;
    width: 72%;
    aspect-ratio: 1;
    height: auto;
    border: 1px solid var(--line-strong);
    border-radius: 16px;
    background: color-mix(in srgb, var(--surface) 70%, var(--line));
  }

  .shape-values p {
    margin: 0 0 14px;
    font-size: 10px;
    line-height: 1.85;
  }

  .shape-values small {
    color: var(--muted);
    font-size: 9px;
  }

  .component-card {
    position: relative;
    min-height: 273px;
    padding-bottom: 33px;
  }

  .component-card:hover h2 {
    color: var(--brand);
  }

  .action-state-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .demo-cell {
    display: grid;
    justify-items: stretch;
    gap: 9px;
    min-width: 0;
  }

  .demo-cell > span {
    color: var(--quiet);
    text-align: center;
    font-size: 8px;
  }

  .button-frame {
    display: flex;
    justify-content: center;
    border-radius: 6px;
  }

  .button-frame ga-button {
    display: block;
    width: 100%;
    min-width: 0;
  }

  .actions-card ga-button::part(button) {
    width: 100%;
    min-width: 0;
    padding-inline: 5px;
    font-size: 10px;
  }

  .state-hover .button-frame:first-of-type {
    filter: saturate(1.25) brightness(0.88);
  }

  .state-focus .button-frame {
    outline: 2px solid var(--focus);
    outline-offset: 1px;
  }

  .text-link {
    position: absolute;
    inset: auto auto 0 0;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: var(--brand) !important;
    font-size: 10px !important;
  }

  .text-link .icon {
    width: 14px;
    height: 14px;
  }

  .forms-card ga-text-field {
    display: block;
    margin-bottom: 10px;
  }

  .forms-card ga-text-field::part(control) {
    border-color: var(--focus);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--focus) 45%, transparent);
  }

  .message-field {
    position: relative;
    display: grid;
    gap: 4px;
    color: var(--muted);
    font-size: 9px;
  }

  .message-field textarea {
    width: 100%;
    min-height: 48px;
    resize: none;
    border: 1px solid var(--line-strong);
    border-radius: 5px;
    padding: 7px 9px 18px;
    background: var(--surface);
    font-size: 9px;
  }

  .message-field small {
    position: absolute;
    right: 8px;
    bottom: 5px;
    color: var(--quiet);
    font-size: 8px;
  }

  .form-options {
    display: grid;
    grid-template-columns: 44px 1fr;
    margin-top: 9px;
    color: var(--muted);
    font-size: 9px;
  }

  .form-options > div {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 7px;
  }

  .form-options ga-switch {
    white-space: nowrap;
  }

  .form-options > div > div {
    grid-row: auto;
  }

  .check-label,
  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  .check-label input,
  .radio-label input {
    position: absolute;
    opacity: 0;
  }

  .check-label > span,
  .radio-label > span {
    width: 12px;
    height: 12px;
    border: 1px solid var(--line-strong);
    background: var(--surface);
  }

  .check-label > span { border-radius: 3px; }
  .radio-label > span { border-radius: 50%; }
  .check-label input:checked + span { border-color: var(--brand); background: var(--brand); }
  .check-label input:checked + span::after {
    display: block;
    width: 6px;
    height: 3px;
    margin: 3px 0 0 2px;
    transform: rotate(-45deg);
    border-bottom: 1.5px solid #fff;
    border-left: 1.5px solid #fff;
    content: "";
  }

  .feedback-card ga-feedback {
    display: block;
    margin-bottom: 7px;
  }

  .feedback-card ga-feedback::part(feedback) {
    min-height: 55px;
    gap: 8px;
    border-radius: 6px;
    padding: 9px 11px;
  }

  .feedback-card ga-feedback::part(title) {
    margin-bottom: 1px;
    font-size: 11px;
  }

  .feedback-card ga-feedback::part(content) {
    font-size: 9px;
    line-height: 1.35;
  }

  .feedback-card ga-feedback::part(dismiss) {
    width: 20px;
    height: 20px;
  }

  .restore-feedback {
    min-height: 34px;
    border: 1px dashed var(--line-strong) !important;
    border-radius: 5px;
    padding: 0 12px;
    color: var(--brand) !important;
    font-size: 10px !important;
  }

  .showcase-app ga-switch[checked]::part(track) {
    background: var(--forest);
  }

  .inspector {
    position: fixed;
    inset: 460px 0 0 auto;
    z-index: 10;
    width: 352px;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    border-left: 1px solid var(--line);
    background: var(--surface);
  }

  .inspector-tabs {
    display: flex;
    height: 50px;
    align-items: stretch;
    gap: 8px;
    border-bottom: 1px solid var(--line);
    padding: 0 13px;
  }

  .inspector-tabs > span {
    display: flex;
  }

  .inspector-mobile-label {
    display: none !important;
  }

  .inspector-content {
    padding: 28px 26px;
  }

  .inspector-group {
    margin-bottom: 25px;
  }

  .inspector-group > strong {
    display: block;
    margin-bottom: 11px;
    font-size: 11px;
    font-weight: 650;
  }

  .inline-preview {
    display: flex;
    align-items: center;
    gap: 15px;
    color: var(--muted);
    font-size: 10px;
  }

  .tab-preview {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 5px;
  }

  .tab-preview > span {
    display: contents;
  }

  .select-wrap {
    position: relative;
    display: block;
  }

  .select-wrap select {
    width: 100%;
    height: 31px;
    appearance: none;
    border: 1px solid var(--line);
    border-radius: 5px;
    padding: 0 34px 0 12px;
    background: var(--surface);
    font-size: 10px;
  }

  .select-wrap .icon {
    position: absolute;
    top: 8px;
    right: 10px;
    width: 14px;
    height: 14px;
    pointer-events: none;
  }

  .segmented {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 5px;
  }

  .segmented button {
    height: 34px;
    border-left: 1px solid var(--line);
    font-size: 10px !important;
  }

  .segmented button:first-child {
    border-left: 0;
  }

  .segmented button.is-active {
    box-shadow: inset 0 0 0 1px var(--brand);
    color: var(--brand);
  }

  .inline-toast {
    display: grid;
    min-height: 46px;
    grid-template-columns: 20px 1fr 20px;
    align-items: center;
    gap: 10px;
    border: 1px solid var(--forest);
    border-radius: 4px;
    padding: 0 10px;
    box-shadow: 0 5px 16px rgb(16 40 28 / 14%);
    color: var(--forest);
    font-size: 9px;
  }

  .inline-toast .icon {
    width: 18px;
    height: 18px;
  }

  .inline-toast button {
    display: grid;
    width: 20px;
    height: 20px;
    place-items: center;
    color: var(--ink);
  }

  .restore-toast {
    min-height: 42px;
    border: 1px dashed var(--line-strong) !important;
    border-radius: 5px;
    color: var(--brand) !important;
    font-size: 10px !important;
  }

  .selection-note {
    margin: -9px 0 0;
    color: var(--quiet);
    font-size: 9px;
  }

  .code-panel {
    display: grid;
    gap: 12px;
    padding: 29px 26px;
  }

  .code-panel > span {
    color: var(--quiet);
    font-size: 10px;
  }

  .code-panel > strong {
    color: var(--brand);
  }

  .code-panel pre {
    overflow-x: auto;
    margin: 5px 0;
    border: 1px solid var(--line);
    border-radius: 7px;
    padding: 15px;
    background: var(--surface-subtle);
    color: var(--muted);
    font-size: 10px;
    line-height: 1.7;
  }

  .code-panel button {
    display: inline-flex;
    width: max-content;
    align-items: center;
    gap: 7px;
    border: 1px solid var(--line) !important;
    border-radius: 5px;
    padding: 8px 10px;
    background: var(--surface) !important;
    font-size: 10px !important;
  }

  .code-panel .icon {
    width: 15px;
    height: 15px;
  }

  .patterns-section {
    min-height: 282px;
    padding-top: 22px;
    padding-bottom: 32px;
  }

  .pattern-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-top: 1px solid var(--line);
  }

  .pattern-list article {
    min-width: 0;
    padding: 20px 28px 0;
    border-left: 1px solid var(--line);
  }

  .pattern-list article:first-child {
    padding-left: 0;
    border-left: 0;
  }

  .pattern-list article:last-child {
    padding-right: 0;
  }

  .pattern-list article > span {
    color: var(--brand);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.11em;
  }

  .pattern-list h2 {
    margin: 10px 0 8px;
    font-family: var(--ga-font-display);
    font-size: 17px;
    font-weight: 500;
  }

  .pattern-list p {
    min-height: 58px;
    margin: 0 0 14px;
    color: var(--muted);
    font-size: 10px;
    line-height: 1.65;
  }

  .pattern-list code {
    color: var(--quiet);
    font-family: var(--ga-font-mono);
    font-size: 9px;
  }

  .live-toast {
    position: fixed;
    right: 26px;
    bottom: 24px;
    z-index: 60;
    display: grid;
    min-width: 310px;
    min-height: 52px;
    grid-template-columns: 22px 1fr 22px;
    align-items: center;
    gap: 10px;
    transform: translateY(16px);
    border: 1px solid var(--forest);
    border-radius: 6px;
    padding: 0 12px;
    background: var(--surface);
    box-shadow: 0 14px 38px rgb(18 30 22 / 20%);
    color: var(--forest);
    font-size: 11px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease, transform 180ms ease;
  }

  .live-toast.is-visible {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .live-toast button {
    display: grid;
    place-items: center;
    color: var(--ink);
  }

  .live-toast .icon {
    width: 19px;
    height: 19px;
  }

  @media (max-width: 1200px) and (min-width: 901px) {
    .hero {
      grid-template-columns: minmax(390px, 0.8fr) minmax(480px, 1.2fr);
      padding-left: 38px;
      padding-right: 32px;
    }

    .hero h1 {
      font-size: 48px;
    }

    .library-section {
      padding-right: 26px;
      padding-left: 32px;
    }

    .foundation-card,
    .component-card {
      padding-right: 20px;
      padding-left: 20px;
    }
  }

  @media (max-width: 1360px) {
    .showcase-app {
      --chrome-height: 88px;
    }

    .sidebar,
    .top-tabs,
    .desktop-only {
      display: none;
    }

    .topbar {
      inset: 0 0 auto;
      height: var(--chrome-height);
      padding: 0 24px;
    }

    .mobile-brand {
      display: flex !important;
      gap: 13px;
      padding: 0;
      font-size: 20px !important;
    }

    .mobile-brand ga-mark {
      width: 42px;
      height: 50px;
    }

    .top-actions {
      gap: 18px;
      padding: 0;
    }

    .version-button {
      width: 96px;
      height: 44px;
      border-radius: 8px;
      font-size: 16px !important;
    }

    .icon-button {
      width: 48px;
      height: 48px;
      border-radius: 8px;
    }

    .icon-button .icon {
      width: 28px;
      height: 28px;
      stroke-width: 1.4;
    }

    .menu-button {
      display: inline-flex !important;
    }

    .mobile-menu {
      position: fixed;
      inset: var(--chrome-height) 0 auto;
      z-index: 24;
      display: grid;
      gap: 18px;
      transform: translateY(-120%);
      border-bottom: 1px solid var(--line);
      padding: 22px 31px 28px;
      background: var(--surface);
      box-shadow: 0 20px 30px rgb(0 0 0 / 10%);
      opacity: 0;
      pointer-events: none;
      transition: transform 200ms ease, opacity 180ms ease;
    }

    .mobile-menu:not(.is-open) {
      visibility: hidden;
    }

    .mobile-menu.is-open {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .mobile-menu nav {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .mobile-menu nav button,
    .mobile-copy {
      display: flex;
      height: 50px;
      align-items: center;
      gap: 12px;
      border: 1px solid var(--line) !important;
      border-radius: 7px;
      padding: 0 15px;
      background: var(--surface) !important;
      font-size: 14px !important;
    }

    .mobile-copy {
      justify-content: center;
      color: var(--brand) !important;
    }

    .workspace {
      margin-left: 0;
      padding-top: var(--chrome-height);
    }

    .hero {
      display: flex;
      min-height: 0;
      flex-direction: column;
      align-items: stretch;
      gap: 0;
      border-bottom: 0;
      padding: 40px 30px 0;
      scroll-margin-top: var(--chrome-height);
    }

    .hero h1 {
      max-width: none;
      margin: 0 0 20px;
      font-size: clamp(52px, 8vw, 70px);
      letter-spacing: -0.064em;
      line-height: 1.23;
    }

    .hero-copy {
      align-self: stretch;
      margin: 0 27px;
    }

    .hero-copy p {
      font-size: 18px;
      line-height: 1.65;
    }

    .hero-actions {
      flex-wrap: wrap;
      gap: 27px;
      margin-top: 27px;
    }

    .hero-actions ga-button {
      min-width: 194px;
    }

    .hero-actions ga-button::part(button) {
      height: 64px;
      padding-right: 28px;
      padding-left: 28px;
      font-size: 18px;
    }

    .today-panel {
      width: 100%;
      min-height: 213px;
      margin-top: 29px;
      border-radius: 6px;
    }

    .panel-heading {
      height: 68px;
      padding: 0 21px 0 24px;
    }

    .panel-heading h2 {
      font-size: 22px;
    }

    .add-button {
      height: 36px;
      padding: 0 14px;
      font-size: 15px !important;
    }

    .task-body {
      padding: 22px 21px 20px;
    }

    .today-label {
      margin-bottom: 14px;
      font-size: 15px;
    }

    .task-row {
      min-height: 61px;
      grid-template-columns: 27px 1fr auto 30px;
      gap: 14px;
      padding-left: 15px;
    }

    .task-check {
      width: 23px;
      height: 23px;
    }

    .task-title {
      font-size: 16px;
    }

    .library-section {
      margin-right: 0;
      padding-right: 34px;
      padding-left: 34px;
      scroll-margin-top: var(--chrome-height);
    }

    .foundations-section {
      height: auto;
      min-height: 438px;
      overflow: visible;
      padding-top: 28px;
      padding-bottom: 21px;
    }

    .components-section {
      height: auto;
      min-height: 0;
      overflow: visible;
      padding-top: 8px;
      padding-bottom: 25px;
    }

    .section-title {
      gap: 24px;
      margin-bottom: 17px;
    }

    .section-title span {
      font-size: 17px;
      letter-spacing: 0.09em;
    }

    .foundation-grid {
      grid-template-columns: 1fr 1fr;
    }

    .foundation-card {
      padding: 0;
    }

    .foundation-card h2,
    .component-card h2 {
      font-size: 23px;
    }

    .color-foundation {
      grid-column: 1 / -1;
      padding-bottom: 28px;
      border-bottom: 1px solid var(--line);
    }

    .color-foundation h2 {
      margin-bottom: 16px;
    }

    .swatches {
      justify-content: space-between;
      gap: 26px;
    }

    .swatch {
      width: auto;
      height: 52px;
      max-width: none;
      flex: 1 1 0;
      border-radius: 5px;
    }

    .token-caption {
      margin-top: 19px;
    }

    .token-caption code {
      font-size: 14px;
    }

    .typography-foundation,
    .shape-foundation {
      min-height: 210px;
      margin-top: 26px;
      overflow: visible;
    }

    .typography-foundation {
      padding-right: 35px;
      border-left: 0;
    }

    .shape-foundation {
      padding-left: 34px;
    }

    .type-demo {
      gap: 49px;
      margin-top: 21px;
    }

    .type-demo > strong {
      font-size: 80px;
    }

    .type-demo b {
      font-size: 22px;
    }

    .type-demo span {
      font-size: 18px;
    }

    .type-demo small {
      font-size: 13px;
    }

    .typography-foundation > p {
      margin-top: 23px;
      font-size: 15px;
      white-space: nowrap;
    }

    .shape-layout {
      grid-template-columns: clamp(110px, 12vw, 134px) minmax(0, 1fr);
      gap: clamp(24px, 3.5vw, 48px);
      margin-top: 22px;
    }

    .shape-stage {
      width: 100%;
      max-width: 134px;
      aspect-ratio: 1;
      height: auto;
    }

    .shape-stage span {
      width: 72%;
      height: auto;
      border-radius: 20px;
    }

    .shape-values p {
      margin-bottom: 20px;
      font-size: 14px;
      line-height: 1.9;
    }

    .shape-values small {
      font-size: 13px;
    }

    .component-grid {
      grid-template-columns: 1fr 1fr;
    }

    .component-card {
      padding-top: 25px;
      padding-bottom: 50px;
    }

    .actions-card {
      grid-column: 1 / -1;
      min-height: 234px;
      padding: 0 8px 23px;
      border-bottom: 1px solid var(--line);
      border-left: 0;
    }

    .actions-card h2 {
      margin-bottom: 22px;
    }

    .action-state-grid {
      gap: 34px;
    }

    .demo-cell {
      gap: 13px;
    }

    .demo-cell > span {
      font-size: 12px;
    }

    .button-frame ga-button::part(button) {
      width: 100%;
      min-width: 0;
      height: 37px;
      padding-inline: 10px;
      font-size: 15px;
    }

    .actions-card .text-link {
      display: none;
    }

    .forms-card {
      min-height: 340px;
      padding-right: 31px;
      padding-left: 0;
      border-left: 0;
    }

    .feedback-card {
      min-height: 340px;
      padding-right: 0;
      padding-left: 31px;
    }

    .forms-card ga-text-field {
      margin-top: 16px;
    }

    .message-field {
      font-size: 12px;
    }

    .message-field textarea {
      min-height: 66px;
      font-size: 12px;
    }

    .message-field small {
      font-size: 11px;
    }

    .form-options {
      grid-template-columns: 60px 1fr;
      font-size: 12px;
    }

    .text-link {
      font-size: 11px !important;
    }

    .feedback-card ga-feedback {
      margin-bottom: 10px;
    }

    .feedback-card ga-feedback::part(feedback) {
      min-height: 72px;
      padding: 13px 16px;
    }

    .feedback-card ga-feedback::part(title) {
      margin-bottom: 3px;
      font-size: 15px;
    }

    .feedback-card ga-feedback::part(content) {
      font-size: 12px;
      line-height: 1.45;
    }

    .forms-card .text-link,
    .feedback-card .text-link {
      display: none;
    }

    .inspector {
      position: relative;
      inset: auto;
      z-index: auto;
      width: 100%;
      min-height: 69px;
      overflow: visible;
      scrollbar-gutter: auto;
      border-top: 1px solid var(--line);
      border-left: 0;
    }

    .inspector-tabs {
      height: 69px;
      justify-content: flex-end;
      gap: 25px;
      padding: 0 32px;
    }

    .inspector-mobile-label {
      display: flex !important;
      margin-right: auto;
      align-items: center;
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0.09em;
    }

    .inspector-content,
    .code-panel {
      padding: 30px 34px 48px;
    }

    .patterns-section {
      min-height: 0;
      margin-right: 0;
      padding-top: 24px;
      padding-bottom: 36px;
      scroll-margin-top: var(--chrome-height);
    }

    .pattern-list article {
      padding: 22px 24px 0;
    }

    .pattern-list h2 {
      font-size: 20px;
    }

    .pattern-list p {
      min-height: 76px;
      font-size: 12px;
    }

    .pattern-list code {
      font-size: 10px;
    }

    .live-toast {
      right: 30px;
      bottom: 24px;
      left: 30px;
      min-width: 0;
      font-size: 13px;
    }
  }

  @media (max-width: 700px) {
    .showcase-app {
      --chrome-height: 74px;
    }

    .topbar {
      height: var(--chrome-height);
      padding: 0 18px;
    }

    .mobile-brand {
      gap: 9px;
      font-size: 17px !important;
    }

    .mobile-brand ga-mark {
      width: 35px;
      height: 42px;
    }

    .top-actions {
      gap: 8px;
    }

    .version-button {
      width: 72px;
      height: 40px;
      font-size: 14px !important;
    }

    .icon-button {
      width: 42px;
      height: 42px;
    }

    .mobile-menu {
      inset: var(--chrome-height) 0 auto;
    }

    .workspace {
      padding-top: var(--chrome-height);
    }

    .hero {
      padding: 30px 20px 0;
    }

    .hero h1 {
      font-size: clamp(38px, 11.8vw, 50px);
      line-height: 1.15;
    }

    .hero-copy {
      margin: 0;
    }

    .hero-copy p {
      font-size: 15px;
    }

    .hero-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .hero-actions ga-button {
      display: block;
      width: 100%;
      min-width: 0;
    }

    .hero-actions ga-button::part(button) {
      width: 100%;
      min-width: 0;
      height: 54px;
      padding-inline: 12px;
      font-size: 14px;
    }

    .library-section {
      padding-right: 20px;
      padding-left: 20px;
    }

    .foundations-section,
    .components-section {
      min-height: 0;
    }

    .swatches {
      gap: 8px;
    }

    .foundation-grid,
    .component-grid {
      display: block;
    }

    .typography-foundation,
    .shape-foundation,
    .forms-card,
    .feedback-card {
      height: auto;
      min-height: 0;
      margin-top: 0;
      border-top: 1px solid var(--line);
      border-left: 0;
      padding: 25px 0;
    }

    .shape-layout {
      grid-template-columns: minmax(108px, 124px) minmax(0, 1fr);
      gap: 25px;
    }

    .action-state-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px 10px;
    }

    .action-state-grid ga-button::part(button) {
      width: 100%;
      min-width: 0;
    }

    .pattern-list {
      display: block;
    }

    .pattern-list article,
    .pattern-list article:first-child,
    .pattern-list article:last-child {
      padding: 22px 0;
      border-top: 1px solid var(--line);
      border-left: 0;
    }

    .pattern-list article:first-child {
      border-top: 0;
    }

    .pattern-list p {
      min-height: 0;
    }

    .inspector-tabs {
      display: grid;
      height: auto;
      min-height: 116px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      padding: 16px 20px;
    }

    .inspector-mobile-label {
      grid-column: 1 / -1;
      margin: 0 0 2px;
    }

    .inspector-tabs ga-tab,
    .inspector-tabs ga-tab::part(tab) {
      width: 100%;
    }

    .task-row {
      grid-template-columns: 24px 1fr auto;
    }

    .task-row > .more-button {
      display: none;
    }
  }

  @media (max-width: 360px) {
    .version-button {
      display: none;
    }

    .hero-actions {
      grid-template-columns: 1fr;
    }

    .mobile-menu {
      padding-right: 18px;
      padding-left: 18px;
    }

    .mobile-menu nav {
      grid-template-columns: 1fr;
    }

    .task-row {
      grid-template-columns: 24px minmax(0, 1fr);
      gap: 10px;
      padding-right: 12px;
      padding-left: 12px;
    }

    .task-row ga-badge {
      display: none;
    }

    .task-title {
      font-size: 14px;
      white-space: nowrap;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .showcase-app *,
    .showcase-app *::before,
    .showcase-app *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
