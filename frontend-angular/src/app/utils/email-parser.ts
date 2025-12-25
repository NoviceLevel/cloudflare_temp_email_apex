import PostalMime from 'postal-mime';
import { humanFileSize } from './index';

export interface MailAttachment {
  id: string;
  filename: string;
  size: string;
  url: string;
  blob: Blob;
}

export interface ParsedMail {
  id: number;
  raw: string;
  source: string;
  originalSource: string;
  subject: string;
  message: string;
  text: string;
  attachments: MailAttachment[];
  created_at: string;
  checked?: boolean;
  metadata?: string;
  address?: string;
}

export async function processItem(item: any): Promise<ParsedMail> {
  item.originalSource = item.source;
  
  // 直接使用 PostalMime（Zone.js 不支持 WASM）
  try {
    const parsedEmail = await PostalMime.parse(item.raw);
    item.source = parsedEmail.from?.address || item.source;
    if (parsedEmail.from?.address && parsedEmail.from?.name) {
      item.source = `${parsedEmail.from.name} <${parsedEmail.from.address}>`;
    }
    item.subject = parsedEmail.subject || 'No Subject';
    item.message = parsedEmail.html || parsedEmail.text || item.raw;
    item.text = parsedEmail.text || '';
    item.attachments = parsedEmail.attachments?.map((a_item: any) => {
      const blob = new Blob(
        [a_item.content],
        { type: a_item.mimeType || 'application/octet-stream' }
      );
      const blob_url = URL.createObjectURL(blob);
      if (a_item.contentId && a_item.contentId.length > 0) {
        item.message = item.message.replace(`cid:${a_item.contentId}`, blob_url);
      }
      return {
        id: a_item.contentId || Math.random().toString(36).substring(2, 15),
        filename: a_item.filename || a_item.contentId || '',
        size: humanFileSize(a_item.content?.length || 0),
        url: blob_url,
        blob: blob
      };
    }) || [];
  } catch (error) {
    console.error('Error parsing email with PostalMime', error);
    item.subject = 'No Subject';
    item.message = item.raw;
    item.text = '';
    item.attachments = [];
  }
  return item;
}

export function getDownloadEmlUrl(raw: string): string {
  return URL.createObjectURL(new Blob([raw], { type: 'text/plain' }));
}
