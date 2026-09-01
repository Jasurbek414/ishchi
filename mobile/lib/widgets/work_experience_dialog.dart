import 'package:flutter/material.dart';

import '../l10n/l10n_x.dart';
import '../models/work_experience.dart';

class WorkExperienceResult {
  const WorkExperienceResult({
    required this.companyName,
    required this.positionTitle,
    this.description,
    required this.startDate,
    this.endDate,
  });

  final String companyName;
  final String positionTitle;
  final String? description;
  final DateTime startDate;
  final DateTime? endDate;
}

Future<WorkExperienceResult?> showWorkExperienceDialog(BuildContext context, {WorkExperience? initial}) {
  return showDialog<WorkExperienceResult>(
    context: context,
    builder: (_) => _WorkExperienceDialog(initial: initial),
  );
}

class _WorkExperienceDialog extends StatefulWidget {
  const _WorkExperienceDialog({this.initial});

  final WorkExperience? initial;

  @override
  State<_WorkExperienceDialog> createState() => _WorkExperienceDialogState();
}

class _WorkExperienceDialogState extends State<_WorkExperienceDialog> {
  late final _companyController = TextEditingController(text: widget.initial?.companyName ?? '');
  late final _positionController = TextEditingController(text: widget.initial?.positionTitle ?? '');
  late final _descriptionController = TextEditingController(text: widget.initial?.description ?? '');
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isCurrent = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _startDate = widget.initial?.startDate;
    _endDate = widget.initial?.endDate;
    _isCurrent = widget.initial != null && widget.initial!.isCurrent;
  }

  @override
  void dispose() {
    _companyController.dispose();
    _positionController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isStart}) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: (isStart ? _startDate : _endDate) ?? now,
      firstDate: DateTime(1970),
      lastDate: now,
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
      } else {
        _endDate = picked;
      }
    });
  }

  String _fmt(DateTime? d) => d == null ? context.l10n.commonNotSelected : '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';

  void _submit() {
    if (_companyController.text.trim().isEmpty || _positionController.text.trim().isEmpty || _startDate == null) {
      setState(() => _error = context.l10n.workExperienceFormError);
      return;
    }
    Navigator.of(context).pop(WorkExperienceResult(
      companyName: _companyController.text.trim(),
      positionTitle: _positionController.text.trim(),
      description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
      startDate: _startDate!,
      endDate: _isCurrent ? null : _endDate,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return AlertDialog(
      title: Text(widget.initial == null ? context.l10n.addWorkExperienceTitle : context.l10n.editWorkExperienceTitle),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _companyController,
              decoration: InputDecoration(labelText: context.l10n.companyNameFieldLabel),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _positionController,
              decoration: InputDecoration(labelText: context.l10n.positionFieldLabel),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: InputDecoration(labelText: context.l10n.optionalNoteFieldLabel),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => _pickDate(isStart: true),
                    child: InputDecorator(
                      decoration: InputDecoration(labelText: context.l10n.startDateFieldLabel),
                      child: Text(_fmt(_startDate)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: InkWell(
                    onTap: _isCurrent ? null : () => _pickDate(isStart: false),
                    child: InputDecorator(
                      decoration: InputDecoration(labelText: context.l10n.endDateFieldLabel),
                      child: Text(_isCurrent ? context.l10n.presentDate : _fmt(_endDate)),
                    ),
                  ),
                ),
              ],
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(context.l10n.currentlyWorkingHereSwitch),
              value: _isCurrent,
              onChanged: (v) => setState(() => _isCurrent = v ?? false),
            ),
            if (_error != null) ...[
              const SizedBox(height: 4),
              Text(_error!, style: TextStyle(color: cs.error, fontSize: 12.5)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(context.l10n.commonCancel)),
        FilledButton(onPressed: _submit, child: Text(context.l10n.saveAction)),
      ],
    );
  }
}
