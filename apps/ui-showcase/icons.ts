export const icon = (name: string, className = "icon") => {
  const paths: Record<string, string> = {
    home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.2V21h13V9.2M9.3 21v-6.6h5.4V21"/>',
    layers:
      '<path d="m12 2.7 9 5.1-9 5.1-9-5.1 9-5.1Z"/><path d="m3 12.2 9 5.1 9-5.1M3 16.4l9 5 9-5"/>',
    cube: '<path d="m12 2.8 8.2 4.7v9.2L12 21.4l-8.2-4.7V7.5L12 2.8Z"/><path d="m3.8 7.5 8.2 4.7 8.2-4.7M12 12.2v9.2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.2 14.3s1.3 2 3.8 2 3.8-2 3.8-2M8.8 9h.01M15.2 9h.01"/>',
    history: '<path d="M3.2 12a8.8 8.8 0 1 0 2.6-6.2L3.2 8.4"/><path d="M3.2 3.5v4.9h4.9M12 7v5l3.4 2"/>',
    copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
    moon: '<path d="M20.6 15.5A9 9 0 0 1 8.5 3.4 9 9 0 1 0 20.6 15.5Z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="m5 5 14 14M19 5 5 19"/>',
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    more: '<circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/>',
    check: '<path d="m5 12.5 4.3 4.3L19.5 6.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    chevron: '<path d="m8 10 4 4 4-4"/>',
    warning: '<path d="M10.2 3.8 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.8 3.8a2 2 0 0 0-3.6 0Z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>',
  };

  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? ""}</svg>`;
};
