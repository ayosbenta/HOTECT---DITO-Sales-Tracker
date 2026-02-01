import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// --- CONFIGURATION ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyo9W0vsdFowaCuR1M2E5SPm2T-km_XXWp--xbrCp1-J1D_T-PfaO5X0KhtvenzKlY6/exec';

// --- MOCK DATA ---
const initialAgents = ['Ryan', 'Leah - Boosting', 'Jackie - Boosting', 'Jackie - Personal'];

const residentialPlans = [
  '1490 - 500mbps'
];

const subscriberStatuses = [
    'Under Review', 'For Scheduling', 'Ready for Installation', 'On the Way', 'APPROVED', 'Installed', 
    'Reschedule', 'POB', 'Canceled', 'Rejected', 'No Signal', 'Unable to Reach', 'Delivered'
];

const payoutStatuses = ['PENDING', 'ON REQUEST', 'PAID'];

// --- HELPERS ---
const calculateCommission = (subscriber) => {
    if (!subscriber || !subscriber.agent) return 0;
    switch (subscriber.agent) {
        case 'Ryan': return 1200;
        case 'Leah - Boosting': return 600;
        case 'Jackie - Boosting': return 600;
        case 'Jackie - Personal': return 1200;
        default: return 0;
    }
};

const getPlanPrice = (plan) => {
    if (!plan) return 0;
    const match = plan.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

const normalizeDateToYYYYMMDD = (sheetDate) => {
    if (!sheetDate) return '';
    const d = new Date(sheetDate);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const payoutStatusBadgeStyle = (status) => ({
    backgroundColor: 
        status === 'PAID' ? 'var(--accent-green)' :
        status === 'PENDING' ? 'var(--accent-yellow)' :
        status === 'ON REQUEST' ? 'var(--accent-blue)' :
        '#6c757d',
});

const statusBadgeStyle = (status) => ({
    backgroundColor:
        ['Installed', 'APPROVED', 'Delivered'].includes(status) ? 'var(--accent-green)' :
        ['Under Review', 'Reschedule'].includes(status) ? 'var(--accent-yellow)' :
        ['For Scheduling', 'Ready for Installation', 'On the Way'].includes(status) ? 'var(--accent-blue)' :
        ['Canceled', 'Rejected'].includes(status) ? 'var(--accent-red)' :
        ['POB', 'No Signal', 'Unable to Reach'].includes(status) ? 'var(--accent-gray)' :
        '#6c757d',
});

// --- ICONS ---
const Icon = ({ path, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: '1.25rem', height: '1.25rem' }}>
        <path d={path} />
    </svg>
);

const ICONS = {
    overview: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    subscribers: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    performance: "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.09-4-4L2 17.08l1.5 1.41z",
    payout: "M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z",
    accounting: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z",
    logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    menu: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
    totalApplications: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
    installedDelivered: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    onTheWayReady: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
    rejectedApplications: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z",
    commissionRequest: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z",
    agentCommissions: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    grossIncome: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z",
    totalExpenses: "M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6h-6z",
    adminCommission: "M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
    topAgent: "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm7 6c-1.65 0-3-1.35-3-3V5h6v6c0 1.65-1.35 3-3 3zm7-6c0 1.3-.84 2.4-2 2.82V7h2v1z",
    netProfit: "M15 14c-2.39 0-4.47 1.21-5.73 3.05-.38-.21-.81-.35-1.27-.35-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5c.81 0 1.5-.39 1.96-1H15c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5v1.28c-.21.08-.4.19-.58.32-.42-.9-1.33-1.6-2.42-1.6-1.66 0-3 1.34-3 3s1.34 3 3 3h.28c.31.89.88 1.66 1.63 2.24.47.36.99.64 1.56.84 1.48 2.08 3.96 3.42 6.78 3.42 4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9h2c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7z",
    calendar: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z",
};

// --- COMPONENTS ---

const Login = ({ onLogin, agents }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (username.toLowerCase() === 'admin' && password === 'M@y191992') {
            onLogin({ name: 'Admin', role: 'admin' });
            return;
        }
        if (username.toLowerCase() === 'leah' && password === 'Leah123') {
            onLogin({ name: 'Leah - Boosting', role: 'agent' });
            return;
        }
        if (username.toLowerCase() === 'jackie' && password === 'JackieDito2026') {
            onLogin({ name: 'Jackie - Boosting', role: 'agent' });
            return;
        }
        if (username.toLowerCase() === 'jackie - personal') {
            setError('Invalid username or password.');
            return;
        }
        if (username.toLowerCase() === 'jackie - boosting') {
            setError('Invalid username or password.');
            return;
        }

        const agentExists = agents.find(agent => agent.toLowerCase() === username.toLowerCase());
        if (agentExists && password === `${agentExists}123`) {
            onLogin({ name: agentExists, role: 'agent' });
            return;
        }
        setError('Invalid username or password.');
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <span className="logo-text">HOTECH</span>
                    <span>DITO SALES TRACKER</span>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input type="text" id="username" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="login-error">{error}</p>}
                    <button type="submit" className="btn btn-primary btn-block">Login</button>
                </form>
            </div>
        </div>
    );
};

const Sidebar = ({ activeMenu, setActiveMenu, userRole, isOpen, onClose }) => {
    const menus = [
        { name: 'Overview', icon: 'overview', roles: ['admin', 'agent'] },
        { name: 'Subscribers', icon: 'subscribers', roles: ['admin', 'agent'] },
        { name: 'Calendar', icon: 'calendar', roles: ['admin'] },
        { name: 'My Performance', icon: 'performance', roles: ['agent'] },
        { name: 'Agent Performance', icon: 'performance', roles: ['admin'] },
        { name: 'Payout Reports', icon: 'payout', roles: ['admin', 'agent'] },
        { name: 'Accounting & Financial', icon: 'accounting', roles: ['admin'] },
    ];

    return (
        <>
            {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}
            <nav className={`sidebar no-print ${isOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-logo">
                    <span className="sidebar-logo-text">HOTECH</span>
                    <span className="sidebar-logo-subtext">DITO</span>
                </div>
                {menus.filter(menu => menu.roles.includes(userRole)).map(menu => (
                    <div
                        key={menu.name}
                        className={`menu-item ${activeMenu === menu.name ? 'active' : ''}`}
                        onClick={() => { setActiveMenu(menu.name); onClose(); }}
                        role="button"
                    >
                        <Icon path={ICONS[menu.icon]} />
                        <span>{menu.name}</span>
                    </div>
                ))}
            </nav>
        </>
    );
};

const Header = ({ currentUser, onLogout, isSaving, onToggleSidebar }) => (
    <header className="app-header no-print">
        <div className="header-start">
             <button className="sidebar-toggle" onClick={onToggleSidebar} aria-label="Toggle menu">
                <Icon path={ICONS.menu} />
            </button>
            <div className={`saving-indicator ${isSaving ? 'is-saving' : ''}`}>Saving...</div>
        </div>
        <div className="header-user">
            <span>Welcome, <strong>{currentUser.name}</strong></span>
            <button className="logout-btn" onClick={onLogout}>
                <Icon path={ICONS.logout} /> Logout
            </button>
        </div>
    </header>
);

const LineChart = ({ labels, datasets }) => {
    const containerRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            if (entries[0]) setContainerWidth(entries[0].contentRect.width);
        });
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    if (!labels || labels.length === 0) return <p>No data to display for this period.</p>;

    const height = 350;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = containerWidth - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const allDataPoints = datasets.flatMap(ds => ds.data);
    const maxValue = Math.max(0, ...allDataPoints);
    const yAxisMax = maxValue === 0 ? 1000 : Math.ceil(maxValue / 1000) * 1000;
    const getX = (index) => padding.left + (index / (labels.length - 1)) * chartWidth;
    const getY = (value) => padding.top + chartHeight - (value / yAxisMax) * chartHeight;

    const yAxisLabels = Array.from({ length: 6 }, (_, i) => {
        const value = (yAxisMax / 5) * i;
        return { value, y: getY(value) };
    });

    const handleMouseOver = (e, index) => {
        setTooltip({
            label: labels[index],
            datasets: datasets.map(ds => ({ name: ds.name, value: ds.data[index], color: ds.color })),
            x: getX(index),
            y: e.clientY - containerRef.current.getBoundingClientRect().top
        });
    };

    return (
        <div className="line-chart-container" ref={containerRef}>
            {containerWidth > 0 && (
                 <svg className="line-chart-svg" width="100%" height={height}>
                    <g className="y-axis">
                        {yAxisLabels.map(({ value, y }) => (
                            <g key={value}>
                                <text x={padding.left - 10} y={y} dy="0.32em" textAnchor="end" className="axis-label">{value / 1000}k</text>
                                <line x1={padding.left} x2={containerWidth - padding.right} y1={y} y2={y} className="grid-line" />
                            </g>
                        ))}
                    </g>
                    <g className="x-axis">
                        {labels.map((label, index) => {
                             const showLabel = labels.length <= 12 || index % Math.ceil(labels.length / 12) === 0;
                            return showLabel && (
                                <text key={label} x={getX(index)} y={height - padding.bottom + 20} textAnchor="middle" className="axis-label">{label}</text>
                            )
                        })}
                    </g>
                    {datasets.map(ds => (
                        <path key={ds.name} className="data-line" stroke={ds.color} d={ds.data.map((point, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(point)}`).join(' ')} />
                    ))}
                     {labels.map((_, index) => (
                        <g key={index} className="data-point-group" onMouseOver={(e) => handleMouseOver(e, index)} onMouseOut={() => setTooltip(null)}>
                             <rect x={getX(index) - (chartWidth / (labels.length - 1) / 2)} y={padding.top} width={chartWidth / (labels.length - 1)} height={chartHeight} fill="transparent" />
                            {datasets.map(ds => (
                                <circle key={ds.name} cx={getX(index)} cy={getY(ds.data[index])} fill={ds.color} className="data-point" />
                            ))}
                        </g>
                    ))}
                </svg>
            )}
            {tooltip && (
                <div className="chart-tooltip visible" style={{ left: tooltip.x, top: tooltip.y }}>
                    <div className="tooltip-title">{tooltip.label}</div>
                    {tooltip.datasets.map(ds => (
                        <div key={ds.name} className="tooltip-item">
                            <span className="tooltip-color-box" style={{ backgroundColor: ds.color }}></span>
                            <span>{ds.name}: ₱{ds.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

    return (
        <nav className="pagination-container">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-button">&laquo; Prev</button>
            {pageNumbers.map(number => (
                <button key={number} onClick={() => onPageChange(number)} className={`pagination-button ${currentPage === number ? 'active' : ''}`}>
                    {number}
                </button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-button">Next &raquo;</button>
        </nav>
    );
};

const KpiCard = ({ title, value, icon, colorClass, currency = false, valueColor = null }) => (
    <div className={`kpi-card ${colorClass}`}>
        <div className="kpi-card-header">
            <Icon path={ICONS[icon]} className="kpi-icon" />
            <span className="kpi-label">{title}</span>
        </div>
        <p className="kpi-value" style={valueColor ? { color: valueColor } : {}}>
            {currency ? `₱${Number(value).toLocaleString()}` : (typeof value === 'number' ? value.toLocaleString() : value)}
        </p>
    </div>
);

const Overview = ({ subscribers, expenses, agents, currentUser }) => {
    const [activeTab, setActiveTab] = useState('Monthly');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [fromYear, setFromYear] = useState(new Date().getFullYear());
    const [fromMonth, setFromMonth] = useState(1);
    const [toYear, setToYear] = useState(new Date().getFullYear());
    const [toMonth, setToMonth] = useState(new Date().getMonth() + 1);

    const visibleSubscribers = useMemo(() => {
        if (currentUser.role === 'agent') {
            if (currentUser.name === 'Jackie - Boosting') return subscribers.filter(sub => sub.agent === 'Jackie - Boosting' || sub.agent === 'Jackie - Personal');
            return subscribers.filter(sub => sub.agent === currentUser.name);
        }
        return subscribers;
    }, [subscribers, currentUser]);
    
    const adminDashboardData = useMemo(() => {
        if (currentUser.role !== 'admin') return null;
        const fromDate = new Date(fromYear, fromMonth - 1, 1);
        const toDate = new Date(toYear, toMonth, 0, 23, 59, 59, 999);
        const rangeFilter = (dStr) => {
            if (!dStr) return false;
            const d = new Date(dStr);
            return d >= fromDate && d <= toDate;
        };

        const inRangeSubs = subscribers.filter(s => rangeFilter(s.dateOfApplication));
        const installedSubs = subscribers.filter(s => ['Installed', 'Delivered'].includes(s.status) && rangeFilter(s.activationDate));
        const inRangeExpenses = expenses.filter(e => rangeFilter(e.date));

        const totalApplications = inRangeSubs.length;
        const totalInstalledDelivered = installedSubs.length;
        const totalOnTheWayReady = inRangeSubs.filter(sub => ['On the Way', 'Ready for Installation'].includes(sub.status)).length;
        const totalRejected = inRangeSubs.filter(sub => sub.status === 'Rejected').length;
        const commissionOnRequest = installedSubs.filter(sub => sub.payoutStatus === 'ON REQUEST').reduce((sum, sub) => sum + 1200, 0);
        const totalAgentCommissions = installedSubs.reduce((sum, sub) => sum + calculateCommission(sub), 0);
        const grossIncome = totalInstalledDelivered * 1200;
        const totalExpenses = inRangeExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const totalAdminCommissions = grossIncome - totalAgentCommissions;
        const netProfit = totalAdminCommissions - totalExpenses;
        
        const agentSales = agents.map(name => ({ name, sales: installedSubs.filter(s => s.agent === name).length }));
        const topAgent = agentSales.reduce((prev, curr) => (prev.sales > curr.sales ? prev : curr), { name: 'N/A', sales: 0 });

        return { totalApplications, totalInstalledDelivered, totalOnTheWayReady, totalRejected, commissionOnRequest, totalAgentCommissions, grossIncome, totalExpenses, totalAdminCommissions, topAgent, netProfit };
    }, [subscribers, expenses, agents, fromMonth, fromYear, toMonth, toYear, currentUser.role]);

    const agentPerformance = useMemo(() => {
        if (currentUser.role !== 'agent') return null;
        const totalSubscribers = visibleSubscribers.length;
        const installed = visibleSubscribers.filter(sub => ['Installed', 'Delivered'].includes(sub.status));
        const totalInstalled = installed.length;
        const totalOnTheWayReady = visibleSubscribers.filter(sub => ['On the Way', 'Ready for Installation'].includes(sub.status)).length;
        const totalRejectedCancelled = visibleSubscribers.filter(sub => ['Rejected', 'Canceled'].includes(sub.status)).length;
        const pendingPayouts = installed.filter(sub => (sub.payoutStatus || 'PENDING') === 'PENDING').length;
        const onRequestPayouts = installed.filter(sub => sub.payoutStatus === 'ON REQUEST').length;
        const paidSubs = installed.filter(sub => sub.payoutStatus === 'PAID');
        const completedPayouts = paidSubs.length;
        const totalCompletedCommission = paidSubs.reduce((sum, sub) => sum + calculateCommission(sub), 0);
        
        const now = new Date();
        const thisMonthApps = visibleSubscribers.filter(sub => {
            if (!sub.dateOfApplication) return false;
            const d = new Date(sub.dateOfApplication);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        const installedThisMonth = thisMonthApps.filter(sub => ['Installed', 'Delivered'].includes(sub.status)).length;
        const conversionRate = thisMonthApps.length > 0 ? (installedThisMonth / thisMonthApps.length) * 100 : 0;
        
        return { totalSubscribers, totalInstalled, totalOnTheWayReady, totalRejectedCancelled, pendingPayouts, onRequestPayouts, completedPayouts, totalCompletedCommission, conversionRate };
    }, [visibleSubscribers, currentUser.role]);

    const chartData = useMemo(() => {
        const now = new Date();
        const labels = [], commissions = [], expenseData = [];
        
        const getCommission = (subs, startDate, endDate) => subs.filter(s => {
            const d = new Date(s.activationDate);
            return ['Installed', 'Delivered'].includes(s.status) && d >= startDate && d <= endDate;
        }).reduce((sum, s) => sum + calculateCommission(s), 0);
        
        const getExpense = (exps, startDate, endDate) => exps.filter(e => {
            const d = new Date(e.date);
            return d >= startDate && d <= endDate;
        }).reduce((sum, e) => sum + e.amount, 0);

        if (activeTab === 'Monthly') {
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
                labels.push(d.toLocaleString('default', { month: 'short' }));
                commissions.push(getCommission(visibleSubscribers, start, end));
                if (currentUser.role === 'admin') expenseData.push(getExpense(expenses, start, end));
            }
        } else if (activeTab === 'Weekly') {
            for (let i = 11; i >= 0; i--) {
                const start = new Date(now);
                start.setDate(now.getDate() - (i * 7) - now.getDay());
                start.setHours(0,0,0,0);
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                end.setHours(23,59,59,999);
                labels.push(`${start.getMonth()+1}/${start.getDate()}`);
                commissions.push(getCommission(visibleSubscribers, start, end));
                if (currentUser.role === 'admin') expenseData.push(getExpense(expenses, start, end));
            }
        } else { // Daily
             for (let i = 29; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const start = new Date(d.setHours(0,0,0,0));
                const end = new Date(d.setHours(23,59,59,999));
                labels.push(`${d.getMonth()+1}/${d.getDate()}`);
                commissions.push(getCommission(visibleSubscribers, start, end));
                if (currentUser.role === 'admin') expenseData.push(getExpense(expenses, start, end));
            }
        }
        return { labels, commissions, expenseData };
    }, [visibleSubscribers, expenses, activeTab, currentUser.role]);
    
    const paginatedData = useMemo(() => {
        const sorted = [...visibleSubscribers].sort((a, b) => new Date(b.dateOfApplication || 0).getTime() - new Date(a.dateOfApplication || 0).getTime());
        return {
            items: sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
            totalPages: Math.ceil(sorted.length / itemsPerPage)
        };
    }, [visibleSubscribers, currentPage]);

    return (
        <div>
            <h1>Overview</h1>
            {currentUser.role === 'agent' ? (
                <div className="kpi-card-grid">
                    <KpiCard title="Total Subscribers" value={agentPerformance.totalSubscribers} icon="subscribers" colorClass="bg-blue" />
                    <KpiCard title="Total Installed" value={agentPerformance.totalInstalled} icon="installedDelivered" colorClass="bg-green" />
                    <KpiCard title="On the Way / Ready" value={agentPerformance.totalOnTheWayReady} icon="onTheWayReady" colorClass="bg-blue" />
                    <KpiCard title="Rejected / Cancelled" value={agentPerformance.totalRejectedCancelled} icon="rejectedApplications" colorClass="bg-red" />
                    <KpiCard title="Pending Payout" value={agentPerformance.pendingPayouts} icon="commissionRequest" colorClass="bg-orange" />
                    <KpiCard title="On Request Payout" value={agentPerformance.onRequestPayouts} icon="payout" colorClass="bg-blue" />
                    <KpiCard title="Total Paid" value={agentPerformance.completedPayouts} icon="grossIncome" colorClass="bg-green" />
                    <KpiCard title="Monthly Conversion" value={`${agentPerformance.conversionRate.toFixed(1)}%`} icon="performance" colorClass="bg-blue" />
                    <KpiCard title="Total Commission (Paid)" value={agentPerformance.totalCompletedCommission} icon="adminCommission" colorClass="bg-green" currency />
                </div>
            ) : (
                <>
                    <div className="card" style={{ marginBottom: '2rem' }}>
                         <div className="report-filters">
                            <div className="form-group"><label>From Month</label><select className="form-control" value={fromMonth} onChange={e => setFromMonth(Number(e.target.value))}>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}</select></div>
                            <div className="form-group"><label>From Year</label><input className="form-control" type="number" value={fromYear} onChange={e => setFromYear(Number(e.target.value))} /></div>
                             <div className="form-group"><label>To Month</label><select className="form-control" value={toMonth} onChange={e => setToMonth(Number(e.target.value))}>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}</select></div>
                            <div className="form-group"><label>To Year</label><input className="form-control" type="number" value={toYear} onChange={e => setToYear(Number(e.target.value))} /></div>
                        </div>
                    </div>
                    <div className="kpi-card-grid">
                        <KpiCard title="Total Applications" value={adminDashboardData.totalApplications} icon="totalApplications" colorClass="bg-blue" />
                        <KpiCard title="Total Installed/Delivered" value={adminDashboardData.totalInstalledDelivered} icon="installedDelivered" colorClass="bg-blue" />
                        <KpiCard title="On the Way / Ready" value={adminDashboardData.totalOnTheWayReady} icon="onTheWayReady" colorClass="bg-blue" />
                        <KpiCard title="Rejected" value={adminDashboardData.totalRejected} icon="rejectedApplications" colorClass="bg-red" />
                        <KpiCard title="Commission on Request" value={adminDashboardData.commissionOnRequest} icon="commissionRequest" colorClass="bg-orange" currency />
                        <KpiCard title="Agent Commissions" value={adminDashboardData.totalAgentCommissions} icon="agentCommissions" colorClass="bg-orange" currency />
                        <KpiCard title="Gross Income" value={adminDashboardData.grossIncome} icon="grossIncome" colorClass="bg-green" currency />
                        <KpiCard title="Total Expenses" value={adminDashboardData.totalExpenses} icon="totalExpenses" colorClass="bg-red" currency />
                        <KpiCard title="Admin Commission" value={adminDashboardData.totalAdminCommissions} icon="adminCommission" colorClass="bg-green" currency />
                        <KpiCard title="Top Agent" value={adminDashboardData.topAgent.name} icon="topAgent" colorClass="bg-blue" />
                        <KpiCard title="Net Profit" value={adminDashboardData.netProfit} icon="netProfit" colorClass="bg-green" currency valueColor={adminDashboardData.netProfit >= 0 ? 'white' : 'var(--accent-red)'} />
                    </div>
                </>
            )}

            <div className="card" style={{ marginTop: '2rem' }}>
                <h2>{currentUser.role === 'agent' ? 'My Commission Trend' : 'Commission vs. Expenses'}</h2>
                 <div className="tabs">
                    <button className={activeTab === 'Daily' ? 'active' : ''} onClick={() => setActiveTab('Daily')}>Daily</button>
                    <button className={activeTab === 'Weekly' ? 'active' : ''} onClick={() => setActiveTab('Weekly')}>Weekly</button>
                    <button className={activeTab === 'Monthly' ? 'active' : ''} onClick={() => setActiveTab('Monthly')}>Monthly</button>
                </div>
                <LineChart 
                    labels={chartData.labels} 
                    datasets={[
                        { name: 'Commissions', data: chartData.commissions, color: 'var(--primary-brand)' },
                        ...(currentUser.role === 'admin' ? [{ name: 'Expenses', data: chartData.expenseData, color: 'var(--accent-red)' }] : [])
                    ]} 
                />
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h2>Latest Transactions</h2>
                <div className="table-responsive-wrapper">
                    <table className="data-table">
                        <thead><tr><th>Date</th><th>Name</th><th>App No</th><th>Sub No</th>{currentUser.role === 'admin' && <th>Agent</th>}<th>Status</th><th>Payout</th></tr></thead>
                        <tbody>
                            {paginatedData.items.map(sub => (
                                <tr key={sub.id}>
                                    <td>{formatDate(sub.dateOfApplication)}</td>
                                    <td>{sub.name}</td>
                                    <td>{sub.applicationNo}</td>
                                    <td>{sub.subscriberNo}</td>
                                    {currentUser.role === 'admin' && <td>{sub.agent}</td>}
                                    <td><span className="status-badge" style={statusBadgeStyle(sub.status)}>{sub.status}</span></td>
                                    <td><span className="status-badge" style={payoutStatusBadgeStyle(sub.payoutStatus || 'PENDING')}>{sub.payoutStatus || 'PENDING'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={paginatedData.totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

const SubscriberModal = ({ isOpen, onClose, onSave, subscriber, agents, currentUser }) => {
    const initialFormState = {
        dateOfApplication: new Date().toISOString().split('T')[0],
        name: '', address: '', applicationNo: '', subscriberNo: '',
        agent: currentUser.role === 'agent' ? currentUser.name : (agents[0] || ''),
        status: 'Under Review', payoutStatus: 'PENDING', activationDate: '', reason: '', plan: residentialPlans[0]
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (subscriber) setFormData({ ...initialFormState, ...subscriber, payoutStatus: subscriber.payoutStatus || 'PENDING' });
        else setFormData(initialFormState);
    }, [subscriber, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'status' && ['Installed', 'Delivered'].includes(value) && !prev.activationDate) newState.activationDate = new Date().toISOString().split('T')[0];
            return newState;
        });
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>{subscriber ? 'Edit Subscriber' : 'Add New Subscriber'}</h2>
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
                    <div className="form-group"><label>Date</label><input type="date" name="dateOfApplication" className="form-control" value={formData.dateOfApplication} onChange={handleChange} required disabled={!!subscriber} /></div>
                    <div className="form-group"><label>Name</label><input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required /></div>
                     <div className="form-group"><label>Address</label><input type="text" name="address" className="form-control" value={formData.address} onChange={handleChange} /></div>
                     <div className="form-group"><label>App No</label><input type="text" name="applicationNo" className="form-control" value={formData.applicationNo} onChange={handleChange} /></div>
                     <div className="form-group"><label>Sub No</label><input type="text" name="subscriberNo" className="form-control" value={formData.subscriberNo} onChange={handleChange} /></div>
                    <div className="form-group">
                        <label>Agent</label>
                        <select name="agent" className="form-control" value={formData.agent} onChange={handleChange} required disabled={currentUser.role === 'agent'}>
                            {agents.map(agent => <option key={agent} value={agent}>{agent}</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label>Status</label><select name="status" className="form-control" value={formData.status} onChange={handleChange} required>{subscriberStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
                    <div className="form-group">
                        <label>Payout Status</label>
                        <select name="payoutStatus" className="form-control" value={formData.payoutStatus} onChange={handleChange} required disabled={currentUser.role === 'agent' || !['Installed', 'Delivered'].includes(formData.status)}>{payoutStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select>
                    </div>
                    <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
                </form>
            </div>
        </div>
    );
};

const Subscribers = ({ subscribers, onSave, onDelete, agents, currentUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPayoutStatus, setFilterPayoutStatus] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubscriber, setEditingSubscriber] = useState(null);
    
    const visibleSubscribers = useMemo(() => {
        if (currentUser.role === 'agent') {
            if (currentUser.name === 'Jackie - Boosting') return subscribers.filter(sub => sub.agent === 'Jackie - Boosting' || sub.agent === 'Jackie - Personal');
            return subscribers.filter(sub => sub.agent === currentUser.name);
        }
        return subscribers;
    }, [subscribers, currentUser]);

    const filteredSubscribers = useMemo(() => visibleSubscribers.filter(sub => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = !term || (sub.name?.toLowerCase().includes(term)) || (String(sub.applicationNo || '').toLowerCase().includes(term)) || (String(sub.subscriberNo || '').toLowerCase().includes(term));
        const matchesStatus = filterStatus === 'All' || sub.status === filterStatus;
        const matchesPayoutStatus = filterPayoutStatus === 'All' || (sub.payoutStatus || 'PENDING') === filterPayoutStatus;
        return matchesSearch && matchesStatus && matchesPayoutStatus;
    }).sort((a, b) => new Date(b.dateOfApplication || 0).getTime() - new Date(a.dateOfApplication || 0).getTime()), [searchTerm, filterStatus, filterPayoutStatus, visibleSubscribers]);

    const handleSave = (data) => { onSave(data); setIsModalOpen(false); setEditingSubscriber(null); };

    return (
        <div>
            <div className="page-header"><h1>Subscribers</h1><button className="btn btn-primary" onClick={() => { setEditingSubscriber(null); setIsModalOpen(true); }}>New Subscriber</button></div>
            <div className="card">
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <input type="text" placeholder="Search..." className="form-control" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{flex: '1', minWidth: '200px'}} />
                    <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{width: 'auto'}}><option value="All">All Statuses</option>{subscriberStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <select className="form-control" value={filterPayoutStatus} onChange={(e) => setFilterPayoutStatus(e.target.value)} style={{width: 'auto'}}><option value="All">All Payouts</option>{payoutStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                <div className="table-responsive-wrapper">
                    <table className="data-table">
                        <thead><tr><th>Date</th><th>Name</th><th>Address</th><th>App No</th><th>Sub No</th><th>Agent</th><th>Status</th><th>Payout</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filteredSubscribers.map(sub => (
                                <tr key={sub.id}>
                                    <td>{formatDate(sub.dateOfApplication)}</td>
                                    <td>{sub.name}</td>
                                    <td>{sub.address}</td>
                                    <td>{sub.applicationNo}</td>
                                    <td>{sub.subscriberNo}</td>
                                    <td>{sub.agent}</td>
                                    <td><span className="status-badge" style={statusBadgeStyle(sub.status)}>{sub.status}</span></td>
                                    <td><span className="status-badge" style={payoutStatusBadgeStyle(sub.payoutStatus || 'PENDING')}>{sub.payoutStatus || 'PENDING'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button className="btn-icon" onClick={() => { setEditingSubscriber(sub); setIsModalOpen(true); }}><Icon path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></button>
                                            <button className="btn-icon btn-icon-danger" onClick={() => { if(window.confirm('Delete?')) onDelete(sub.id); }}><Icon path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <SubscriberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} subscriber={editingSubscriber} agents={agents} currentUser={currentUser} />
        </div>
    );
};

const MyPerformance = ({ subscribers, currentUser }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const data = useMemo(() => {
        const subs = subscribers.filter(s => {
            const d = new Date(s.dateOfApplication);
            const isAgent = currentUser.name === 'Jackie - Boosting' ? (s.agent === 'Jackie - Boosting' || s.agent === 'Jackie - Personal') : s.agent === currentUser.name;
            return isAgent && d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
        });
        const installed = subs.filter(s => ['Installed', 'Delivered'].includes(s.status));
        return {
            total: subs.length,
            installed: installed.length,
            pending: subs.filter(s => ['Under Review', 'For Scheduling', 'Ready for Installation', 'On the Way'].includes(s.status)).length,
            rejected: subs.filter(s => ['Canceled', 'Rejected'].includes(s.status)).length,
            commission: installed.reduce((acc, s) => acc + calculateCommission(s), 0),
            conversion: subs.length ? (installed.length / subs.length) * 100 : 0
        };
    }, [subscribers, selectedMonth, selectedYear, currentUser]);

    return (
        <div>
            <h1>My Performance</h1>
             <div className="card">
                <div className="report-filters">
                    <div className="form-group"><label>Month</label><select className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}</select></div>
                    <div className="form-group"><label>Year</label><input className="form-control" type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} /></div>
                </div>
            </div>
            <div className="card-grid" style={{ marginTop: '2rem' }}>
                <div className="stat-card"><div className="stat-value">{data.installed}</div><div className="stat-label">Installed Sales</div></div>
                <div className="stat-card"><div className="stat-value">{data.total}</div><div className="stat-label">Total Applications</div></div>
                <div className="stat-card"><div className="stat-value">{data.conversion.toFixed(1)}%</div><div className="stat-label">Conversion Rate</div></div>
                <div className="stat-card"><div className="stat-value">{data.pending}</div><div className="stat-label">Pending</div></div>
                <div className="stat-card"><div className="stat-value">{data.rejected}</div><div className="stat-label">Cancelled / Rejected</div></div>
                <div className="stat-card"><div className="stat-value">₱{data.commission.toLocaleString()}</div><div className="stat-label">Commission Earned</div></div>
            </div>
        </div>
    );
};

const AgentPerformance = ({ subscribers, agents }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [sortKey, setSortKey] = useState('installed');

    const data = useMemo(() => {
        return agents.map(agent => {
            const subs = subscribers.filter(s => {
                const d = new Date(s.dateOfApplication);
                return s.agent === agent && d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
            });
            const installed = subs.filter(s => ['Installed', 'Delivered'].includes(s.status)).length;
            const total = subs.length;
            return {
                name: agent,
                total,
                installed,
                conversion: total ? (installed / total) * 100 : 0,
                commission: subs.filter(s => ['Installed', 'Delivered'].includes(s.status)).reduce((acc, s) => acc + calculateCommission(s), 0)
            };
        }).sort((a, b) => b[sortKey] - a[sortKey]);
    }, [subscribers, agents, selectedMonth, selectedYear, sortKey]);

    return (
        <div>
            <h1>Agent Performance</h1>
            <div className="card">
                <div className="report-filters">
                    <div className="form-group"><label>Month</label><select className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}</select></div>
                    <div className="form-group"><label>Year</label><input className="form-control" type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} /></div>
                </div>
                <div className="table-responsive-wrapper">
                    <table className="data-table">
                        <thead><tr>
                            <th onClick={() => setSortKey('name')} style={{cursor: 'pointer'}}>Agent</th>
                            <th onClick={() => setSortKey('installed')} style={{cursor: 'pointer'}}>Installed</th>
                            <th onClick={() => setSortKey('total')} style={{cursor: 'pointer'}}>Total Apps</th>
                            <th onClick={() => setSortKey('conversion')} style={{cursor: 'pointer'}}>Conv. Rate</th>
                            <th onClick={() => setSortKey('commission')} style={{cursor: 'pointer'}}>Comm. Earned</th>
                        </tr></thead>
                        <tbody>
                            {data.map(d => (
                                <tr key={d.name}><td>{d.name}</td><td style={{fontWeight: 'bold', color: 'var(--primary-brand)'}}>{d.installed}</td><td>{d.total}</td><td>{d.conversion.toFixed(1)}%</td><td>₱{d.commission.toLocaleString()}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const PayoutReports = ({ subscribers, agents, currentUser, onSaveSubscriber }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedAgent, setSelectedAgent] = useState(currentUser.role === 'admin' ? 'All' : currentUser.name);

    const reportData = useMemo(() => {
        return subscribers.filter(sub => {
            if (!sub.activationDate) return false;
            const d = new Date(sub.activationDate);
            const isSuccess = ['Installed', 'Delivered'].includes(sub.status);
            const isAgent = currentUser.role === 'admin' ? (selectedAgent === 'All' || sub.agent === selectedAgent) : (currentUser.name === 'Jackie - Boosting' ? (sub.agent === 'Jackie - Boosting' || sub.agent === 'Jackie - Personal') : sub.agent === currentUser.name);
            return isSuccess && isAgent && d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
        }).map(s => ({ ...s, commission: calculateCommission(s) }));
    }, [subscribers, selectedMonth, selectedYear, selectedAgent, currentUser]);

    return (
        <div>
            <div className="page-header"><h1>Payout Reports</h1><button className="btn btn-secondary no-print" onClick={() => window.print()}>Print</button></div>
            <div className="card">
                <div className="report-filters no-print">
                    <div className="form-group"><label>Month</label><select className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}</select></div>
                    <div className="form-group"><label>Year</label><input className="form-control" type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} /></div>
                    {currentUser.role === 'admin' && <div className="form-group"><label>Agent</label><select className="form-control" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}><option value="All">All</option>{agents.map(a => <option key={a} value={a}>{a}</option>)}</select></div>}
                </div>
                <div className="card-grid" style={{marginTop: '2rem'}}>
                     <div className="stat-card"><div className="stat-value">{reportData.length}</div><div className="stat-label">Total Sales</div></div>
                     <div className="stat-card"><div className="stat-value">₱{reportData.reduce((s, i) => s + i.commission, 0).toLocaleString()}</div><div className="stat-label">Total Commission</div></div>
                </div>
                <div className="table-responsive-wrapper">
                    <table className="data-table">
                        <thead><tr><th>Agent</th><th>Subscriber</th><th>App No</th><th>Date</th><th>Comm</th><th>Status</th></tr></thead>
                        <tbody>
                            {reportData.map(item => (
                                <tr key={item.id}>
                                    <td>{item.agent}</td><td>{item.name}</td><td>{item.applicationNo}</td><td>{formatDate(item.activationDate)}</td><td>₱{item.commission.toLocaleString()}</td>
                                    <td>{currentUser.role === 'admin' ? (
                                        <select className="form-control table-select" value={item.payoutStatus || 'PENDING'} onChange={(e) => onSaveSubscriber({ ...item, payoutStatus: e.target.value })}><option value="PENDING">PENDING</option><option value="ON REQUEST">ON REQUEST</option><option value="PAID">PAID</option></select>
                                    ) : <span className="status-badge" style={payoutStatusBadgeStyle(item.payoutStatus || 'PENDING')}>{item.payoutStatus || 'PENDING'}</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const PieChart = ({ data }) => {
    const colors = ['var(--primary-brand)', 'var(--accent-green)', 'var(--accent-yellow)', 'var(--accent-red)'];
    const total = data.reduce((s, i) => s + i.value, 0);
    if (!total) return <p>No data.</p>;
    let cumulative = 0;
    return (
        <div style={{display:'flex', gap:'2rem', alignItems:'center'}}>
            <svg viewBox="0 0 100 100" width="200" height="200">
                {data.map((item, i) => {
                    const percent = (item.value / total) * 100;
                    const start = (cumulative / 100) * 360;
                    const end = ((cumulative + percent) / 100) * 360;
                    cumulative += percent;
                    const x1 = 50 + 40 * Math.cos((start - 90) * Math.PI / 180);
                    const y1 = 50 + 40 * Math.sin((start - 90) * Math.PI / 180);
                    const x2 = 50 + 40 * Math.cos((end - 90) * Math.PI / 180);
                    const y2 = 50 + 40 * Math.sin((end - 90) * Math.PI / 180);
                    return <path key={item.name} d={`M 50,50 L ${x1},${y1} A 40,40 0 ${percent > 50 ? 1 : 0},1 ${x2},${y2} Z`} fill={colors[i % colors.length]} />;
                })}
            </svg>
            <div>{data.map((d, i) => <div key={d.name} style={{display:'flex', alignItems:'center', marginBottom:'5px'}}><span style={{width:10, height:10, background:colors[i%colors.length], marginRight:5}}></span>{d.name}: {d.value}</div>)}</div>
        </div>
    );
}

const ExpenseModal = ({ isOpen, onClose, onSave, expense }) => {
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], category: 'Marketing', description: '', amount: '' });
    useEffect(() => { if (expense) setFormData(expense); else setFormData({ date: new Date().toISOString().split('T')[0], category: 'Marketing', description: '', amount: '' }); }, [expense, isOpen]);
    if (!isOpen) return null;
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>{expense ? 'Edit Expense' : 'Add Expense'}</h2>
                <form onSubmit={(e) => { e.preventDefault(); onSave({ ...formData, amount: parseFloat(formData.amount) }); }}>
                    <div className="form-group"><label>Date</label><input type="date" className="form-control" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
                    <div className="form-group"><label>Category</label><select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option>Marketing</option><option>Office</option><option>Travel</option><option>Utilities</option><option>Other</option></select></div>
                    <div className="form-group"><label>Desc</label><input type="text" className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required /></div>
                    <div className="form-group"><label>Amount</label><input type="number" className="form-control" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required step="0.01" /></div>
                    <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
                </form>
            </div>
        </div>
    );
};

const AccountingFinancial = ({ subscribers, expenses, onSaveExpense, onDeleteExpense }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editExp, setEditExp] = useState(null);

    const data = useMemo(() => {
        const subs = subscribers.filter(s => {
            if (!s.activationDate) return false;
            const d = new Date(s.activationDate);
            return ['Installed', 'Delivered'].includes(s.status) && d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
        });
        const exps = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
        });
        const revenue = subs.reduce((s, i) => s + getPlanPrice(i.plan || '1490'), 0); 
        const payouts = subs.reduce((s, i) => s + calculateCommission(i), 0);
        const expenseTotal = exps.reduce((s, i) => s + i.amount, 0);
        return { revenue, payouts, expenseTotal, net: payouts - expenseTotal, exps }; // Net is simplified here as Commission - Expenses for Admin view
    }, [subscribers, expenses, selectedMonth, selectedYear]);

    return (
        <div>
            <h1>Accounting & Financial</h1>
            <div className="card"><div className="report-filters no-print"><div className="form-group"><label>Month</label><select className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}</select></div><div className="form-group"><label>Year</label><input className="form-control" type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} /></div></div></div>
            <div className="card-grid" style={{ marginTop: '2rem' }}>
                <div className="stat-card"><div className="stat-value">₱{data.revenue.toLocaleString()}</div><div className="stat-label">Total Revenue (Est. Plan Value)</div></div>
                <div className="stat-card"><div className="stat-value">₱{data.payouts.toLocaleString()}</div><div className="stat-label">Total Commission Paid Out</div></div>
                <div className="stat-card"><div className="stat-value">₱{data.expenseTotal.toLocaleString()}</div><div className="stat-label">Total Expenses</div></div>
                 <div className="stat-card"><div className="stat-value" style={{color: data.net >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}}>₱{data.net.toLocaleString()}</div><div className="stat-label">Net (Comm - Exp)</div></div>
            </div>
            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="page-header"><h2>Expenses</h2><button className="btn btn-primary no-print" onClick={() => { setEditExp(null); setIsModalOpen(true); }}>Add Expense</button></div>
                <div className="table-responsive-wrapper">
                    <table className="data-table">
                        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Actions</th></tr></thead>
                        <tbody>
                            {data.exps.map(e => (
                                <tr key={e.id}><td>{formatDate(e.date)}</td><td>{e.category}</td><td>{e.description}</td><td>₱{e.amount.toLocaleString()}</td>
                                <td><div style={{display:'flex', gap:5}}><button className="btn-icon" onClick={() => { setEditExp(e); setIsModalOpen(true); }}><Icon path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></button><button className="btn-icon btn-icon-danger" onClick={() => onDeleteExpense(e.id)}><Icon path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/></button></div></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={d => { onSaveExpense(d); setIsModalOpen(false); }} expense={editExp} />
        </div>
    );
};

const CalendarView = ({ subscribers, agents }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const data = useMemo(() => {
        return days.map(day => {
            const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const rowData = { day, dateStr, agents: {} };

            agents.forEach(agent => {
                const registered = subscribers.filter(s => {
                    if (!s.dateOfApplication) return false;
                    return s.dateOfApplication === dateStr && s.agent === agent;
                }).length;

                const installed = subscribers.filter(s => {
                    if (!s.activationDate) return false;
                     const isInstalled = ['Installed', 'Delivered'].includes(s.status);
                    return isInstalled && s.activationDate === dateStr && s.agent === agent;
                }).length;

                rowData.agents[agent] = { registered, installed };
            });
            return rowData;
        });
    }, [subscribers, agents, selectedMonth, selectedYear]);

    return (
        <div>
            <h1>Calendar Report</h1>
            <div className="card">
                <div className="report-filters">
                    <div className="form-group">
                        <label>Month</label>
                        <select className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                            {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Year</label>
                        <input className="form-control" type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} />
                    </div>
                </div>

                <div className="table-responsive-wrapper">
                    <table className="data-table calendar-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{position: 'sticky', left: 0, zIndex: 10, backgroundColor: '#f9fafb', borderRight: '1px solid var(--border-color)'}}>Day</th>
                                {agents.map(agent => (
                                    <th key={agent} colSpan={2} style={{textAlign: 'center', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)'}}>{agent}</th>
                                ))}
                            </tr>
                            <tr>
                                {agents.map(agent => (
                                    <React.Fragment key={`${agent}-headers`}>
                                        <th style={{fontSize: '0.7rem', color: 'var(--accent-blue)', borderLeft: '1px solid var(--border-color)', textAlign: 'center'}}>Reg</th>
                                        <th style={{fontSize: '0.7rem', color: 'var(--accent-green)', textAlign: 'center'}}>Inst</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(row => (
                                <tr key={row.day}>
                                    <td style={{position: 'sticky', left: 0, backgroundColor: 'white', fontWeight: 'bold', borderRight: '1px solid var(--border-color)'}}>{row.day}</td>
                                    {agents.map(agent => (
                                        <React.Fragment key={`${row.day}-${agent}`}>
                                            <td style={{textAlign: 'center', borderLeft: '1px solid var(--border-color)', color: row.agents[agent].registered > 0 ? 'var(--text-primary)' : '#e5e7eb'}}>{row.agents[agent].registered || '-'}</td>
                                            <td style={{textAlign: 'center', color: row.agents[agent].installed > 0 ? 'var(--primary-brand)' : '#e5e7eb', fontWeight: row.agents[agent].installed > 0 ? 'bold' : 'normal'}}>{row.agents[agent].installed || '-'}</td>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            ))}
                            <tr style={{backgroundColor: '#f3f4f6', fontWeight: 'bold'}}>
                                <td style={{position: 'sticky', left: 0, backgroundColor: '#f3f4f6', borderRight: '1px solid var(--border-color)'}}>TOTAL</td>
                                {agents.map(agent => {
                                    const totalReg = data.reduce((sum, r) => sum + r.agents[agent].registered, 0);
                                    const totalInst = data.reduce((sum, r) => sum + r.agents[agent].installed, 0);
                                    return (
                                        <React.Fragment key={`total-${agent}`}>
                                            <td style={{textAlign: 'center', borderLeft: '1px solid var(--border-color)'}}>{totalReg}</td>
                                            <td style={{textAlign: 'center', color: 'var(--primary-brand)'}}>{totalInst}</td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [currentUser, setCurrentUser] = useState(() => { try { return JSON.parse(localStorage.getItem('currentUser')); } catch { return null; } });
    const [activeMenu, setActiveMenu] = useState('Overview');
    const [subscribers, setSubscribers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [agents] = useState(initialAgents);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!currentUser) { setIsLoading(false); return; }
        const fetchData = async () => {
            setIsLoading(true); setError(null);
            try {
                // Mock data loading if offline or just for structure, usually fetch from GOOGLE_SCRIPT_URL
                // For this environment, we'll initialize with empty or mock if needed, but let's try fetch
                const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=readAll`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                if (data.status === 'error') throw new Error(data.message);
                
                setSubscribers((data.subscribers || []).map((item, index) => ({
                    ...item, id: item.id || `row-${index}`,
                    dateOfApplication: normalizeDateToYYYYMMDD(item.dateOfApplication),
                    activationDate: normalizeDateToYYYYMMDD(item.activationDate),
                    amount: parseFloat(item.amount) || 0
                })));
                setExpenses((data.expenses || []).map((item, index) => ({
                    ...item, id: item.id || `exp-${index}`,
                    date: normalizeDateToYYYYMMDD(item.date),
                    amount: parseFloat(item.amount) || 0
                })));
            } catch (e) { 
                console.log('Using local state or failed fetch', e);
            } finally { setIsLoading(false); }
        };
        fetchData();
    }, [currentUser]);

    const saveDataToSheet = async (data, sheetName) => {
        setIsSaving(true);
        try {
            const payload = { action: 'save', sheetName, data };
            await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        } catch (e) { console.error('Save failed', e); } 
        finally { setIsSaving(false); }
    };

    const handleSaveSubscriber = (sub) => {
        const newSubs = sub.id ? subscribers.map(s => s.id === sub.id ? sub : s) : [{...sub, id: `new-${Date.now()}`}, ...subscribers];
        setSubscribers(newSubs);
        saveDataToSheet(newSubs, 'DATA');
    };
    const handleDeleteSubscriber = (id) => {
        const newSubs = subscribers.filter(s => s.id !== id);
        setSubscribers(newSubs);
        saveDataToSheet(newSubs, 'DATA');
    };
    const handleSaveExpense = (exp) => {
        const newExps = exp.id ? expenses.map(e => e.id === exp.id ? exp : e) : [{...exp, id: `new-${Date.now()}`}, ...expenses];
        setExpenses(newExps);
        saveDataToSheet(newExps, 'Expenses');
    };
    const handleDeleteExpense = (id) => {
        const newExps = expenses.filter(e => e.id !== id);
        setExpenses(newExps);
        saveDataToSheet(newExps, 'Expenses');
    };

    const handleLogin = (user) => { localStorage.setItem('currentUser', JSON.stringify(user)); setCurrentUser(user); setActiveMenu('Overview'); };
    const handleLogout = () => { localStorage.removeItem('currentUser'); setCurrentUser(null); };

    const renderContent = () => {
        switch (activeMenu) {
            case 'Overview': return <Overview subscribers={subscribers} expenses={expenses} agents={agents} currentUser={currentUser} />;
            case 'Subscribers': return <Subscribers subscribers={subscribers} onSave={handleSaveSubscriber} onDelete={handleDeleteSubscriber} agents={agents} currentUser={currentUser} />;
            case 'Calendar': return <CalendarView subscribers={subscribers} agents={agents} />;
            case 'My Performance': return <MyPerformance subscribers={subscribers} currentUser={currentUser} />;
            case 'Agent Performance': return <AgentPerformance subscribers={subscribers} agents={agents} />;
            case 'Payout Reports': return <PayoutReports subscribers={subscribers} agents={agents} currentUser={currentUser} onSaveSubscriber={handleSaveSubscriber} />;
            case 'Accounting & Financial': return <AccountingFinancial subscribers={subscribers} expenses={expenses} onSaveExpense={handleSaveExpense} onDeleteExpense={handleDeleteExpense} />;
            default: return null;
        }
    };

    if (!currentUser) return <Login onLogin={handleLogin} agents={agents} />;

    return (
        <>
            <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} userRole={currentUser.role} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className="main-content">
                <Header currentUser={currentUser} onLogout={handleLogout} isSaving={isSaving} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <div className="content-area">{isLoading ? 'Loading...' : renderContent()}</div>
            </main>
        </>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);