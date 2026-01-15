import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchAgentsPaginated, searchAgents, AgentProfile } from '../lib/api';

const AGENTS_PER_PAGE = 15;

const Discovery = () => {
   const [searchParams, setSearchParams] = useSearchParams();
   const [agents, setAgents] = useState<AgentProfile[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

   // Filter states
   const [streamingFilter, setStreamingFilter] = useState(false);
   const [selectedTags, setSelectedTags] = useState<string[]>([]);

   // Pagination states
   const [currentPage, setCurrentPage] = useState(1);
   const [totalAgents, setTotalAgents] = useState(0);

   const loadAgents = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
         const query = searchParams.get('q');

         if (query) {
            // Search doesn't use pagination yet, returns all results
            const results = await searchAgents(query);
            setAgents(results);
            setTotalAgents(results.length);
         } else {
            // Use paginated fetch for filtered results
            const offset = (currentPage - 1) * AGENTS_PER_PAGE;
            const { agents: results, total } = await fetchAgentsPaginated({
               streaming: streamingFilter || undefined,
               tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
               limit: AGENTS_PER_PAGE,
               offset: offset,
            });
            setAgents(results);
            setTotalAgents(total);
         }
      } catch (err) {
         setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
         setLoading(false);
      }
   }, [searchParams, streamingFilter, selectedTags, currentPage]);

   useEffect(() => {
      loadAgents();
   }, [loadAgents]);

   // Reset to page 1 when filters or search changes
   useEffect(() => {
      setCurrentPage(1);
   }, [searchParams, streamingFilter, selectedTags]);

   const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
         setSearchParams({ q: searchQuery.trim() });
      } else {
         setSearchParams({});
      }
   };

   const handleTagToggle = (tag: string) => {
      setSelectedTags(prev =>
         prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
   };

   // Generate color and icon from agent name
   const getAgentStyles = (name: string) => {
      const colors = [
         'from-[#17a1cf] to-[#0f4d61]',
         'from-indigo-500 to-purple-600',
         'from-orange-500 to-red-600',
         'from-emerald-500 to-teal-700',
         'from-pink-500 to-rose-600',
         'from-gray-700 to-gray-900',
      ];
      const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      return {
         color: colors[hash % colors.length],
         icon: name.charAt(0).toUpperCase(),
      };
   };

   return (
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row">
         {/* Sidebar Filters */}
         <aside className="w-full lg:w-72 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-surface-border p-6 lg:h-[calc(100vh-73px)] lg:sticky lg:top-[73px] overflow-y-auto bg-background-dark">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-white text-lg font-bold">Filters</h3>
               <button
                  className="text-xs text-text-secondary hover:text-white transition-colors"
                  onClick={() => {
                     setStreamingFilter(false);
                     setSelectedTags([]);
                     setSearchParams({});
                     setSearchQuery('');
                     setCurrentPage(1);
                  }}
               >
                  Reset
               </button>
            </div>

            <div className="mb-8">
               <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Capabilities</h4>
               <div className="space-y-1">
                  <label className="flex items-center gap-3 py-2 cursor-pointer group">
                     <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-surface-border bg-surface-dark text-primary focus:ring-offset-0 focus:ring-0 cursor-pointer"
                        checked={streamingFilter}
                        onChange={(e) => setStreamingFilter(e.target.checked)}
                     />
                     <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Streaming</span>
                  </label>
               </div>
            </div>

            <div>
               <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Skills & Tags</h4>
               <div className="flex flex-wrap gap-2">
                  {['Weather', 'Stocks', 'NLP', 'Analysis', 'Trading', 'Image Gen', 'Coding'].map((tag) => (
                     <button
                        key={tag}
                        onClick={() => handleTagToggle(tag.toLowerCase())}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedTags.includes(tag.toLowerCase())
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface-dark text-text-secondary hover:text-white border-surface-border hover:border-primary/50'
                           }`}
                     >
                        {tag}
                     </button>
                  ))}
               </div>
            </div>
         </aside>

         {/* Main Content */}
         <div className="flex-1 flex flex-col min-w-0">
            <div className="p-6 md:px-10 pb-0">
               <div className="flex flex-col gap-2 mb-8">
                  <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Agent Discovery</h1>
                  <p className="text-text-secondary text-base md:text-lg">Find trusted AI Agents for your workflow on the MOI network.</p>
               </div>

               <form onSubmit={handleSearch} className="relative w-full max-w-3xl mb-8 group z-20">
                  <div className="flex w-full items-stretch rounded-xl h-14 bg-surface-dark border border-surface-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-lg">
                     <div className="flex items-center justify-center pl-4 text-text-secondary">
                        <span className="material-symbols-outlined">search</span>
                     </div>
                     <input
                        className="flex-1 bg-transparent border-none text-white placeholder:text-text-secondary px-4 focus:ring-0 text-base h-full w-full"
                        placeholder="Search agents by name, tag, or capability..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                     />
                     <div className="hidden sm:flex items-center pr-2">
                        <button type="submit" className="h-8 px-3 flex items-center gap-1 rounded bg-primary hover:bg-primary/80 text-white text-xs font-bold transition-colors">
                           Search
                        </button>
                     </div>
                  </div>
               </form>

               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
                  <p className="text-white text-sm font-medium">
                     <span className="font-bold">{totalAgents}</span> Agents found
                  </p>
               </div>
            </div>

            {/* Loading State */}
            {loading && (
               <div className="p-6 md:p-10 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                     <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-text-secondary">Loading agents...</p>
                  </div>
               </div>
            )}

            {/* Error State */}
            {error && (
               <div className="p-6 md:p-10">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                     <p className="text-red-400">{error}</p>
                     <button
                        onClick={loadAgents}
                        className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                     >
                        Retry
                     </button>
                  </div>
               </div>
            )}

            {/* Empty State */}
            {!loading && !error && agents.length === 0 && (
               <div className="p-6 md:p-10 flex items-center justify-center">
                  <div className="text-center">
                     <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">smart_toy</span>
                     <p className="text-text-secondary text-lg">No agents found</p>
                     <p className="text-text-secondary text-sm mt-2">Try adjusting your search or filters</p>
                  </div>
               </div>
            )}

            {/* Agents Grid */}
            {!loading && !error && agents.length > 0 && (
               <>
                  <div className="p-6 md:px-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                     {agents.map((agent) => {
                        const styles = getAgentStyles(agent.agent_card?.name || agent.sageo_id);
                        const card = agent.agent_card;
                        const isVerified = agent.status === 'ACTIVE';

                        return (
                           <Link to={`/agent/${agent.sageo_id}`} key={agent.sageo_id} className="group relative flex flex-col rounded-xl border border-surface-border bg-surface-dark p-5 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(23,161,207,0.1)] transition-all duration-300">
                              <div className="flex items-start justify-between mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className={`size-12 rounded-lg bg-gradient-to-br ${styles.color} flex items-center justify-center text-white font-bold text-lg`}>
                                       {styles.icon}
                                    </div>
                                    <div>
                                       <h3 className="text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                          {card?.name || agent.sageo_id}
                                       </h3>
                                       <div className="flex items-center gap-1 mt-0.5">
                                          <span className={`material-symbols-outlined text-[16px] ${isVerified ? 'text-primary' : 'text-text-secondary'}`}>verified</span>
                                          <span className="text-xs text-text-secondary font-medium">{isVerified ? 'Active Agent' : agent.status}</span>
                                       </div>
                                    </div>
                                 </div>
                                 {card?.version && (
                                    <span className="text-xs text-text-secondary font-mono bg-surface-border px-2 py-1 rounded">
                                       {card.version}
                                    </span>
                                 )}
                              </div>

                              <p className="text-text-secondary text-sm mb-5 leading-relaxed line-clamp-2">
                                 {card?.description || 'No description available'}
                              </p>

                              {card?.skills && card.skills.length > 0 && (
                                 <div className="flex flex-wrap gap-2 mb-6">
                                    {card.skills.slice(0, 3).map(skill => (
                                       <span key={skill.id} className="text-[10px] uppercase font-bold tracking-wider text-gray-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                                          {skill.name}
                                       </span>
                                    ))}
                                 </div>
                              )}

                              <div className="mt-auto pt-4 border-t border-surface-border flex items-center justify-between">
                                 <div className="flex items-center gap-4 text-xs text-text-secondary font-mono">
                                    {card?.capabilities?.streaming && (
                                       <span className="flex items-center gap-1" title="Streaming">
                                          <span className="material-symbols-outlined text-[14px]">stream</span> Live
                                       </span>
                                    )}
                                 </div>
                              </div>
                           </Link>
                        );
                     })}
                  </div>

                  {/* Pagination Controls */}
                  {totalAgents > AGENTS_PER_PAGE && (
                     <div className="p-6 md:px-10 flex items-center justify-center gap-2">
                        <button
                           onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                           disabled={currentPage === 1}
                           className="px-4 py-2 rounded-lg bg-surface-dark border border-surface-border text-white hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-surface-border transition-colors"
                        >
                           <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                              Previous
                           </span>
                        </button>

                        <div className="flex items-center gap-1">
                           {(() => {
                              const totalPages = Math.ceil(totalAgents / AGENTS_PER_PAGE);
                              const pages: (number | string)[] = [];

                              if (totalPages <= 7) {
                                 // Show all pages if 7 or fewer
                                 for (let i = 1; i <= totalPages; i++) pages.push(i);
                              } else {
                                 // Always show first page
                                 pages.push(1);

                                 if (currentPage > 3) pages.push('...');

                                 // Show pages around current page
                                 for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                    pages.push(i);
                                 }

                                 if (currentPage < totalPages - 2) pages.push('...');

                                 // Always show last page
                                 pages.push(totalPages);
                              }

                              return pages.map((page, idx) => {
                                 if (page === '...') {
                                    return (
                                       <span key={`ellipsis-${idx}`} className="px-3 py-2 text-text-secondary">
                                          ...
                                       </span>
                                    );
                                 }

                                 const pageNum = page as number;
                                 const isActive = pageNum === currentPage;

                                 return (
                                    <button
                                       key={pageNum}
                                       onClick={() => setCurrentPage(pageNum)}
                                       className={`px-3 py-2 rounded-lg transition-colors ${
                                          isActive
                                             ? 'bg-primary text-white font-bold'
                                             : 'bg-surface-dark border border-surface-border text-white hover:border-primary'
                                       }`}
                                    >
                                       {pageNum}
                                    </button>
                                 );
                              });
                           })()}
                        </div>

                        <button
                           onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalAgents / AGENTS_PER_PAGE), p + 1))}
                           disabled={currentPage >= Math.ceil(totalAgents / AGENTS_PER_PAGE)}
                           className="px-4 py-2 rounded-lg bg-surface-dark border border-surface-border text-white hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-surface-border transition-colors"
                        >
                           <span className="flex items-center gap-1">
                              Next
                              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                           </span>
                        </button>
                     </div>
                  )}
               </>
            )}
         </div>
      </div>
   );
};

export default Discovery;