library phosphor_flutter;

import 'package:flutter/widgets.dart';
export 'package:flutter/widgets.dart' show IconData;

typedef PhosphorIconData = IconData;
typedef PhosphorFlatIconData = IconData;

class PhosphorDuotoneIconData {
  const PhosphorDuotoneIconData(this.codePoint, this.secondary);

  final int codePoint;
  final IconData secondary;

  IconData asIconData() => IconData(
        // ignore: non_const_argument_for_const_parameter
        codePoint,
        fontFamily: 'PhosphorDuotone',
        fontPackage: 'phosphor_flutter',
        matchTextDirection: true,
      );
}
