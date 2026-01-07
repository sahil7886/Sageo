import React from 'react';
import { Link } from 'react-router-dom';

const Developers = () => {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-10 py-8 lg:py-12">
      {/* Hero Section */}
      <div className="flex flex-col gap-10 lg:flex-row mb-16 lg:mb-24">
        {/* Left: Text Content */}
        <div className="flex flex-col justify-center gap-6 lg:w-1/2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">v2.0 SDK Live</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white">
            The Trust Layer for <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">AI Agents</span> on MOI
          </h1>
          <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
            Register, manage, and verify your autonomous agents with the Sageo SDK. Enable verifiable interactions and build trust into your AI agents today.
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <Link to="/register" className="flex h-12 items-center justify-center px-6 rounded-lg bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(23,161,207,0.3)]">
              Register Agent
            </Link>
            <Link to="/docs" className="flex h-12 items-center justify-center px-6 rounded-lg bg-surface-border text-white font-bold text-base hover:bg-[#354348] transition-all">
              <span className="mr-2">View Documentation</span>
              <span className="material-symbols-outlined text-sm">arrow_outward</span>
            </Link>
          </div>
          <div className="flex items-center gap-6 text-slate-500 text-sm font-medium mt-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
              <span>Audited Security</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">code</span>
              <span>Type-safe SDK</span>
            </div>
          </div>
        </div>

        {/* Right: Code/Visual */}
        <div className="flex lg:w-1/2 items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-lg">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-xl blur opacity-20"></div>
            {/* Code Window */}
            <div className="relative rounded-xl bg-[#0f1416] border border-surface-border overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#161b1d] border-b border-surface-border">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <div className="ml-auto text-xs text-slate-500 font-mono">install.sh</div>
              </div>
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">$</span>
                  <span className="text-slate-300">npm install <span className="text-primary">@sageo/sdk</span></span>
                </div>
                <div className="flex gap-4 mt-4 group">
                  <span className="text-slate-600 select-none">1</span>
                  <span><span className="text-purple-400">import</span> <span className="text-slate-300">{`{ SageoClient }`}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'@sageo/sdk'</span>;</span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">2</span>
                  <span className="text-slate-500">// Initialize client</span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">3</span>
                  <span><span className="text-purple-400">const</span> <span className="text-blue-400">client</span> = <span className="text-purple-400">new</span> <span className="text-yellow-300">SageoClient</span>({`{`}</span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">4</span>
                  <span className="text-slate-300 pl-4">network: <span className="text-green-400">'moi-mainnet'</span>,</span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">5</span>
                  <span className="text-slate-300 pl-4">apiKey: process.env.SAGEO_KEY</span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">6</span>
                  <span className="text-slate-300">{`});`}</span>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Ready to start building?</span>
                  <button className="text-xs flex items-center gap-1 text-primary hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[14px]">content_copy</span> Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Agent Management (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">Agent Console</h2>
            <Link to="/register" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Register New Agent
            </Link>
          </div>
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="bg-surface-dark border border-surface-border p-4 rounded-lg">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Agents</p>
              <p className="text-2xl font-bold text-white mt-1">12</p>
            </div>
            <div className="bg-surface-dark border border-surface-border p-4 rounded-lg">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active</p>
              <p className="text-2xl font-bold text-green-500 mt-1">08</p>
            </div>
            <div className="bg-surface-dark border border-surface-border p-4 rounded-lg">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-yellow-500 mt-1">04</p>
            </div>
          </div>
          
          {/* Agent Table */}
          <div className="w-full overflow-hidden rounded-lg border border-surface-border bg-surface-dark shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-[#161b1d] border-b border-surface-border">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Agent Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ID Hash</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  <tr className="group hover:bg-[#1f292c] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">TB</div>
                        <div>
                          <div className="text-sm font-medium text-white">TradingBot_v1</div>
                          <div className="text-xs text-slate-500">Last active: 2m ago</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-[#2c3639] px-2 py-1 rounded text-slate-300 font-mono">0x71...3a9</code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                  {/* More rows would go here */}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Benefits & Resources (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Why Sageo?</h2>
          {[
            { icon: 'fingerprint', color: 'blue', title: 'Verifiable Identity', desc: 'Give your agents a unique, on-chain identity that users can trust and verify cryptographically.' },
            { icon: 'travel_explore', color: 'purple', title: 'Global Discovery', desc: 'Get indexed in the global Sageo registry, making your agents discoverable by users and other agents.' },
            { icon: 'receipt_long', color: 'green', title: 'Interaction Proof', desc: 'Log critical interactions on the MOI blockchain for audit trails and dispute resolution.' }
          ].map((item, i) => (
             <div key={i} className="p-5 rounded-xl bg-surface-dark border border-surface-border group hover:border-primary/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg bg-${item.color}-500/10 flex items-center justify-center text-${item.color}-500`}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-snug">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-4 pt-6 border-t border-surface-border">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Developer Resources</h4>
            <div className="flex flex-col gap-3">
              {['API Reference', 'CLI Tools', 'Community Discord'].map((link, i) => (
                <a key={i} href="#" className="flex items-center justify-between p-3 rounded-lg bg-surface-border hover:bg-[#354348] transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-white text-[20px]">{i === 0 ? 'menu_book' : i === 1 ? 'terminal' : 'forum'}</span>
                    <span className="text-sm font-medium text-slate-200 group-hover:text-white">{link}</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_forward</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developers;