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

    if (!name || !version) {
      setError('Name and version are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await registerAgent({ name, version, url, description, tags });
      setSuccessId(res.sageo_id);
    } catch (err: any) {
      setError(err?.message || 'Failed to register agent.');
    } finally {
      setSubmitting(false);
    }
  };

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

        {/* Error and Success Messages */}
        {error && (
          <div className="w-full rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {successId && (
          <div className="w-full rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
            Registered: <span className="font-mono">{successId}</span>
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