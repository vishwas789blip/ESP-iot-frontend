import { useState, useMemo, useEffect } from 'react';
import { Zap, Plus, ArrowDown, Trash2 } from 'lucide-react';

import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useRealtime } from '@/context/RealtimeContext';
import { deviceApi, sensorApi, actuatorApi, automationApi } from '@/services';
import { useToast } from '@/context/ToastContext';
import type { Sensor, Actuator, Automation, AutomationCondition, AutomationAction } from '@/types';
import { AutomationCard } from '@/components/AutomationCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';

interface ConditionDraft {
  sensorId: string;
  operator: string;
  value: string;
}

interface ActionDraft {
  actuatorId: string;
  command: string;
  duration: string;
}

interface AutomationForm {
  deviceId: string;
  name: string;
  conditions: ConditionDraft[];
  actions: ActionDraft[];
}

const operators = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'greater_than_or_equal', label: 'greater than or equal' },
  { value: 'less_than', label: 'less than' },
  { value: 'less_than_or_equal', label: 'less than or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
];

const emptyCondition = (): ConditionDraft => ({ sensorId: '', operator: 'equals', value: '' });
const emptyAction = (): ActionDraft => ({ actuatorId: '', command: 'ON', duration: '' });

export function AutomationsPage() {
  const { show } = useToast();
  const { automations: liveAutomations, devices: liveDevices, setInitialDevices, setInitialAutomations } = useRealtime();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [actuators, setActuators] = useState<Actuator[]>([]);
  const [form, setForm] = useState<AutomationForm>({ deviceId: '', name: '', conditions: [emptyCondition()], actions: [emptyAction()] });

  const { loading, error, refetch } = useRealtimeData<Automation[]>({
    fetcher: (signal) => automationApi.list(signal),
    onLoaded: setInitialAutomations,
  });

  const devices = useMemo(() => Object.values(liveDevices), [liveDevices]);
  const automationsArray = useMemo(() => Object.values(liveAutomations), [liveAutomations]);

  useEffect(() => {
    deviceApi.list().then(setInitialDevices).catch((err) => console.error('[Automations] Failed to load devices:', err));
  }, [setInitialDevices]);

  useEffect(() => {
    if (!form.deviceId) {
      setSensors([]);
      setActuators([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const sensorResponse = await sensorApi.listByDevice(form.deviceId);
        const sensorData: Sensor[] = Array.isArray(sensorResponse)
          ? sensorResponse
          : Array.isArray((sensorResponse as any)?.data)
            ? (sensorResponse as any).data
            : Array.isArray((sensorResponse as any)?.data?.data)
              ? (sensorResponse as any).data.data
              : [];
        if (!cancelled) setSensors(sensorData);
      } catch (err) {
        console.error('[Automations] Failed to load sensors:', err);
        if (!cancelled) setSensors([]);
      }

      try {
        const actuatorResponse = await actuatorApi.listByDevice(form.deviceId);
        const actuatorData: Actuator[] = Array.isArray(actuatorResponse)
          ? actuatorResponse
          : Array.isArray((actuatorResponse as any)?.data)
            ? (actuatorResponse as any).data
            : Array.isArray((actuatorResponse as any)?.data?.data)
              ? (actuatorResponse as any).data.data
              : [];
        if (!cancelled) setActuators(actuatorData);
      } catch (err) {
        console.error('[Automations] Failed to load actuators:', err);
        if (!cancelled) setActuators([]);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [form.deviceId]);

  const resetForm = (deviceId = '') => {
    setForm({ deviceId, name: '', conditions: [emptyCondition()], actions: [emptyAction()] });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm(devices[0]?._id || '');
    setModalOpen(true);
  };

  const openEdit = (automation: Automation) => {
    setEditing(automation);
    setForm({
      deviceId: automation.deviceId || '',
      name: automation.name || '',
      conditions: (automation.conditions || []).map((c) => ({
        sensorId: c.sensorId || '',
        operator: c.operator || 'equals',
        value: c.value === undefined ? '' : String(c.value),
      })),
      actions: (automation.actions || []).map((a) => ({
        actuatorId: a.actuatorId || '',
        command: a.command || 'ON',
        duration: a.duration === undefined ? '' : String(a.duration),
      })),
    });
    setModalOpen(true);
  };

  const updateCondition = (index: number, updates: Partial<ConditionDraft>) => {
    setForm((current) => ({
      ...current,
      conditions: current.conditions.map((item, i) => i === index ? { ...item, ...updates } : item),
    }));
  };

  const updateAction = (index: number, updates: Partial<ActionDraft>) => {
    setForm((current) => ({
      ...current,
      actions: current.actions.map((item, i) => i === index ? { ...item, ...updates } : item),
    }));
  };

  const parseValue = (value: string): string | number | boolean => {
    const trimmed = value.trim();
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    if (trimmed !== '' && Number.isFinite(Number(trimmed))) return Number(trimmed);
    return value;
  };

  const handleSave = async () => {
    if (!form.name.trim()) return show('Automation name is required', 'error');
    if (!form.deviceId) return show('Please select a device', 'error');
    if (form.conditions.length === 0) return show('Add at least one condition', 'error');
    if (form.actions.length === 0) return show('Add at least one action', 'error');

    const conditionIds = new Set<string>();
    for (const [index, condition] of form.conditions.entries()) {
      if (!condition.sensorId || !sensors.some((s) => s._id === condition.sensorId)) {
        return show(`Select a valid sensor for condition ${index + 1}`, 'error');
      }
      if (!condition.value.trim()) return show(`Enter a comparison value for condition ${index + 1}`, 'error');
      conditionIds.add(condition.sensorId);
    }

    for (const [index, action] of form.actions.entries()) {
      if (!action.actuatorId || !actuators.some((a) => a._id === action.actuatorId)) {
        return show(`Select a valid actuator for action ${index + 1}`, 'error');
      }
      if (!['ON', 'OFF'].includes(action.command.toUpperCase())) {
        return show(`Select ON or OFF for action ${index + 1}`, 'error');
      }
      if (action.duration.trim()) {
        const duration = Number(action.duration);
        if (!Number.isFinite(duration) || duration <= 0) return show(`Duration for action ${index + 1} must be greater than 0`, 'error');
      }
    }

    const conditions: AutomationCondition[] = form.conditions.map((c) => ({
      sensorId: c.sensorId,
      sensorName: sensors.find((s) => s._id === c.sensorId)?.name,
      operator: c.operator,
      value: parseValue(c.value),
    }));

    const actions: AutomationAction[] = form.actions.map((a) => ({
      actuatorId: a.actuatorId,
      actuatorName: actuators.find((x) => x._id === a.actuatorId)?.name,
      command: a.command.trim().toUpperCase(),
      duration: a.duration.trim() ? Number(a.duration) : undefined,
    }));

    setSaving(true);
    try {
      const payload = { deviceId: form.deviceId, name: form.name.trim(), conditions, actions };
      if (editing) {
        await automationApi.update(editing._id, payload);
        show('Automation updated', 'success');
      } else {
        await automationApi.create({ ...payload, enabled: true });
        show('Automation created', 'success');
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to save automation';
      show(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await automationApi.remove(deleteTarget._id);
      show('Automation deleted', 'success');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to delete automation';
      show(message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Build automations with multiple sensors, conditions, actuators and actions.</p>
          <p className="text-xs text-gray-600 mt-1">All conditions must match before the actions are executed.</p>
        </div>
        <Button onClick={openCreate} disabled={!devices.length}><Plus className="w-4 h-4" />Create Automation</Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : error ? (
        <ErrorState message="Unable to load automations" onRetry={refetch} />
      ) : automationsArray.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automationsArray.map((automation) => (
            <AutomationCard key={automation._id} automation={automation} onEdit={openEdit} onDelete={setDeleteTarget} onToggled={refetch} />
          ))}
        </div>
      ) : (
        <div className="glass-card"><EmptyState icon={Zap} title="No automations yet" description="Create a rule using one or more sensors and actuators." action={devices.length ? <Button onClick={openCreate}>Create Automation</Button> : <span className="text-sm text-gray-500">Add a device first</span>} /></div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Automation' : 'Create Automation'} size="lg">
        <div className="space-y-5">
          <Input label="Automation Name" placeholder="e.g. Hot + Dry Room → Fan & Light" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <Select label="Device" value={form.deviceId} onChange={(e) => setForm((f) => ({ ...f, deviceId: e.target.value, conditions: [emptyCondition()], actions: [emptyAction()] }))} options={[{ value: '', label: 'Select device…' }, ...devices.map((d) => ({ value: d._id, label: d.name }))]} />

          <div className="p-5 rounded-xl bg-ink-900/60 border border-white/5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">WHEN</p>
                <p className="text-xs text-gray-500 mt-1">Add as many sensor conditions as this automation needs.</p>
              </div>
              <Badge variant="cyan">{form.conditions.length} condition{form.conditions.length !== 1 ? 's' : ''}</Badge>
            </div>

            {form.conditions.map((condition, index) => (
              <div key={`condition-${index}`} className="rounded-lg border border-white/5 bg-ink-800/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Badge variant="cyan">CONDITION {index + 1}</Badge>{index > 0 && <span className="text-xs text-accent-cyan">AND</span>}</div>
                  {form.conditions.length > 1 && <button type="button" className="text-gray-500 hover:text-red-400" onClick={() => setForm((f) => ({ ...f, conditions: f.conditions.filter((_, i) => i !== index) }))}><Trash2 className="w-4 h-4" /></button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Select value={condition.sensorId} onChange={(e) => updateCondition(index, { sensorId: e.target.value })} options={[{ value: '', label: sensors.length ? 'Select sensor…' : 'No sensors available' }, ...sensors.map((s) => ({ value: s._id, label: `${s.name}${s.unit ? ` (${s.unit})` : ''}` }))]} />
                  <Select value={condition.operator} onChange={(e) => updateCondition(index, { operator: e.target.value })} options={operators} />
                  <Input placeholder="Value (e.g. 30, true)" value={condition.value} onChange={(e) => updateCondition(index, { value: e.target.value })} />
                </div>
              </div>
            ))}

            <Button variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, conditions: [...f.conditions, emptyCondition()] }))}><Plus className="w-4 h-4" />Add Condition</Button>

            <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-gray-600" /></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">THEN</p>
                <p className="text-xs text-gray-500 mt-1">Execute one or more actuator actions when every condition matches.</p>
              </div>
              <Badge variant="warning">{form.actions.length} action{form.actions.length !== 1 ? 's' : ''}</Badge>
            </div>

            {form.actions.map((action, index) => (
              <div key={`action-${index}`} className="rounded-lg border border-white/5 bg-ink-800/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Badge variant="warning">ACTION {index + 1}</Badge>{index > 0 && <span className="text-xs text-accent-amber">AND</span>}</div>
                  {form.actions.length > 1 && <button type="button" className="text-gray-500 hover:text-red-400" onClick={() => setForm((f) => ({ ...f, actions: f.actions.filter((_, i) => i !== index) }))}><Trash2 className="w-4 h-4" /></button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Select value={action.actuatorId} onChange={(e) => updateAction(index, { actuatorId: e.target.value })} options={[{ value: '', label: actuators.length ? 'Select actuator…' : 'No actuators available' }, ...actuators.map((a) => ({ value: a._id, label: a.name }))]} />
                  <Select value={action.command} onChange={(e) => updateAction(index, { command: e.target.value })} options={[{ value: 'ON', label: 'ON' }, { value: 'OFF', label: 'OFF' }]} />
                  <Input type="number" min={0} placeholder="Duration (sec, optional)" value={action.duration} onChange={(e) => updateAction(index, { duration: e.target.value })} />
                </div>
              </div>
            ))}

            <Button variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, actions: [...f.actions, emptyAction()] }))}><Plus className="w-4 h-4" />Add Action</Button>

            <div className="rounded-lg bg-accent-cyan/5 border border-accent-cyan/10 px-4 py-3">
              <p className="text-xs text-gray-300"><b>Rule preview:</b> WHEN {form.conditions.length} condition{form.conditions.length !== 1 ? 's' : ''} match → THEN execute {form.actions.length} action{form.actions.length !== 1 ? 's' : ''}.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update Automation' : 'Create Automation'}</Button>
          </div>
        </div>
      </Modal>

<ConfirmDialog
  open={Boolean(deleteTarget)}
  onCancel={() => setDeleteTarget(null)}
  onConfirm={handleDelete}
  title="Delete Automation"
  message={`Delete “${deleteTarget?.name || 'this automation'}”? This action cannot be undone.`}
  confirmLabel={deleting ? 'Deleting…' : 'Delete'}
  loading={deleting}
/>
    </div>
  );
}
