// ============================================================================
// ActuatorCard.tsx
// ----------------------------------------------------------------------------
// Ye component ek actuator (relay, buzzer, LED, motor, servo, fan...) ka card
// dikhata hai jisme:
//   1. Actuator ka naam, type, hardware info aur ON/OFF badge
//   2. Command bhejne ka form (command + value + auto-off duration)
//   3. Duration presets (5s, 10s, ...) aur live countdown "OFF in 4s"
//   4. Fallback auto-off timer (browser se OFF command bhejta hai)
//
// Flow: Browser -> REST API -> Backend -> MQTT (HiveMQ) -> ESP32
// ============================================================================

import { useEffect, useState } from 'react';
import { Power, Send, SlidersHorizontal, Timer } from 'lucide-react'; // icons
import type { Actuator, CommandPayload } from '@/types';               // TypeScript types
import { actuatorApi } from '@/services';                              // backend API calls
import { Button } from './ui/Button';
import { useToast } from '@/context/ToastContext';                     // popup messages
import { Badge } from './ui/Badge';
import { formatHardware } from './HardwareConfigFields';               // "GPIO 18" jaisa text banata hai

// Props: parent (ActuatorsPage) se aane wali cheezein
interface ActuatorCardProps {
  actuator: Actuator;      // is card ka actuator data
  onChanged?: () => void;  // command ke baad list refresh karne ke liye (optional)
}

// State kai formats mein aa sakti hai (true, 'on', 'ON', '1', 'HIGH'...).
// Ye helper sabko ek boolean mein badal deta hai: ON = true, OFF = false.
function isOn(state: string | boolean) {
  return state === true || state === 'true' || state === 'on' || state === 'ON' || state === '1' || state === 'HIGH';
}

/* ========================================================================== */
/* AUTO-OFF SCHEDULER (module level)                                          */
/* -------------------------------------------------------------------------- */
/* Ye variables component ke BAHAR hain. Isliye agar user dusre page pe jaye  */
/* aur wapas aaye (component unmount/mount), tab bhi timer chalta rehta hai.  */
/*                                                                            */
/* NOTE: Ye sirf FALLBACK hai. Agar ESP32 firmware khud duration ke baad OFF  */
/* kar deta hai, to ye extra OFF command harmless hai (device pehle se OFF).  */
/* Browser tab band karne par ye timer ruk jata hai, isliye asli auto-off     */
/* firmware/backend mein hona chahiye.                                        */
/* ========================================================================== */

// Duration khatam hone ke baad thoda extra wait (ms), taaki firmware ko
// pehle khud OFF karne ka mauka mile. Phir bhi ON raha to hum OFF bhejenge.
const OFF_GRACE_MS = 1500;

// actuatorId -> chal raha setTimeout ka handle (cancel karne ke kaam aata hai)
const pendingOff = new Map<string, ReturnType<typeof setTimeout>>();

// actuatorId -> woh time (epoch ms) jab actuator OFF hona chahiye (countdown ke liye)
const deadlines = new Map<string, number>();

// Kisi actuator ka pending auto-off timer cancel karta hai.
// Use hota hai jab: naya command aaye, ya actuator khud OFF ho jaye.
function cancelAutoOff(id: string) {
  const t = pendingOff.get(id);
  if (t) clearTimeout(t);   // agar timer chal raha hai to rok do
  pendingOff.delete(id);
  deadlines.delete(id);
}

// Naya auto-off timer lagata hai.
//  id      -> actuator ka id
//  seconds -> kitne second baad OFF karna hai
//  onDone  -> OFF bhejne ke baad chalne wala callback (list refresh)
function scheduleAutoOff(id: string, seconds: number, onDone?: () => void) {
  cancelAutoOff(id); // pehle purana timer hatao (double timer se bachne ke liye)

  // Countdown ke liye deadline save karo
  deadlines.set(id, Date.now() + seconds * 1000);

  const timer = setTimeout(async () => {
    // Time pura ho gaya: bookkeeping saaf karo
    pendingOff.delete(id);
    deadlines.delete(id);
    try {
      // Backend ko OFF command bhejo (backend MQTT se ESP32 ko forward karega)
      await actuatorApi.sendCommand(id, { command: 'OFF' });
    } catch {
      // Ignore: device pehle se OFF ho sakta hai ya offline ho sakta hai
    } finally {
      onDone?.(); // UI refresh
    }
  }, seconds * 1000 + OFF_GRACE_MS);

  pendingOff.set(id, timer);
}

// Kin commands ke saath duration (auto-off) sense karta hai.
// OFF ke saath duration ka koi matlab nahi, isliye woh list mein nahi hai.
const TIMED_COMMANDS = ['ON', 'TOGGLE', 'SET', 'PWM', 'SERVO'];

// Quick-select chips ki list (label = jo dikhega, seconds = asli value)
const PRESETS: { label: string; seconds: number }[] = [
  { label: '5s', seconds: 5 },
  { label: '10s', seconds: 10 },
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
];

// Milliseconds ko readable text mein badalta hai: 65000 -> "1m 05s", 4000 -> "4s"
function formatRemaining(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000)); // negative nahi hone dena
  const m = Math.floor(s / 60);                // poore minutes
  const r = s % 60;                            // bache hue seconds
  return m > 0 ? `${m}m ${String(r).padStart(2, '0')}s` : `${r}s`;
}

/* ========================================================================== */
/* MAIN COMPONENT                                                             */
/* ========================================================================== */
export function ActuatorCard({ actuator, onChanged }: ActuatorCardProps) {
  const { show } = useToast(); // toast popup dikhane ka function

  // ---- Form ki state ----
  const [command, setCommand] = useState('ON');   // dropdown ka selected command
  const [value, setValue] = useState('');         // optional value (PWM duty, servo angle...)
  const [duration, setDuration] = useState('');   // auto-off seconds (string kyunki input hai)
  const [sending, setSending] = useState(false);  // true = request chal rahi hai (button loading)

  // Countdown ke liye bacha hua time (ms). null = koi timer nahi chal raha.
  const [remaining, setRemaining] = useState<number | null>(null);

  // Actuator abhi ON hai ya nahi (backend/realtime se aaye state ke basis pe)
  const active = isOn(actuator.state);

  // Kya current selected command ke saath duration allowed hai?
  const timedAllowed = TIMED_COMMANDS.includes(command);

  // ------------------------------------------------------------------------
  // EFFECT 1: Countdown display
  // Har 500ms pe module-level deadline padhta hai aur remaining update karta
  // hai. Kyunki deadline module level pe hai, page wapas aane par bhi sahi
  // countdown dikhta hai.
  // ------------------------------------------------------------------------
  useEffect(() => {
    const tick = () => {
      const d = deadlines.get(actuator._id);
      setRemaining(d ? d - Date.now() : null);
    };
    tick();                                  // turant ek baar chalao
    const id = setInterval(tick, 500);       // phir har 500ms
    return () => clearInterval(id);          // unmount pe interval band (memory leak se bachao)
  }, [actuator._id]);

  // ------------------------------------------------------------------------
  // EFFECT 2: Agar device ne khud OFF report kar diya (realtime se), to hamara
  // fallback timer bekar hai, use cancel kar do.
  // 3 second ka wait isliye ki ON command bhejne ke turant baad state thodi
  // der mein update hoti hai; jaldi cancel na ho jaye.
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (!active && deadlines.has(actuator._id)) {
      const t = setTimeout(() => {
        // 3 sec baad bhi OFF hai to hi cancel karo
        if (!isOn(actuator.state)) cancelAutoOff(actuator._id);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [active, actuator._id, actuator.state]);

  // ------------------------------------------------------------------------
  // "Send Command" button ka handler
  // ------------------------------------------------------------------------
  const sendCommand = async () => {
    const cmd = command.trim().toUpperCase();

    // ---- Step 1: Duration validate karo ----
    let durationSec: number | undefined;
    if (duration.trim()) {
      const n = Number(duration);
      // Sirf poora number, 1 se 86400 (24 ghante) ke beech
      if (!Number.isInteger(n) || n < 1 || n > 86400) {
        show('Duration must be a whole number between 1 and 86400 seconds', 'error');
        return; // galat input: yahin ruk jao
      }
      // Duration sirf timed commands ke saath use hogi (OFF ke saath nahi)
      if (TIMED_COMMANDS.includes(cmd)) durationSec = n;
    }

    setSending(true); // button ko loading mode mein daalo
    try {
      // ---- Step 2: Value ko sahi type mein badlo ----
      // 'true'/'false' -> boolean, number jaisa text -> number, warna string
      let parsedValue: boolean | number | string | undefined;
      if (value.trim()) {
        if (value.trim().toLowerCase() === 'true') parsedValue = true;
        else if (value.trim().toLowerCase() === 'false') parsedValue = false;
        else if (Number.isFinite(Number(value))) parsedValue = Number(value);
        else parsedValue = value.trim();
      }

      // ---- Step 3: Payload banao ----
      // Spread (...) se optional fields tabhi judte hain jab unki value ho.
      const payload: CommandPayload = {
        command: cmd,
        ...(parsedValue !== undefined ? { value: parsedValue } : {}),
        ...(durationSec !== undefined ? { duration: durationSec } : {}),
      };

      // ---- Step 4: Backend ko bhejo (REST -> MQTT -> ESP32) ----
      await actuatorApi.sendCommand(actuator._id, payload);

      // ---- Step 5: Auto-off timer sambhalo ----
      // Naya command purane auto-off ko replace karta hai, isliye pehle cancel...
      cancelAutoOff(actuator._id);
      // ...aur agar duration di gayi hai to naya timer lagao.
      if (durationSec !== undefined) {
        scheduleAutoOff(actuator._id, durationSec, onChanged);
        show(`Command ${cmd} sent — auto OFF in ${formatRemaining(durationSec * 1000)}`, 'success');
      } else {
        show(`Command ${cmd} sent to ESP32`, 'success');
      }

      onChanged?.(); // parent ko bolo list refresh kare
    } catch (err) {
      // Error se readable message nikalo (agar 'message' field hai to woh)
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to send command';
      show(msg, 'error');
    } finally {
      setSending(false); // success ho ya fail, button wapas normal
    }
  };

  // ------------------------------------------------------------------------
  // UI (JSX)
  // ------------------------------------------------------------------------
  return (
    // Card: ON hai to amber glow aur border, OFF hai to normal
    <div className={`glass-card p-6 transition-all ${active ? 'border-accent-amber/30 shadow-glow-amber' : 'hover:border-white/10'}`}>

      {/* ---------- Header: icon + naam + badge ---------- */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Power icon: ON = amber, OFF = grey */}
          <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${active ? 'bg-accent-amber/20' : 'bg-ink-700/80 border border-white/5'}`}>
            <Power className={`w-6 h-6 ${active ? 'text-accent-amber' : 'text-gray-500'}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{actuator.name}</h3>
            {/* Type + hardware info, jaise "relay · GPIO 18" */}
            <p className="text-xs text-gray-500 font-mono capitalize truncate">{actuator.type} · {formatHardware(actuator)}</p>
          </div>
        </div>

        {/* Right side: ON/OFF badge + (agar timer chal raha hai) countdown */}
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={active ? 'warning' : 'default'} dot>{active ? 'ON' : 'OFF'}</Badge>
          {remaining !== null && remaining > 0 && (
            <span className="flex items-center gap-1 text-xs text-accent-amber font-mono">
              <Timer className="w-3 h-3" />OFF in {formatRemaining(remaining)}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* ---------- Row 1: command dropdown, value, duration ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Command chunne ka dropdown */}
          <select value={command} onChange={(e) => setCommand(e.target.value)} className="input-dark">
            {['ON', 'OFF', 'TOGGLE', 'SET', 'PWM', 'SERVO'].map((c) => <option key={c}>{c}</option>)}
          </select>

          {/* Optional value: PWM duty, servo angle, custom string, etc. */}
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value (optional)" className="input-dark" />

          {/* Auto-off duration (seconds). OFF command ke saath disabled. */}
          <input
            type="number"
            min={1}
            max={86400}
            step={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Auto-off after (sec)"
            disabled={!timedAllowed}
            title={timedAllowed ? 'Actuator will turn OFF automatically after this many seconds' : 'Duration is not used with OFF'}
            className="input-dark disabled:opacity-40"
          />
        </div>

        {/* ---------- Row 2: duration preset chips (sirf timed commands pe) ---------- */}
        {timedAllowed && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-500 mr-1">Auto-off:</span>
            {PRESETS.map((p) => (
              <button
                key={p.seconds}
                type="button"
                onClick={() => setDuration(String(p.seconds))} // chip dabane par input bhar jata hai
                // Selected chip amber highlight hota hai
                className={`px-2 py-0.5 rounded-md text-xs font-mono border transition-colors ${duration === String(p.seconds) ? 'border-accent-amber/50 text-accent-amber bg-accent-amber/10' : 'border-white/10 text-gray-400 hover:text-white'}`}
              >{p.label}</button>
            ))}
            {/* Duration bhari hai to "clear" button dikhao */}
            {duration && (
              <button type="button" onClick={() => setDuration('')} className="px-2 py-0.5 rounded-md text-xs text-gray-500 hover:text-white">clear</button>
            )}
          </div>
        )}

        {/* ---------- Send button ---------- */}
        <Button onClick={sendCommand} loading={sending} disabled={sending} className="w-full">
          <SlidersHorizontal className="w-4 h-4" />Send Command
        </Button>

        {/* Data ka raasta dikhata chhota label */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><Send className="w-3 h-3" /> REST → MQTT → ESP32</div>
      </div>
    </div>
  );
}