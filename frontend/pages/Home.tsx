import React from 'react';
import { Link } from 'react-router-dom';

const recentInteractions = [
  { name: 'Agent-Alpha', id: '#8821', type: 'Data Query', typeColor: 'emerald', tx: '0x8f72...2a91', time: '2s ago', logo: 'bg-gradient-to-br from-blue-500 to-cyan-400' },
  { name: 'TradingBot_X', id: '#1094', type: 'Token Swap', typeColor: 'indigo', tx: '0x3c11...9b22', time: '5s ago', logo: 'bg-gradient-to-br from-purple-500 to-pink-400' },
  { name: 'Oracle_V2', id: '#5592', type: 'Identity Verify', typeColor: 'blue', tx: '0x1d44...441a', time: '12s ago', logo: 'bg-gradient-to-br from-orange-500 to-amber-400' },
  { name: 'Sentinel_AI', id: '#9901', type: 'Alert Trigger', typeColor: 'rose', tx: '0x99a1...bb02', time: '32s ago', logo: 'bg-gradient-to-br from-slate-600 to-slate-500' },
];

const Home = () => {
  return (
    <>
      <main className="flex-grow flex flex-col items-center justify-center relative w-full overflow-hidden">
        {/* Abstract Background Pattern */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center gap-12 relative z-10">
          {/* Hero Text */}
          <div className="flex flex-col items-center pt-8 text-center gap-6 max-w-3xl animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-surface-dark border border-surface-border mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live on Moi Babylon</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight bg-gradient-to-b pb-2 from-white to-white/60 bg-clip-text text-transparent">
              The Trust Layer for <br className="hidden md:block" /> AI Agents
            </h1>
            <p className="text-lg text-slate-400 font-normal leading-relaxed max-w-xl">
              Verify, discover, and interact with autonomous agents on the MOI blockchain. The decentralized registry for the agent economy.
            </p>
          </div>

          {/* Search Component */}
          <form
            className="w-full max-w-2xl group pb-20 animate-[fadeIn_0.8s_ease-out_0.2s_both]"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const input = form.querySelector('input') as HTMLInputElement;
              if (input.value.trim()) {
                window.location.hash = `/discovery?q=${encodeURIComponent(input.value.trim())}`;
              }
            }}
          >
            <div className="relative flex items-center w-full h-16 rounded-xl bg-surface-dark border border-surface-border shadow-xl shadow-black/20 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all duration-300">
              <div className="flex items-center justify-center pl-5 text-slate-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[28px]">search</span>
              </div>
              <input
                className="w-full h-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-400 text-lg px-4"
                placeholder="Search by Agent ID, Name, or Capability..."
                type="text"
              />
              <div className="pr-2 hidden sm:block">
                <button type="submit" className="h-10 px-4 rounded-lg bg-primary hover:bg-primary/80 text-xs font-bold text-white transition-all">
                  Search
                </button>
              </div>
            </div>
          </form>


          {/* View Activity */}
          <div className="animate-[fadeIn_1s_ease-out_0.4s_both]">
            <button
              onClick={() => document.getElementById('activity-feed')?.scrollIntoView({ behavior: 'smooth' })}
              className="group flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors cursor-pointer"
            >
              <span className="text-xs tracking-wide">View Network Activity</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform">arrow_downward</span>
            </button>
          </div>
        </div>
      </main>

      {/* Activity Feed Section */}
      <section id="activity-feed" className="w-full bg-[#0e1518] border-t border-surface-border py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Recent Interactions
            </h3>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg hover:bg-surface-dark text-slate-400 transition-colors">
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </button>
              <button className="p-2 rounded-lg hover:bg-surface-dark text-slate-400 transition-colors">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
            </div>
          </div>

          {/* Table Component */}
          <div className="w-full overflow-hidden rounded-xl border border-surface-border bg-surface-dark shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border bg-black/20">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-1/4">Agent Name</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-1/4">Interaction Type</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-1/4">Tx Hash</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-1/4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {recentInteractions.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded ${item.logo} flex items-center justify-center text-white font-bold text-xs shadow-lg`}>{item.name[0]}</div>
                          <div>
                            <Link to={`/agent/${item.id.replace('#', '')}`} className="text-sm font-medium text-white hover:text-primary transition-colors">{item.name}</Link>
                            <div className="text-xs text-slate-400">ID: {item.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-${item.typeColor}-500/10 text-${item.typeColor}-400 border border-${item.typeColor}-500/20`}>
                          <span className={`w-1.5 h-1.5 rounded-full bg-${item.typeColor}-400`}></span>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                          <span>{item.tx}</span>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary">
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-slate-400">{item.time}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer of table */}
            <div className="px-6 py-3 bg-black/20 border-t border-surface-border flex items-center justify-between">
              <span className="text-xs text-slate-500">Showing last 4 interactions</span>
              <Link to="/discovery" className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1">
                View all transactions <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;