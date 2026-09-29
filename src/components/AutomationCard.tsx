import { Link } from 'react-router-dom';
import {
  Zap,
  ArrowDown,
  Pencil,
  Trash2,
  Clock,
  ArrowRight,
  Play,
} from 'lucide-react';
import type { Automation } from '@/types';
import { Toggle } from './ui/Toggle';
import { Badge } from './ui/Badge';
import { useState } from 'react';
import { automationApi } from '@/services';
import { useToast } from '@/context/ToastContext';

interface AutomationCardProps {
  automation: Automation;
  onEdit?: (a: Automation) => void;
  onDelete?: (a: Automation) => void;
  onToggled?: () => void;
}

export function AutomationCard({
  automation,
  onEdit,
  onDelete,
  onToggled,
}: AutomationCardProps) {
  const { show } = useToast();
  const [toggling, setToggling] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);

    try {
      await automationApi.toggle(automation._id);
      show(
        `Automation ${automation.enabled ? 'disabled' : 'enabled'}`,
        'success',
      );
      onToggled?.();
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to toggle';
      show(msg, 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleTest = async () => {
  setTesting(true);

  try {
    const res = await automationApi.test(automation._id);
    show(res?.message || 'Test command sent', res?.triggered ? 'success' : 'error');
    onToggled?.();
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Test failed';
    show(msg, 'error');
  } finally {
    setTesting(false);
  }
};

  const condition = automation.conditions[0];
  const action = automation.actions[0];

  return (
    <div
      className={`glass-card p-5 transition-all group relative overflow-hidden ${
        automation.enabled
          ? 'border-accent-green/20'
          : 'opacity-70 hover:opacity-100'
      }`}
    >
      {automation.enabled && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-green/5 rounded-full blur-3xl" />
      )}

      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              automation.enabled
                ? 'bg-accent-green/10'
                : 'bg-ink-700/80'
            }`}
          >
            <Zap
              className={`w-5 h-5 ${
                automation.enabled
                  ? 'text-accent-green'
                  : 'text-gray-500'
              }`}
            />
          </div>

          <div>
            <h3 className="font-semibold text-white text-sm">
              {automation.name}
            </h3>
            {automation.deviceName && (
              <Link
                to="/devices"
                className="text-xs text-gray-500 hover:text-accent-cyan transition-colors"
              >
                {automation.deviceName}
              </Link>
            )}
          </div>
        </div>

        <Toggle
          checked={automation.enabled}
          onChange={handleToggle}
          disabled={toggling}
        />
      </div>

      <div className="relative space-y-2.5 mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="sm" className="text-[10px]">
            WHEN
          </Badge>
          <span className="text-xs text-gray-300">
            {condition?.sensorName || 'Sensor'} {condition?.operator}{' '}
            {String(condition?.value)}
          </span>
        </div>

        <div className="flex items-center justify-center">
          <ArrowDown className="w-4 h-4 text-gray-600" />
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="warning" size="sm" className="text-[10px]">
            THEN
          </Badge>
          <span className="text-xs text-gray-300">
            {action?.actuatorName || 'Actuator'}{' '}
            <ArrowRight className="w-3 h-3 inline" />{' '}
            {action?.command}
            {action?.duration ? ` for ${action.duration}s` : ''}
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          {automation.lastExecuted
            ? new Date(automation.lastExecuted).toLocaleString()
            : 'Never executed'}
        </div>
                <div className="flex items-center gap-1">
          <button
            onClick={handleTest}
            disabled={testing || !automation.enabled}
            className="p-1.5 rounded-lg text-gray-400 hover:text-accent-green hover:bg-accent-green/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={automation.enabled ? 'Run test' : 'Enable automation to test'}
          >
            <Play className={`w-3.5 h-3.5 ${testing ? 'animate-pulse' : ''}`} />
          </button>

          {onEdit && (
            <button
              onClick={() => onEdit(automation)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
              title="Edit automation"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(automation)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-accent-red hover:bg-accent-red/10 transition-colors"
              title="Delete automation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}