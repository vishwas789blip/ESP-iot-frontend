import { Link } from 'react-router-dom';
import { Cpu, Zap, Waves, Volume2, ArrowRight, Github, Shield, Radio } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-900 grid-bg overflow-x-hidden">
      <nav className="fixed top-0 inset-x-0 z-50 bg-ink-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-accent-cyan" />
            </div>
            <span className="font-bold text-white">ESP32 IoT</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-ink-900 bg-accent-cyan hover:bg-accent-cyan/90 px-4 py-2 rounded-lg transition-all shadow-glow"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-4 lg:px-8">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent-cyan/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 mb-6 animate-fade-in">
            <Radio className="w-4 h-4 text-accent-cyan" />
            <span className="text-xs font-medium text-accent-cyan">Real-time IoT Control Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight max-w-4xl mx-auto leading-tight animate-fade-in">
            Command your <span className="text-accent-cyan">ESP32</span> from anywhere
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mt-6 animate-fade-in">
            A self-programmable IoT platform for monitoring sensors, controlling actuators, and building automation rules — all through a clean REST API and real-time dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 animate-fade-in">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 text-base font-semibold text-ink-900 bg-accent-cyan hover:bg-accent-cyan/90 px-6 py-3 rounded-xl transition-all shadow-glow"
            >
              Start Building
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-base font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 px-6 py-3 rounded-xl transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="glass-card p-6 lg:p-8 rounded-2xl border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Waves, title: 'Sensor Monitoring', desc: 'Real-time PIR motion detection and sensor telemetry streaming from your ESP32.', color: 'text-accent-cyan' },
                { icon: Volume2, title: 'Actuator Control', desc: 'Send commands to buzzers, relays, and motors via REST API → MQTT → hardware.', color: 'text-accent-amber' },
                { icon: Zap, title: 'Smart Automations', desc: 'Build visual rules: when motion is detected, activate the buzzer for 5 seconds.', color: 'text-accent-green' },
              ].map((f) => (
                <div key={f.title} className="text-center md:text-left">
                  <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3 mx-auto md:mx-0`}>
                    <f.icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'REST API', value: '100%' },
            { label: 'MQTT Bridge', value: 'Backend' },
            { label: 'GPIO Control', value: '26 + 27' },
            { label: 'Architecture', value: 'Scalable' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className="text-xl font-bold text-accent-cyan">{s.value}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative py-20 px-4 lg:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Register', desc: 'Create your account' },
              { step: '02', title: 'Add Device', desc: 'Connect your ESP32' },
              { step: '03', title: 'Monitor', desc: 'View sensor data live' },
              { step: '04', title: 'Automate', desc: 'Build smart rules' },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="text-3xl font-bold text-accent-cyan/30 mb-2">{s.step}</div>
                <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent-cyan" />
            <span className="text-sm text-gray-500">ESP32 IoT Platform</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> JWT Auth</span>
            <span className="flex items-center gap-1"><Github className="w-4 h-4" /> Open Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
