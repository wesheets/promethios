import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Scale, 
  DollarSign, 
  GraduationCap, 
  Building, 
  ShoppingCart,
  Shield,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Award,
  Zap,
  Target,
  BarChart3,
  Lock
} from 'lucide-react';

const SolutionsPage: React.FC = () => {
  const [activeIndustry, setActiveIndustry] = useState('healthcare');

  const industries = [
    {
      id: 'healthcare',
      name: 'Healthcare',
      icon: Heart,
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      description: 'HIPAA-compliant AI governance for medical applications',
      stats: { trustScore: '96%', violations: '127', savings: '$2.3M' },
      challenges: [
        'Patient data privacy (HIPAA compliance)',
        'Medical misinformation prevention',
        'Clinical decision support accuracy',
        'Regulatory audit requirements'
      ],
      solutions: [
        'Automated PHI detection and redaction',
        'Medical fact-checking with verified sources',
        'Clinical guideline compliance monitoring',
        'Comprehensive audit trails for regulators'
      ],
      useCases: [
        {
          title: 'Medical AI Assistants',
          description: 'Prevent hallucinations in diagnostic and treatment recommendations',
          roi: '340% ROI from reduced malpractice risk'
        },
        {
          title: 'Patient Communication',
          description: 'Ensure HIPAA compliance in AI-powered patient interactions',
          roi: '$1.2M saved in potential HIPAA violations'
        },
        {
          title: 'Clinical Documentation',
          description: 'Automate medical record generation with governance oversight',
          roi: '60% reduction in documentation errors'
        }
      ],
      testimonial: {
        quote: "Promethios helped us deploy AI assistants across 50+ hospitals while maintaining perfect HIPAA compliance. Zero violations in 18 months.",
        author: "Dr. Sarah Chen",
        title: "Chief Medical Officer",
        company: "MedTech Solutions"
      }
    },
    {
      id: 'legal',
      name: 'Legal',
      icon: Scale,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      description: 'Bar-compliant AI governance for legal professionals',
      stats: { trustScore: '94%', violations: '89', savings: '$5.1M' },
      challenges: [
        'Fabricated case citations (Johnson v. Smith scenarios)',
        'Attorney-client privilege protection',
        'Bar association ethical compliance',
        'Legal precedent accuracy verification'
      ],
      solutions: [
        'Real-time case citation verification',
        'Privileged information detection and blocking',
        'Ethical guideline enforcement',
        'Legal database cross-referencing'
      ],
      useCases: [
        {
          title: 'Legal Research AI',
          description: 'Prevent fabricated cases and ensure citation accuracy',
          roi: 'Avoided $50M Johnson v. Smith scenario'
        },
        {
          title: 'Contract Analysis',
          description: 'AI-powered contract review with compliance oversight',
          roi: '75% faster contract processing'
        },
        {
          title: 'Client Communication',
          description: 'Secure AI assistants for client interactions',
          roi: '99.9% privilege protection rate'
        }
      ],
      testimonial: {
        quote: "After implementing Promethios, our AI research tools have never cited a non-existent case. It's saved us from potential malpractice claims.",
        author: "James Morrison",
        title: "Managing Partner",
        company: "Morrison & Associates"
      }
    },
    {
      id: 'financial',
      name: 'Financial Services',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      description: 'SOX and PCI-compliant AI governance for financial institutions',
      stats: { trustScore: '91%', violations: '203', savings: '$8.7M' },
      challenges: [
        'SOX compliance for trading algorithms',
        'PCI DSS requirements for payment processing',
        'Bias detection in lending decisions',
        'Regulatory reporting accuracy'
      ],
      solutions: [
        'Automated SOX compliance monitoring',
        'PCI-compliant AI transaction processing',
        'Bias detection and correction algorithms',
        'Regulatory audit trail generation'
      ],
      useCases: [
        {
          title: 'Trading Algorithm Governance',
          description: 'Ensure SOX compliance in AI-driven trading decisions',
          roi: '$3.2M in avoided regulatory fines'
        },
        {
          title: 'Credit Risk Assessment',
          description: 'Bias-free AI lending with regulatory compliance',
          roi: '45% improvement in fair lending metrics'
        },
        {
          title: 'Fraud Detection',
          description: 'AI-powered fraud prevention with governance oversight',
          roi: '89% reduction in false positives'
        }
      ],
      testimonial: {
        quote: "Promethios governance has been essential for our AI trading systems. We've maintained perfect SOX compliance while improving performance.",
        author: "Michael Rodriguez",
        title: "Chief Risk Officer",
        company: "Global Financial Partners"
      }
    },
    {
      id: 'education',
      name: 'Education',
      icon: GraduationCap,
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      description: 'FERPA-compliant AI governance for educational institutions',
      stats: { trustScore: '93%', violations: '45', savings: '$1.8M' },
      challenges: [
        'Student data privacy (FERPA compliance)',
        'Academic integrity in AI-assisted learning',
        'Bias prevention in admissions and grading',
        'Age-appropriate content filtering'
      ],
      solutions: [
        'FERPA-compliant student data handling',
        'Academic integrity monitoring',
        'Bias detection in educational AI',
        'Content appropriateness verification'
      ],
      useCases: [
        {
          title: 'AI Tutoring Systems',
          description: 'Personalized learning with privacy protection',
          roi: '67% improvement in learning outcomes'
        },
        {
          title: 'Admissions AI',
          description: 'Bias-free application review and decision support',
          roi: '34% increase in diversity metrics'
        },
        {
          title: 'Student Support',
          description: 'AI-powered student services with FERPA compliance',
          roi: '52% reduction in support response time'
        }
      ],
      testimonial: {
        quote: "Our AI tutoring platform serves 100,000+ students with perfect FERPA compliance thanks to Promethios governance.",
        author: "Dr. Lisa Park",
        title: "VP of Technology",
        company: "EduTech University"
      }
    },
    {
      id: 'government',
      name: 'Government',
      icon: Building,
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30',
      description: 'FedRAMP-compliant AI governance for public sector',
      stats: { trustScore: '98%', violations: '12', savings: '$4.2M' },
      challenges: [
        'FedRAMP compliance requirements',
        'Public transparency and accountability',
        'Citizen data protection',
        'Bias prevention in public services'
      ],
      solutions: [
        'FedRAMP-certified governance infrastructure',
        'Transparent AI decision auditing',
        'Citizen privacy protection',
        'Equitable service delivery monitoring'
      ],
      useCases: [
        {
          title: 'Citizen Services AI',
          description: 'AI-powered government services with transparency',
          roi: '78% improvement in citizen satisfaction'
        },
        {
          title: 'Policy Analysis',
          description: 'AI-assisted policy research with bias detection',
          roi: '43% faster policy development'
        },
        {
          title: 'Public Safety',
          description: 'AI-enhanced emergency response with oversight',
          roi: '29% faster emergency response times'
        }
      ],
      testimonial: {
        quote: "Promethios enables us to deploy AI services for citizens while maintaining the highest standards of transparency and accountability.",
        author: "Robert Kim",
        title: "Chief Technology Officer",
        company: "State of California"
      }
    },
    {
      id: 'retail',
      name: 'Retail & E-commerce',
      icon: ShoppingCart,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      description: 'Brand-safe AI governance for customer-facing applications',
      stats: { trustScore: '87%', violations: '156', savings: '$3.4M' },
      challenges: [
        'Brand safety in AI-generated content',
        'Customer data privacy compliance',
        'Bias prevention in recommendations',
        'Accurate product information'
      ],
      solutions: [
        'Brand safety content filtering',
        'Privacy-compliant personalization',
        'Bias-free recommendation algorithms',
        'Product information accuracy verification'
      ],
      useCases: [
        {
          title: 'AI Customer Service',
          description: 'Brand-safe chatbots with escalation protocols',
          roi: '56% reduction in customer service costs'
        },
        {
          title: 'Product Recommendations',
          description: 'Bias-free AI recommendations with governance',
          roi: '23% increase in conversion rates'
        },
        {
          title: 'Content Generation',
          description: 'AI-powered marketing content with brand compliance',
          roi: '89% faster content creation'
        }
      ],
      testimonial: {
        quote: "Our AI chatbots handle 2M+ customer interactions monthly with zero brand safety incidents since implementing Promethios.",
        author: "Amanda Foster",
        title: "Head of Digital Experience",
        company: "RetailCorp"
      }
    }
  ];

  const activeIndustryData = industries.find(ind => ind.id === activeIndustry) || industries[0];
  const ActiveIcon = activeIndustryData.icon;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Industry Solutions
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Tailored AI governance solutions for every industry. From healthcare to finance, 
              ensure compliance and build trust with industry-specific governance frameworks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                Explore Solutions
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all duration-300"
              >
                Schedule Demo
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Industry Stats */}
      <div className="bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">6</div>
              <div className="text-gray-400">Industries Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">500+</div>
              <div className="text-gray-400">Enterprise Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">$50M+</div>
              <div className="text-gray-400">Compliance Violations Prevented</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">99.7%</div>
              <div className="text-gray-400">Governance Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Selector */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-4">
            {industries.map((industry) => {
              const Icon = industry.icon;
              return (
                <button
                  key={industry.id}
                  onClick={() => setActiveIndustry(industry.id)}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all whitespace-nowrap mr-4 ${
                    activeIndustry === industry.id
                      ? `bg-gradient-to-r ${industry.color} text-white`
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{industry.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Industry Deep Dive */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          key={activeIndustry}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          {/* Industry Header */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${activeIndustryData.color} mb-6`}>
              <ActiveIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">{activeIndustryData.name} Solutions</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {activeIndustryData.description}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className={`${activeIndustryData.bgColor} ${activeIndustryData.borderColor} border p-6 rounded-lg text-center`}>
              <div className="text-3xl font-bold mb-2">{activeIndustryData.stats.trustScore}</div>
              <div className="text-gray-400">Average Trust Score</div>
            </div>
            <div className={`${activeIndustryData.bgColor} ${activeIndustryData.borderColor} border p-6 rounded-lg text-center`}>
              <div className="text-3xl font-bold mb-2">{activeIndustryData.stats.violations}</div>
              <div className="text-gray-400">Violations Prevented</div>
            </div>
            <div className={`${activeIndustryData.bgColor} ${activeIndustryData.borderColor} border p-6 rounded-lg text-center`}>
              <div className="text-3xl font-bold mb-2">{activeIndustryData.stats.savings}</div>
              <div className="text-gray-400">Compliance Savings</div>
            </div>
          </div>

          {/* Challenges & Solutions */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Target className="w-6 h-6 mr-3 text-red-400" />
                Industry Challenges
              </h3>
              <ul className="space-y-4">
                {activeIndustryData.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-green-400" />
                Promethios Solutions
              </h3>
              <ul className="space-y-4">
                {activeIndustryData.solutions.map((solution, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <h3 className="text-3xl font-bold mb-8 text-center">Key Use Cases</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {activeIndustryData.useCases.map((useCase, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-800 p-6 rounded-lg hover:bg-gray-750 transition-all duration-300"
                >
                  <h4 className="text-xl font-semibold mb-3">{useCase.title}</h4>
                  <p className="text-gray-300 mb-4">{useCase.description}</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${activeIndustryData.color} text-white`}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {useCase.roi}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Customer Testimonial */}
          <div className={`${activeIndustryData.bgColor} ${activeIndustryData.borderColor} border p-8 rounded-lg`}>
            <div className="flex items-center mb-6">
              <Star className="w-5 h-5 text-yellow-400 mr-1" />
              <Star className="w-5 h-5 text-yellow-400 mr-1" />
              <Star className="w-5 h-5 text-yellow-400 mr-1" />
              <Star className="w-5 h-5 text-yellow-400 mr-1" />
              <Star className="w-5 h-5 text-yellow-400 mr-4" />
              <span className="text-sm text-gray-400">Customer Success Story</span>
            </div>
            <blockquote className="text-lg text-gray-300 mb-6 italic">
              "{activeIndustryData.testimonial.quote}"
            </blockquote>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${activeIndustryData.color} flex items-center justify-center mr-4`}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold">{activeIndustryData.testimonial.author}</div>
                <div className="text-sm text-gray-400">
                  {activeIndustryData.testimonial.title}, {activeIndustryData.testimonial.company}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-8 rounded-lg text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your {activeIndustryData.name} AI?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join industry leaders who trust Promethios to govern their AI systems. 
              Get started with a customized demo for your {activeIndustryData.name.toLowerCase()} use case.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`bg-gradient-to-r ${activeIndustryData.color} text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 flex items-center justify-center`}
              >
                Schedule {activeIndustryData.name} Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300"
              >
                Download {activeIndustryData.name} Guide
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cross-Industry Benefits */}
      <div className="bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Universal Benefits Across All Industries</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              While each industry has unique challenges, Promethios delivers consistent value across all sectors.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Compliance Assurance</h3>
              <p className="text-gray-400">Meet industry regulations automatically</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Risk Reduction</h3>
              <p className="text-gray-400">Prevent costly AI failures and violations</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Faster Deployment</h3>
              <p className="text-gray-400">Deploy AI with confidence and speed</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Trust Building</h3>
              <p className="text-gray-400">Build stakeholder confidence in AI systems</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Govern Your Industry's AI?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 500+ enterprises across 6 industries who trust Promethios to govern their AI systems. 
            Get started with a customized solution for your industry today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Start Your Industry Solution
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border border-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all duration-300"
            >
              Contact Enterprise Sales
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionsPage;

