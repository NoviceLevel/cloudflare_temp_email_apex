// Google Admin Console 风格的共享样式
export const ADMIN_CARD_STYLES = `
  .admin-section { margin-bottom: 24px; }
  .admin-section-title { font-size: 14px; font-weight: 500; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  :host-context(.dark) .admin-section-title { color: #9aa0a6; }
  
  .admin-card { background: #fff; border: 1px solid #dadce0; border-radius: 8px; overflow: hidden; }
  :host-context(.dark) .admin-card { background: #292a2d; border-color: #3c4043; }
  
  .admin-card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #e0e0e0; }
  :host-context(.dark) .admin-card-header { border-color: #3c4043; }
  .admin-card-title { font-size: 16px; font-weight: 500; color: #202124; margin: 0; }
  :host-context(.dark) .admin-card-title { color: #e8eaed; }
  
  .admin-card-body { padding: 24px; }
  
  .admin-list-item { display: flex; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e0e0e0; cursor: pointer; transition: background 0.15s; }
  .admin-list-item:last-child { border-bottom: none; }
  .admin-list-item:hover { background: #f8f9fa; }
  :host-context(.dark) .admin-list-item { border-color: #3c4043; }
  :host-context(.dark) .admin-list-item:hover { background: #3c4043; }
  
  .admin-list-icon { width: 40px; height: 40px; border-radius: 50%; background: #e8f0fe; color: #1a73e8; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0; }
  :host-context(.dark) .admin-list-icon { background: #174ea6; color: #8ab4f8; }
  
  .admin-list-content { flex: 1; min-width: 0; }
  .admin-list-title { font-size: 14px; font-weight: 500; color: #202124; margin-bottom: 2px; }
  :host-context(.dark) .admin-list-title { color: #e8eaed; }
  .admin-list-subtitle { font-size: 12px; color: #5f6368; }
  :host-context(.dark) .admin-list-subtitle { color: #9aa0a6; }
  
  .admin-list-action { color: #5f6368; }
  :host-context(.dark) .admin-list-action { color: #9aa0a6; }
`;

export const ADMIN_FORM_STYLES = `
  .form-group { margin-bottom: 20px; }
  .form-label { font-size: 14px; font-weight: 500; color: #202124; margin-bottom: 8px; display: block; }
  :host-context(.dark) .form-label { color: #e8eaed; }
  .form-hint { font-size: 12px; color: #5f6368; margin-top: 4px; }
  :host-context(.dark) .form-hint { color: #9aa0a6; }
  
  .form-row { display: flex; gap: 16px; align-items: flex-start; }
  .form-row > * { flex: 1; }
  
  .form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e0e0e0; margin-top: 24px; }
  :host-context(.dark) .form-actions { border-color: #3c4043; }
  
  .full-width { width: 100%; }
  .mb-2 { margin-bottom: 8px; }
  .mb-3 { margin-bottom: 16px; }
  .mb-4 { margin-bottom: 24px; }
  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 16px; }
`;

export const ADMIN_TABLE_STYLES = `
  .admin-table-container { overflow-x: auto; }
  .admin-table { width: 100%; border-collapse: collapse; min-width: 600px; }
  .admin-table th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 500; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e0e0e0; background: #f8f9fa; }
  :host-context(.dark) .admin-table th { color: #9aa0a6; border-color: #3c4043; background: #202124; }
  .admin-table td { padding: 12px 16px; font-size: 14px; color: #202124; border-bottom: 1px solid #e0e0e0; }
  :host-context(.dark) .admin-table td { color: #e8eaed; border-color: #3c4043; }
  .admin-table tr:hover td { background: #f8f9fa; }
  :host-context(.dark) .admin-table tr:hover td { background: #3c4043; }
  
  .table-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; gap: 16px; flex-wrap: wrap; }
  :host-context(.dark) .table-toolbar { border-color: #3c4043; }
  .table-search { display: flex; align-items: center; gap: 8px; flex: 1; max-width: 400px; }
  .table-actions { display: flex; align-items: center; gap: 8px; }
`;

export const ADMIN_ALERT_STYLES = `
  .admin-alert { padding: 12px 16px; border-radius: 4px; font-size: 14px; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
  .admin-alert mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
  .admin-alert.info { background: #e8f0fe; color: #1967d2; }
  .admin-alert.warning { background: #fef7e0; color: #ea8600; }
  .admin-alert.error { background: #fce8e6; color: #c5221f; }
  .admin-alert.success { background: #e6f4ea; color: #137333; }
`;

export const ADMIN_CHIP_STYLES = `
  .admin-chip { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; }
  .admin-chip.primary { background: #e8f0fe; color: #1a73e8; }
  .admin-chip.success { background: #e6f4ea; color: #137333; }
  .admin-chip.warning { background: #fef7e0; color: #ea8600; }
  .admin-chip.error { background: #fce8e6; color: #c5221f; }
  .admin-chip.neutral { background: #f1f3f4; color: #5f6368; }
`;

export const ALL_ADMIN_STYLES = `
  ${ADMIN_CARD_STYLES}
  ${ADMIN_FORM_STYLES}
  ${ADMIN_TABLE_STYLES}
  ${ADMIN_ALERT_STYLES}
  ${ADMIN_CHIP_STYLES}
`;
