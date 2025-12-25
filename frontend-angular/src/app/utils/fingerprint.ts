import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedFingerprint: string | null = null;

/**
 * Get browser fingerprint
 * Uses cached value if available to avoid unnecessary computation
 * @returns Fingerprint visitor ID, or 'ERROR' if failed
 */
export const getFingerprint = async (): Promise<string> => {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  } catch (error) {
    console.error('Failed to get fingerprint:', error);
    cachedFingerprint = 'ERROR';
    return cachedFingerprint;
  }
};

export const setCachedFingerprint = (value: string) => {
  cachedFingerprint = value;
};
