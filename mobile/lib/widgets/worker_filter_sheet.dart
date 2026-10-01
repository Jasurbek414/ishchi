import 'package:flutter/material.dart';

import '../l10n/l10n_x.dart';
import '../state/worker_providers.dart';
import 'profession_dropdown.dart';
import 'region_district_selector.dart';

class WorkerFilterSheet extends StatefulWidget {
  const WorkerFilterSheet({super.key, required this.initial});

  final WorkerFilter initial;

  @override
  State<WorkerFilterSheet> createState() => _WorkerFilterSheetState();
}

class _WorkerFilterSheetState extends State<WorkerFilterSheet> {
  late int? _regionId = widget.initial.regionId;
  late int? _districtId = widget.initial.districtId;
  late int? _professionId = widget.initial.professionId;
  late bool _availableToday = widget.initial.availableToday ?? false;
  final _experienceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.initial.minExperience != null) {
      _experienceController.text = widget.initial.minExperience.toString();
    }
  }

  @override
  void dispose() {
    _experienceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20, right: 20, top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(context.l10n.filterTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800))),
                TextButton(
                  onPressed: () => setState(() {
                    _regionId = null;
                    _districtId = null;
                    _professionId = null;
                    _availableToday = false;
                    _experienceController.clear();
                  }),
                  child: Text(context.l10n.clearAction),
                ),
              ],
            ),
            const SizedBox(height: 12),
            RegionDistrictSelector(
              regionId: _regionId,
              districtId: _districtId,
              onChanged: (r, d) => setState(() {
                _regionId = r;
                _districtId = d;
              }),
            ),
            const SizedBox(height: 12),
            ProfessionDropdown(
              value: _professionId,
              allowEmpty: true,
              onChanged: (v) => setState(() => _professionId = v),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _experienceController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(labelText: context.l10n.minExperienceFieldLabel),
            ),
            const SizedBox(height: 20),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _availableToday,
              onChanged: (value) => setState(() => _availableToday = value),
              title: Text(context.l10n.availableTodayFilter, style: const TextStyle(fontSize: 14.5)),
              secondary: const Icon(Icons.today_outlined),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                final filter = (
                  regionId: _regionId,
                  districtId: _districtId,
                  professionId: _professionId,
                  minExperience: int.tryParse(_experienceController.text.trim()),
                  search: widget.initial.search,
                  workPreference: widget.initial.workPreference,
                  availableToday: _availableToday ? true : null,
                );
                Navigator.of(context).pop(filter);
              },
              child: Text(context.l10n.applyAction),
            ),
          ],
        ),
      ),
    );
  }
}
