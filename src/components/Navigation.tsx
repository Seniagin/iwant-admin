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
                    <Link to="/demands" className={`nav-link ${location.pathname.startsWith('/demands') ? 'active' : ''}`}>
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
                        to="/facets"
                        className={`nav-link ${location.pathname.startsWith('/facets') ? 'active' : ''}`}
                    >
                        Parameters
                    </Link>
                    <Link
                        to="/search-logs"
                        className={`nav-link ${location.pathname.startsWith('/search-logs') ? 'active' : ''}`}
                    >
                        Search log
                    </Link>
                    <Link
                        to="/playground"
                        className={`nav-link ${location.pathname === '/playground' ? 'active' : ''}`}
                    >
                        🎮 Playground
                    </Link>
                    <Link
                        to="/business-import"
                        className={`nav-link ${location.pathname === '/business-import' ? 'active' : ''}`}
                    >
                        📍 Business import
                    </Link>
                    <Link
                        to="/business-claims"
                        className={`nav-link ${location.pathname === '/business-claims' ? 'active' : ''}`}
                    >
                        🏷️ Claims
                    </Link>
                    <Link
                        to="/query-playground"
                        className={`nav-link ${location.pathname === '/query-playground' ? 'active' : ''}`}
                    >
                        🧪 Query playground
                    </Link>
                </div>
            </div>
        </nav>
    );
};
