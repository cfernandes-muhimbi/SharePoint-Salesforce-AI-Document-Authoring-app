import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeScreen.css';

const WelcomeScreen: React.FC = () => {
    const navigate = useNavigate();

    const handleLaunchAITemplates = () => {
        navigate('/opportunities', { state: { quickMode: true } });
    };

    const handleLaunchAIWizard = () => {
        navigate('/opportunities');
    };

    return (
        <div className="welcome-screen">
            <div className="welcome-hero">
                <h1>Welcome to AI Document Authoring!</h1>
                <p className="welcome-subtitle">
                    Create intelligent, polished documents effortlessly with AI-powered tools.
                </p>
                <p className="welcome-body">
                    Utilize cutting-edge AI to generate presentations, reports, proposals, and more. Choose from
                    pre-built templates or follow a guided wizard to craft custom solutions tailored to your needs.
                </p>
            </div>

            <div className="button-container">
                {/* Quick AI Templates */}
                <div className="button-card">
                    <div className="card-icon">
                        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="card-illustration">
                            <rect x="14" y="10" width="38" height="50" rx="4" fill="#DBEAFE" />
                            <rect x="20" y="18" width="26" height="3" rx="1.5" fill="#93C5FD" />
                            <rect x="20" y="25" width="20" height="3" rx="1.5" fill="#93C5FD" />
                            <rect x="20" y="32" width="23" height="3" rx="1.5" fill="#93C5FD" />
                            <rect x="28" y="8" width="22" height="30" rx="4" fill="#3B82F6" />
                            <path d="M39 16 L36 24 L40 24 L37 32 L44 21 L40 21 L43 16 Z" fill="#FBBF24" />
                        </svg>
                    </div>
                    <h2>Quick AI Templates</h2>
                    <p>Start with a ready-to-use AI template to quickly generate your document.</p>
                    <button type="button" onClick={handleLaunchAITemplates}>Browse Templates</button>
                </div>

                {/* AI Document Wizard */}
                <div className="button-card">
                    <div className="card-icon">
                        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="card-illustration">
                            <circle cx="40" cy="42" r="22" fill="#DBEAFE" />
                            <rect x="30" y="28" width="20" height="22" rx="10" fill="#3B82F6" />
                            <circle cx="36" cy="38" r="2.5" fill="white" />
                            <circle cx="44" cy="38" r="2.5" fill="white" />
                            <path d="M36 44 Q40 47 44 44" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M28 26 Q40 18 52 26" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                            <circle cx="28" cy="26" r="2" fill="#60A5FA" />
                            <path d="M52 22 L54 16 L57 19 Z" fill="#60A5FA" />
                            <circle cx="57" cy="19" r="2" fill="#A78BFA" />
                            <circle cx="24" cy="34" r="2" fill="#A78BFA" />
                            <circle cx="56" cy="34" r="2" fill="#60A5FA" />
                        </svg>
                    </div>
                    <h2>AI Document Wizard</h2>
                    <p>Guide me through a step-by-step process to create a custom document.</p>
                    <button type="button" onClick={handleLaunchAIWizard}>Launch Wizard</button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
