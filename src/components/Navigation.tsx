import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <nav className="top-navigation">
            <div className="nav-container">
                <Link to="/" className={`nav-logo ${isHome ? 'active' : ''}`} aria-label="IWant home">
                    IWant
                </Link>
                <div className="nav-links">
                    <Link
                        to="/categories"
                        className={`nav-link ${location.pathname === '/categories' ? 'active' : ''}`}
                    >
                        Categories
                    </Link>
                    <Link to="/demands" className={`nav-link ${location.pathname === '/demands' ? 'active' : ''}`}>
                        Demands
                    </Link>
                    <Link
                        to="/users"
                        className={`nav-link ${
                            location.pathname === '/users' || location.pathname.startsWith('/users/')
                                ? 'active'
                                : ''
                        }`}
                    >
                        Users
                    </Link>
                    <Link
                        to="/business-users"
                        className={`nav-link ${location.pathname.startsWith('/business-users') ? 'active' : ''}`}
                    >
                        Business Users
                    </Link>
                    <Link
                        to="/businesses"
                        className={`nav-link ${location.pathname.startsWith('/businesses') ? 'active' : ''}`}
                    >
                        Businesses
                    </Link>
                    <Link
                        to="/low-coverage-demands"
                        className={`nav-link ${location.pathname === '/low-coverage-demands' ? 'active' : ''}`}
                    >
                        Low Coverage
                    </Link>
                    <Link
                        to="/rejected-messages"
                        className={`nav-link ${location.pathname === '/rejected-messages' ? 'active' : ''}`}
                    >
                        Rejected
                    </Link>
                </div>
            </div>
        </nav>
    );
};
