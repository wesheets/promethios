import React from 'react';
import { Link } from 'react-router-dom';
import WaitlistForm from '../waitlist/WaitlistForm';

const LoginPage: React.FC = () => {
  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <header style={{ 
        textAlign: 'center', 
        marginBottom: '3rem' 
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 700,
          marginBottom: '1rem',
          color: '#1a202c'
        }}>
          Promethios
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#4a5568',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          The platform for wrapping, governing, and deploying AI agents
        </p>
      </header>

      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        alignItems: 'center'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          padding: '2rem',
          backgroundColor: '#f7fafc',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 600,
            marginBottom: '1.5rem',
            color: '#2d3748',
            textAlign: 'center'
          }}>
            Login Coming Soon
          </h2>
          <p style={{ 
            textAlign: 'center',
            marginBottom: '1.5rem',
            color: '#4a5568'
          }}>
            We're currently in private beta. Join our waitlist to get early access.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <Link to="/waitlist" style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3182ce',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}>
              Join Waitlist
            </Link>
            <Link to="/debug/waitlist-test" style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#718096',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}>
              Test Waitlist Form
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
