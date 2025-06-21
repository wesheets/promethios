import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Users, 
  Target, 
  Award, 
  Globe, 
  Shield, 
  Zap,
  Heart,
  Brain,
  Lightbulb,
  Rocket,
  Star,
  MapPin,
  Mail,
  Linkedin,
  Twitter,
  Github,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Building,
  Calendar
} from 'lucide-react';

const AboutPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('company');
  const location = useLocation();

  useEffect(() => {
    // Handle hash navigation
    const hash = location.hash.replace('#', '');
    if (hash && ['company', 'team', 'values', 'careers'].includes(hash)) {
      setActiveSection(hash);
    }
  }, [location.hash]);

  const teamMembers = [
    {
      name: "Dr. Sarah Chen",
      role: "CEO & Co-Founder",
      bio: "Former AI Ethics lead at Google. PhD in Computer Science from Stanford. 15+ years building responsible AI systems.",
      image: "/api/placeholder/150/150",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "Michael Rodriguez",
      role: "CTO & Co-Founder", 
      bio: "Ex-Principal Engineer at OpenAI. Led safety infrastructure for GPT models. MIT Computer Science graduate.",
      image: "/api/placeholder/150/150",
      linkedin: "#",
      github: "#"
    },
    {
      name: "Dr. Priya Patel",
      role: "Head of AI Safety",
      bio: "Former researcher at DeepMind. PhD in AI Safety from Oxford. Published 50+ papers on AI alignment.",
      image: "/api/placeholder/150/150",
      linkedin: "#"
    },
    {
      name: "James Kim",
      role: "VP of Engineering",
      bio: "Former Engineering Manager at Meta. Built large-scale ML infrastructure. Carnegie Mellon alumnus.",
      image: "/api/placeholder/150/150",
      linkedin: "#",
      github: "#"
    },
    {
      name: "Dr. Lisa Wang",
      role: "Head of Compliance",
      bio: "Former Legal Counsel at Microsoft. JD from Harvard Law. Expert in AI regulation and data privacy.",
      image: "/api/placeholder/150/150",
      linkedin: "#"
    },
    {
      name: "David Thompson",
      role: "Head of Product",
      bio: "Former Product Lead at Anthropic. 10+ years in AI product development. Stanford MBA.",
      image: "/api/placeholder/150/150",
      linkedin: "#"
    }
  ];

  const values = [
    {
      icon: Shield,
      title: "Safety First",
      description: "We believe AI safety isn't optional—it's fundamental. Every decision we make prioritizes the safety and wellbeing of humans.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Heart,
      title: "Human-Centered",
      description: "Technology should serve humanity, not the other way around. We build AI governance that puts people at the center.",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: Brain,
      title: "Intelligent by Design",
      description: "We combine cutting-edge AI research with practical engineering to create governance systems that are both smart and reliable.",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "AI is a global technology that requires global solutions. We're building governance frameworks that work across cultures and borders.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We're not just solving today's AI problems—we're anticipating tomorrow's challenges and building solutions for the future.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "The biggest challenges require the best minds working together. We believe in open collaboration and shared knowledge.",
      color: "from-indigo-500 to-blue-500"
    }
  ];

  const milestones = [
    {
      year: "2022",
      title: "Company Founded",
      description: "Promethios founded by AI safety researchers from Google, OpenAI, and DeepMind",
      icon: Rocket
    },
    {
      year: "2023",
      title: "Seed Funding",
      description: "$15M seed round led by Andreessen Horowitz to build AI governance infrastructure",
      icon: TrendingUp
    },
    {
      year: "2023",
      title: "First Enterprise Customers",
      description: "Launched with 10 Fortune 500 companies, preventing 1,000+ AI violations in first quarter",
      icon: Building
    },
    {
      year: "2024",
      title: "Series A",
      description: "$50M Series A to expand globally and build industry-specific governance solutions",
      icon: Globe
    },
    {
      year: "2024",
      title: "500+ Customers",
      description: "Reached 500+ enterprise customers across 6 industries, preventing $50M+ in violations",
      icon: Award
    },
    {
      year: "2025",
      title: "AI Governance Standard",
      description: "Promethios governance framework adopted as industry standard by major tech companies",
      icon: Star
    }
  ];

  const stats = [
    { number: "500+", label: "Enterprise Customers", icon: Building },
    { number: "$50M+", label: "Violations Prevented", icon: Shield },
    { number: "6", label: "Industries Served", icon: Globe },
    { number: "99.7%", label: "Uptime SLA", icon: Zap }
  ];

  const sections = [
    { id: 'company', label: 'Our Story', icon: Building },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'values', label: 'Values', icon: Heart },
    { id: 'careers', label: 'Careers', icon: Target }
  ];

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
              About Promethios
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              We're building the future of AI governance—ensuring that artificial intelligence 
              serves humanity safely, responsibly, and ethically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                onClick={() => setActiveSection('team')}
              >
                Meet Our Team
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all duration-300"
                onClick={() => setActiveSection('careers')}
              >
                Join Us
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Company Stats */}
      <div className="bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-blue-400 mb-2">{stat.number}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeSection === section.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {activeSection === 'company' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-16"
          >
            {/* Mission Statement */}
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                To make artificial intelligence safe, trustworthy, and beneficial for all humanity by providing 
                the world's most advanced AI governance platform. We believe that with great power comes great 
                responsibility—and AI represents the greatest power humanity has ever created.
              </p>
            </div>

            {/* The Problem */}
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6 text-center">The Challenge We're Solving</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">AI Safety Crisis</h4>
                  <p className="text-gray-400">
                    73% of enterprises report unreliable AI behavior, with hallucinations and bias causing 
                    millions in damages annually.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Compliance Complexity</h4>
                  <p className="text-gray-400">
                    Navigating HIPAA, SOX, GDPR, and other regulations while deploying AI is nearly impossible 
                    without specialized expertise.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Trust Deficit</h4>
                  <p className="text-gray-400">
                    Users and stakeholders lack confidence in AI systems, slowing adoption and limiting 
                    the potential benefits of AI technology.
                  </p>
                </div>
              </div>
            </div>

            {/* Company Timeline */}
            <div>
              <h3 className="text-3xl font-bold mb-8 text-center">Our Journey</h3>
              <div className="space-y-8">
                {milestones.map((milestone, index) => {
                  const Icon = milestone.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`flex items-center space-x-6 ${index % 2 === 1 ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className={`flex-1 ${index % 2 === 1 ? 'text-right' : ''}`}>
                        <div className="text-sm text-blue-400 font-semibold">{milestone.year}</div>
                        <h4 className="text-xl font-bold mb-2">{milestone.title}</h4>
                        <p className="text-gray-300">{milestone.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'team' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-6">Meet Our Team</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                World-class AI researchers, engineers, and safety experts united by a shared mission 
                to make AI safe and beneficial for humanity.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-800 p-6 rounded-lg hover:bg-gray-750 transition-all duration-300"
                >
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                    <div className="text-blue-400 font-semibold mb-3">{member.role}</div>
                    <p className="text-gray-300 text-sm mb-4">{member.bio}</p>
                    <div className="flex justify-center space-x-3">
                      {member.linkedin && (
                        <a href={member.linkedin} className="text-gray-400 hover:text-blue-400 transition-colors">
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                      {member.twitter && (
                        <a href={member.twitter} className="text-gray-400 hover:text-blue-400 transition-colors">
                          <Twitter className="w-5 h-5" />
                        </a>
                      )}
                      {member.github && (
                        <a href={member.github} className="text-gray-400 hover:text-blue-400 transition-colors">
                          <Github className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Advisory Board */}
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6 text-center">Advisory Board</h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <h4 className="text-lg font-semibold mb-2">Dr. Yoshua Bengio</h4>
                  <p className="text-blue-400 mb-2">Turing Award Winner</p>
                  <p className="text-gray-400 text-sm">Co-founder of Element AI, Professor at University of Montreal</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">Dr. Fei-Fei Li</h4>
                  <p className="text-blue-400 mb-2">Stanford AI Lab Director</p>
                  <p className="text-gray-400 text-sm">Former Chief Scientist at Google Cloud, Co-founder of AI4ALL</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">Stuart Russell</h4>
                  <p className="text-blue-400 mb-2">UC Berkeley Professor</p>
                  <p className="text-gray-400 text-sm">Author of "Human Compatible", AI Safety pioneer</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'values' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-6">Our Values</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                These principles guide every decision we make and every line of code we write. 
                They're not just words on a wall—they're the foundation of who we are.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-gray-800 p-6 rounded-lg hover:bg-gray-750 transition-all duration-300"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-r ${value.color} rounded-full flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                    <p className="text-gray-300">{value.description}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Commitment Section */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6 text-center">Our Commitment</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    Open Research
                  </h4>
                  <p className="text-gray-300 mb-4">
                    We publish our research and contribute to the global AI safety community. 
                    Knowledge should be shared, not hoarded.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    Ethical AI
                  </h4>
                  <p className="text-gray-300 mb-4">
                    We never compromise on ethics. Our technology is designed to promote fairness, 
                    transparency, and human dignity.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    Global Accessibility
                  </h4>
                  <p className="text-gray-300 mb-4">
                    AI governance shouldn't be a luxury. We're committed to making our technology 
                    accessible to organizations of all sizes.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    Long-term Thinking
                  </h4>
                  <p className="text-gray-300 mb-4">
                    We're not just solving today's problems—we're building infrastructure for 
                    the AI systems of tomorrow.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'careers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-6">Join Our Mission</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Help us build the future of AI governance. We're looking for brilliant minds who share 
                our passion for making AI safe, trustworthy, and beneficial for all.
              </p>
            </div>

            {/* Why Join Us */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Cutting-Edge Work</h3>
                <p className="text-gray-300">
                  Work on the most important problems in AI safety with state-of-the-art technology 
                  and unlimited resources.
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">World-Class Team</h3>
                <p className="text-gray-300">
                  Collaborate with leading AI researchers and engineers from Google, OpenAI, 
                  DeepMind, and top universities.
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Global Impact</h3>
                <p className="text-gray-300">
                  Your work will directly impact how AI is deployed safely across industries 
                  and around the world.
                </p>
              </div>
            </div>

            {/* Open Positions */}
            <div>
              <h3 className="text-3xl font-bold mb-8 text-center">Open Positions</h3>
              <div className="space-y-4">
                {[
                  { title: "Senior AI Safety Researcher", department: "Research", location: "San Francisco, CA" },
                  { title: "Staff Software Engineer", department: "Engineering", location: "Remote" },
                  { title: "Product Manager - AI Governance", department: "Product", location: "San Francisco, CA" },
                  { title: "Senior Frontend Engineer", department: "Engineering", location: "Remote" },
                  { title: "AI Ethics Specialist", department: "Research", location: "San Francisco, CA" },
                  { title: "DevOps Engineer", department: "Engineering", location: "Remote" }
                ].map((job, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-gray-800 p-6 rounded-lg hover:bg-gray-750 transition-all duration-300 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{job.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          {job.department}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center"
                    >
                      Apply
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6 text-center">Benefits & Perks</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">Health & Wellness</h4>
                  <p className="text-sm text-gray-400">Comprehensive health, dental, vision, and mental health coverage</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">Unlimited PTO</h4>
                  <p className="text-sm text-gray-400">Take the time you need to recharge and maintain work-life balance</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">Learning Budget</h4>
                  <p className="text-sm text-gray-400">$5,000 annual budget for conferences, courses, and professional development</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">Equity Package</h4>
                  <p className="text-sm text-gray-400">Meaningful equity stake in the future of AI governance</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-8 rounded-lg text-center">
              <h3 className="text-2xl font-bold mb-4">Don't See Your Role?</h3>
              <p className="text-gray-300 mb-6">
                We're always looking for exceptional talent. Send us your resume and tell us how 
                you'd like to contribute to AI safety.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center mx-auto"
              >
                <Mail className="w-5 h-5 mr-2" />
                careers@promethios.ai
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AboutPage;

