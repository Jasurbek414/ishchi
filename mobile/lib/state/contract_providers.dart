import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/contract_status.dart';
import 'core_providers.dart';

final contractStatusProvider = FutureProvider<ContractStatus>((ref) {
  return ref.watch(contractRepositoryProvider).getContractStatus();
});
