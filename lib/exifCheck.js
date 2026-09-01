// Mandatory timestamp + geotag enforcement for site photos (requirement:
// "make time stamped and geo tagged photos mandatory otherwise reject the
// upload"). This is the one gate that must never be soft — a photo missing
// either piece of EXIF data is rejected before a site_photos row is ever
// created, full stop, no override in the UI.

import exifr from 'exifr';

export async function extractRequiredExif(buffer) {
  let data;
  try {
    data = await exifr.parse(buffer, { pick: ['DateTimeOriginal', 'CreateDate', 'GPSLatitude', 'GPSLongitude', 'latitude', 'longitude'] });
  } catch {
    data = null;
  }

  const capturedAt = data?.DateTimeOriginal || data?.CreateDate || null;
  // exifr normalizes GPS into `latitude`/`longitude` when both are present.
  const latitude = data?.latitude ?? null;
  const longitude = data?.longitude ?? null;

  const problems = [];
  if (!capturedAt) problems.push('No capture timestamp (EXIF DateTimeOriginal) found in this photo.');
  if (latitude == null || longitude == null) problems.push('No GPS location (EXIF GPS tags) found in this photo.');

  if (problems.length > 0) {
    return { ok: false, problems };
  }

  return {
    ok: true,
    capturedAt: new Date(capturedAt).toISOString(),
    latitude,
    longitude
  };
}
