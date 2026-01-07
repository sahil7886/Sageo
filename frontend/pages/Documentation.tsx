import React from 'react';

const Documentation = () => {
  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex w-72 flex-col sticky top-[66px] h-[calc(100vh-66px)] border-r border-surface-border p-6 lg:p-8 overflow-y-auto bg-background-dark">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-blue-600"></div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Integration Guide</h1>
              <p className="text-[10px] text-text-secondary">v2.4.0 • Updated Yesterday</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 mb-8">
          <p className="text-[10px] font-bold text-[#5f747a] uppercase tracking-wider mb-3 px-3">Table of Contents</p>
          <a href="#intro" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">article</span>
            <span className="text-sm font-medium">Introduction</span>
          </a>
          <a href="#role-of-moi" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border-l-2 border-primary">
            <span className="material-symbols-outlined text-[18px]">hub</span>
            <span className="text-sm font-medium">The Role of MOI</span>
          </a>
          <a href="#context-portability" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">backpack</span>
            <span className="text-sm font-medium">Context Portability</span>
          </a>
          <a href="#empowering-agents" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span className="text-sm font-medium">Empowering Agents</span>
          </a>
        </nav>

        <div className="mt-auto">
          <div className="bg-[#1c2426] p-4 rounded-xl border border-surface-border">
            <p className="text-xs font-bold text-white mb-1">Need help?</p>
            <p className="text-xs text-text-secondary mb-3 leading-relaxed">Join our developer discord for real-time support on integration.</p>
            <button className="w-full py-2 rounded-lg bg-[#293438] hover:bg-[#364449] text-xs font-bold text-white transition-colors border border-[#3c4d53]">Join Discord</button>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 px-6 py-10 lg:px-20 lg:py-16 max-w-5xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-text-secondary mb-10 font-medium">
          <span className="hover:text-white cursor-pointer transition-colors">Documentation</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="hover:text-white cursor-pointer transition-colors">Core Concepts</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-primary">Integration</span>
        </div>
        
        {/* Page Heading */}
        <div className="flex flex-col gap-6 mb-16 border-b border-surface-border pb-10">
          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            MOI & Sageo <span className="text-primary">Integration</span>
          </h1>
          <p className="text-lg lg:text-xl text-text-secondary leading-relaxed max-w-3xl">
            The Infrastructure of Trust: Enabling context portability and participant-centric discovery for the next generation of AI agents.
          </p>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-16 text-slate-300">
          
          {/* Introduction Section */}
          <section id="intro" className="flex flex-col gap-6 scroll-mt-32">
            <p className="text-base leading-7 text-gray-300">
              Sageo is built on top of MOI to leverage a unique participant-centric network structure. Unlike traditional blockchain architectures that prioritize global state consensus for every transaction, MOI focuses on the participant’s state. This fundamental shift ensures that discovery within Sageo is not merely about finding available agents, but about trusting them with valuable user context.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="p-6 rounded-xl bg-[#1c2426] border border-surface-border flex items-start gap-4 hover:border-primary/30 transition-colors">
                <div className="mt-1 size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[16px] font-bold">check</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base mb-1">Participant-Centric</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">State is relative to the user, ensuring lighter, faster interactions.</p>
                </div>
              </div>
              <div className="p-6 rounded-xl bg-[#1c2426] border border-surface-border flex items-start gap-4 hover:border-primary/30 transition-colors">
                <div className="mt-1 size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[16px] font-bold">check</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base mb-1">Context Aware</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">Agents receive personalized data packets authorized by the user.</p>
                </div>
              </div>
            </div>
          </section>
          
          <hr className="border-surface-border/50" />

          {/* The Role of MOI */}
          <section id="role-of-moi" className="flex flex-col gap-6 scroll-mt-32">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[24px]">hub</span>
              </span>
              <h2 className="text-2xl font-bold text-white">The Role of MOI</h2>
            </div>
            <p className="text-base leading-7 text-gray-300">
              MOI acts as the interaction state machine for Sageo. While Sageo handles the reputation and discovery logic, MOI secures the "handshake" between a user and an AI agent. This handshake is cryptographically secured and records not just the transaction, but the <strong className="text-white font-bold">intent</strong> and context permissions granted for that specific interaction.
            </p>
            
            {/* Code Snippet */}
            <div className="rounded-xl overflow-hidden bg-[#111618] border border-surface-border font-mono text-sm shadow-2xl mt-4">
              <div className="flex items-center justify-between px-4 py-3 bg-[#1c2426] border-b border-surface-border">
                <span className="text-xs text-text-secondary font-medium">InteractionManifest.json</span>
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-[#3c4d53]"></div>
                  <div className="size-2.5 rounded-full bg-[#3c4d53]"></div>
                </div>
              </div>
              <div className="p-6 text-gray-300 overflow-x-auto leading-relaxed">
                <pre><code><span className="text-purple-400">interaction</span> {'{'}
  <span className="text-blue-400">participant_id</span>: <span className="text-green-400">"moi:user:0x8a7..."</span>,
  <span className="text-blue-400">agent_target</span>: <span className="text-green-400">"sageo:agent:finance-bot"</span>,
  <span className="text-blue-400">context_scope</span>: [
    <span className="text-green-400">"read:financial_history"</span>,
    <span className="text-green-400">"write:investment_plan"</span>
  ],
  <span className="text-blue-400">proof</span>: <span className="text-yellow-400">"zk-snark-valid-credential"</span>
{'}'}</code></pre>
              </div>
            </div>
          </section>

           {/* Context Portability */}
           <section id="context-portability" className="flex flex-col gap-6 scroll-mt-32">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[24px]">backpack</span>
              </span>
              <h2 className="text-2xl font-bold text-white">Context Portability</h2>
            </div>
            <p className="text-base leading-7 text-gray-300">
              In the current Web2 landscape, users are fragmented. Your travel preferences live in one silo, your financial goals in another. Sageo, powered by MOI, introduces <strong className="text-white">Context Portability</strong>. Think of it as a digital backpack. When you discover a new agent via Sageo, you don’t start from zero. You authorize the agent to peek into your backpack and read specifically scoped data.
            </p>
            
            {/* Visual Diagram - Initial Linear Version */}
            <div className="relative w-full h-80 rounded-xl bg-[#0e1214] border border-surface-border mt-4 overflow-hidden flex items-center justify-center select-none">
              {/* Dotted Pattern */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#3c4d53 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              
              <div className="relative z-10 flex items-center gap-4 md:gap-16">
                 {/* User Node */}
                 <div className="flex flex-col items-center gap-3">
                   <div className="size-16 rounded-full border-2 border-surface-border bg-[#1c2426] flex items-center justify-center text-gray-400 shadow-lg">
                      <span className="material-symbols-outlined text-[32px]">person</span>
                   </div>
                   <span className="text-xs font-bold tracking-widest text-text-secondary uppercase">User</span>
                 </div>

                 {/* Connection Line */}
                 <div className="relative h-0.5 w-24 md:w-48 bg-surface-border flex items-center justify-center">
                    <div className="absolute -top-3 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-primary/20 flex items-center gap-1">
                      Context
                    </div>
                 </div>

                 {/* Agent Node */}
                 <div className="flex flex-col items-center gap-3">
                   <div className="size-16 rounded-full border-2 border-primary bg-[#1c2426] flex items-center justify-center text-primary shadow-[0_0_30px_rgba(23,161,207,0.2)]">
                      <span className="material-symbols-outlined text-[32px]">smart_toy</span>
                   </div>
                   <span className="text-xs font-bold tracking-widest text-primary uppercase">Agent</span>
                 </div>
              </div>
              
              <div className="absolute bottom-8 text-center px-4">
                 <p className="text-xs text-text-secondary max-w-md mx-auto">Users grant temporary, scoped access to their history and preferences, enabling instant personalization.</p>
              </div>
            </div>
          </section>
          
          {/* Empowering Agents */}
          <section id="empowering-agents" className="flex flex-col gap-6 scroll-mt-32">
             <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[24px]">smart_toy</span>
              </span>
              <h2 className="text-2xl font-bold text-white">Empowering Agents</h2>
            </div>
            <p className="text-base leading-7 text-gray-300">
              Context portability empowers agents to be more effective immediately. An agent designed to help you book flights doesn’t need to ask for your passport number or seat preference if you’ve granted it access to your "Travel Context." This creates a seamless web of interoperable intelligence where agents can collaborate to serve the user’s intent.
            </p>

             <div className="mt-4 p-8 rounded-xl bg-gradient-to-r from-[#1c2426] to-[#161b1d] border-l-4 border-primary shadow-lg">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">lightbulb</span>
                Key Takeaway
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Sageo transforms the agent economy from a collection of isolated chatbots into a cohesive ecosystem where user context is the unifying currency, secured by MOI.
              </p>
            </div>
          </section>

          <hr className="border-surface-border/50" />

          {/* Footer CTA */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
            <div>
              <h3 className="text-white font-bold text-lg">Ready to build?</h3>
              <p className="text-text-secondary text-sm mt-1">Check out the developer documentation to get started.</p>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-3 rounded-lg border border-surface-border hover:bg-surface-dark text-white text-sm font-bold transition-colors">
                View API Reference
              </button>
              <button className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all">
                Start Integration
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Documentation;