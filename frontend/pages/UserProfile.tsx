import React from 'react';
import { useParams } from 'react-router-dom';

const UserProfile = () => {
  const { id } = useParams();

  return (
    <div className="flex-1 flex flex-col items-center py-8 px-4 md:px-10 lg:px-40 w-full">
      <div className="flex flex-col max-w-[1024px] w-full gap-8">
        {/* Profile Header */}
        <div className="flex flex-col gap-4 p-4 rounded-xl">
          <div className="flex w-full flex-col gap-6 md:flex-row md:justify-between md:items-center">
            <div className="flex gap-5 items-center">
              <div 
                className="bg-center bg-no-repeat bg-cover rounded-full h-24 w-24 md:h-32 md:w-32 ring-2 ring-border-dark" 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCjnGvP6jyzjvst653EeMDE-moUWltUUlrqM0chmOZuU3aoO2osgcIE2BDPbGgQ4wSmRz1WZfX6WUWeEleQp6H1LasPsxBHh2mZwVRh_w5B7dAj_R8URw9OJDWn9wf8ZkSb2gpqCASfAfkbIA43CJNBo0jLT5oJt_qW1Lm-LpdmYSeQt05HSelTJLgF0cUrzvq2XdHUUnDed1XdoFq9p8nM1HAubUHbYQOoPI2iKBobFarDokQoqlbSvYdwciCwq55BBfkkYlBXaS65")' }}
                aria-label="User avatar"
              ></div>
              <div className="flex flex-col justify-center gap-1">
                <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight tracking-[-0.015em]">{id || 'user_12345'}</h1>
                <div className="flex items-center gap-2 text-text-secondary text-sm md:text-base">
                  <span className="font-mono bg-[#293438] px-2 py-0.5 rounded text-xs">0x71C...9A2</span>
                  <span className="hidden md:inline">(MOI Address)</span>
                  <button className="text-primary hover:text-white transition-colors" title="Copy Address">
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  </button>
                </div>
                <div className="flex items-center gap-1 text-text-secondary text-sm mt-1">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  <span>Member since Oct 2023</span>
                </div>
              </div>
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-[#293438] hover:bg-[#3c4d53] transition-colors text-white text-sm font-bold flex-1 md:flex-auto gap-2">
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span className="truncate">Share</span>
              </button>
              <button className="flex items-center justify-center rounded-lg h-10 px-4 border border-primary text-primary hover:bg-primary/10 transition-colors text-sm font-bold flex-1 md:flex-auto gap-2">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span className="truncate">Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-dark border border-border-dark hover:border-primary/50 transition-colors group">
            <div className="flex justify-between items-start">
              <p className="text-text-secondary text-sm font-medium leading-normal group-hover:text-white transition-colors">Total Interactions</p>
              <span className="material-symbols-outlined text-primary text-[24px]">history</span>
            </div>
            <p className="text-white tracking-tight text-3xl font-bold leading-tight">52</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-dark border border-border-dark hover:border-primary/50 transition-colors group">
            <div className="flex justify-between items-start">
              <p className="text-text-secondary text-sm font-medium leading-normal group-hover:text-white transition-colors">Unique Agent Reach</p>
              <span className="material-symbols-outlined text-primary text-[24px]">hub</span>
            </div>
            <p className="text-white tracking-tight text-3xl font-bold leading-tight">12</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-dark border border-border-dark hover:border-primary/50 transition-colors group">
            <div className="flex justify-between items-start">
              <p className="text-text-secondary text-sm font-medium leading-normal group-hover:text-white transition-colors">Last Active</p>
              <span className="material-symbols-outlined text-primary text-[24px]">schedule</span>
            </div>
            <p className="text-white tracking-tight text-3xl font-bold leading-tight">2 mins ago</p>
          </div>
        </div>

        {/* Interaction History Section */}
        <div className="flex flex-col px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border-dark mb-6">
            <div>
              <h3 className="text-white text-2xl font-bold leading-tight">Interaction History</h3>
              <p className="text-text-secondary text-sm mt-1">A chronological log of your verifiable on-chain activity.</p>
            </div>
            <div className="flex flex-1 md:justify-end gap-3">
              <div className="relative w-full md:max-w-[240px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input className="w-full bg-surface-dark border border-border-dark text-white text-sm rounded-lg focus:ring-primary focus:border-primary block pl-10 p-2.5 placeholder-text-secondary" placeholder="Filter by Agent Name" />
              </div>
              <div className="relative w-full md:max-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <span className="material-symbols-outlined text-[20px]">filter_list</span>
                </div>
                <input className="w-full bg-surface-dark border border-border-dark text-white text-sm rounded-lg focus:ring-primary focus:border-primary block pl-10 p-2.5 placeholder-text-secondary" placeholder="Status Code" />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="w-full overflow-hidden rounded-xl border border-border-dark bg-surface-dark/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-text-secondary">
                <thead className="bg-[#1c2426] text-xs uppercase text-white font-semibold">
                  <tr>
                    <th className="px-6 py-4" scope="col">Agent Name</th>
                    <th className="px-6 py-4" scope="col">Interaction ID</th>
                    <th className="px-6 py-4" scope="col">Intent</th>
                    <th className="px-6 py-4" scope="col">Timestamp</th>
                    <th className="px-6 py-4 text-right" scope="col">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {/* Row 1 */}
                  <tr className="hover:bg-[#232d30] transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div 
                        className="h-8 w-8 rounded bg-gray-700 bg-center bg-cover" 
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAUwQBeWKKH-ncOhyPjN3RBt2eUpS_tQIjT9_qC-wzYhDeR-gg7k_P6viyJjHBP7VjkRoY30tTtOHreZj9o4_hws77G_YEqJiS_sVO2Cu0NWQRZDnT0T1P4_NK0qzrE1TcR21zya2h97JHjFvCKRcgPXYQsnqA3qrkfKu1Gs7G4JmYwTTuzaUqtPvPvUloui2JHmcxhz8O77q7F3YVBkr1BNI76VU4I5mMazuDifK-VN6LMXmrJ7qewmXSKitnlbTAsayNV7X2wz1vm")' }}
                      ></div>
                      DeFi Saver Bot
                    </td>
                    <td className="px-6 py-4 font-mono text-primary cursor-pointer hover:underline">#9928123</td>
                    <td className="px-6 py-4 text-white">Liquidity Check</td>
                    <td className="px-6 py-4">2 mins ago</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-400/10 px-2.5 py-0.5 text-xs font-medium text-green-400 border border-green-400/20">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        200 OK
                      </span>
                    </td>
                  </tr>
                  {/* Row 2 */}
                  <tr className="hover:bg-[#232d30] transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div 
                        className="h-8 w-8 rounded bg-gray-700 bg-center bg-cover" 
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCeE9ZqaApJjAA6VQbi7FqbxIqf7atgjFpZ-FVyNlZQdupoQwFOaR23vV30scRMmr693usTYM7Mc8gCeTLiGo0rlGKQkoK_109kSvUdzcgK9utH-aPT3UE76Z2Gs3fBTitkgrBm8C0-1oeL5XDDTFLPB-g1U9xG67oGcWFwDRXX5D_ywRT5PzTb4F7SVgxzWiFYwKfhD5fSAE3ThfcAT1076Lg6VfUY7apNmF0S5s196oJWREqXxB7pkVGXsRG5vahUPdcA041p_rim")' }}
                      ></div>
                      Market Analyzer
                    </td>
                    <td className="px-6 py-4 font-mono text-primary cursor-pointer hover:underline">#9928122</td>
                    <td className="px-6 py-4 text-white">Fetch Price Data</td>
                    <td className="px-6 py-4">15 mins ago</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-400/10 px-2.5 py-0.5 text-xs font-medium text-green-400 border border-green-400/20">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        200 OK
                      </span>
                    </td>
                  </tr>
                  {/* Row 3 */}
                  <tr className="hover:bg-[#232d30] transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div 
                        className="h-8 w-8 rounded bg-gray-700 bg-center bg-cover" 
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBkRLShIF5cR0FYtX7h6m6yWJTpbVtWQqI4vXUM7POUIWT1U88pDwc95pvtfEUeYVRmqnQ3bpf5N-EfqB9ubcKOJbXBUrAcMbgXkppktMZsZydptroLRrzpWCXVDjjUVUJ7cLgkkL8hKMZSGDsexwjKXhqasTvqsPCiJHes0SJ7Nubc9uUFefMjxGyDWHxeKFccmfS81LTDnI6snhZCcCC61X_UasFu7D7DzVEEPXwgok8TPCdDX85FN-yDHwYLYbYDZT7RLNQ4bO_x")' }}
                      ></div>
                      Portfolio Balancer
                    </td>
                    <td className="px-6 py-4 font-mono text-primary cursor-pointer hover:underline">#9928098</td>
                    <td className="px-6 py-4 text-white">Rebalance Asset</td>
                    <td className="px-6 py-4">1 hr ago</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-400/10 px-2.5 py-0.5 text-xs font-medium text-orange-400 border border-orange-400/20">
                        <span className="material-symbols-outlined text-[14px]">pending</span>
                        PENDING
                      </span>
                    </td>
                  </tr>
                  {/* Row 4 */}
                  <tr className="hover:bg-[#232d30] transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div 
                        className="h-8 w-8 rounded bg-gray-700 bg-center bg-cover" 
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAOOsVWaG8L4kLJDiE6cjGr1DEtvHL7yn4wo5DyRhUaoV397ngyuj2I3i-cVwIeNWIf6JehnlOCkmSg9f9pqLVndf8tRlv1iGirS1o0X-O0CC2CI7mUHxF2xJRJCcds9jdAAEpyP825r0to9WS24kE4tc4TLNBbS5fRbw3t-Pt2D6dSOW7nDVguGsUUuRWGoIAKYRc2qyhJ2IOHOCEdA08WMD9e2LOe5ckIBw3bFdhbwMy0bfd8wTynTBKsWerymV8CBJfGIYw8QWJK")' }}
                      ></div>
                      Data Oracle Node
                    </td>
                    <td className="px-6 py-4 font-mono text-primary cursor-pointer hover:underline">#9927541</td>
                    <td className="px-6 py-4 text-white">Verify Identity</td>
                    <td className="px-6 py-4">5 hrs ago</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-400/20">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        401 AUTH
                      </span>
                    </td>
                  </tr>
                  {/* Row 5 */}
                  <tr className="hover:bg-[#232d30] transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div 
                        className="h-8 w-8 rounded bg-gray-700 bg-center bg-cover" 
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBpDxM1XCEDNi3JiBFk6BnnjukH3wkycUyWHbqq70kOo4HX0rtidRQPOZiKYvspVA3xb5OiugKgPe_nMxtLb0-JemtrdlXnlJqCqq8NH0d9dHXkFCYaEP4ZDXJnTQ5WviUEYfWPmmsZ-_aU_BDBKT1VCzt6YZzspa1rlV_hbKd3dnGNkG1HRxI8qCLdctBkTfg2ZLIp4xy0ZJlB2v_r-vaVAcylLzcWZvgiGxPbdklBr1dkfTcn2oFcWe4VZVCTpWDPC5qsTEyUco9C")' }}
                      ></div>
                      DeFi Saver Bot
                    </td>
                    <td className="px-6 py-4 font-mono text-primary cursor-pointer hover:underline">#9927100</td>
                    <td className="px-6 py-4 text-white">Swap Token</td>
                    <td className="px-6 py-4">1 day ago</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-400/10 px-2.5 py-0.5 text-xs font-medium text-green-400 border border-green-400/20">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        200 OK
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border-dark bg-[#1c2426] px-6 py-3">
              <div className="text-xs text-text-secondary">
                Showing <span className="font-medium text-white">1</span> to <span className="font-medium text-white">5</span> of <span className="font-medium text-white">52</span> results
              </div>
              <div className="flex gap-2">
                <button className="flex items-center justify-center rounded bg-transparent p-1 text-text-secondary hover:bg-white/5 hover:text-white disabled:opacity-50">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="flex items-center justify-center rounded bg-transparent p-1 text-text-secondary hover:bg-white/5 hover:text-white">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;