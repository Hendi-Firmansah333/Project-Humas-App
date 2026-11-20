import 'package:dio/dio.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/services/local_storage.dart';

enum ApiErrorType {
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  serverError,
  networkError,
  unknown,
}

class ApiException implements Exception {
  const ApiException({
    required this.message,
    required this.type,
    this.statusCode,
  });

  final String message;
  final ApiErrorType type;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  static const _tokenKey = 'auth_token';

  Dio? _dio;
  String? _token;

  Future<void> init() async {
    _token = await LocalStorage.getString(_tokenKey);
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 20),
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
      ),
    );
    _dio!.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (ApiConfig.baseUrl.contains('ngrok')) {
            options.headers['ngrok-skip-browser-warning'] = '69420';
          }
          if (_token != null && _token!.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $_token';
          }
          handler.next(options);
        },
        onError: (DioException e, handler) async {
          final statusCode = e.response?.statusCode;
          String? serverMessage;

          if (e.response?.data is Map<String, dynamic>) {
            final data = e.response!.data as Map<String, dynamic>;
            if (data['message'] != null) {
              final msg = data['message'];
              serverMessage = msg is List ? msg.join(', ') : msg.toString();
            }
          }

          ApiErrorType errorType;
          String userFriendlyMessage;

          if (statusCode == 401) {
            errorType = ApiErrorType.unauthorized;
            userFriendlyMessage = serverMessage ?? 'Sesi Anda telah berakhir. Silakan masuk kembali.';
            await clearToken();
          } else if (statusCode == 403) {
            errorType = ApiErrorType.forbidden;
            userFriendlyMessage = serverMessage ?? 'Anda tidak memiliki hak akses untuk tindakan ini.';
          } else if (statusCode == 404) {
            errorType = ApiErrorType.notFound;
            userFriendlyMessage = serverMessage ?? 'Data atau layanan yang diminta tidak ditemukan.';
          } else if (statusCode != null && statusCode >= 500) {
            errorType = ApiErrorType.serverError;
            userFriendlyMessage = 'Terjadi gangguan internal pada server (500). Silakan coba lagi nanti.';
          } else if (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout ||
              e.type == DioExceptionType.connectionError) {
            errorType = ApiErrorType.networkError;
            userFriendlyMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet atau jaringan Anda.';
          } else if (statusCode == 400) {
            errorType = ApiErrorType.badRequest;
            userFriendlyMessage = serverMessage ?? 'Permintaan data tidak valid.';
          } else {
            errorType = ApiErrorType.unknown;
            userFriendlyMessage = serverMessage ?? (e.message ?? 'Terjadi kesalahan sistem.');
          }

          final apiException = ApiException(
            message: userFriendlyMessage,
            type: errorType,
            statusCode: statusCode,
          );

          return handler.reject(
            DioException(
              requestOptions: e.requestOptions,
              response: e.response,
              type: e.type,
              error: apiException,
              message: userFriendlyMessage,
            ),
          );
        },
      ),
    );
  }

  Dio get dio {
    if (_dio == null) throw StateError('ApiClient belum diinisialisasi.');
    return _dio!;
  }

  bool get hasToken => _token != null && _token!.isNotEmpty;

  Future<void> setToken(String? token) async {
    _token = token;
    if (token == null) {
      await LocalStorage.setString(_tokenKey, '');
    } else {
      await LocalStorage.setString(_tokenKey, token);
    }
  }

  Future<void> clearToken() => setToken(null);

  Map<String, dynamic> _unwrap(dynamic raw) {
    if (raw is Map<String, dynamic>) {
      if (raw.containsKey('success') && raw.containsKey('data')) {
        final data = raw['data'];
        if (data is Map<String, dynamic>) return data;
        if (data is List) return {'items': data};
        return {'value': data};
      }
      return raw;
    }
    return {};
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) async {
    final response = await dio.get<dynamic>(path, queryParameters: query);
    return _unwrap(response.data);
  }

  Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? body}) async {
    final response = await dio.post<dynamic>(path, data: body);
    return _unwrap(response.data);
  }

  Future<Map<String, dynamic>> patch(String path, {Map<String, dynamic>? body}) async {
    final response = await dio.patch<dynamic>(path, data: body);
    return _unwrap(response.data);
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final response = await dio.delete<dynamic>(path);
    return _unwrap(response.data);
  }
}