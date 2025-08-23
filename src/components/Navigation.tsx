import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

export const Navigation: React.FC = () => {
    const location = useLocation();

    return (
        <nav className="top-navigation">
            <div className="nav-container">
                <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                    Home
                </Link>
                <Link to="/categories" className={`nav-link ${location.pathname === '/categories' ? 'active' : ''}`}>
                    Categories
                </Link>
                <Link to="/demands" className={`nav-link ${location.pathname === '/demands' ? 'active' : ''}`}>
                    Demands
                </Link>
                <Link to="/business" className={`nav-link ${location.pathname === '/business' ? 'active' : ''}`}>
                    Business
                </Link>
                <Link to="/business-users" className={`nav-link ${location.pathname === '/business-users' ? 'active' : ''}`}>
                    Business Users
                </Link>
            </div>
        </nav>
    );
}; 