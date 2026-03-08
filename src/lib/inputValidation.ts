/**
 * Sanitize user input by stripping HTML tags and limiting length.
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
  // Strip HTML tags
  const stripped = input.replace(/<[^>]*>/g, "");
  // Trim and limit length
  return stripped.trim().slice(0, maxLength);
}

/**
 * Validate CNIC format: XXXXX-XXXXXXX-X
 */
export function validateCNIC(cnic: string): boolean {
  return /^\d{5}-\d{7}-\d{1}$/.test(cnic);
}

/**
 * Validate Pakistani phone format: 03XX-XXXXXXX or +923XXXXXXXXX
 */
export function validatePakistaniPhone(phone: string): boolean {
  return /^(\+92|0)3\d{2}[\s-]?\d{7}$/.test(phone.replace(/\s/g, ""));
}

/**
 * Validate YouTube URL
 */
export function validateYouTubeUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=[\w-]{11}|youtu\.be\/[\w-]{11})/.test(url);
}

/**
 * Validate Vimeo URL
 */
export function validateVimeoUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?vimeo\.com\/\d+/.test(url);
}

/**
 * Validate that a URL is an internal app route (starts with /)
 */
export function validateInternalUrl(url: string): boolean {
  return /^\/[a-zA-Z0-9\-\/]*$/.test(url);
}

/**
 * Validate hourly rate (positive number, max 50000 PKR)
 */
export function validateHourlyRate(rate: number): boolean {
  return Number.isFinite(rate) && rate > 0 && rate <= 50000;
}

/**
 * Validate rating (integer 1-5)
 */
export function validateRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Sanitize message content for chat
 */
export function sanitizeMessage(content: string): string {
  return sanitizeText(content, 5000);
}

/**
 * Sanitize review comment
 */
export function sanitizeReviewComment(comment: string): string {
  return sanitizeText(comment, 500);
}

/**
 * Sanitize profile name (letters, spaces, hyphens, apostrophes only)
 */
export function sanitizeName(name: string): string {
  return name.replace(/<[^>]*>/g, "").trim().slice(0, 100);
}

/**
 * Validate file type by checking MIME type against allowed list
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size in bytes
 */
export function validateFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}

// File size constants
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // 2MB

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const ALLOWED_CHAT_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
