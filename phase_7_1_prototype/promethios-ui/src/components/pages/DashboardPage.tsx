import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <header style={{ 
        marginBottom: '2rem' 
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 700,
          marginBottom: '0.5rem',
          color: '#1a202c'
        }}>
          Dashboard
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: '#4a5568'
        }}>
          Welcome to your Promethios dashboard
        </p>
      </header>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f7fafc',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600,
            marginBottom: '1rem',
            color: '#2d3748'
          }}>
            Your Agents
          </h2>
          <p style={{ color: '#4a5568' }}>
            No agents created yet. Start by creating your first agent.
          </p>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f7fafc',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600,
            marginBottom: '1rem',
            color: '#2d3748'
          }}>
            Governance
          </h2>
          <p style={{ color: '#4a5568' }}>
            Set up governance rules for your AI agents.
          </p>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f7fafc',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600,
            marginBottom: '1rem',
            color: '#2d3748'
          }}>
            Deployments
          </h2>
          <p style={{ color: '#4a5568' }}>
            No deployments yet. Deploy your first agent.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
