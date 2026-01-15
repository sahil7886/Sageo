import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAgents, AgentProfile } from '../lib/api';

const Developers = () => {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgents = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchAgents();
        setAgents(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, []);

  // Calculate stats from fetched agents
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.status === 'ACTIVE').length;
  const pendingAgents = agents.filter(a => a.status === 'INACTIVE' || !a.status).length;

  // Helper to get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return '??';
    const words = name.split(/[\s_-]/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper to truncate ID hash
  const truncateId = (id: string) => {
    if (!id) return 'N/A';
    if (id.length <= 10) return id;
    return `${id.substring(0, 4)}...${id.substring(id.length - 3)}`;
  };

  // Helper to format relative time
  const formatLastActive = (updatedAt?: number) => {
    if (!updatedAt) return 'Never';
    const now = Date.now();
    const diff = now - updatedAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Helper to get status badge styles
  const getStatusBadge = (status?: string) => {
    const statusUpper = status?.toUpperCase() || 'INACTIVE';
    if (statusUpper === 'ACTIVE') {
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/20',
        dot: 'bg-green-500',
        label: 'Active'
      };
    }
    return {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/20',
      dot: 'bg-yellow-500',
      label: statusUpper === 'SUSPENDED' ? 'Suspended' : 'Pending'
    };
  };

  // Helper to get gradient colors for avatar
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-500 to-cyan-400',
      'from-indigo-500 to-purple-400',
      'from-orange-500 to-red-400',
      'from-emerald-500 to-teal-400',
      'from-pink-500 to-rose-400',
      'from-gray-500 to-gray-400',
    ];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

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
                  <span className="text-slate-300">npm install <span className="text-primary">@sageo/interaction-sdk</span></span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span className="text-slate-600 select-none">+</span>
                  <span className="text-slate-500">Installing dependencies...</span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-slate-400">
                  <span className="text-slate-600 select-none">+</span>
                  <span><span className="text-purple-400">js-moi-sdk</span><span className="text-slate-500">@^0.7.0-rc4</span></span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-slate-400">
                  <span className="text-slate-600 select-none">+</span>
                  <span><span className="text-purple-400">@a2a-js/sdk</span><span className="text-slate-500">@^0.3.0</span></span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-slate-400">
                  <span className="text-slate-600 select-none">+</span>
                  <span><span className="text-purple-400">js-yaml</span><span className="text-slate-500">@^4.1.0</span></span>
                </div>
                <div className="flex gap-4 mt-4 pt-3 border-t border-white/5 group">
                  <span className="text-slate-600 select-none">1</span>
                  <span><span className="text-purple-400">import</span> <span className="text-slate-300">{`{ SageoClient }`}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'@sageo/interaction-sdk'</span>;</span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">2</span>
                  <span className="text-slate-500">// Initialize client with MOI RPC and agent key</span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">3</span>
                  <span><span className="text-purple-400">const</span> <span className="text-blue-400">client</span> = <span className="text-purple-400">new</span> <span className="text-yellow-300">SageoClient</span><span className="text-slate-300">(</span></span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">4</span>
                  <span className="text-slate-300 pl-4"><span className="text-green-400">'https://voyage-rpc.moi.technology'</span>,</span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">5</span>
                  <span className="text-slate-300 pl-4">process.env.<span className="text-blue-400">AGENT_PRIVATE_KEY</span>,</span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">6</span>
                  <span className="text-slate-300 pl-4"><span className="text-blue-400">agentCard</span></span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">7</span>
                  <span className="text-slate-300"><span className="text-slate-500">);</span></span>
                </div>
                <div className="flex gap-4 group mt-2">
                  <span className="text-slate-600 select-none">8</span>
                  <span className="text-slate-500">// Auto-registers your agent on Sageo</span>
                </div>
                <div className="flex gap-4 group">
                  <span className="text-slate-600 select-none">9</span>
                  <span><span className="text-purple-400">await</span> <span className="text-blue-400">client</span><span className="text-slate-300">.</span><span className="text-yellow-300">initialize</span><span className="text-slate-300">();</span></span>
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
              <p className="text-2xl font-bold text-white mt-1">
                {loading ? '...' : totalAgents}
              </p>
            </div>
            <div className="bg-surface-dark border border-surface-border p-4 rounded-lg">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active</p>
              <p className="text-2xl font-bold text-green-500 mt-1">
                {loading ? '...' : activeAgents.toString().padStart(2, '0')}
              </p>
            </div>
            <div className="bg-surface-dark border border-surface-border p-4 rounded-lg">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-yellow-500 mt-1">
                {loading ? '...' : pendingAgents.toString().padStart(2, '0')}
              </p>
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
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined animate-spin">sync</span>
                          <span>Loading agents...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-red-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined">error</span>
                          <span>{error}</span>
                        </div>
                      </td>
                    </tr>
                  ) : agents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-4xl">inventory_2</span>
                          <span>No agents registered yet</span>
                          <Link to="/register" className="text-primary hover:text-primary/80 text-sm mt-2">
                            Register your first agent →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    agents.map((agent) => {
                      const agentName = agent.agent_card?.name || agent.sageo_id || 'Unknown Agent';
                      const initials = getInitials(agentName);
                      const gradient = getAvatarGradient(agentName);
                      const statusBadge = getStatusBadge(agent.status);
                      
                      return (
                        <tr key={agent.sageo_id} className="group hover:bg-[#1f292c] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-bold text-xs`}>
                                {initials}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">{agentName}</div>
                                <div className="text-xs text-slate-500">
                                  Last active: {formatLastActive(agent.updated_at ? agent.updated_at * 1000 : undefined)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-[#2c3639] px-2 py-1 rounded text-slate-300 font-mono">
                                {truncateId(agent.sageo_id)}
                              </code>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link 
                              to={`/agent/${agent.sageo_id}`}
                              className="text-slate-400 hover:text-white inline-flex items-center"
                            >
                              <span className="material-symbols-outlined">more_vert</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
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