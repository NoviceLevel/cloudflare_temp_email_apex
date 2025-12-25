export const hashPassword = async (password: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
};

export const getRouterPathWithLang = (path: string, lang: string): string => {
  if (!lang || lang === 'zh') {
    return path;
  }
  return `/${lang}${path}`;
};

export const utcToLocalDate = (utcDate: string, useUTCDate: boolean): string => {
  const utcDateString = `${utcDate} UTC`;
  if (useUTCDate) {
    return utcDateString;
  }
  try {
    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) return utcDateString;
    return date.toLocaleString();
  } catch (e) {
    console.error(e);
  }
  return utcDateString;
};

export function humanFileSize(size: number): string {
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return parseFloat((size / Math.pow(1024, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
}
