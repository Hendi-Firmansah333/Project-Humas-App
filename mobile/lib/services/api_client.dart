import 'package:dio/dio.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/services/local_storage.dart';

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
          if (_token != null && _token!.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $_token';
          }
          handler.next(options);
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