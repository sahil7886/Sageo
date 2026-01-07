import React from 'react';
import { Link } from 'react-router-dom';

const agents = [
  { id: 1, name: 'Nexus Trader', success: '99.2%', tags: ['DeFi', 'HFT', 'MOI'], desc: 'High-frequency trading agent optimized for arbitrage opportunities across the MOI network.', verified: true, latency: '12ms', tx: '1.2M', color: 'from-[#17a1cf] to-[#0f4d61]', icon: 'N' },
  { id: 2, name: 'Sage Analyst', success: '95.0%', tags: ['NLP', 'Analytics'], desc: 'Real-time sentiment analysis on crypto markets using advanced NLP models.', verified: false, latency: '450ms', tx: '45k', color: 'from-indigo-500 to-purple-600', icon: 'S' },
  { id: 3, name: 'Alpha Seeker', success: '98.5%', tags: ['Audit', 'Security'], desc: 'Scours new token launches for liquidity locks and contract safety. Automated auditing agent.', verified: true, latency: '2s', tx: '120k', color: 'from-orange-500 to-red-600', icon: 'A' },
  { id: 4, name: 'Echo Stream', success: '88.9%', tags: ['Social', 'Curator'], desc: 'Connects decentralized social graphs to generate curated content feeds. Specialized for Farcaster & Lens.', verified: true, latency: '800ms', tx: '500k', color: 'from-emerald-500 to-teal-700', icon: 'E' },
  { id: 5, name: 'Velocimeter', success: '97.1%', tags: ['Bridge', 'DeFi'], desc: 'Cross-chain bridge aggregator finding the cheapest and fastest routes for asset transfer.', verified: false, latency: '5s', tx: '89k', color: 'from-pink-500 to-rose-600', icon: 'V' },
  { id: 6, name: 'ZeroKnowledge', success: '99.9%', tags: ['Privacy', 'ZK'], desc: 'Private transaction mixer ensuring anonymity for whale movements. Fully compliant with ZK-proofs.', verified: true, latency: '15s', tx: '5k', color: 'from-gray-700 to-gray-900', icon: 'Z' },
];

const Discovery = () => {
  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-72 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-surface-border p-6 lg:h-[calc(100vh-73px)] lg:sticky lg:top-[73px] overflow-y-auto bg-background-dark">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white text-lg font-bold">Filters</h3>
          <button className="text-xs text-text-secondary hover:text-white transition-colors">Reset</button>
        </div>
        
        <div className="mb-8">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Capabilities</h4>
          <div className="space-y-1">
             {['Streaming', 'Push Notifications', 'Wallet Access', 'Multi-sig'].map((cap, i) => (
               <label key={i} className="flex items-center gap-3 py-2 cursor-pointer group">
                 <input type="checkbox" className="h-4 w-4 rounded border-surface-border bg-surface-dark text-primary focus:ring-offset-0 focus:ring-0 cursor-pointer" defaultChecked={i === 0} />
                 <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{cap}</span>
               </label>
             ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
             <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Min Trust Score</h4>
             <span className="text-primary font-mono text-xs font-bold">90%</span>
          </div>
          <div className="px-1">
             <input type="range" min="0" max="100" defaultValue="90" className="w-full bg-transparent appearance-none h-1 bg-surface-border rounded-lg" />
          </div>
           <div className="flex justify-between mt-2 text-[10px] text-text-secondary font-mono">
             <span>0%</span>
             <span>100%</span>
           </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Skills & Tags</h4>
          <div className="flex flex-wrap gap-2">
            {['DeFi', 'Arbitrage', 'NLP', 'Analysis', 'Trading', 'Image Gen', 'Coding'].map((tag, i) => (
              <button key={i} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${i === 0 ? 'bg-primary text-white border-primary' : 'bg-surface-dark text-text-secondary hover:text-white border-surface-border hover:border-primary/50'}`}>{tag}</button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-6 md:p-10 pb-0">
          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Agent Discovery</h1>
            <p className="text-text-secondary text-base md:text-lg">Find trusted AI Agents for your workflow on the MOI network.</p>
          </div>
          
          <div className="relative w-full max-w-3xl mb-8 group z-20">
             <div className="flex w-full items-stretch rounded-xl h-14 bg-surface-dark border border-surface-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-lg">
                <div className="flex items-center justify-center pl-4 text-text-secondary"><span className="material-symbols-outlined">search</span></div>
                <input className="flex-1 bg-transparent border-none text-white placeholder:text-text-secondary px-4 focus:ring-0 text-base h-full w-full" placeholder="Search agents by name, tag, or capability..." />
                <div className="hidden sm:flex items-center pr-2">
                   <div className="h-8 px-2 flex items-center gap-1 rounded bg-[#293438] text-[10px] text-text-secondary border border-[#3c4d53]">
                      <span className="font-bold">CMD</span><span>+</span><span className="font-bold">K</span>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
             <p className="text-white text-sm font-medium"><span className="font-bold">248</span> Agents found</p>
             <div className="flex items-center gap-3">
               <span className="text-text-secondary text-sm">Sort by:</span>
               <button className="flex items-center gap-1 text-white text-sm font-medium hover:text-primary transition-colors">Relevance <span className="material-symbols-outlined text-sm">expand_more</span></button>
             </div>
          </div>
        </div>

        <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {agents.map((agent) => (
             <div key={agent.id} className="group relative flex flex-col rounded-xl border border-surface-border bg-surface-dark p-5 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(23,161,207,0.1)] transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                   <div className="flex items-center gap-3">
                      <div className={`size-12 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center text-white font-bold text-lg`}>{agent.icon}</div>
                      <div>
                         <h3 className="text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors">{agent.name}</h3>
                         <div className="flex items-center gap-1 mt-0.5">
                            <span className={`material-symbols-outlined text-[16px] ${agent.verified ? 'text-primary' : 'text-text-secondary'}`}>verified</span>
                            <span className="text-xs text-text-secondary font-medium">{agent.verified ? 'Verified Agent' : 'Unverified'}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex flex-col items-end">
                      <div className={`font-mono text-sm font-bold px-2 py-1 rounded border ${agent.verified ? 'text-primary bg-primary/10 border-primary/20' : 'text-green-400 bg-green-400/10 border-green-400/20'}`}>{agent.success}</div>
                      <span className="text-[10px] text-text-secondary mt-1">Success Rate</span>
                   </div>
                </div>
                <p className="text-text-secondary text-sm mb-5 leading-relaxed line-clamp-2">{agent.desc}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                   {agent.tags.map(tag => (
                      <span key={tag} className="text-[10px] uppercase font-bold tracking-wider text-gray-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">{tag}</span>
                   ))}
                </div>
                <div className="mt-auto pt-4 border-t border-surface-border flex items-center justify-between">
                   <div className="flex items-center gap-4 text-xs text-text-secondary font-mono">
                      <span className="flex items-center gap-1" title="Latency"><span className="material-symbols-outlined text-[14px]">bolt</span> {agent.latency}</span>
                      <span className="flex items-center gap-1" title="Transactions"><span className="material-symbols-outlined text-[14px]">swap_horiz</span> {agent.tx}</span>
                   </div>
                   <Link to={`/agent/${agent.id}`} className="text-white text-sm font-bold hover:text-primary flex items-center gap-1 transition-colors">
                      View Profile <span className="material-symbols-outlined text-sm">arrow_forward</span>
                   </Link>
                </div>
             </div>
           ))}
        </div>

        <div className="flex items-center justify-center py-10">
           <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-surface-border hover:bg-surface-dark focus:z-20 focus:outline-offset-0">
                 <span className="sr-only">Previous</span>
                 <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="relative z-10 inline-flex items-center bg-primary px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">1</button>
              <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-surface-border hover:bg-surface-dark focus:z-20 focus:outline-offset-0">2</button>
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-500 ring-1 ring-inset ring-surface-border focus:outline-offset-0">...</span>
              <button className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-surface-border hover:bg-surface-dark focus:z-20 focus:outline-offset-0">
                 <span className="sr-only">Next</span>
                 <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
           </nav>
        </div>
      </div>
    </div>
  );
};

export default Discovery;