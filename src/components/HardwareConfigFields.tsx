// ============================================================================
// HardwareConfigFields.tsx  ->  src/components/HardwareConfigFields.tsx
// ----------------------------------------------------------------------------
// Is file mein 3 cheezein export hoti hain (ActuatorCard aur ActuatorsPage
// inhi ko import karte hain):
//   1. formatHardware(item)      -> card pe "GPIO 18" jaisa chhota text banata hai
//   2. parseJsonObject(text, nm) -> JSON textbox ko object mein badalta hai
//   3. HardwareConfigFields      -> "Register Actuator" modal ke hardware fields
// ============================================================================

import type { HardwareInterface } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

// Dropdown mein dikhne wale interface options.
// Agar tumhare '@/types' ke HardwareInterface mein alag values hain,
// to yahan value: '...' ko wahi kar dena.
const INTERFACE_OPTIONS = [
  { value: 'gpio', label: 'GPIO (digital)' },
  { value: 'pwm', label: 'PWM' },
  { value: 'adc', label: 'ADC (analog)' },
  { value: 'i2c', label: 'I2C' },
  { value: 'spi', label: 'SPI' },
  { value: 'uart', label: 'UART' },
  { value: 'custom', label: 'Custom' },
];

// ---------------------------------------------------------------------------
// formatHardware: actuator/sensor ka hardware summary text
// Example: { interface:'gpio', gpio:18 } -> "GPIO 18"
// ---------------------------------------------------------------------------
interface HardwareLike {
  interface?: string;
  gpio?: number | string;
  pins?: Record<string, number | string>;
  address?: string;
}

export function formatHardware(item: HardwareLike): string {
  const iface = (item.interface || 'gpio').toUpperCase();
  const parts: string[] = [];

  if (item.gpio !== undefined && item.gpio !== null && item.gpio !== '') parts.push(`${item.gpio}`);
  if (item.address) parts.push(`@${item.address}`);
  if (item.pins && Object.keys(item.pins).length) {
    parts.push(Object.entries(item.pins).map(([k, v]) => `${k}:${v}`).join(','));
  }

  return parts.length ? `${iface} ${parts.join(' ')}` : iface;
}

// ---------------------------------------------------------------------------
// parseJsonObject: textbox ka JSON text -> object
//  - khali text  -> undefined (matlab field bharna zaroori nahi)
//  - galat JSON  -> Error throw (parent toast mein dikha deta hai)
//  - array/number -> Error (sirf { ... } object allowed)
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseJsonObject(text: string, label: string): Record<string, any> | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} must be valid JSON, e.g. {"sda": 21, "scl": 22}`);
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object like { "key": value }`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return parsed as Record<string, any>;
}

// ---------------------------------------------------------------------------
// HardwareConfigFields: form ke hardware wale fields
// Props parent (ActuatorsPage) se controlled aate hain: value + onChange.
// ---------------------------------------------------------------------------
interface HardwareConfigFieldsProps {
  interfaceType: HardwareInterface;
  onInterfaceChange: (v: HardwareInterface) => void;
  gpio: string;
  onGpioChange: (v: string) => void;
  pinsJson: string;
  onPinsChange: (v: string) => void;
  address: string;
  onAddressChange: (v: string) => void;
  parametersJson: string;
  onParametersChange: (v: string) => void;
}

export function HardwareConfigFields({
  interfaceType,
  onInterfaceChange,
  gpio,
  onGpioChange,
  pinsJson,
  onPinsChange,
  address,
  onAddressChange,
  parametersJson,
  onParametersChange,
}: HardwareConfigFieldsProps) {
  const iface = String(interfaceType);

  // Kaunsa interface kaunse fields maangta hai
  const needsGpio = ['gpio', 'pwm', 'adc'].includes(iface);
  const needsPins = ['i2c', 'spi', 'uart', 'custom'].includes(iface);
  const needsAddress = ['i2c', 'uart', 'custom'].includes(iface);

  return (
    <div className="space-y-4">
      {/* Interface type chunne ka dropdown */}
      <Select
        label="Hardware Interface"
        value={iface}
        onChange={(e) => onInterfaceChange(e.target.value as HardwareInterface)}
        options={INTERFACE_OPTIONS}
      />

      {/* Single GPIO pin number (gpio / pwm / adc) */}
      {needsGpio && (
        <Input
          label="GPIO Pin"
          type="number"
          placeholder="18"
          value={gpio}
          onChange={(e) => onGpioChange(e.target.value)}
        />
      )}

      {/* Multi-pin interfaces ke liye JSON, jaise {"sda":21,"scl":22} */}
      {needsPins && (
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Pins (JSON)</label>
          <textarea
            rows={2}
            className="input-dark w-full font-mono text-xs"
            placeholder='{"sda": 21, "scl": 22}'
            value={pinsJson}
            onChange={(e) => onPinsChange(e.target.value)}
          />
        </div>
      )}

      {/* I2C address ya UART port jaisa identifier */}
      {needsAddress && (
        <Input
          label="Address / Port"
          placeholder="0x27"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
        />
      )}

      {/* Extra parameters (optional), jaise {"activeLow": true, "freq": 5000} */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Parameters (JSON, optional)</label>
        <textarea
          rows={2}
          className="input-dark w-full font-mono text-xs"
          placeholder='{"activeLow": true}'
          value={parametersJson}
          onChange={(e) => onParametersChange(e.target.value)}
        />
      </div>
    </div>
  );
}
