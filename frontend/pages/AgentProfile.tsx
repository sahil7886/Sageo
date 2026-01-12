import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  fetchAgentProfile,
  fetchAgentCard,
  fetchAgentInteractions,
  fetchAgentStats,
  AgentProfile as AgentProfileType,
  AgentCard,
  InteractionRecord,
  AgentInteractionStats
} from '../lib/api';

// Helper to format relative time (handles both Unix seconds and counter values)
const formatRelativeTime = (timestamp: number): string => {
  // If timestamp is very small (< year 2000), it's likely a counter value, not a real timestamp
  if (timestamp < 946684800) {
    return `#${timestamp}`;
  }

  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 0) return 'just now'; // Future timestamp (clock skew)
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
};

const AgentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<AgentProfileType | null>(null);
  const [card, setCard] = useState<AgentCard | null>(null);
  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);
  const [stats, setStats] = useState<AgentInteractionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgent = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const [profileData, cardData, interactionsData, statsData] = await Promise.all([
          fetchAgentProfile(id),
          fetchAgentCard(id),
          fetchAgentInteractions(id, 5, 0).catch(() => ({ interactions: [], total: 0 })),
          fetchAgentStats(id).catch(() => null)
        ]);

        setProfile(profileData);
        setCard(cardData);
        setInteractions(interactionsData.interactions || []);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [id]);

  // Loading State
  if (loading) {
    return (
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">Loading agent profile...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center max-w-md">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
          <p className="text-red-400 text-lg">{error}</p>
          <Link
            to="/discovery"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-surface-border text-white rounded-lg text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  // 404 State
  if (!profile) {
    return (
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">search_off</span>
          <h2 className="text-white text-2xl font-bold mb-2">Agent Not Found</h2>
          <p className="text-text-secondary mb-6">The agent "{id}" could not be found.</p>
          <Link
            to="/discovery"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Browse Agents
          </Link>
        </div>
      </div>
    );
  }

  const agentName = card?.name || profile.sageo_id;
  const isActive = profile.status === 'ACTIVE';

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to="/" className="text-text-secondary hover:text-white transition-colors">Home</Link>
        <span className="text-text-secondary material-symbols-outlined text-[16px]">chevron_right</span>
        <Link to="/discovery" className="text-text-secondary hover:text-white transition-colors">Agents</Link>
        <span className="text-text-secondary material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-white font-medium">{agentName}</span>
      </div>

      {/* Profile Header */}
      <section className="bg-surface-dark border border-surface-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
          <div className="flex gap-5 items-start">
            <div className="relative group shrink-0">
              <div className="size-24 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center overflow-hidden border border-surface-border shadow-inner">
                <span className="material-symbols-outlined text-4xl text-white/20">smart_toy</span>
              </div>
              <div className={`absolute -bottom-2 -right-2 ${isActive ? 'bg-green-500' : 'bg-gray-500'} rounded-full p-1 border-4 border-surface-dark`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{agentName}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${isActive ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-gray-500/20 border-gray-500/30 text-gray-400'} border text-xs font-bold uppercase tracking-wider`}>
                  <span className="material-symbols-outlined text-[14px]">{isActive ? 'verified' : 'pending'}</span> {profile.status}
                </span>
                {card?.version && (
                  <span className="text-text-secondary text-sm font-mono border border-surface-border px-2 py-0.5 rounded bg-background-dark/50">{card.version}</span>
                )}
              </div>
              <p className="text-text-secondary text-base max-w-2xl leading-relaxed">
                {card?.description || 'No description available for this agent.'}
              </p>

              {/* Skills & Capabilities Pills */}
              <div className="flex flex-wrap gap-2 mt-2">
                {/* Capability Pills */}
                {card?.capabilities?.streaming && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                    <span className="material-symbols-outlined text-[14px]">stream</span>
                    Streaming
                  </span>
                )}
                {card?.capabilities?.pushNotifications && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                    <span className="material-symbols-outlined text-[14px]">notifications</span>
                    Push
                  </span>
                )}
                {card?.capabilities?.stateTransitionHistory && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
                    <span className="material-symbols-outlined text-[14px]">history</span>
                    History
                  </span>
                )}

                {/* Skill Pills with Tooltip */}
                {card?.skills?.map(skill => (
                  <div key={skill.id} className="relative group/skill">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-medium cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all">
                      <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
                      {skill.name}
                    </span>
                    {/* Tooltip on hover */}
                    <div className="absolute left-0 top-full mt-2 z-50 hidden group-hover/skill:block">
                      <div className="bg-[#1a1f22] border border-surface-border rounded-lg p-3 shadow-xl min-w-[200px] max-w-[300px]">
                        <h4 className="text-white font-semibold text-sm mb-1">{skill.name}</h4>
                        {skill.description && (
                          <p className="text-text-secondary text-xs leading-relaxed">{skill.description}</p>
                        )}
                        {skill.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {skill.tags.split(',').map(tag => (
                              <span key={tag.trim()} className="text-[10px] uppercase font-medium text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-row w-full md:w-auto gap-3 shrink-0">
            {card?.documentationUrl && (
              <a
                href={card.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 md:flex-none items-center justify-center gap-2 h-10 px-5 rounded-lg border border-surface-border bg-transparent hover:bg-surface-border/50 text-white text-sm font-semibold transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">description</span>
                Docs
              </a>
            )}
            {card?.url && (
              <a
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 md:flex-none items-center justify-center gap-2 h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">link</span>
                Connect Agent
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-surface-dark border border-surface-border rounded-xl p-5 flex flex-col justify-between h-full shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-text-secondary text-sm font-medium mb-1">Success Rate</span>
              <div className="flex items-baseline gap-2">
                {stats ? (
                  <>
                    <span className="text-3xl font-bold text-white">
                      {stats.total_requests_sent > 0
                        ? ((stats.success_count / stats.total_requests_sent) * 100).toFixed(1)
                        : '0'}%
                    </span>
                    {stats.success_count > 0 && (
                      <span className="text-green-500 text-xs font-bold flex items-center">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-3xl font-bold text-white">--</span>
                )}
              </div>
            </div>
            <div className="bg-primary/10 p-2 rounded-lg text-primary"><span className="material-symbols-outlined">health_and_safety</span></div>
          </div>
          <div className="w-full bg-surface-border rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: stats && stats.total_requests_sent > 0 ? `${(stats.success_count / stats.total_requests_sent) * 100}%` : '0%' }}
            ></div>
          </div>
          <p className="text-text-secondary text-xs mt-3">
            {stats ? `${stats.success_count} successful of ${stats.total_requests_sent} requests` : 'No data'}
          </p>
        </div>

        <div className="bg-surface-dark border border-surface-border rounded-xl p-5 flex flex-col justify-between h-full shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <span className="text-text-secondary text-sm font-medium mb-1">Total Requests</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {stats ? stats.total_requests_sent + stats.total_requests_received : 0}
                </span>
              </div>
            </div>
            <div className="bg-primary/10 p-2 rounded-lg text-primary"><span className="material-symbols-outlined">bar_chart</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-xs">
              <span className="text-text-secondary">Sent: </span>
              <span className="text-white font-medium">{stats?.total_requests_sent || 0}</span>
            </div>
            <div className="text-xs">
              <span className="text-text-secondary">Received: </span>
              <span className="text-white font-medium">{stats?.total_requests_received || 0}</span>
            </div>
          </div>
          <p className="text-text-secondary text-xs mt-3">
            {stats?.total_responses_sent || 0} responses sent
          </p>
        </div>

        <div className="bg-surface-dark border border-surface-border rounded-xl p-5 flex flex-col justify-between h-full shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-text-secondary text-sm font-medium mb-1">Network Reach</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{stats?.unique_counterparties || 0}</span>
                <span className="text-text-secondary text-sm font-normal">Unique Agents</span>
              </div>
            </div>
            <div className="bg-primary/10 p-2 rounded-lg text-primary"><span className="material-symbols-outlined">hub</span></div>
          </div>
          <div className="flex -space-x-2 overflow-hidden mt-1">
            {[...Array(Math.min(stats?.unique_counterparties || 0, 4))].map((_, i) => (
              <div
                key={i}
                className={`inline-block h-8 w-8 rounded-full ring-2 ring-surface-dark ${['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500'][i]
                  }`}
              ></div>
            ))}
            {(stats?.unique_counterparties || 0) > 4 && (
              <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-surface-dark bg-slate-700 text-white text-[10px] font-bold">
                +{(stats?.unique_counterparties || 0) - 4}
              </div>
            )}
          </div>
          <p className="text-text-secondary text-xs mt-3">
            {stats?.last_interaction_at
              ? `Last active: ${formatRelativeTime(stats.last_interaction_at)}`
              : 'No interactions yet'}
          </p>
        </div>
      </section>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
        {/* Left: Interactions Table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span> Interaction Proofs
            </h3>
            <button className="text-xs font-medium text-primary hover:text-white transition-colors flex items-center gap-1">
              View All On-Chain <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          </div>
          <div className="bg-surface-dark border border-surface-border rounded-xl overflow-hidden shadow-sm flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#15181c] border-b border-surface-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">Interaction ID</th>
                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">Intent</th>
                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {interactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                        No interactions recorded yet
                      </td>
                    </tr>
                  ) : (
                    interactions.map((row) => {
                      const statusColor = row.status_code >= 200 && row.status_code < 300 ? 'green' : 'red';
                      return (
                        <tr key={row.interaction_id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-primary cursor-pointer hover:underline">{row.interaction_id}</td>
                          <td className="px-6 py-4 text-white">{row.intent}</td>
                          <td className="px-6 py-4 text-text-secondary">{formatRelativeTime(row.timestamp)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-900/30 text-${statusColor}-400 border border-${statusColor}-900/50`}>
                              {row.status_code} {row.status_code >= 200 && row.status_code < 300 ? 'OK' : 'Err'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-surface-border bg-[#15181c] text-center">
              <span className="text-xs text-text-secondary">{interactions.length} interactions shown</span>
            </div>
          </div>
        </div>

        {/* Right: Identity Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-dark border border-surface-border rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-text-secondary text-[20px]">fingerprint</span> On-Chain Identity
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Sageo ID</span>
                <div className="flex items-center justify-between bg-background-dark p-2 rounded-lg border border-transparent hover:border-surface-border transition-colors group cursor-pointer">
                  <span className="text-sm font-mono text-white truncate">{profile.sageo_id}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(profile.sageo_id)}
                    className="material-symbols-outlined text-[16px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    content_copy
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Owner</span>
                <div className="flex items-center justify-between bg-background-dark p-2 rounded-lg border border-transparent hover:border-surface-border transition-colors group cursor-pointer">
                  <span className="text-sm font-mono text-primary truncate">{profile.owner}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(profile.owner)}
                    className="material-symbols-outlined text-[16px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    content_copy
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Status</span>
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                    {profile.status}
                  </span>
                </div>
                {profile.registered_at && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Created</span>
                    <span className="text-sm font-mono text-text-secondary">
                      {new Date(profile.registered_at * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface-dark border border-surface-border rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-text-secondary text-[20px]">verified_user</span> Verify Hash
            </h3>
            <p className="text-xs text-text-secondary mb-4">Verify interaction integrity by checking raw payload against on-chain records.</p>
            <div className="flex flex-col gap-3">
              <textarea className="w-full h-24 bg-background-dark border border-surface-border rounded-lg p-3 text-xs font-mono text-white placeholder:text-text-secondary/50 focus:ring-1 focus:ring-primary focus:border-primary resize-none" placeholder='{"interaction_id": "...", "payload": "..."}'></textarea>
              <button className="w-full flex items-center justify-center gap-2 bg-surface-border hover:bg-[#3c4d53] text-white text-sm font-bold py-2.5 rounded-lg transition-colors border border-transparent">
                <span className="material-symbols-outlined text-[18px]">check_circle</span> Check Hash
              </button>
            </div>
          </div>
        </div >
      </div >
    </div >
  );
};

export default AgentProfile;