class UrlValidationResult {
  const UrlValidationResult({required this.isValid, this.message});

  final bool isValid;
  final String? message;
}

UrlValidationResult validateHttpUrl(String value, {String label = 'URL'}) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    return UrlValidationResult(isValid: false, message: '$label wajib diisi.');
  }
  final uri = Uri.tryParse(trimmed);
  if (uri == null || !uri.hasScheme || (uri.scheme != 'http' && uri.scheme != 'https')) {
    return UrlValidationResult(
      isValid: false,
      message: '$label harus berformat http:// atau https://',
    );
  }
  if (uri.host.isEmpty) {
    return UrlValidationResult(isValid: false, message: '$label tidak valid.');
  }
  return const UrlValidationResult(isValid: true);
}

UrlValidationResult validateDriveOrVideoUrl(String value) {
  final base = validateHttpUrl(value, label: 'Link');
  if (!base.isValid) return base;
  final lower = value.toLowerCase();
  final allowed = lower.contains('drive.google.com') ||
      lower.contains('docs.google.com') ||
      lower.contains('youtube.com') ||
      lower.contains('youtu.be') ||
      lower.contains('dropbox.com');
  if (!allowed) {
    return const UrlValidationResult(
      isValid: false,
      message: 'Gunakan link Google Drive, YouTube, atau Dropbox yang valid.',
    );
  }
  return const UrlValidationResult(isValid: true);
}