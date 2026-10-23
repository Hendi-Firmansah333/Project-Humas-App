class UserProfile {
  const UserProfile({
    this.id,
    required this.name,
    required this.role,
    required this.phone,
    required this.email,
    this.photoPath,
    this.emailEditable = true,
  });

  final int? id;
  final String name;
  final String role;
  final String phone;
  final String email;
  final String? photoPath;
  final bool emailEditable;

  UserProfile copyWith({
    int? id,
    String? name,
    String? role,
    String? phone,
    String? email,
    String? photoPath,
    bool clearPhoto = false,
    bool? emailEditable,
  }) {
    return UserProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      role: role ?? this.role,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      photoPath: clearPhoto ? null : (photoPath ?? this.photoPath),
      emailEditable: emailEditable ?? this.emailEditable,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'role': role,
        'phone': phone,
        'email': email,
        'photoPath': photoPath,
        'emailEditable': emailEditable,
      };

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as int?,
      name: json['name'] as String? ?? '',
      role: json['role'] as String? ?? 'Anggota Humas',
      phone: json['phone'] as String? ?? '',
      email: json['email'] as String? ?? '',
      photoPath: json['photoPath'] as String?,
      emailEditable: json['emailEditable'] as bool? ?? true,
    );
  }
}