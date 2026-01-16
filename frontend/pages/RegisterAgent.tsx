import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerAgent } from '../lib/api';

const RegisterAgent = () => {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags([...tags, trimmed]);
  };

  const removeTag = (value: string) => {
    setTags(tags.filter(t => t !== value));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessId(null);
    setMnemonic(null);
    setWalletAddress(null);
    setWarning(null);

    if (!name || !version) {
      setError('Name and version are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await registerAgent({ name, version, url, description, tags });
      setSuccessId(res.sageo_id);
      setMnemonic(res.mnemonic || null);
      setWalletAddress(res.wallet_address || null);
      setWarning(res.warning || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to register agent.');
    } finally {
      setSubmitting(false);
    }
  };

  // Show success screen if registration complete
  if (successId && mnemonic && walletAddress) {
    return (
      <div className="flex-1 flex justify-center py-10 px-4 md:px-10 lg:px-20 bg-background-dark min-h-screen">
        <div className="flex flex-col w-full max-w-[960px] gap-6">
          {/* Page Header */}
          <div className="flex flex-col gap-2">
            <Link to="/developers" className="flex items-center gap-2 text-text-secondary text-sm mb-2 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Developers</span>
            </Link>
          </div>

          {/* Success Message */}
          <div className="flex flex-col items-center justify-center gap-6 py-12">
            <div className="size-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500 text-[48px]">check_circle</span>
            </div>
            <div className="text-center">
              <h1 className="text-white text-3xl font-bold mb-2">Agent Registered Successfully!</h1>
              <p className="text-text-secondary text-lg">Your agent has been added to the Sageo network</p>
            </div>

            {/* Agent ID */}
            <div className="w-full max-w-2xl bg-surface-dark border border-surface-border rounded-xl p-6">
              <div className="text-xs uppercase tracking-wider text-text-secondary mb-2">Sageo Agent ID</div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-2xl font-mono font-bold text-primary">{successId}</span>
                <Link
                  to={`/agent/${successId}`}
                  className="px-4 py-2 rounded-lg bg-primary/10 border border-primary text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  View Profile
                </Link>
              </div>
            </div>

            {/* Critical Information */}
            <div className="w-full max-w-2xl bg-amber-500/10 border-2 border-amber-500 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="material-symbols-outlined text-amber-500 text-[24px]">warning</span>
                <div>
                  <h3 className="text-amber-200 font-bold text-lg mb-1">Save Your Credentials</h3>
                  <p className="text-amber-100/80 text-sm">This information will only be shown once. Store it securely - you'll need it to authenticate your agent.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
                {/* Mnemonic */}
                <div className="bg-black/30 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs uppercase tracking-wider text-amber-200/70 font-bold">Mnemonic Phrase</div>
                    <button
                      onClick={() => navigator.clipboard.writeText(mnemonic)}
                      className="inline-flex items-center gap-1 text-xs text-amber-200 hover:text-white transition-colors px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      Copy
                    </button>
                  </div>
                  <div className="font-mono text-sm text-amber-100 break-words bg-black/20 p-3 rounded">{mnemonic}</div>
                </div>

                {/* Wallet Address */}
                <div className="bg-black/30 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs uppercase tracking-wider text-amber-200/70 font-bold">Wallet Address</div>
                    <button
                      onClick={() => navigator.clipboard.writeText(walletAddress)}
                      className="inline-flex items-center gap-1 text-xs text-amber-200 hover:text-white transition-colors px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      Copy
                    </button>
                  </div>
                  <div className="font-mono text-sm text-amber-100 break-all bg-black/20 p-3 rounded">{walletAddress}</div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="w-full max-w-2xl bg-surface-dark border border-surface-border rounded-xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">integration_instructions</span>
                Next Steps: Integrate with Your Agent
              </h3>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="text-white font-medium mb-1">Install the Sageo SDK</p>
                    <div className="bg-black/50 rounded px-3 py-2 font-mono text-sm text-slate-300 border border-surface-border">
                      npm install @sageo/interaction-sdk
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="text-white font-medium mb-1">Initialize the SageoClient</p>
                    <div className="bg-black/50 rounded px-3 py-2 font-mono text-xs text-slate-300 border border-surface-border overflow-x-auto">
                      <div className="text-purple-400">import</div> {`{ SageoClient }`} <div className="text-purple-400">from</div> <div className="text-green-400">'@sageo/interaction-sdk'</div>;<br/>
                      <div className="text-purple-400 mt-2">const</div> client = <div className="text-purple-400">new</div> SageoClient(<br/>
                      &nbsp;&nbsp;<div className="text-green-400">'https://voyage-rpc.moi.technology'</div>,<br/>
                      &nbsp;&nbsp;process.env.<div className="text-blue-400">AGENT_MNEMONIC</div><br/>
                      );<br/>
                      <div className="text-purple-400 mt-2">await</div> client.initialize();
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="text-white font-medium mb-1">Start logging interactions</p>
                    <p className="text-text-secondary text-sm">All A2A interactions will now be recorded on the MOI blockchain.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-border flex gap-3">
                <Link to="/docs" className="flex-1 text-center px-4 py-2 rounded-lg bg-surface-border text-white text-sm font-medium hover:bg-[#354247] transition-colors">
                  View Documentation
                </Link>
                <Link to="/developers" className="flex-1 text-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                  Go to Developer Console
                </Link>
              </div>
            </div>

            {/* Register Another Agent */}
            <button
              onClick={() => {
                setSuccessId(null);
                setMnemonic(null);
                setWalletAddress(null);
                setWarning(null);
                setName('');
                setVersion('');
                setUrl('');
                setDescription('');
                setTags([]);
              }}
              className="text-text-secondary hover:text-white text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Register Another Agent
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex justify-center py-10 px-4 md:px-10 lg:px-20 bg-background-dark min-h-screen">
      <div className="flex flex-col w-full max-w-[960px] gap-6">

        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <Link to="/developers" className="flex items-center gap-2 text-text-secondary text-sm mb-2 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Developers</span>
          </Link>
          <h1 className="text-white tracking-tight text-[32px] font-bold leading-tight">Register New Agent</h1>
          <p className="text-text-secondary text-base font-normal leading-normal max-w-2xl">
            Define your AgentCard metadata for the Sageo Registry. This information will be immutable on the MOI blockchain.
          </p>
        </div>

        {/* Wallet Requirement Card */}
        <div className="w-full rounded-xl bg-surface-dark border border-surface-border p-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#111618] border border-surface-border flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[24px]">wallet</span>
              </div>
              <div>
                <p className="text-white text-base font-bold leading-tight">Wallet Connected</p>
                <p className="text-text-secondary text-sm font-normal mt-1">Ready to sign transaction on MOI Network (Testnet)</p>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none h-9 px-4 rounded-lg bg-surface-border text-white text-sm font-medium hover:bg-[#354247] transition-colors">Disconnect</button>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="flex flex-col gap-3 py-2">
          <div className="flex gap-6 justify-between items-end">
            <p className="text-white text-lg font-bold leading-normal">Step 1: Agent Identity</p>
            <p className="text-text-secondary text-sm font-medium">Step 1 of 4</p>
          </div>
          <div className="w-full rounded-full bg-surface-border h-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Main Form Section */}
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
          {/* Row 1: Basic Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-white text-sm font-medium">Agent Name</span>
                <span className="text-text-secondary text-xs material-symbols-outlined cursor-help" title="Unique identifier for your agent">help</span>
              </div>
              <div className="relative">
                <input
                  className="w-full bg-surface-dark border border-surface-border rounded-lg h-12 px-4 text-white placeholder:text-text-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  placeholder="e.g. Sageo Research Bot"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </label>
            <label className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-white text-sm font-medium">Version (SemVer)</span>
                <span className="text-text-secondary text-xs">Required</span>
              </div>
              <input
                className="w-full bg-surface-dark border border-surface-border rounded-lg h-12 px-4 text-white placeholder:text-text-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                placeholder="1.0.0"
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
              />
            </label>
          </div>

          {/* Row 2: URL */}
          <label className="flex flex-col gap-2">
            <span className="text-white text-sm font-medium">Agent Homepage URL</span>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-text-secondary material-symbols-outlined text-[20px]">link</span>
              <input
                className="w-full bg-surface-dark border border-surface-border rounded-lg h-12 pl-12 pr-4 text-white placeholder:text-text-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                placeholder="https://"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </label>

          {/* Row 3: Descriptions */}
          <label className="flex flex-col gap-2">
            <span className="text-white text-sm font-medium">Short Description</span>
            <p className="text-text-secondary text-xs">A brief summary displayed on the discovery card (max 120 chars).</p>
            <textarea
              className="w-full bg-surface-dark border border-surface-border rounded-lg p-4 text-white placeholder:text-text-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition-all"
              placeholder="An autonomous agent capable of analyzing complex market data trends..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </label>

          {/* Row 4: Capabilities */}
          <label className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-white text-sm font-medium">Capabilities & Tags</span>
              <span className="text-primary text-xs font-medium cursor-pointer hover:underline">+ Add from presets</span>
            </div>
            <div className="w-full bg-surface-dark border border-surface-border rounded-lg min-h-[56px] p-2 flex flex-wrap gap-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all cursor-text">
              {tags.map(tag => (
                <div key={tag} className="flex items-center gap-1 bg-surface-border text-white text-xs font-medium px-3 py-1.5 rounded-full border border-[#3c4d53]">
                  <span>{tag}</span>
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 flex items-center">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
              <input
                className="bg-transparent border-none text-white text-sm focus:ring-0 p-1.5 placeholder:text-text-secondary/50 flex-1 min-w-[120px]"
                placeholder="Type and press enter..."
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(tagInput);
                    setTagInput('');
                  }
                }}
              />
            </div>
            <p className="text-text-secondary text-xs">Tags help developers discover your agent based on its functionality.</p>
          </label>
          
          <div className="border-t border-surface-border my-2"></div>

          {/* Action Footer */}
          <div className="flex flex-col-reverse md:flex-row justify-between gap-4 items-center">
            <button className="w-full md:w-auto text-text-secondary hover:text-white text-sm font-medium px-6 py-3 transition-colors">
              Cancel Registration
            </button>
            <div className="flex gap-4 w-full md:w-auto">
              <button type="button" className="flex-1 md:flex-none min-w-[120px] rounded-lg border border-surface-border bg-surface-dark text-white text-sm font-bold h-12 hover:bg-surface-border/80 transition-colors">
                Save Draft
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 md:flex-none min-w-[160px] rounded-lg bg-primary text-white text-sm font-bold h-12 hover:bg-primary/90 shadow-[0_0_15px_rgba(23,161,207,0.3)] flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {submitting ? 'Registering...' : 'Register Agent'}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
          
          <div className="flex justify-center mt-4">
             <button className="flex items-center gap-2 text-[#3c4d53] hover:text-text-secondary text-xs font-mono transition-colors">
                <span className="material-symbols-outlined text-[14px]">data_object</span>
                View Raw JSON Schema
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterAgent;
