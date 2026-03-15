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
            <h1>Welcome!</h1>
            <p>
                AI Document Authoring allows you to create and deliver robust, sophisticated documents with ease, using advanced artificial intelligence and pre-built intelligence templates. Documents include presentations, reports, and quotes by leveraging automated AI workflows.
            </p>
            <div className="button-container">
                <div className="button-card">
                    <h2>Quick AI Templates</h2>
                    <p>Select a pre-built AI solution best suited for your needs.</p>
                    <button onClick={handleLaunchAITemplates}>Launch AI Templates</button>
                </div>
                <div className="button-card">
                    <h2>AI Document Wizard</h2>
                    <p>Follow the easy AI-guided process to create your custom, intelligent solution.</p>
                    <button onClick={handleLaunchAIWizard}>Launch AI Wizard</button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;