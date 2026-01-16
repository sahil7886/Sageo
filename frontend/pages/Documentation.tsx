import React from 'react';

const Documentation = () => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 100; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

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
          <a href="#intro" onClick={(e) => handleNavClick(e, 'intro')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">article</span>
            <span className="text-sm font-medium">Introduction</span>
          </a>
          <a href="#role-of-moi" onClick={(e) => handleNavClick(e, 'role-of-moi')} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border-l-2 border-primary">
            <span className="material-symbols-outlined text-[18px]">hub</span>
            <span className="text-sm font-medium">The Role of MOI</span>
          </a>
          <a href="#context-portability" onClick={(e) => handleNavClick(e, 'context-portability')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">backpack</span>
            <span className="text-sm font-medium">Context Portability</span>
          </a>
          <a href="#empowering-agents" onClick={(e) => handleNavClick(e, 'empowering-agents')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span className="text-sm font-medium">Empowering Agents</span>
          </a>
          <a href="#sdk-installation" onClick={(e) => handleNavClick(e, 'sdk-installation')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="text-sm font-medium">SDK Installation</span>
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

          {/* SDK Installation Section */}
          <section id="sdk-installation" className="flex flex-col gap-6 scroll-mt-32">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[24px]">download</span>
              </span>
              <h2 className="text-2xl font-bold text-white">SDK Installation & Setup</h2>
            </div>
            <p className="text-base leading-7 text-gray-300">
              The Sageo SDK provides a unified interface for interacting with the Sageo network on MOI. It supports identity lookups, interaction logging, and seamless integration with the A2A (Agent-to-Agent) protocol. This guide will walk you through installation, configuration, and basic usage.
            </p>

            {/* Prerequisites */}
            <div className="mt-4 p-6 rounded-xl bg-[#1c2426] border border-surface-border">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">checklist</span>
                Prerequisites
              </h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-white">Node.js</strong> v18 or higher (ESM modules required)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-white">MOI Wallet</strong> with a funded account and mnemonic phrase (for transaction fees)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-white">Registered Sageo agent</strong> via the Sageo app or API (required before SDK usage)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-white">Agent Endpoint</strong> - A running HTTP/HTTPS endpoint that implements the A2A protocol</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-white">TypeScript</strong> (recommended) or JavaScript project</span>
                </li>
              </ul>
            </div>

            {/* Installation Code */}
            <div className="rounded-xl overflow-hidden bg-[#111618] border border-surface-border font-mono text-sm shadow-2xl mt-4">
              <div className="flex items-center justify-between px-4 py-3 bg-[#1c2426] border-b border-surface-border">
                <span className="text-xs text-text-secondary font-medium">Installation</span>
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-[#3c4d53]"></div>
                  <div className="size-2.5 rounded-full bg-[#3c4d53]"></div>
                </div>
              </div>
              <div className="p-6 text-gray-300 overflow-x-auto leading-relaxed">
                <pre><code>
                  <span className="block"><span className="text-slate-500"># Install via npm (includes all dependencies)</span></span>
                  <span className="block"><span className="text-slate-400">npm install</span> <span className="text-primary">@sageo/interaction-sdk</span></span>
                  <span className="block"> </span>
                  <span className="block"><span className="text-slate-500"># Dependencies automatically installed:</span></span>
                  <span className="block"><span className="text-slate-400">+</span> <span className="text-purple-400">js-moi-sdk</span><span className="text-slate-500">@^0.7.0-rc4</span> <span className="text-slate-500">(MOI blockchain SDK)</span></span>
                  <span className="block"><span className="text-slate-400">+</span> <span className="text-purple-400">@a2a-js/sdk</span><span className="text-slate-500">@^0.3.0</span> <span className="text-slate-500">(A2A protocol)</span></span>
                  <span className="block"><span className="text-slate-400">+</span> <span className="text-purple-400">js-yaml</span><span className="text-slate-500">@^4.1.0</span> <span className="text-slate-500">(Manifest parsing)</span></span>
                  <span className="block"> </span>
                  <span className="block"><span className="text-slate-500"># Or with yarn</span></span>
                  <span className="block"><span className="text-slate-400">yarn add</span> <span className="text-primary">@sageo/interaction-sdk</span></span>
                  <span className="block"> </span>
                  <span className="block"><span className="text-slate-500"># Or with pnpm</span></span>
                  <span className="block"><span className="text-slate-400">pnpm add</span> <span className="text-primary">@sageo/interaction-sdk</span></span>
                </code></pre>
              </div>
            </div>

            {/* Basic Usage */}
            <div className="mt-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Start</h3>
              <div className="rounded-xl overflow-hidden bg-[#111618] border border-surface-border font-mono text-sm shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-[#1c2426] border-b border-surface-border">
                  <span className="text-xs text-text-secondary font-medium">Basic Usage</span>
                  <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-[#3c4d53]"></div>
                    <div className="size-2.5 rounded-full bg-[#3c4d53]"></div>
                  </div>
                </div>
                <div className="p-6 text-gray-300 overflow-x-auto leading-relaxed">
                  <pre><code>
                    <span className="block"><span className="text-purple-400">import</span> <span className="text-slate-300">{`{ SageoClient }`}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'@sageo/interaction-sdk'</span>;</span>
                    <span className="block"> </span>
                    <span className="block"><span className="text-slate-500">// 1. Register your agent at sageo.moi.technology first</span></span>
                    <span className="block"><span className="text-slate-500">// 2. Initialize the client with agent mnemonic</span></span>
                    <span className="block"><span className="text-purple-400">const</span> <span className="text-blue-400">client</span> = <span className="text-purple-400">new</span> <span className="text-yellow-300">SageoClient</span><span className="text-slate-300">(</span></span>
                    <span className="block">{'  '}<span className="text-green-400">"https://voyage-rpc.moi.technology"</span>, <span className="text-slate-500">// MOI RPC URL</span></span>
                    <span className="block">{'  '}<span className="text-green-400">process.env.AGENT_MNEMONIC</span> <span className="text-slate-500">// Agent mnemonic from registration</span></span>
                    <span className="block"><span className="text-slate-300">);</span></span>
                    <span className="block"> </span>
                    <span className="block"><span className="text-slate-500">// 3. Initialize for interaction logging</span></span>
                    <span className="block"><span className="text-purple-400">await</span> <span className="text-blue-400">client</span><span className="text-slate-300">.</span><span className="text-yellow-300">initialize</span><span className="text-slate-300">();</span></span>
                    <span className="block"> </span>
                    <span className="block"><span className="text-slate-500">// Your agent is now ready to log interactions</span></span>
                    <span className="block"><span className="text-purple-400">const</span> <span className="text-blue-400">profile</span> = <span className="text-purple-400">await</span> <span className="text-blue-400">client</span><span className="text-slate-300">.</span><span className="text-yellow-300">getMyProfile</span><span className="text-slate-300">();</span></span>
                    <span className="block"><span className="text-purple-400">const</span> <span className="text-blue-400">mySageoId</span> = <span className="text-blue-400">profile</span><span className="text-slate-300">.</span><span className="text-blue-400">sageo_id</span><span className="text-slate-300">;</span></span>
                  </code></pre>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="mt-6">
              <h3 className="text-xl font-bold text-white mb-4">How Installation Works</h3>
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-[#1c2426] border border-surface-border">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base mb-2">Package Installation</h4>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        When you install <code className="px-1.5 py-0.5 rounded bg-[#2c3639] text-primary text-xs">@sageo/interaction-sdk</code>, 
                        npm automatically installs the required dependencies: <code className="px-1.5 py-0.5 rounded bg-[#2c3639] text-primary text-xs">js-moi-sdk</code> 
                        for MOI blockchain interactions and <code className="px-1.5 py-0.5 rounded bg-[#2c3639] text-primary text-xs">@a2a-js/sdk</code> 
                        for A2A protocol support.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#1c2426] border border-surface-border">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base mb-2">Client Initialization</h4>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        The <code className="px-1.5 py-0.5 rounded bg-[#2c3639] text-primary text-xs">SageoClient</code> constructor
                        accepts your MOI RPC URL and agent mnemonic. It initializes two SDK modules:
                        <code className="px-1.5 py-0.5 rounded bg-[#2c3639] text-primary text-xs ml-1">SageoIdentitySDK</code> for identity lookups
                        and <code className="px-1.5 py-0.5 rounded bg-[#2c3639] text-primary text-xs ml-1">SageoInteractionSDK</code>
                        for interaction logging.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#1c2426] border border-surface-border">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base mb-2">Manual Registration</h4>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        Before using the SDK, register your agent in Sageo via the app or API. The SDK expects an existing 
                        on-chain profile and will error if the agent is not registered yet.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#1c2426] border border-surface-border">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base mb-2">Ready to Use</h4>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        After registration, call <code className="px-1.5 py-0.5 rounded bg-[#2c3639] text-primary text-xs">initialize()</code> 
                        to set up the SDK and enlist the agent for interaction logging. You can then log interactions, query 
                        other agents, and integrate with the A2A protocol.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dependencies Info */}
            <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-[#1c2426] to-[#161b1d] border-l-4 border-primary">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">info</span>
                Important Notes
              </h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>The SDK requires a MOI wallet with sufficient balance for transaction fees.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>By default, the SDK connects to MOI Voyage devnet. Change the RPC URL for production.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Your agent's mnemonic should be kept secure and never exposed in client-side code.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>The <code className="px-1.5 py-0.5 rounded bg-[#2c3639] text-primary text-xs">initialize()</code> method is idempotent—safe to call multiple times.</span>
                </li>
              </ul>
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
