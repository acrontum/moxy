// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
export const extToMimeType: Record<string, string> = {
  '.epub': 'application/epub+zip',
  '.gz': 'application/gzip',
  '.jar': 'application/java-archive',
  '.json': 'application/json',
  '.jsonld': 'application/ld+json',
  '.doc': 'application/msword',
  '.bin': 'application/octet-stream',
  '.ogx': 'application/ogg',
  '.pdf': 'application/pdf',
  '.rtf': 'application/rtf',
  '.azw': 'application/vnd.amazon.ebook',
  '.mpkg': 'application/vnd.apple.installer+xml',
  '.xul': 'application/vnd.mozilla.xul+xml',
  '.xls': 'application/vnd.ms-excel',
  '.eot': 'application/vnd.ms-fontobject',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.rar': 'application/vnd.rar',
  '.vsd': 'application/vnd.visio',
  '.7z': 'application/x-7z-compressed',
  '.abw': 'application/x-abiword',
  '.bz': 'application/x-bzip',
  '.bz2': 'application/x-bzip2',
  '.cda': 'application/x-cdf',
  '.csh': 'application/x-csh',
  '.arc': 'application/x-freearc',
  '.php': 'application/x-httpd-php',
  '.sh': 'application/x-sh',
  '.tar': 'application/x-tar',
  '.xhtml': 'application/xhtml+xml',
  '.xml': 'application/xml serves as a valid default.',
  '.zip': 'application/zip',
  '.3gp': 'audio/3gpp', // if it doesn't contain video
  '.3g2': 'audio/3gpp2', // if it doesn't contain video
  '.aac': 'audio/aac',
  '.mp3': 'audio/mpeg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/opus',
  '.wav': 'audio/wav',
  '.weba': 'audio/webm',
  '.mid': 'audio/x-midi',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.tif': 'image/tiff',
  '.ico': 'image/vnd.microsoft.icon',
  '.webp': 'image/webp',
  '.ics': 'text/calendar',
  '.css': 'text/css',
  '.csv': 'text/csv',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.mjs': 'text/javascript',
  '.js': 'text/javascript', // (Specifications: HTML and RFC 9239)
  '.txt': 'text/plain',
  '.ts': 'video/mp2t',
  '.mp4': 'video/mp4',
  '.mpeg': 'video/mpeg',
  '.ogv': 'video/ogg',
  '.webm': 'video/webm',
  '.avi': 'video/x-msvideo',
};
