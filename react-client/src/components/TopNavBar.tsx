import React from 'react';
import { Link } from 'react-router-dom';
import { Login } from '@microsoft/mgt-react';
import './TopNavBar.css';

interface TopNavBarProps {
  onLoginCompleted?: () => void;
  onChatToggle?: () => void;
  onNavToggle?: () => void;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ onLoginCompleted, onNavToggle }) => {
  return (
    <nav className="top-nav">
      <button type="button" className="top-nav-hamburger" onClick={onNavToggle} aria-label="Toggle navigation">
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>
      <div className="top-nav-brand">
        <Link to="/welcome" className="top-nav-logo">AI Document Authoring</Link>
      </div>
      <div className="top-nav-links">
        <Link to="/welcome" className="top-nav-link">Home</Link>
        <Link to="/containers" className="top-nav-link">Containers</Link>
        <Link to="/opportunities" className="top-nav-link">Opportunities</Link>
      </div>
      <div className="top-nav-actions">
        <Login loginCompleted={onLoginCompleted} />
      </div>
    </nav>
  );
};

export default TopNavBar;
