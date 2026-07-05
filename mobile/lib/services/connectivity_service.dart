import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class ConnectivityService extends ChangeNotifier {
  ConnectivityService._();

  static final ConnectivityService instance = ConnectivityService._();

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  bool _isOnline = true;
  bool _pluginAvailable = true;

  bool get isOnline => _isOnline;
  bool get pluginAvailable => _pluginAvailable;

  Future<void> init() async {
    try {
      final result = await _connectivity.checkConnectivity();
      _isOnline = _hasConnection(result);
      _subscription = _connectivity.onConnectivityChanged.listen((results) {
        final online = _hasConnection(results);
        if (online != _isOnline) {
          _isOnline = online;
          notifyListeners();
        }
      });
    } on MissingPluginException catch (e) {
      _pluginAvailable = false;
      _isOnline = true;
      debugPrint('ConnectivityService: plugin belum terdaftar — asumsikan online. ($e)');
    } on PlatformException catch (e) {
      _pluginAvailable = false;
      _isOnline = true;
      debugPrint('ConnectivityService: gagal init — asumsikan online. ($e)');
    }
  }

  bool _hasConnection(List<ConnectivityResult> results) {
    return results.any((r) => r != ConnectivityResult.none);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}