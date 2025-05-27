// Modified Header.tsx to remove unused imports
import React from 'react';
import { Link } from 'react-router-dom';
// Removed unused ThemeToggle import

const Header = () => {
  return (
    <header>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/settings">Settings</Link>
      </nav>
    </header>
  );
};

export default Header;
