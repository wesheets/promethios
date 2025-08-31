import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CleanRiskSurfaceSection = () => {
  const [showProblem, setShowProblem] = useState(false);

  return (
    <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
      {/* Tech Grid Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5'%3E%3Cpath d='M0 0h100v100H0z'/%3E%3Cpath d='M20 0v100M40 0v100M60 0v100M80 0v100M0 20h100M0 40h100M0 60h100M0 80h100'/%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      {/* Floating Tech Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-red-500 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-40"></div>
        <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-green-400 rounded-full animate-pulse opacity-50"></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-30"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
            Your AI Is a <span className="text-red-400">Risk Surface</span>. That's Why Enterprises Are Locking It Down.
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed px-4">
            You're not managing models. You're protecting trust, reputation, and risk.
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 mx-auto mt-8 mb-8"></div>
          
          {/* Problem/Solution Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-xl p-2 flex items-center space-x-2">
              <button 
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  showProblem ? 'bg-red-500 text-white' : 'text-gray-400'
                }`}
                onClick={() => setShowProblem(true)}
              >
                <span className="flex items-center space-x-2">
                  <span>🚨</span>
                  <span>The Problem</span>
                </span>
              </button>
              <button 
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  !showProblem ? 'bg-green-500 text-white' : 'text-gray-400'
                }`}
                onClick={() => setShowProblem(false)}
              >
                <span className="flex items-center space-x-2">
                  <span>🛡️</span>
                  <span>The Spark Layer</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 2x2 Grid of Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* Card 1: Customer Risk */}
          <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-red-500/30 hover:border-red-400 hover:bg-gray-800/80 transition-all duration-300">
            <h3 className="text-xl font-bold mb-6 text-red-400">
              Your AI just lied to a customer. Now what?
            </h3>
            
            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              {/* Dashboard */}
              <div className="w-full lg:w-80 h-40 bg-gray-900/80 rounded-lg border border-red-500/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-400 text-xs font-semibold">
                    {showProblem ? 'UNGOVERNED' : 'GOVERNED'}
                  </span>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    showProblem ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                </div>
                <div className="space-y-2">
                  {showProblem ? (
                    <>
                      <div className="text-xs text-red-400">🧠 AI generated fake legal case</div>
                      <div className="text-xs text-gray-400">"Johnson v. Smith" - completely fabricated</div>
                      <div className="text-xs text-red-400">📉 Trust score unknown</div>
                      <div className="mt-2 bg-red-900/30 rounded px-2 py-1">
                        <div className="text-xs text-red-300">💥 PRISM off. No transparency logs</div>
                        <div className="text-xs text-red-400">❌ No audit trail available</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-green-400">🛡️ Hallucination blocked</div>
                      <div className="text-xs text-gray-300">Redirected to verified legal database</div>
                      <div className="text-xs text-green-400">✓ Trust score: 91% (Veritas active)</div>
                      <div className="mt-2 bg-green-900/30 rounded px-2 py-1">
                        <div className="text-xs text-green-300">🕵️ Audit-ready logs available</div>
                        <div className="text-xs text-green-400">✓ Full transparency maintained</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                Without governance, you're flying blind. No audit trail, no accountability, no way to prove what went wrong.
              </p>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-300 font-semibold text-sm">Spark Solution</span>
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Agent Integrity Reports</strong> + <strong>Real-Time Monitoring</strong><br/>
                  Instant alerts, full audit trails, and automatic hallucination prevention.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Compliance Risk */}
          <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-orange-500/30 hover:border-orange-400 hover:bg-gray-800/80 transition-all duration-300">
            <h3 className="text-xl font-bold mb-6 text-orange-400">
              You're regulated. Your AI isn't.
            </h3>
            
            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              {/* Dashboard */}
              <div className="w-full lg:w-80 h-40 bg-gray-900/80 rounded-lg border border-orange-500/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-orange-400 text-xs font-semibold">
                    {showProblem ? 'UNGOVERNED' : 'GOVERNED'}
                  </span>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    showProblem ? 'bg-orange-500' : 'bg-green-500'
                  }`}></div>
                </div>
                <div className="space-y-2">
                  {showProblem ? (
                    <>
                      <div className="text-xs text-orange-400">GDPR ❌ Bypassed</div>
                      <div className="text-xs text-orange-400">HIPAA ❌ Ignored</div>
                      <div className="text-xs text-orange-400">SOC2 ❌ Violated</div>
                      <div className="mt-2 bg-orange-900/30 rounded px-2 py-1">
                        <div className="text-xs text-orange-300">PII exposed: 147 instances</div>
                        <div className="text-xs text-orange-400">❌ Compliance failure</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-green-400">GDPR ✓ Active</div>
                      <div className="text-xs text-green-400">HIPAA ✓ Active</div>
                      <div className="text-xs text-green-400">SOC2 ✓ Active</div>
                      <div className="mt-2 bg-green-900/30 rounded px-2 py-1">
                        <div className="text-xs text-green-300">PII Redacted: 47 instances</div>
                        <div className="text-xs text-green-400">✓ GDPR violation prevented</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                HIPAA, SOC2, GDPR compliance means nothing if your AI agents can bypass every control you've built.
              </p>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-300 font-semibold text-sm">Spark Solution</span>
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Governance Wrapping</strong> + <strong>Policy Enforcement</strong><br/>
                  Zero-code compliance wrapping for any agent. HIPAA, SOC2, GDPR built-in.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Board Risk */}
          <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-purple-500/30 hover:border-purple-400 hover:bg-gray-800/80 transition-all duration-300">
            <h3 className="text-xl font-bold mb-6 text-purple-400">
              Board wants to know if AI is safe to scale.
            </h3>
            
            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              {/* Dashboard */}
              <div className="w-full lg:w-80 h-40 bg-gray-900/80 rounded-lg border border-purple-500/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-400 text-xs font-semibold">
                    {showProblem ? 'UNGOVERNED' : 'GOVERNED'}
                  </span>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    showProblem ? 'bg-purple-500' : 'bg-green-500'
                  }`}></div>
                </div>
                <div className="space-y-2">
                  {showProblem ? (
                    <>
                      <div className="text-xs text-purple-400">Trust Score: ???</div>
                      <div className="text-xs text-gray-400">No governance metrics available</div>
                      <div className="text-xs text-purple-400">ROI: Unknown</div>
                      <div className="mt-2 bg-purple-900/30 rounded px-2 py-1">
                        <div className="text-xs text-purple-300">No governance metrics</div>
                        <div className="text-xs text-purple-400">❌ No business case</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-green-400">Trust Score: 91%</div>
                      <div className="text-xs text-gray-300">Governed: 91% vs Ungoverned: 34%</div>
                      <div className="text-xs text-green-400">ROI: +247%</div>
                      <div className="mt-2 bg-green-900/30 rounded px-2 py-1">
                        <div className="text-xs text-green-300">✓ Board-ready metrics</div>
                        <div className="text-xs text-green-400">✓ Clear business case</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                "Trust me, it works" isn't a business case. You need metrics, benchmarks, and proof of governance.
              </p>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-300 font-semibold text-sm">Spark Solution</span>
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Trust Score Engine</strong> + <strong>Benchmark Insights</strong><br/>
                  Quantified trust metrics and governed vs. ungoverned performance data.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Systemic Risk */}
          <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-cyan-500/30 hover:border-cyan-400 hover:bg-gray-800/80 transition-all duration-300">
            <h3 className="text-xl font-bold mb-6 text-cyan-400">
              Multi-agent chaos is coming.
            </h3>
            
            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              {/* Dashboard */}
              <div className="w-full lg:w-80 h-40 bg-gray-900/80 rounded-lg border border-cyan-500/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-400 text-xs font-semibold">
                    {showProblem ? 'UNGOVERNED' : 'GOVERNED'}
                  </span>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    showProblem ? 'bg-cyan-500' : 'bg-green-500'
                  }`}></div>
                </div>
                <div className="space-y-2">
                  {showProblem ? (
                    <>
                      <div className="text-xs text-cyan-400">Active Agents: 12</div>
                      <div className="text-xs text-gray-400">Conflicts: 847</div>
                      <div className="text-xs text-cyan-400">Coordination: Failed</div>
                      <div className="mt-2 bg-cyan-900/30 rounded px-2 py-1">
                        <div className="text-xs text-cyan-300">Workflow Efficiency: 23%</div>
                        <div className="text-xs text-cyan-400">❌ Governance gaps</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-green-400">Active Agents: 12</div>
                      <div className="text-xs text-gray-300">Coordinated Tasks: 847</div>
                      <div className="text-xs text-green-400">Conflicts Resolved: 23</div>
                      <div className="mt-2 bg-green-900/30 rounded px-2 py-1">
                        <div className="text-xs text-green-300">Workflow Efficiency: 94%</div>
                        <div className="text-xs text-green-400">✓ Zero governance gaps</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                One agent is hard enough to govern. What happens when you have dozens working together?
              </p>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-300 font-semibold text-sm">Spark Solution</span>
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Multi-Agent Coordination</strong> + <strong>Unified Governance</strong><br/>
                  Single pane of glass for governing complex multi-agent workflows.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise Reality Check */}
        <div className="text-center mb-12">
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/50 rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-white">The Enterprise Reality</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-red-400 font-bold text-lg mb-2">"Don't let your AI become your next liability."</p>
              </div>
              <div>
                <p className="text-orange-400 font-bold text-lg mb-2">"Auditors won't accept 'It was the model's fault.'"</p>
              </div>
              <div>
                <p className="text-green-400 font-bold text-lg mb-2">"Trust is earned. Spark proves it."</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <Link 
            to="/features" 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Fix the part of AI no one wants to admit is broken
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CleanRiskSurfaceSection;

