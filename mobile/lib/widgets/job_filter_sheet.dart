import 'package:flutter/material.dart';

import '../l10n/l10n_x.dart';
import '../models/enums.dart';
import '../state/job_providers.dart';
import 'profession_dropdown.dart';
import 'region_district_selector.dart';

class JobFilterSheet extends StatefulWidget {
  const JobFilterSheet({super.key, required this.initial});

  final JobFilter initial;

  @override
  State<JobFilterSheet> createState() => _JobFilterSheetState();
}

class _JobFilterSheetState extends State<JobFilterSheet> {
  late int? _regionId = widget.initial.regionId;
  late int? _districtId = widget.initial.districtId;
  late int? _professionId = widget.initial.professionId;
  late JobType? _jobType = widget.initial.jobType;
  late String _sort = widget.initial.sort;
  late bool _urgentOnly = widget.initial.urgent ?? false;
  final _minController = TextEditingController();
  final _maxController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.initial.minPayment != null) _minController.text = widget.initial.minPayment.toString();
    if (widget.initial.maxPayment != null) _maxController.text = widget.initial.maxPayment.toString();
  }

  @override
  void dispose() {
    _minController.dispose();
    _maxController.dispose();
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
                    _jobType = null;
                    _sort = 'newest';
                    _urgentOnly = false;
                    _minController.clear();
                    _maxController.clear();
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
            DropdownButtonFormField<JobType?>(
              value: _jobType,
              isExpanded: true,
              decoration: InputDecoration(labelText: context.l10n.jobTypeLabel),
              items: [
                DropdownMenuItem(value: null, child: Text(context.l10n.allFilterOption)),
                for (final t in JobType.values) DropdownMenuItem(value: t, child: Text(t.label(context))),
              ],
              onChanged: (v) => setState(() => _jobType = v),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _minController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(labelText: context.l10n.minPaymentFieldLabel),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _maxController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(labelText: context.l10n.maxPaymentFieldLabel),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _sort,
              isExpanded: true,
              decoration: InputDecoration(labelText: context.l10n.sortByLabel),
              items: [
                DropdownMenuItem(value: 'newest', child: Text(context.l10n.sortNewest)),
                DropdownMenuItem(value: 'highest_pay', child: Text(context.l10n.sortHighestPay)),
              ],
              onChanged: (v) => setState(() => _sort = v ?? 'newest'),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _urgentOnly,
              onChanged: (value) => setState(() => _urgentOnly = value),
              title: Text(context.l10n.urgentOnlyFilter, style: const TextStyle(fontSize: 14.5)),
              secondary: const Icon(Icons.bolt_rounded),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                final filter = (
                  regionId: _regionId,
                  districtId: _districtId,
                  professionId: _professionId,
                  jobType: _jobType,
                  minPayment: num.tryParse(_minController.text.trim()),
                  maxPayment: num.tryParse(_maxController.text.trim()),
                  search: widget.initial.search,
                  sort: _sort,
                  nearRegionId: null,
                  nearDistrictId: null,
                  urgent: _urgentOnly ? true : null,
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
