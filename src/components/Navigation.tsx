import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { setAdminToken } from '../auth/adminSession';
import { MODERATION_CHANGED_EVENT } from '../pages/ModerationPage';
import { getReviewQueue, getSettings } from '../service/moderation.api.service';

/** Requests waiting for moderation, and whether moderation is on — for the menu badge. */
function useModerationBadge(): { waiting: number; on: boolean } {
    const [state, setState] = useState({ waiting: 0, on: false });
    useEffect(() => {
        let cancelled = false;
        const count = () =>
            Promise.all([getReviewQueue(), getSettings()])
                .then(([queue, settings]) => {
                    if (!cancelled) setState({ waiting: queue.length, on: settings.demandReview });
                })
                .catch(() => {});
        void count();
        const timer = setInterval(count, 30_000);
        window.addEventListener(MODERATION_CHANGED_EVENT, count);
        return () => {
            cancelled = true;
            clearInterval(timer);
            window.removeEventListener(MODERATION_CHANGED_EVENT, count);
        };
    }, []);
    return state;
}

export const Navigation: React.FC = () => {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const moderation = useModerationBadge();

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
                        to="/moderation"
                        className={`nav-link ${location.pathname === '/moderation' ? 'active' : ''}`}
                        title={moderation.on ? 'Manual moderation is on' : 'Manual moderation is off'}
                    >
                        🛡️ Moderation{moderation.on ? '' : ' (off)'}
                        {moderation.waiting > 0 && <span className="nav-badge">{moderation.waiting}</span>}
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
                    <button type="button" className="nav-link nav-link--button" onClick={() => setAdminToken(null)}>
                        Log out
                    </button>
                </div>
            </div>
        </nav>
    );
};
