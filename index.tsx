import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
    LayoutDashboard, 
    Users, 
    TrendingUp, 
    CreditCard, 
    Wallet, 
    LogOut, 
    Menu, 
    FileText, 
    CheckCircle2, 
    Truck, 
    XCircle, 
    AlertCircle, 
    Users2, 
    DollarSign, 
    Receipt, 
    Shield, 
    Award, 
    Activity, 
    Calendar,
    ChevronLeft,
    ChevronRight,
    Search,
    Plus,
    Tag,
    Edit3,
    Trash2,
    Megaphone,
    Layers,
    Globe
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart as RechartsLineChart,
    Line as RechartsLine,
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';

// --- CONFIGURATION ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCh_0EvLV3yb797Rd2AuMMlp9SDq_t54Q153chmdjFvEsF8xc42xKyLLRTra6hWriD/exec';

// --- MOCK DATA ---
const initialAgents = ['Ryan', 'Leah - Boosting', 'Jackie - Boosting', 'Jackie - Personal', 'Lyn - Boosting', 'Lyn Personal'];

const residentialPlans = [
  '1490 - 500mbps'
];

const subscriberStatuses = [
    'Under Review', 'For Scheduling', 'Ready for Installation', 'On the Way', 'APPROVED', 'Installed', 
    'Reschedule', 'POB', 'Canceled', 'Rejected', 'No Signal', 'Unable to Reach', 'Delivered'
];

const payoutStatuses = ['PENDING', 'ON REQUEST', 'PAID'];

// --- HELPERS ---
const isSamePerson = (nameA, nameB) => {
    if (!nameA || !nameB) return false;
    const clean = (n) => n.toLowerCase().trim()
        .replace(/-?\s*boosting/g, '')
        .replace(/-?\s*personal/g, '')
        .replace(/jacky/g, 'jackie')
        .replace(/\s+/g, '');
    return clean(nameA) === clean(nameB);
};

const calculateCommission = (subscriber, userName = undefined) => {
    if (!subscriber || !subscriber.agent) return 0;
    
    const isBoosting = subscriber.agent.toLowerCase().includes('boosting');
    
    if (userName) {
        let earned = 0;
        if (isBoosting) {
            // Boosting Sales – ₱200 for the Agent and ₱200 for the Processor
            if (isSamePerson(subscriber.agent, userName)) {
                earned += 200;
            }
            if (isSamePerson(subscriber.processedBy, userName)) {
                earned += 200;
            }
        } else {
            // Personal Sales – ₱1,200 commission (goes to Agent)
            if (isSamePerson(subscriber.agent, userName)) {
                earned += 1200;
            }
        }
        return earned;
    } else {
        // Return total commission (all stakeholders combined) for the subscriber record
        if (isBoosting) {
            return 400; // ₱200 plus ₱200
        } else {
            return 1200; // ₱1200
        }
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

const payoutStatusBadgeStyle = (status) => {
    switch (status) {
        case 'PAID':
            return { backgroundColor: '#DEF7EC', color: '#03543F', border: '1px solid #BCF0DA' };
        case 'PENDING':
            return { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
        case 'ON REQUEST':
            return { backgroundColor: '#E1EFFE', color: '#1E429F', border: '1px solid #C3DDFD' };
        default:
            return { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' };
    }
};

const statusBadgeStyle = (status) => {
    if (['Installed', 'APPROVED', 'Delivered'].includes(status)) {
        return { backgroundColor: '#DEF7EC', color: '#03543F', border: '1px solid #BCF0DA' };
    }
    if (['Under Review', 'Reschedule'].includes(status)) {
        return { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
    }
    if (['For Scheduling', 'Ready for Installation', 'On the Way'].includes(status)) {
        return { backgroundColor: '#E1EFFE', color: '#1E429F', border: '1px solid #C3DDFD' };
    }
    if (['Canceled', 'Rejected'].includes(status)) {
        return { backgroundColor: '#FDE8E8', color: '#9B1C1C', border: '1px solid #FCD2D2' };
    }
    if (['POB', 'No Signal', 'Unable to Reach'].includes(status)) {
        return { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' };
    }
    return { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' };
};

// --- ICONS ---
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
    rejectedApplications: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8.358 8 8-3.58 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z",
    commissionRequest: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z",
    agentCommissions: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    grossIncome: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z",
    totalExpenses: "M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6h-6z",
    adminCommission: "M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
    topAgent: "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm7 6c-1.65 0-3-1.35-3-3V5h6v6c0 1.65-1.35 3-3 3zm7-6c0 1.3-.84 2.4-2 2.82V7h2v1z",
    netProfit: "M15 14c-2.39 0-4.47 1.21-5.73 3.05-.38-.21-.81-.35-1.27-.35-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5c.81 0 1.5-.39 1.96-1H15c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5v1.28c-.21.08-.4.19-.58.32-.42-.9-1.33-1.6-2.42-1.6-1.66 0-3 1.34-3 3s1.34 3 3 3h.28c.31.89.88 1.66 1.63 2.24.47.36.99.64 1.56.84 1.48 2.08 3.96 3.42 6.78 3.42 4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9h2c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7z",
    calendar: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z",
    metaAds: "M12 MetaAds"
};

const lucideIconsMap = {
    overview: LayoutDashboard,
    subscribers: Users,
    performance: TrendingUp,
    payout: CreditCard,
    accounting: Wallet,
    logout: LogOut,
    menu: Menu,
    totalApplications: FileText,
    installedDelivered: CheckCircle2,
    onTheWayReady: Truck,
    rejectedApplications: XCircle,
    commissionRequest: AlertCircle,
    agentCommissions: Users2,
    grossIncome: DollarSign,
    totalExpenses: Receipt,
    adminCommission: Shield,
    topAgent: Award,
    netProfit: Activity,
    calendar: Calendar,
    metaAds: Megaphone
};

const path_to_key_map = {};
Object.entries(ICONS).forEach(([key, path]) => {
    path_to_key_map[path] = key;
});

const Icon = ({ path, className = '' }) => {
    const key = path_to_key_map[path];
    const LucideComponent = lucideIconsMap[key] || LayoutDashboard;
    return <LucideComponent className={`icon-lucide ${className}`} style={{ width: '1.25rem', height: '1.25rem' }} />;
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
        { name: 'Calendar', icon: 'calendar', roles: ['admin', 'agent'] },
        { name: 'My Performance', icon: 'performance', roles: ['agent'] },
        { name: 'Agent Performance', icon: 'performance', roles: ['admin'] },
        { name: 'Payout Reports', icon: 'payout', roles: ['admin', 'agent'] },
        { name: 'Accounting & Financial', icon: 'accounting', roles: ['admin'] },
        { name: 'Meta Ads Monitoring', icon: 'metaAds', roles: ['admin', 'agent'] },
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
            <div className="kpi-icon-container">
                <Icon path={ICONS[icon]} className="kpi-icon" />
            </div>
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
            if (currentUser.name === 'Lyn - Boosting') return subscribers.filter(sub => sub.agent === 'Lyn - Boosting' || sub.agent === 'Lyn Personal');
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
        const commissionOnRequest = installedSubs.filter(sub => sub.payoutStatus === 'ON REQUEST').reduce((sum, sub) => sum + calculateCommission(sub), 0);
        const totalAgentCommissions = installedSubs.reduce((sum, sub) => sum + calculateCommission(sub), 0);
        const grossIncome = totalInstalledDelivered * 1200;
        const totalExpenses = inRangeExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const totalAdminCommissions = grossIncome - totalAgentCommissions;
        const netProfit = totalAdminCommissions - totalExpenses;
        
        const agentSales = agents.map(name => ({ name, sales: installedSubs.filter(s => s.agent === name).length }));
        const topAgent = agentSales.reduce((prev, curr) => (prev.sales > curr.sales ? prev : curr), { name: 'N/A', sales: 0 });

        // --- NEW KPI METRICS FOR ADMIN ---
        const conversionRate = totalApplications > 0 ? (totalInstalledDelivered / totalApplications) * 100 : 0;
        const activePlanMRR = installedSubs.reduce((sum, sub) => sum + getPlanPrice(sub.plan || '1490'), 0);
        
        let totalDays = 0;
        let validCount = 0;
        installedSubs.forEach(s => {
            if (s.dateOfApplication && s.activationDate) {
                const appDate = new Date(s.dateOfApplication);
                const actDate = new Date(s.activationDate);
                if (!isNaN(appDate.getTime()) && !isNaN(actDate.getTime())) {
                    const diffTime = actDate.getTime() - appDate.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays >= 0 && diffDays < 365) {
                        totalDays += diffDays;
                        validCount++;
                    }
                }
            }
        });
        const avgInstallDays = validCount > 0 ? (totalDays / validCount).toFixed(1) : 'N/A';
        
        const lossCount = inRangeSubs.filter(s => ['Canceled', 'Rejected'].includes(s.status)).length;
        const lossRate = totalApplications > 0 ? (lossCount / totalApplications) * 100 : 0;

        const underReviewCount = inRangeSubs.filter(s => s.status === 'Under Review').length;
        const underReviewRate = totalApplications > 0 ? (underReviewCount / totalApplications) * 100 : 0;
        const avgPlanRevenue = totalInstalledDelivered > 0 ? activePlanMRR / totalInstalledDelivered : 0;
        const profitMargin = totalAdminCommissions > 0 ? (netProfit / totalAdminCommissions) * 100 : 0;
        const activeAgentsCount = new Set(inRangeSubs.map(s => s.agent)).size;

        return { 
            totalApplications, 
            totalInstalledDelivered, 
            totalOnTheWayReady, 
            totalRejected, 
            commissionOnRequest, 
            totalAgentCommissions, 
            grossIncome, 
            totalExpenses, 
            totalAdminCommissions, 
            topAgent, 
            netProfit, 
            conversionRate, 
            activePlanMRR, 
            avgInstallDays, 
            lossRate,
            underReviewCount,
            underReviewRate,
            avgPlanRevenue,
            profitMargin,
            activeAgentsCount
        };
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
        
        const allAgentInvolvedInstalled = subscribers.filter(s => ['Installed', 'Delivered'].includes(s.status) && (isSamePerson(s.agent, currentUser.name) || isSamePerson(s.processedBy, currentUser.name)));
        const paidInvolved = allAgentInvolvedInstalled.filter(sub => sub.payoutStatus === 'PAID');
        const totalCompletedCommission = paidInvolved.reduce((sum, sub) => sum + calculateCommission(sub, currentUser.name), 0);
        
        const now = new Date();
        const thisMonthApps = visibleSubscribers.filter(sub => {
            if (!sub.dateOfApplication) return false;
            const d = new Date(sub.dateOfApplication);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        const installedThisMonth = thisMonthApps.filter(sub => ['Installed', 'Delivered'].includes(sub.status)).length;
        const conversionRate = thisMonthApps.length > 0 ? (installedThisMonth / thisMonthApps.length) * 100 : 0;
        
        // --- NEW KPI CALCULATIONS FOR AGENT ---
        const projectedCommissions = allAgentInvolvedInstalled.filter(sub => sub.payoutStatus !== 'PAID').reduce((sum, sub) => sum + calculateCommission(sub, currentUser.name), 0);
        const overallConversion = totalSubscribers > 0 ? (totalInstalled / totalSubscribers) * 100 : 0;
        
        let agentTotalDays = 0;
        let agentValidCount = 0;
        installed.forEach(s => {
            if (s.dateOfApplication && s.activationDate) {
                const appDate = new Date(s.dateOfApplication);
                const actDate = new Date(s.activationDate);
                if (!isNaN(appDate.getTime()) && !isNaN(actDate.getTime())) {
                    const diffTime = actDate.getTime() - appDate.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays >= 0 && diffDays < 365) {
                        agentTotalDays += diffDays;
                        agentValidCount++;
                    }
                }
            }
        });
        const agentAvgInstallDays = agentValidCount > 0 ? (agentTotalDays / agentValidCount).toFixed(1) : 'N/A';
        const activatedPlanMRR = installed.reduce((sum, sub) => sum + getPlanPrice(sub.plan || '1490'), 0);

        // MORE KPI'S
        const avgCommission = totalInstalled > 0 ? (totalCompletedCommission + projectedCommissions) / totalInstalled : 0;
        const monthlyAppsCount = thisMonthApps.length;
        const pendingVerifications = visibleSubscribers.filter(sub => sub.status === 'Under Review').length;
        const agentLossCount = visibleSubscribers.filter(sub => ['Canceled', 'Rejected'].includes(sub.status)).length;
        const agentLossRate = totalSubscribers > 0 ? (agentLossCount / totalSubscribers) * 100 : 0;

        return { 
            totalSubscribers, 
            totalInstalled, 
            totalOnTheWayReady, 
            totalRejectedCancelled, 
            pendingPayouts, 
            onRequestPayouts, 
            completedPayouts, 
            totalCompletedCommission, 
            conversionRate,
            projectedCommissions,
            overallConversion,
            agentAvgInstallDays,
            activatedPlanMRR,
            avgCommission,
            monthlyAppsCount,
            pendingVerifications,
            agentLossRate
        };
    }, [visibleSubscribers, currentUser.role]);

    const chartData = useMemo(() => {
        const now = new Date();
        const labels = [], commissions = [], expenseData = [];
        
        const getCommission = (subs, startDate, endDate) => {
            const activeSubs = currentUser.role === 'agent' ? subscribers : subs;
            return activeSubs.filter(s => {
                const d = new Date(s.activationDate);
                return ['Installed', 'Delivered'].includes(s.status) && d >= startDate && d <= endDate;
            }).reduce((sum, s) => sum + (currentUser.role === 'agent' ? calculateCommission(s, currentUser.name) : calculateCommission(s)), 0);
        };
        
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
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="dashboard-title-bar">
                <h1>Overview Dashboard</h1>
                <p className="dashboard-subtitle">Real-time performance analytics & sales distribution dashboard</p>
            </div>
            {currentUser.role === 'agent' ? (
                <div>
                    <h3 className="dashboard-section-header">Sales Performance & Conversion Funnel</h3>
                    <div className="kpi-card-grid" style={{ marginBottom: '2.5rem' }}>
                        <KpiCard title="Total Subscribers" value={agentPerformance.totalSubscribers} icon="subscribers" colorClass="bg-blue" />
                        <KpiCard title="Apps Submitted This Month" value={agentPerformance.monthlyAppsCount} icon="totalApplications" colorClass="bg-blue" />
                        <KpiCard title="Total Installed Sales" value={agentPerformance.totalInstalled} icon="installedDelivered" colorClass="bg-green" />
                        <KpiCard title="Pending Verification" value={agentPerformance.pendingVerifications} icon="commissionRequest" colorClass="bg-orange" />
                        <KpiCard title="Installations On The Way" value={agentPerformance.totalOnTheWayReady} icon="onTheWayReady" colorClass="bg-blue" />
                        <KpiCard title="Rejected / Cancelled" value={agentPerformance.totalRejectedCancelled} icon="rejectedApplications" colorClass="bg-red" />
                        <KpiCard title="Personal Loss/Cancel Rate" value={`${agentPerformance.agentLossRate.toFixed(1)}%`} icon="rejectedApplications" colorClass="bg-red" />
                        <KpiCard title="Current Month Conversion" value={`${agentPerformance.conversionRate.toFixed(1)}%`} icon="performance" colorClass="bg-blue" />
                        <KpiCard title="Overall Account Conv. Rate" value={`${agentPerformance.overallConversion.toFixed(1)}%`} icon="performance" colorClass="bg-blue" />
                        <KpiCard title="Avg. Installation Speed" value={agentPerformance.agentAvgInstallDays === 'N/A' ? 'N/A' : `${agentPerformance.agentAvgInstallDays} Days`} icon="calendar" colorClass="bg-blue" />
                    </div>

                    <h3 className="dashboard-section-header">Commissions & Earnings Ledger</h3>
                    <div className="kpi-card-grid">
                        <KpiCard title="Pending Commission Status" value={agentPerformance.pendingPayouts} icon="commissionRequest" colorClass="bg-orange" />
                        <KpiCard title="Request Released Status" value={agentPerformance.onRequestPayouts} icon="payout" colorClass="bg-blue" />
                        <KpiCard title="Pending Unpaid Commission" value={agentPerformance.projectedCommissions} icon="commissionRequest" colorClass="bg-orange" currency />
                        <KpiCard title="Number of Paid Commissions" value={agentPerformance.completedPayouts} icon="grossIncome" colorClass="bg-green" />
                        <KpiCard title="Career Commissions (Paid)" value={agentPerformance.totalCompletedCommission} icon="adminCommission" colorClass="bg-green" currency />
                        <KpiCard title="Mean Commission / Sale" value={agentPerformance.avgCommission} icon="adminCommission" colorClass="bg-green" currency />
                        <KpiCard title="Active MRR Value Added" value={agentPerformance.activatedPlanMRR} icon="grossIncome" colorClass="bg-green" currency />
                    </div>
                </div>
            ) : (
                <>
                    <div className="card dashboard-filter-wrapper animate-slide-down">
                         <div className="report-filters">
                            <div className="form-group"><label>From Month</label><select className="form-control" value={fromMonth} onChange={e => setFromMonth(Number(e.target.value))}>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}</select></div>
                            <div className="form-group"><label>From Year</label><input className="form-control" type="number" value={fromYear} onChange={e => setFromYear(Number(e.target.value))} /></div>
                             <div className="form-group"><label>To Month</label><select className="form-control" value={toMonth} onChange={e => setToMonth(Number(e.target.value))}>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}</select></div>
                            <div className="form-group"><label>To Year</label><input className="form-control" type="number" value={toYear} onChange={e => setToYear(Number(e.target.value))} /></div>
                         </div>
                    </div>

                    <h3 className="dashboard-section-header">Operational Funnel & Conversion Quality</h3>
                    <div className="kpi-card-grid" style={{ marginBottom: '2.5rem' }}>
                        <KpiCard title="Total Applications Received" value={adminDashboardData.totalApplications} icon="totalApplications" colorClass="bg-blue" />
                        <KpiCard title="Total Successful Installations" value={adminDashboardData.totalInstalledDelivered} icon="installedDelivered" colorClass="bg-green" />
                        <KpiCard title="Backlog (Under Review)" value={adminDashboardData.underReviewCount} icon="commissionRequest" colorClass="bg-orange" />
                        <KpiCard title="In Progress Installations" value={adminDashboardData.totalOnTheWayReady} icon="onTheWayReady" colorClass="bg-blue" />
                        <KpiCard title="Rejected Applications" value={adminDashboardData.totalRejected} icon="rejectedApplications" colorClass="bg-red" />
                        <KpiCard title="System-wide Conversion Rate" value={`${adminDashboardData.conversionRate.toFixed(1)}%`} icon="performance" colorClass="bg-green" />
                        <KpiCard title="Rejection / Loss Rate" value={`${adminDashboardData.lossRate.toFixed(1)}%`} icon="rejectedApplications" colorClass="bg-red" />
                        <KpiCard title="Pending Review Ratio" value={`${adminDashboardData.underReviewRate.toFixed(1)}%`} icon="commissionRequest" colorClass="bg-orange" />
                        <KpiCard title="Average Lead to Install Speed" value={adminDashboardData.avgInstallDays === 'N/A' ? 'N/A' : `${adminDashboardData.avgInstallDays} Days`} icon="calendar" colorClass="bg-blue" />
                        <KpiCard title="Total Selling Agents Active" value={adminDashboardData.activeAgentsCount} icon="agentCommissions" colorClass="bg-blue" />
                    </div>

                    <h3 className="dashboard-section-header">Consolidated Financial & Profitability Ledger</h3>
                    <div className="kpi-card-grid">
                        <KpiCard title="Sales Volume Value (Gross)" value={adminDashboardData.grossIncome} icon="grossIncome" colorClass="bg-green" currency />
                        <KpiCard title="Operating Expenses Debited" value={adminDashboardData.totalExpenses} icon="totalExpenses" colorClass="bg-red" currency />
                        <KpiCard title="Unsubmitted Commissions Est." value={adminDashboardData.commissionOnRequest} icon="commissionRequest" colorClass="bg-orange" currency />
                        <KpiCard title="Agent Claims Committed" value={adminDashboardData.totalAgentCommissions} icon="agentCommissions" colorClass="bg-orange" currency />
                        <KpiCard title="Gross Admin Commissions" value={adminDashboardData.totalAdminCommissions} icon="adminCommission" colorClass="bg-green" currency />
                        <KpiCard title="Net Balance (Post Expense)" value={adminDashboardData.netProfit} icon="netProfit" colorClass="bg-green" currency valueColor={adminDashboardData.netProfit >= 0 ? '#10b981' : '#ef4444'} />
                        <KpiCard title="Admin Net Margin Rate" value={`${adminDashboardData.profitMargin.toFixed(1)}%`} icon="performance" colorClass="bg-green" />
                        <KpiCard title="Average Active Plan MRR" value={adminDashboardData.avgPlanRevenue} icon="grossIncome" colorClass="bg-green" currency />
                        <KpiCard title="Primary Core Performer Agent" value={adminDashboardData.topAgent.name} icon="topAgent" colorClass="bg-blue" />
                        <KpiCard title="Total Recurring Value Created" value={adminDashboardData.activePlanMRR} icon="grossIncome" colorClass="bg-green" currency />
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
                        <thead><tr><th>Date</th><th>Name</th><th>App No</th><th>Sub No</th>{currentUser.role === 'admin' && <><th>Agent</th><th>Processed By</th></>}<th>Status</th><th>Payout</th></tr></thead>
                        <tbody>
                            {paginatedData.items.map(sub => (
                                <tr key={sub.id}>
                                    <td>{formatDate(sub.dateOfApplication)}</td>
                                    <td>{sub.name}</td>
                                    <td>{sub.applicationNo}</td>
                                    <td>{sub.subscriberNo}</td>
                                    {currentUser.role === 'admin' && <><td>{sub.agent}</td><td>{sub.processedBy || '-'}</td></>}
                                    <td><span className="status-badge" style={statusBadgeStyle(sub.status)}>{sub.status}</span></td>
                                    <td><span className="status-badge" style={payoutStatusBadgeStyle(sub.payoutStatus || 'PENDING')}>{sub.payoutStatus || 'PENDING'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={paginatedData.totalPages} onPageChange={setCurrentPage} />
            </div>
        </motion.div>
    );
};

const SubscriberModal = ({ isOpen, onClose, onSave, subscriber, agents, currentUser }) => {
    const initialFormState = {
        dateOfApplication: new Date().toISOString().split('T')[0],
        name: '', address: '', applicationNo: '', subscriberNo: '',
        agent: currentUser.role === 'agent' ? currentUser.name : (agents[0] || ''),
        processedBy: 'Leah',
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
                    <div className="form-group">
                        <label>Processed By</label>
                        <select name="processedBy" className="form-control" value={formData.processedBy || 'Leah'} onChange={handleChange} required>
                            <option value="Leah">Leah</option>
                            <option value="Jacky">Jacky</option>
                            <option value="Ryan">Ryan</option>
                            <option value="Lyn">Lyn</option>
                            <option value="Other">Other</option>
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
            if (currentUser.name === 'Lyn - Boosting') return subscribers.filter(sub => sub.agent === 'Lyn - Boosting' || sub.agent === 'Lyn Personal');
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
                        <thead><tr><th>Date</th><th>Name</th><th>Address</th><th>App No</th><th>Sub No</th><th>Agent</th><th>Processed By</th><th>Status</th><th>Payout</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filteredSubscribers.map(sub => (
                                <tr key={sub.id}>
                                    <td>{formatDate(sub.dateOfApplication)}</td>
                                    <td>{sub.name}</td>
                                    <td>{sub.address}</td>
                                    <td>{sub.applicationNo}</td>
                                    <td>{sub.subscriberNo}</td>
                                    <td>{sub.agent}</td>
                                    <td>{sub.processedBy || '-'}</td>
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
        const primarySubs = subscribers.filter(s => {
            const d = new Date(s.dateOfApplication);
            const isAgent = currentUser.name === 'Jackie - Boosting' 
                ? (s.agent === 'Jackie - Boosting' || s.agent === 'Jackie - Personal') 
                : (currentUser.name === 'Lyn - Boosting' 
                    ? (s.agent === 'Lyn - Boosting' || s.agent === 'Lyn Personal') 
                    : s.agent === currentUser.name);
            return isAgent && d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
        });
        const installedPrimary = primarySubs.filter(s => ['Installed', 'Delivered'].includes(s.status));

        // For commission, they might also be the processor of other sales! Let's count them too.
        const allInvolvedSubs = subscribers.filter(s => {
            const d = new Date(s.dateOfApplication);
            const isParticipant = isSamePerson(s.agent, currentUser.name) || isSamePerson(s.processedBy, currentUser.name);
            return isParticipant && d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
        });
        const installedInvolved = allInvolvedSubs.filter(s => ['Installed', 'Delivered'].includes(s.status));

        return {
            total: primarySubs.length,
            installed: installedPrimary.length,
            pending: primarySubs.filter(s => ['Under Review', 'For Scheduling', 'Ready for Installation', 'On the Way'].includes(s.status)).length,
            rejected: primarySubs.filter(s => ['Canceled', 'Rejected'].includes(s.status)).length,
            commission: installedInvolved.reduce((acc, s) => acc + calculateCommission(s, currentUser.name), 0),
            conversion: primarySubs.length ? (installedPrimary.length / primarySubs.length) * 100 : 0
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

            // Include all subscribers where this person is involved as Agent OR Processor to calculate their total earned commissions!
            const allInvolvedSubs = subscribers.filter(s => {
                const d = new Date(s.dateOfApplication);
                const isParticipant = isSamePerson(s.agent, agent) || isSamePerson(s.processedBy, agent);
                return isParticipant && d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
            });
            const installedInvolved = allInvolvedSubs.filter(s => ['Installed', 'Delivered'].includes(s.status));

            return {
                name: agent,
                total,
                installed,
                conversion: total ? (installed / total) * 100 : 0,
                commission: installedInvolved.reduce((acc, s) => acc + calculateCommission(s, agent), 0)
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
    const [isDownloading, setIsDownloading] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    const reportData = useMemo(() => {
        return subscribers.filter(sub => {
            if (!sub.activationDate) return false;
            const d = new Date(sub.activationDate);
            const isSuccess = ['Installed', 'Delivered'].includes(sub.status);
            const isAgent = currentUser.role === 'admin' 
                ? (selectedAgent === 'All' || isSamePerson(sub.agent, selectedAgent) || isSamePerson(sub.processedBy, selectedAgent)) 
                : (isSamePerson(sub.agent, currentUser.name) || isSamePerson(sub.processedBy, currentUser.name));
            return isSuccess && isAgent && d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
        }).map(s => ({ 
            ...s, 
            commission: currentUser.role === 'admin'
                ? (selectedAgent === 'All' ? calculateCommission(s) : calculateCommission(s, selectedAgent))
                : calculateCommission(s, currentUser.name)
        }));
    }, [subscribers, selectedMonth, selectedYear, selectedAgent, currentUser]);

    const generatePayoutTxtContent = (records) => {
        let content = "Application No. | Agent Name | Process By | Amount\n\n";
        
        // 1. Individual list
        records.forEach(rec => {
            const appNo = rec.applicationNo || '-';
            const agent = rec.agent || '-';
            const processBy = rec.processedBy || '-';
            
            // Compute Row Amount (Personal = 1200, Boosting = 400 total)
            const isBoosting = (rec.agent || '').toLowerCase().includes('boosting');
            const amount = isBoosting ? 400 : 1200;
            
            content += `${appNo} | ${agent} | ${processBy} | PHP ${amount.toLocaleString('en-US')}\n`;
        });
        
        content += "\n";
        
        // 2. Agent Summary
        const agentSums = {};
        records.forEach(rec => {
            const agent = rec.agent || 'Unknown';
            const isBoosting = (rec.agent || '').toLowerCase().includes('boosting');
            const amount = isBoosting ? 400 : 1200;
            agentSums[agent] = (agentSums[agent] || 0) + amount;
        });
        
        Object.keys(agentSums).forEach(agentName => {
            content += `${agentName} | PHP ${agentSums[agentName].toLocaleString('en-US')}\n`;
        });
        
        content += "\n";
        
        // 3. Processor (Process By) Summary
        const processorSums = {};
        records.forEach(rec => {
            const processBy = rec.processedBy || '-';
            const isBoosting = (rec.agent || '').toLowerCase().includes('boosting');
            const amount = isBoosting ? 400 : 1200;
            processorSums[processBy] = (processorSums[processBy] || 0) + amount;
        });
        
        Object.keys(processorSums).forEach(procName => {
            content += `${procName} | PHP ${processorSums[procName].toLocaleString('en-US')}\n`;
        });
        
        content += "\n";
        
        // 4. Grand Total
        const grandTotal = records.reduce((sum, rec) => {
            const isBoosting = (rec.agent || '').toLowerCase().includes('boosting');
            return sum + (isBoosting ? 400 : 1200);
        }, 0);
        content += `Grand Total | PHP ${grandTotal.toLocaleString('en-US')}\n`;
        
        return content;
    };

    const handleDownloadOnRequest = async () => {
        setIsDownloading(true);
        setStatusMsg({ type: 'loading', text: 'Generating payout file...' });
        try {
            // Live data only - fetch directly from Google Sheet script URL
            const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=readAll`);
            if (!response.ok) {
                throw new Error('Database connection failed.');
            }
            const resData = await response.json();
            if (resData.status === 'error') {
                throw new Error(resData.message || 'Error fetching data from database.');
            }
            
            // Extract raw subscribers
            const allSubs = resData.subscribers || [];
            
            // Filter using: Status = "On Request" (represented by payoutStatus = 'ON REQUEST')
            const onRequestRecords = allSubs.filter(sub => {
                const payoutStatus = (sub.payoutStatus || '').trim().toUpperCase();
                return payoutStatus === 'ON REQUEST';
            });
            
            if (onRequestRecords.length === 0) {
                setStatusMsg({ type: 'error', text: 'No On Request payout records available.' });
                return;
            }
            
            // Generate content
            const fileContent = generatePayoutTxtContent(onRequestRecords);
            
            // Handle Download
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            const fileName = `Payout_Report_${dateString}.txt`;
            
            const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setStatusMsg({ type: 'success', text: 'Payout report downloaded successfully.' });
        } catch (err) {
            console.error('Download failed:', err);
            setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Database error occurred.' });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Payout Reports</h1>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="btn btn-secondary no-print" onClick={() => window.print()}>Print</button>
                    <button 
                        className="btn btn-primary no-print" 
                        onClick={handleDownloadOnRequest}
                        disabled={isDownloading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                        {isDownloading ? 'Downloading...' : 'Download On Request Payout'}
                    </button>
                </div>
            </div>
            
            {statusMsg && (
                <div 
                    className="no-print"
                    style={{
                        padding: '1rem',
                        borderRadius: '0.375rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: statusMsg.type === 'success' ? '#def7ec' : statusMsg.type === 'error' ? '#fde8e8' : '#e1effe',
                        color: statusMsg.type === 'success' ? '#03543f' : statusMsg.type === 'error' ? '#9b1c1c' : '#1e429f',
                        border: `1px solid ${statusMsg.type === 'success' ? '#bcf0da' : statusMsg.type === 'error' ? '#f8b4b4' : '#a4cafe'}`,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {statusMsg.type === 'loading' && (
                            <svg className="animate-spin" style={{ width: '1.25rem', height: '1.25rem', color: 'currentColor' }} fill="none" viewBox="0 0 24 24">
                                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        <span>{statusMsg.text}</span>
                    </span>
                    {statusMsg.type !== 'loading' && (
                        <button 
                            onClick={() => setStatusMsg(null)} 
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'inherit', 
                                cursor: 'pointer', 
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                padding: '0 0.5rem'
                            }}
                        >
                            &times;
                        </button>
                    )}
                </div>
            )}

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
                        <thead><tr><th>Agent</th><th>Processed By</th><th>Subscriber</th><th>App No</th><th>Date</th><th>Comm</th><th>Status</th></tr></thead>
                        <tbody>
                            {reportData.map(item => (
                                <tr key={item.id}>
                                    <td>{item.agent}</td><td>{item.processedBy || '-'}</td><td>{item.name}</td><td>{item.applicationNo}</td><td>{formatDate(item.activationDate)}</td><td>₱{item.commission.toLocaleString()}</td>
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

    // Helpers for date math
    const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month - 1, 1).getDay(); // 0 = Sunday

    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const startDay = getFirstDayOfMonth(selectedYear, selectedMonth);

    // Filter subscribers relevant to the view (admin sees all passed agents, agent sees self)
    const visibleSubscribers = useMemo(() => {
        return subscribers.filter(s => agents.includes(s.agent));
    }, [subscribers, agents]);

    const dayData = useMemo(() => {
        const data = {};
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Count registered: subscriber.dateOfApplication === dateStr
            const registered = visibleSubscribers.filter(s => s.dateOfApplication === dateStr).length;
            
            // Count installed: subscriber.activationDate === dateStr AND status is 'Installed' or 'Delivered'
            const installed = visibleSubscribers.filter(s => 
                ['Installed', 'Delivered'].includes(s.status) && s.activationDate === dateStr
            ).length;
            
            data[day] = { registered, installed };
        }
        return data;
    }, [visibleSubscribers, selectedMonth, selectedYear, daysInMonth]);

    const totalInstalledForMonth = useMemo(() => {
         let total = 0;
         for (let day = 1; day <= daysInMonth; day++) {
             if (dayData[day]) {
                 total += dayData[day].installed;
             }
         }
         return total;
    }, [dayData, daysInMonth]);

    const renderCalendarDays = () => {
        const boxes = [];
        // Empty boxes for days before start of month
        for (let i = 0; i < startDay; i++) {
            boxes.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }
        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const { registered, installed } = dayData[day];
            boxes.push(
                <div key={day} className="calendar-day">
                    <div className="day-number">{day}</div>
                    <div className="day-stats">
                        <div className="stat registered">
                            <span className="label">Reg:</span>
                            <span className="value">{registered}</span>
                        </div>
                        <div className="stat installed">
                            <span className="label">Inst:</span>
                            <span className="value">{installed}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return boxes;
    };

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

                <div className="calendar-container">
                    <div className="calendar-header-row">
                        <div className="calendar-header-cell">Sun</div>
                        <div className="calendar-header-cell">Mon</div>
                        <div className="calendar-header-cell">Tue</div>
                        <div className="calendar-header-cell">Wed</div>
                        <div className="calendar-header-cell">Thu</div>
                        <div className="calendar-header-cell">Fri</div>
                        <div className="calendar-header-cell">Sat</div>
                    </div>
                    <div className="calendar-grid">
                        {renderCalendarDays()}
                    </div>
                </div>
                <div style={{ marginTop: '1.5rem', textAlign: 'right', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-red)' }}>
                    Total Installed: {totalInstalledForMonth}
                </div>
            </div>
        </div>
    );
};

const DEFAULT_PAGES = [
    { id: 'page-1', name: 'DITO HOME WIFI - LEAH', category: 'Home Wifi', agent: 'Leah - Boosting', status: 'Active', isArchived: false },
    { id: 'page-2', name: 'DITO UNLIMITED INTERNET - JACKY', category: 'Unlimited Internet', agent: 'Jackie - Boosting', status: 'Active', isArchived: false },
    { id: 'page-3', name: 'DITO HOME WIRELESS - GHAYE', category: 'Wireless', agent: 'Lyn - Boosting', status: 'Active', isArchived: false }
];

const DEFAULT_CAMPAIGNS = [
    { id: 'camp-1', pageId: 'page-1', name: 'Leah Home Wifi March Promo', dateStarted: '2026-03-01', dailyBudget: 150, totalBudget: 4500, numCreatives: 3, creativeType: 'Image', status: 'Active', agent: 'Leah - Boosting', processedBy: 'Admin' },
    { id: 'camp-2', pageId: 'page-2', name: 'Jacky Unli Net Launch', dateStarted: '2026-04-05', dailyBudget: 300, totalBudget: 9000, numCreatives: 5, creativeType: 'Video', status: 'Active', agent: 'Jackie - Boosting', processedBy: 'Admin' },
    { id: 'camp-3', pageId: 'page-3', name: 'Ghaye Wireless Unlimited Base', dateStarted: '2026-05-10', dailyBudget: 200, totalBudget: 6000, numCreatives: 2, creativeType: 'Carousel', status: 'Active', agent: 'Lyn - Boosting', processedBy: 'Admin' }
];

const DEFAULT_LOGS = [
    { id: 'log-1', campaignId: 'camp-1', date: '2026-03-05', amountSpent: 600, reach: 12000, impressions: 15000, clicks: 450, messages: 90, leads: 18, approvedSales: 4, rejectedSales: 1, revenueGenerated: 6000 },
    { id: 'log-2', campaignId: 'camp-1', date: '2026-03-12', amountSpent: 1050, reach: 21000, impressions: 26000, clicks: 780, messages: 150, leads: 30, approvedSales: 7, rejectedSales: 2, revenueGenerated: 10500 },
    { id: 'log-3', campaignId: 'camp-1', date: '2026-04-05', amountSpent: 1200, reach: 24000, impressions: 30000, clicks: 900, messages: 180, leads: 36, approvedSales: 8, rejectedSales: 1, revenueGenerated: 12000 },
    { id: 'log-4', campaignId: 'camp-1', date: '2026-04-20', amountSpent: 1500, reach: 30000, impressions: 38000, clicks: 1100, messages: 220, leads: 45, approvedSales: 10, rejectedSales: 3, revenueGenerated: 15000 },
    
    { id: 'log-5', campaignId: 'camp-2', date: '2026-04-08', amountSpent: 1500, reach: 28000, impressions: 35000, clicks: 1120, messages: 250, leads: 55, approvedSales: 12, rejectedSales: 2, revenueGenerated: 18000 },
    { id: 'log-6', campaignId: 'camp-2', date: '2026-04-22', amountSpent: 2100, reach: 40000, impressions: 52000, clicks: 1600, messages: 350, leads: 78, approvedSales: 18, rejectedSales: 4, revenueGenerated: 27000 },
    { id: 'log-7', campaignId: 'camp-2', date: '2026-05-02', amountSpent: 1800, reach: 34000, impressions: 44000, clicks: 1350, messages: 300, leads: 65, approvedSales: 15, rejectedSales: 3, revenueGenerated: 22500 },
    { id: 'log-8', campaignId: 'camp-2', date: '2026-05-20', amountSpent: 2500, reach: 48000, impressions: 61000, clicks: 1900, messages: 420, leads: 92, approvedSales: 22, rejectedSales: 5, revenueGenerated: 33000 },
    
    { id: 'log-9', campaignId: 'camp-3', date: '2026-05-12', amountSpent: 1000, reach: 18000, impressions: 22000, clicks: 650, messages: 130, leads: 26, approvedSales: 6, rejectedSales: 1, revenueGenerated: 9000 },
    { id: 'log-10', campaignId: 'camp-3', date: '2026-05-18', amountSpent: 1600, reach: 29000, impressions: 36000, clicks: 1100, messages: 210, leads: 44, approvedSales: 10, rejectedSales: 2, revenueGenerated: 15000 },
    { id: 'log-11', campaignId: 'camp-3', date: '2026-05-25', amountSpent: 2000, reach: 37000, impressions: 46000, clicks: 1400, messages: 280, leads: 58, approvedSales: 13, rejectedSales: 3, revenueGenerated: 19500 }
];

// --- META ADS MONITORING COMPONENT ---
const MetaAds = ({ agents, currentUser, initialPages = [], initialCampaigns = [], initialLogs = [], onSaveMetaAdsData }) => {
    const [subTab, setSubTab] = useState('Dashboard'); // 'Dashboard' | 'Pages' | 'Campaigns' | 'Logs'
    const [chartGroup, setChartGroup] = useState('Trends'); // 'Trends' | 'Comparisons' | 'Insights'
    const [showArchivedPages, setShowArchivedPages] = useState(false);

    // Check if there is already any existing configuration from parent (e.g. from Google Sheets or localStorage)
    const hasSomeData = (initialPages && initialPages.length > 0) || (initialCampaigns && initialCampaigns.length > 0) || (initialLogs && initialLogs.length > 0);

    // Persisted Data layers
    const [pages, setPages] = useState(() => hasSomeData ? initialPages : DEFAULT_PAGES);
    const [campaigns, setCampaigns] = useState(() => hasSomeData ? initialCampaigns : DEFAULT_CAMPAIGNS);
    const [performanceLogs, setPerformanceLogs] = useState(() => hasSomeData ? initialLogs : DEFAULT_LOGS);

    // Synchronize props dynamically when loaded from Google Sheet
    useEffect(() => {
        const currentDataExists = (initialPages && initialPages.length > 0) || (initialCampaigns && initialCampaigns.length > 0) || (initialLogs && initialLogs.length > 0);
        if (currentDataExists) {
            setPages(initialPages || []);
        }
    }, [initialPages]);

    useEffect(() => {
        const currentDataExists = (initialPages && initialPages.length > 0) || (initialCampaigns && initialCampaigns.length > 0) || (initialLogs && initialLogs.length > 0);
        if (currentDataExists) {
            setCampaigns(initialCampaigns || []);
        }
    }, [initialCampaigns]);

    useEffect(() => {
        const currentDataExists = (initialPages && initialPages.length > 0) || (initialCampaigns && initialCampaigns.length > 0) || (initialLogs && initialLogs.length > 0);
        if (currentDataExists) {
            setPerformanceLogs(initialLogs || []);
        }
    }, [initialLogs]);

    // Role-based visibility logic
    const isRecordVisible = (agentField) => {
        if (currentUser.role === 'admin') return true;
        if (currentUser.name === 'Jackie - Boosting') {
            return agentField === 'Jackie - Boosting' || agentField === 'Jackie - Personal';
        }
        if (currentUser.name === 'Lyn - Boosting') {
            return agentField === 'Lyn - Boosting' || agentField === 'Lyn Personal';
        }
        return agentField === currentUser.name;
    };

    // Filter states
    const [filterPageId, setFilterPageId] = useState('All');
    const [filterCampaignId, setFilterCampaignId] = useState('All');
    const [filterAgent, setFilterAgent] = useState(() => currentUser.role === 'agent' ? currentUser.name : 'All');
    const [filterProcessedBy, setFilterProcessedBy] = useState('All');
    const [filterCampStatus, setFilterCampStatus] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const resetFilters = () => {
        setFilterPageId('All');
        setFilterCampaignId('All');
        setFilterAgent(currentUser.role === 'agent' ? currentUser.name : 'All');
        setFilterProcessedBy('All');
        setFilterCampStatus('All');
        setStartDate('');
        setEndDate('');
    };

    // Derived lists
    const visiblePages = useMemo(() => {
        return pages.filter(p => isRecordVisible(p.agent) && (showArchivedPages ? true : !p.isArchived));
    }, [pages, showArchivedPages, currentUser]);

    const activePagesList = useMemo(() => {
        return pages.filter(p => !p.isArchived && isRecordVisible(p.agent));
    }, [pages, currentUser]);

    const visibleCampaigns = useMemo(() => {
        return campaigns.filter(c => {
            const page = pages.find(p => p.id === c.pageId);
            const isArchived = page ? page.isArchived : false;
            return !isArchived && isRecordVisible(c.agent);
        });
    }, [campaigns, pages, currentUser]);

    const processedByOptions = useMemo(() => {
        const set = new Set(visibleCampaigns.map(c => c.processedBy));
        return Array.from(set).filter(Boolean);
    }, [visibleCampaigns]);

    const filteredLogs = useMemo(() => {
        return performanceLogs.filter(log => {
            const campaign = campaigns.find(c => c.id === log.campaignId);
            if (!campaign) return false;
            const page = pages.find(p => p.id === campaign.pageId);
            if (!page || page.isArchived) return false;

            if (!isRecordVisible(campaign.agent)) return false;

            if (filterPageId !== 'All' && campaign.pageId !== filterPageId) return false;
            if (filterCampaignId !== 'All' && log.campaignId !== filterCampaignId) return false;

            if (filterAgent !== 'All') {
                if (filterAgent === 'Jackie - Boosting') {
                    if (campaign.agent !== 'Jackie - Boosting' && campaign.agent !== 'Jackie - Personal') return false;
                } else if (filterAgent === 'Lyn - Boosting') {
                    if (campaign.agent !== 'Lyn - Boosting' && campaign.agent !== 'Lyn Personal') return false;
                } else {
                    if (campaign.agent !== filterAgent) return false;
                }
            }

            if (filterProcessedBy !== 'All' && campaign.processedBy !== filterProcessedBy) return false;
            if (filterCampStatus !== 'All' && campaign.status !== filterCampStatus) return false;
            if (startDate && log.date < startDate) return false;
            if (endDate && log.date > endDate) return false;

            return true;
        });
    }, [performanceLogs, campaigns, pages, filterPageId, filterCampaignId, filterAgent, filterProcessedBy, filterCampStatus, startDate, endDate, currentUser]);

    // Financial & KPI aggregates
    const kpis = useMemo(() => {
        const totalPages = pages.filter(p => !p.isArchived && isRecordVisible(p.agent)).length;
        const activePages = pages.filter(p => !p.isArchived && p.status === 'Active' && isRecordVisible(p.agent)).length;

        const filteredCamps = campaigns.filter(c => {
            const page = pages.find(p => p.id === c.pageId);
            if (!page || page.isArchived) return false;
            if (!isRecordVisible(c.agent)) return false;

            if (filterPageId !== 'All' && c.pageId !== filterPageId) return false;
            if (filterCampaignId !== 'All' && c.id !== filterCampaignId) return false;

            if (filterAgent !== 'All') {
                if (filterAgent === 'Jackie - Boosting') {
                    if (c.agent !== 'Jackie - Boosting' && c.agent !== 'Jackie - Personal') return false;
                } else if (filterAgent === 'Lyn - Boosting') {
                    if (c.agent !== 'Lyn - Boosting' && c.agent !== 'Lyn Personal') return false;
                } else {
                    if (c.agent !== filterAgent) return false;
                }
            }

            if (filterProcessedBy !== 'All' && c.processedBy !== filterProcessedBy) return false;
            if (filterCampStatus !== 'All' && c.status !== filterCampStatus) return false;
            return true;
        });

        const totalCampaigns = filteredCamps.length;
        const activeCampaigns = filteredCamps.filter(c => c.status === 'Active').length;
        const totalCreatives = filteredCamps.filter(c => c.status === 'Active').reduce((sum, c) => sum + (c.numCreatives || 0), 0);

        let totalSpend = 0;
        let totalReach = 0;
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalMessages = 0;
        let totalLeads = 0;
        let totalApprovedSales = 0;
        let totalRejectedSales = 0;
        let totalRevenue = 0;

        filteredLogs.forEach(log => {
            totalSpend += log.amountSpent;
            totalReach += log.reach;
            totalImpressions += log.impressions;
            totalClicks += log.clicks;
            totalMessages += log.messages;
            totalLeads += log.leads;
            totalApprovedSales += log.approvedSales;
            totalRejectedSales += log.rejectedSales;
            totalRevenue += log.revenueGenerated;
        });

        const costPerMessage = totalMessages > 0 ? totalSpend / totalMessages : 0;
        const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
        const costPerSale = totalApprovedSales > 0 ? totalSpend / totalApprovedSales : 0;
        const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

        return {
            totalPages,
            activePages,
            totalCampaigns,
            activeCampaigns,
            totalCreatives,
            totalSpend,
            totalReach,
            totalImpressions,
            totalClicks,
            totalMessages,
            totalLeads,
            totalApprovedSales,
            totalRejectedSales,
            totalRevenue,
            costPerMessage,
            costPerLead,
            costPerSale,
            roas
        };
    }, [pages, campaigns, filteredLogs, filterPageId, filterCampaignId, filterAgent, filterProcessedBy, filterCampStatus, currentUser]);

    // Formatting helpers
    const formatCurrency = (val) => '₱' + Math.round(val).toLocaleString();
    const formatNumber = (val) => Math.round(val).toLocaleString();

    // 10 Detailed Recharts Datasets
    // 1, 2, 3, 4: Trends rollup by Date
    const dateTrendData = useMemo(() => {
        const groups = {};
        filteredLogs.forEach(log => {
            if (!groups[log.date]) {
                groups[log.date] = { date: log.date, Spend: 0, Leads: 0, Sales: 0, Revenue: 0 };
            }
            groups[log.date].Spend += log.amountSpent;
            groups[log.date].Leads += log.leads;
            groups[log.date].Sales += log.approvedSales;
            groups[log.date].Revenue += log.revenueGenerated;
        });

        return Object.keys(groups).sort().map(d => {
            const parsed = new Date(d);
            const label = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return {
                name: label,
                ...groups[d]
            };
        });
    }, [filteredLogs]);

    // 5: Page Performance Comparison
    const pagePerformanceData = useMemo(() => {
        const groups = {};
        activePagesList.forEach(p => {
            groups[p.id] = { name: p.name, Spend: 0, Revenue: 0 };
        });

        filteredLogs.forEach(log => {
            const camp = campaigns.find(c => c.id === log.campaignId);
            if (camp && groups[camp.pageId]) {
                groups[camp.pageId].Spend += log.amountSpent;
                groups[camp.pageId].Revenue += log.revenueGenerated;
            }
        });

        return Object.values(groups).filter(g => g.Spend > 0 || g.Revenue > 0);
    }, [activePagesList, campaigns, filteredLogs]);

    // 6: Campaign Performance Comparison
    const campaignPerformanceData = useMemo(() => {
        const groups = {};
        visibleCampaigns.forEach(c => {
            groups[c.id] = { name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name, Spend: 0, Messages: 0, Leads: 0 };
        });

        filteredLogs.forEach(log => {
            if (groups[log.campaignId]) {
                groups[log.campaignId].Spend += log.amountSpent;
                groups[log.campaignId].Messages += log.messages;
                groups[log.campaignId].Leads += log.leads;
            }
        });

        return Object.values(groups).filter(g => g.Spend > 0 || g.Leads > 0);
    }, [visibleCampaigns, filteredLogs]);

    // 7: Creative Performance Comparison
    const creativePerformanceData = useMemo(() => {
        const types = ['Image', 'Video', 'Carousel', 'Reel'];
        const map = types.reduce((acc, t) => {
            acc[t] = { name: t, Spend: 0, Leads: 0, Sales: 0 };
            return acc;
        }, {});

        filteredLogs.forEach(log => {
            const camp = campaigns.find(c => c.id === log.campaignId);
            if (camp && map[camp.creativeType]) {
                map[camp.creativeType].Spend += log.amountSpent;
                map[camp.creativeType].Leads += log.leads;
                map[camp.creativeType].Sales += log.approvedSales;
            }
        });

        return Object.values(map).map(item => {
            const cpl = item.Leads > 0 ? item.Spend / item.Leads : 0;
            const cps = item.Sales > 0 ? item.Spend / item.Sales : 0;
            return {
                name: item.name,
                "Cost Per Lead": Math.round(cpl),
                "Cost Per Sale": Math.round(cps)
            };
        });
    }, [campaigns, filteredLogs]);

    // 8: Budget vs Revenue Comparison
    const budgetVsRevenueData = useMemo(() => {
        return visibleCampaigns.map(c => {
            const rev = filteredLogs
                .filter(l => l.campaignId === c.id)
                .reduce((sum, l) => sum + l.revenueGenerated, 0);
            return {
                name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
                "Target Budget": c.totalBudget,
                "Revenue Generated": rev
            };
        }).filter(item => item["Target Budget"] > 0 || item["Revenue Generated"] > 0);
    }, [visibleCampaigns, filteredLogs]);

    // 9: Agent Performance Comparison
    const agentPerformanceData = useMemo(() => {
        const map = {};
        agents.forEach(a => {
            map[a] = { name: a, Spend: 0, Revenue: 0 };
        });

        filteredLogs.forEach(log => {
            const camp = campaigns.find(c => c.id === log.campaignId);
            if (camp && map[camp.agent]) {
                map[camp.agent].Spend += log.amountSpent;
                map[camp.agent].Revenue += log.revenueGenerated;
            }
        });

        return Object.values(map).filter(item => item.Spend > 0 || item.Revenue > 0);
    }, [agents, campaigns, filteredLogs]);

    // 10: Monthly Performance Summary
    const monthlyPerformanceData = useMemo(() => {
        const map = {};
        filteredLogs.forEach(log => {
            const d = new Date(log.date);
            const mLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!map[mLabel]) {
                map[mLabel] = { name: mLabel, Spend: 0, Leads: 0, Revenue: 0 };
            }
            map[mLabel].Spend += log.amountSpent;
            map[mLabel].Leads += log.leads;
            map[mLabel].Revenue += log.revenueGenerated;
        });
        return Object.values(map);
    }, [filteredLogs]);


    // -- Modal Management structures --
    // Page Modal
    const [pageModalOpen, setPageModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [pageFormName, setPageFormName] = useState('');
    const [pageFormCategory, setPageFormCategory] = useState('');
    const [pageFormAgent, setPageFormAgent] = useState('');
    const [pageFormStatus, setPageFormStatus] = useState('Active');

    const openPageForm = (pageToEdit = null) => {
        if (pageToEdit) {
            setEditingPage(pageToEdit);
            setPageFormName(pageToEdit.name);
            setPageFormCategory(pageToEdit.category);
            setPageFormAgent(pageToEdit.agent);
            setPageFormStatus(pageToEdit.status);
        } else {
            setEditingPage(null);
            setPageFormName('');
            setPageFormCategory('');
            setPageFormAgent(currentUser.role === 'agent' ? currentUser.name : agents[0]);
            setPageFormStatus('Active');
        }
        setPageModalOpen(true);
    };

    const handleSavePage = (e) => {
        e.preventDefault();
        if (!pageFormName.trim() || !pageFormCategory.trim() || !pageFormAgent) return;

        let updatedPages;
        if (editingPage) {
            updatedPages = pages.map(p => p.id === editingPage.id ? { ...p, name: pageFormName.trim(), category: pageFormCategory.trim(), agent: pageFormAgent, status: pageFormStatus } : p);
        } else {
            const newP = {
                id: `page-${Date.now()}`,
                name: pageFormName.trim(),
                category: pageFormCategory.trim(),
                agent: pageFormAgent,
                status: pageFormStatus,
                isArchived: false
            };
            updatedPages = [...pages, newP];
        }
        setPages(updatedPages);
        onSaveMetaAdsData(updatedPages, campaigns, performanceLogs);
        setPageModalOpen(false);
        setEditingPage(null);
    };

    // Campaign Modal
    const [campModalOpen, setCampModalOpen] = useState(false);
    const [editingCamp, setEditingCamp] = useState(null);
    const [campFormPageId, setCampFormPageId] = useState('');
    const [campFormName, setCampFormName] = useState('');
    const [campFormDateStarted, setCampFormDateStarted] = useState('');
    const [campFormDailyBudget, setCampFormDailyBudget] = useState('');
    const [campFormTotalBudget, setCampFormTotalBudget] = useState('');
    const [campFormNumCreatives, setCampFormNumCreatives] = useState('');
    const [campFormCreativeType, setCampFormCreativeType] = useState('Image');
    const [campFormStatus, setCampFormStatus] = useState('Active');
    const [campFormAgent, setCampFormAgent] = useState('');
    const [campFormProcessedBy, setCampFormProcessedBy] = useState('');

    const openCampForm = (campToEdit = null) => {
        const today = new Date().toISOString().split('T')[0];
        const initialPage = activePagesList[0]?.id || '';
        if (campToEdit) {
            setEditingCamp(campToEdit);
            setCampFormPageId(campToEdit.pageId);
            setCampFormName(campToEdit.name);
            setCampFormDateStarted(campToEdit.dateStarted);
            setCampFormDailyBudget(campToEdit.dailyBudget.toString());
            setCampFormTotalBudget(campToEdit.totalBudget.toString());
            setCampFormNumCreatives(campToEdit.numCreatives.toString());
            setCampFormCreativeType(campToEdit.creativeType);
            setCampFormStatus(campToEdit.status);
            setCampFormAgent(campToEdit.agent);
            setCampFormProcessedBy(campToEdit.processedBy);
        } else {
            setEditingCamp(null);
            setCampFormPageId(initialPage);
            setCampFormName('');
            setCampFormDateStarted(today);
            setCampFormDailyBudget('150');
            setCampFormTotalBudget('3000');
            setCampFormNumCreatives('3');
            setCampFormCreativeType('Image');
            setCampFormStatus('Active');
            setCampFormAgent(currentUser.role === 'agent' ? currentUser.name : (agents[0] || ''));
            setCampFormProcessedBy(currentUser.name);
        }
        setCampModalOpen(true);
    };

    const handleSaveCamp = (e) => {
        e.preventDefault();
        if (!campFormPageId || !campFormName.trim() || !campFormDailyBudget || !campFormAgent) return;

        const campData = {
            pageId: campFormPageId,
            name: campFormName.trim(),
            dateStarted: campFormDateStarted,
            dailyBudget: parseFloat(campFormDailyBudget) || 0,
            totalBudget: parseFloat(campFormTotalBudget) || 0,
            numCreatives: parseInt(campFormNumCreatives) || 0,
            creativeType: campFormCreativeType,
            status: campFormStatus,
            agent: campFormAgent,
            processedBy: campFormProcessedBy.trim() || currentUser.name
        };

        let updatedCampaigns;
        if (editingCamp) {
            updatedCampaigns = campaigns.map(c => c.id === editingCamp.id ? { ...c, ...campData } : c);
        } else {
            const newC = {
                id: `camp-${Date.now()}`,
                ...campData
            };
            updatedCampaigns = [...campaigns, newC];
        }
        setCampaigns(updatedCampaigns);
        onSaveMetaAdsData(pages, updatedCampaigns, performanceLogs);
        setCampModalOpen(false);
        setEditingCamp(null);
    };

    // Performance Log Modal (Cumulative updating)
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [logFormCampId, setLogFormCampId] = useState('');
    const [logFormDate, setLogFormDate] = useState('');
    const [logFormAmountSpent, setLogFormAmountSpent] = useState('');
    const [logFormReach, setLogFormReach] = useState('');
    const [logFormImpressions, setLogFormImpressions] = useState('');
    const [logFormClicks, setLogFormClicks] = useState('');
    const [logFormMessages, setLogFormMessages] = useState('');
    const [logFormLeads, setLogFormLeads] = useState('');
    const [logFormApprovedSales, setLogFormApprovedSales] = useState('');
    const [logFormRejectedSales, setLogFormRejectedSales] = useState('');
    const [logFormRevenueGenerated, setLogFormRevenueGenerated] = useState('');

    const openLogForm = (logToEdit = null, preselectedCampId = '') => {
        const today = new Date().toISOString().split('T')[0];
        const defaultCamp = preselectedCampId || visibleCampaigns[0]?.id || '';

        if (logToEdit) {
            setEditingLog(logToEdit);
            setLogFormCampId(logToEdit.campaignId);
            setLogFormDate(logToEdit.date);
            setLogFormAmountSpent(logToEdit.amountSpent.toString());
            setLogFormReach(logToEdit.reach.toString());
            setLogFormImpressions(logToEdit.impressions.toString());
            setLogFormClicks(logToEdit.clicks.toString());
            setLogFormMessages(logToEdit.messages.toString());
            setLogFormLeads(logToEdit.leads.toString());
            setLogFormApprovedSales(logToEdit.approvedSales.toString());
            setLogFormRejectedSales(logToEdit.rejectedSales.toString());
            setLogFormRevenueGenerated(logToEdit.revenueGenerated.toString());
        } else {
            setEditingLog(null);
            setLogFormCampId(defaultCamp);
            setLogFormDate(today);
            setLogFormAmountSpent('');
            setLogFormReach('');
            setLogFormImpressions('');
            setLogFormClicks('');
            setLogFormMessages('');
            setLogFormLeads('');
            setLogFormApprovedSales('');
            setLogFormRejectedSales('');
            setLogFormRevenueGenerated('');
        }
        setLogModalOpen(true);
    };

    const handleSaveLog = (e) => {
        e.preventDefault();
        if (!logFormCampId || !logFormAmountSpent || !logFormDate) return;

        const logData = {
            campaignId: logFormCampId,
            date: logFormDate,
            amountSpent: parseFloat(logFormAmountSpent) || 0,
            reach: parseInt(logFormReach) || 0,
            impressions: parseInt(logFormImpressions) || 0,
            clicks: parseInt(logFormClicks) || 0,
            messages: parseInt(logFormMessages) || 0,
            leads: parseInt(logFormLeads) || 0,
            approvedSales: parseInt(logFormApprovedSales) || 0,
            rejectedSales: parseInt(logFormRejectedSales) || 0,
            revenueGenerated: parseFloat(logFormRevenueGenerated) || 0
        };

        let updatedLogs;
        if (editingLog) {
            updatedLogs = performanceLogs.map(l => l.id === editingLog.id ? { ...l, ...logData } : l);
        } else {
            const newL = {
                id: `log-${Date.now()}`,
                ...logData
            };
            updatedLogs = [newL, ...performanceLogs];
        }
        setPerformanceLogs(updatedLogs);
        onSaveMetaAdsData(pages, campaigns, updatedLogs);
        setLogModalOpen(false);
        setEditingLog(null);
    };

    const handleDeleteLog = (id) => {
        if (confirm('Are you sure you want to delete this performance log?')) {
            const updatedLogs = performanceLogs.filter(l => l.id !== id);
            setPerformanceLogs(updatedLogs);
            onSaveMetaAdsData(pages, campaigns, updatedLogs);
        }
    };

    const handleArchivePage = (id, targetStatus) => {
        const updatedPages = pages.map(p => p.id === id ? { ...p, isArchived: targetStatus } : p);
        setPages(updatedPages);
        onSaveMetaAdsData(updatedPages, campaigns, performanceLogs);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <style>{`
                .meta-subtabs {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 0.5rem;
                    overflow-x: auto;
                }
                .subtab-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.65rem 1.25rem;
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                    background: none;
                    border: none;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .subtab-btn:hover {
                    background-color: rgba(0,0,0,0.05);
                    color: var(--text-primary);
                }
                .subtab-btn.active {
                    background-color: var(--primary-brand);
                    color: white;
                }
                .meta-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2.5rem;
                }
                .meta-kpi {
                    background: white;
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-sm);
                    border-radius: 12px;
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    transition: all 0.2s;
                }
                .meta-kpi:hover {
                    box-shadow: var(--shadow-md);
                    transform: translateY(-2px);
                }
                .meta-kpi-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                }
                .meta-kpi-icon {
                    background: var(--primary-brand-light);
                    color: var(--primary-brand);
                    padding: 6px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .meta-kpi-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .char-nav {
                    display: flex;
                    gap: 0.25rem;
                    margin-bottom: 1.5rem;
                    background: #e9ecef;
                    padding: 4px;
                    border-radius: 8px;
                    width: fit-content;
                }
                .char-nav-btn {
                    padding: 0.45rem 1rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    background: none;
                    border: none;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                .char-nav-btn.active {
                    background: white;
                    color: var(--text-primary);
                    box-shadow: var(--shadow-sm);
                }
                .chart-panel-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                @media (max-width: 768px) {
                    .chart-panel-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .chart-container-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid var(--border-color);
                }
                .chart-container-card h3 {
                    font-size: 1.1rem;
                    margin-bottom: 1.25rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-primary);
                }
                .badge-pill {
                    padding: 0.25rem 0.6rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    line-height: 1;
                    display: inline-block;
                }
                .badge-active { background: #d1fae5; color: #065f46; }
                .badge-inactive { background: #f3f4f6; color: #374151; }
                .badge-paused { background: #fef3c7; color: #92400e; }
                .badge-completed { background: #dbeafe; color: #1e40af; }
                .action-row {
                    display: flex;
                    gap: 0.5rem;
                }
                .d-flex-between {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .page-desc {
                    color: var(--text-secondary);
                    margin-top: -0.5rem;
                    margin-bottom: 2rem;
                    font-size: 0.95rem;
                }
            `}</style>

            <div className="dashboard-title-bar">
                <h1>Meta Ads Performance Tracking</h1>
                <p className="dashboard-subtitle">Direct manual tracking, campaign spend, conversion funnels, and real-time ROAS monitoring</p>
            </div>

            {/* Navigation sub-tabs */}
            <div className="meta-subtabs no-print">
                <button className={`subtab-btn ${subTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setSubTab('Dashboard')}><Icon path={ICONS.overview} /> Dashboard Overview</button>
                <button className={`subtab-btn ${subTab === 'Pages' ? 'active' : ''}`} onClick={() => setSubTab('Pages')}><Icon path={ICONS.subscribers} /> Manage Facebook Pages</button>
                <button className={`subtab-btn ${subTab === 'Campaigns' ? 'active' : ''}`} onClick={() => setSubTab('Campaigns')}><Icon path={ICONS.totalApplications} /> Campaign Management</button>
                <button className={`subtab-btn ${subTab === 'Logs' ? 'active' : ''}`} onClick={() => setSubTab('Logs')}><Icon path={ICONS.accounting} /> Performance Logs Tracker</button>
            </div>

            {/* Sub-tab Rendering - Dashboard tab */}
            {subTab === 'Dashboard' && (
                <>
                    {/* Filters bar */}
                    <div className="card dashboard-filter-wrapper animate-slide-down no-print" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', items: 'center', gap: '0.5rem' }}><Icon path={ICONS.calendar} /> Filters & Period Selector</span>
                            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={resetFilters}>Reset Filters</button>
                        </div>
                        <div className="report-filters">
                            <div className="form-group">
                                <label>Facebook Page</label>
                                <select className="form-control" value={filterPageId} onChange={e => setFilterPageId(e.target.value)}>
                                    <option value="All">All FB Pages</option>
                                    {activePagesList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Ad Campaign</label>
                                <select className="form-control" value={filterCampaignId} onChange={e => setFilterCampaignId(e.target.value)}>
                                    <option value="All">All Campaigns</option>
                                    {visibleCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Assigned Agent</label>
                                <select className="form-control" value={filterAgent} onChange={e => setFilterAgent(e.target.value)} disabled={currentUser.role === 'agent'}>
                                    <option value="All">All Agents</option>
                                    {agents.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Processed By</label>
                                <select className="form-control" value={filterProcessedBy} onChange={e => setFilterProcessedBy(e.target.value)}>
                                    <option value="All">All Workers</option>
                                    {processedByOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Campaign Status</label>
                                <select className="form-control" value={filterCampStatus} onChange={e => setFilterCampStatus(e.target.value)}>
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Paused">Paused</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>From Date</label>
                                <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>To Date</label>
                                <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards section */}
                    <div className="meta-kpi-grid">
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Total Pages</span><div className="meta-kpi-icon"><Globe style={{ width: 16, height: 16 }} /></div></div>
                            <div className="meta-kpi-value">{kpis.totalPages}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Active Pages: <strong>{kpis.activePages}</strong></div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Total Campaigns</span><div className="meta-kpi-icon"><Layers style={{ width: 16, height: 16 }} /></div></div>
                            <div className="meta-kpi-value">{kpis.totalCampaigns}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Active Campaigns: <strong>{kpis.activeCampaigns}</strong></div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Daily Creatives Running</span><div className="meta-kpi-icon"><Globe style={{ width: 16, height: 16 }} /></div></div>
                            <div className="meta-kpi-value">{kpis.totalCreatives}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Across active accounts</div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Total Ad Spend</span><div className="meta-kpi-icon"><Icon path={ICONS.totalExpenses} /></div></div>
                            <div className="meta-kpi-value" style={{ color: 'var(--accent-red)' }}>{formatCurrency(kpis.totalSpend)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Aggregated marketing costs</div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Total Reach</span><div className="meta-kpi-icon"><Icon path={ICONS.subscribers} /></div></div>
                            <div className="meta-kpi-value">{formatNumber(kpis.totalReach)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Unique user impressions</div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Total Impressions</span><div className="meta-kpi-icon"><Icon path={ICONS.calendar} /></div></div>
                            <div className="meta-kpi-value">{formatNumber(kpis.totalImpressions)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Total visual deliveries</div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Total Messages Generated</span><div className="meta-kpi-icon"><Icon path={ICONS.commissionRequest} /></div></div>
                            <div className="meta-kpi-value" style={{ color: 'var(--accent-blue)' }}>{formatNumber(kpis.totalMessages)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Conversation conversions</div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Total Leads Formed</span><div className="meta-kpi-icon"><Icon path={ICONS.totalApplications} /></div></div>
                            <div className="meta-kpi-value" style={{ color: '#8b5cf6' }}>{formatNumber(kpis.totalLeads)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Interested prospects logged</div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Approved Sales Count</span><div className="meta-kpi-icon"><Icon path={ICONS.installedDelivered} /></div></div>
                            <div className="meta-kpi-value" style={{ color: 'var(--accent-green)' }}>{formatNumber(kpis.totalApprovedSales)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Rejected sales: <strong>{kpis.totalRejectedSales}</strong></div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Total Revenue Created</span><div className="meta-kpi-icon"><Icon path={ICONS.grossIncome} /></div></div>
                            <div className="meta-kpi-value" style={{ color: 'var(--accent-green)' }}>{formatCurrency(kpis.totalRevenue)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Commission & sales value</div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Cost Per Message (CPM)</span><div className="meta-kpi-icon"><Icon path={ICONS.payout} /></div></div>
                            <div className="meta-kpi-value">{formatCurrency(kpis.costPerMessage)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Spend per raw message click</div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Cost Per Lead (CPL)</span><div className="meta-kpi-icon"><Icon path={ICONS.payout} /></div></div>
                            <div className="meta-kpi-value">{formatCurrency(kpis.costPerLead)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Spend per prospective lead</div>
                        </div>
                        <div className="meta-kpi">
                            <div className="meta-kpi-head"><span>Cost Per Sale (CPS)</span><div className="meta-kpi-icon"><Icon path={ICONS.payout} /></div></div>
                            <div className="meta-kpi-value">{formatCurrency(kpis.costPerSale)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Spend per successful installation</div>
                        </div>
                        <div className="meta-kpi" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                            <div className="meta-kpi-head"><span>Return on Ad Spend (ROAS)</span><div className="meta-kpi-icon"><Icon path={ICONS.performance} /></div></div>
                            <div className="meta-kpi-value" style={{ color: 'var(--accent-green)' }}>{kpis.roas.toFixed(2)}x</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Revenue multiple of spend</div>
                        </div>
                    </div>

                    {/* Chart Navigation header */}
                    <div className="char-nav no-print">
                        <button className={`char-nav-btn ${chartGroup === 'Trends' ? 'active' : ''}`} onClick={() => setChartGroup('Trends')}>Performance Trends</button>
                        <button className={`char-nav-btn ${chartGroup === 'Comparisons' ? 'active' : ''}`} onClick={() => setChartGroup('Comparisons')}>Platform Comparisons</button>
                        <button className={`char-nav-btn ${chartGroup === 'Insights' ? 'active' : ''}`} onClick={() => setChartGroup('Insights')}>Optimization Insights</button>
                    </div>

                    {/* Group 1: Performance Trends charts */}
                    {chartGroup === 'Trends' && (
                        <div className="chart-panel-grid">
                            <div className="chart-container-card">
                                <h3><Icon path={ICONS.performance} /> Ad Spend Trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={dateTrendData}>
                                        <defs>
                                            <linearGradient id="spendG" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
                                        <Area type="monotone" dataKey="Spend" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#spendG)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-container-card">
                                <h3><Icon path={ICONS.totalApplications} /> Ad Leads Trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={dateTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Bar dataKey="Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-container-card">
                                <h3><Icon path={ICONS.installedDelivered} /> Approved Sales Trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsLineChart data={dateTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <RechartsLine type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                                    </RechartsLineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-container-card">
                                <h3><Icon path={ICONS.grossIncome} /> Revenue Trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={dateTrendData}>
                                        <defs>
                                            <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
                                        <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#revG)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Group 2: Platform Comparisons */}
                    {chartGroup === 'Comparisons' && (
                        <div className="chart-panel-grid">
                            <div className="chart-container-card">
                                <h3><Globe style={{ width: 16, height: 16, marginRight: 6, display: 'inline' }} /> Facebook Page Performance</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={pagePerformanceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="Spend" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-container-card">
                                <h3><Layers style={{ width: 16, height: 16, marginRight: 6, display: 'inline' }} /> Campaign Volume Performance</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={campaignPerformanceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Bar dataKey="Messages" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-container-card" style={{ gridColumn: '1 / -1' }}>
                                <h3><Icon path={ICONS.grossIncome} /> Target Budget vs Actual Revenue</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={budgetVsRevenueData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="Target Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Revenue Generated" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Group 3: Insights */}
                    {chartGroup === 'Insights' && (
                        <div className="chart-panel-grid">
                            <div className="chart-container-card">
                                <h3><Globe style={{ width: 16, height: 16, marginRight: 6, display: 'inline' }} /> Creative Type cost ratios</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={creativePerformanceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="Cost Per Lead" fill="#eab308" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Cost Per Sale" fill="#ec4899" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-container-card">
                                <h3><Icon path={ICONS.topAgent} /> Agent Resource Comparison</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={agentPerformanceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="Spend" fill="#f97316" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-container-card" style={{ gridColumn: '1 / -1' }}>
                                <h3><Icon path={ICONS.calendar} /> Monthly Performance Summary</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={monthlyPerformanceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="Spend" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Sub-tab Pages Management */}
            {subTab === 'Pages' && (
                <div className="card">
                    <div className="d-flex-between">
                        <div>
                            <h2>Facebook Pages Registry</h2>
                            <p className="page-desc">Add and monitor business pages connected with marketing allocations</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <label className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showArchivedPages} onChange={e => setShowArchivedPages(e.target.checked)} />
                                Show Archived Pages
                            </label>
                            <button className="btn btn-primary no-print" onClick={() => openPageForm(null)}>+ Add Facebook Page</button>
                        </div>
                    </div>

                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Page Name</th>
                                    <th>Category</th>
                                    <th>Assigned Agent</th>
                                    <th>Active Campaign Count</th>
                                    <th>Status</th>
                                    <th className="no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visiblePages.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No Facebook Pages configured. Click "+ Add Facebook Page" to start.</td></tr>
                                ) : (
                                    visiblePages.map(page => {
                                        const camps = campaigns.filter(c => c.pageId === page.id && c.status === 'Active').length;
                                        return (
                                            <tr key={page.id} style={page.isArchived ? { opacity: 0.6, background: '#f9fafb' } : {}}>
                                                <td>
                                                    <strong>{page.name}</strong>
                                                    {page.isArchived && <span style={{ marginLeft: 8, fontSize: '0.7rem', verticalAlign: 'middle', background: '#e5e7eb', color: '#1f2937', padding: '2px 6px', borderRadius: '4px' }}>Archived</span>}
                                                </td>
                                                <td>{page.category}</td>
                                                <td>{page.agent}</td>
                                                <td>{camps} Active</td>
                                                <td>
                                                    <span className={`badge-pill ${page.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                                                        {page.status}
                                                    </span>
                                                </td>
                                                <td className="no-print">
                                                    <div className="action-row">
                                                        <button className="btn-icon" onClick={() => openPageForm(page)} title="Edit Page"><Icon path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></button>
                                                        {page.isArchived ? (
                                                            <button className="btn-icon" onClick={() => handleArchivePage(page.id, false)} title="Unarchive Page"><Icon path="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z" /></button>
                                                        ) : (
                                                            <button className="btn-icon btn-icon-danger" onClick={() => handleArchivePage(page.id, true)} title="Archive Page"><Icon path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sub-tab Campaign Management */}
            {subTab === 'Campaigns' && (
                <div className="card">
                    <div className="d-flex-between">
                        <div>
                            <h2>Ad Campaign Directory</h2>
                            <p className="page-desc font-normal">Manage marketing campaign budgets, assignments, and check running progress</p>
                        </div>
                        <button className="btn btn-primary no-print" onClick={() => openCampForm(null)}>+ Launch New Campaign</button>
                    </div>

                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Campaign Details</th>
                                    <th>Facebook Page</th>
                                    <th>Started</th>
                                    <th>Budget Parameters</th>
                                    <th>Creatives</th>
                                    <th>Status</th>
                                    <th>Assignments</th>
                                    <th className="no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleCampaigns.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No active campaigns configured. Click "+ Launch New Campaign" to start.</td></tr>
                                ) : (
                                    visibleCampaigns.map(camp => {
                                        const page = pages.find(p => p.id === camp.pageId);
                                        const spend = performanceLogs.filter(l => l.campaignId === camp.id).reduce((sum, l) => sum + l.amountSpent, 0);
                                        const rev = performanceLogs.filter(l => l.campaignId === camp.id).reduce((sum, l) => sum + l.revenueGenerated, 0);
                                        const roas = spend > 0 ? (rev / spend).toFixed(1) + 'x' : '0.0x';

                                        return (
                                            <tr key={camp.id}>
                                                <td>
                                                    <strong>{camp.name}</strong>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                        Spend: {formatCurrency(spend)} | ROAS: <strong style={{ color: 'var(--accent-green)' }}>{roas}</strong>
                                                    </div>
                                                </td>
                                                <td>{page ? page.name : 'Unknown Page'}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{formatDate(camp.dateStarted)}</td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>Daily: <strong>{formatCurrency(camp.dailyBudget)}</strong></div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Totalcap: {formatCurrency(camp.totalBudget)}</div>
                                                </td>
                                                <td>
                                                    <strong>{camp.numCreatives}</strong>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{camp.creativeType}</div>
                                                </td>
                                                <td>
                                                    <span className={`badge-pill ${
                                                        camp.status === 'Active' ? 'badge-active' :
                                                        camp.status === 'Paused' ? 'badge-paused' : 'badge-completed'
                                                    }`}>
                                                        {camp.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>Agent: <strong>{camp.agent}</strong></div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>By: {camp.processedBy}</div>
                                                </td>
                                                <td className="no-print">
                                                    <div className="action-row">
                                                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => openLogForm(null, camp.id)}>+ Log Result</button>
                                                        <button className="btn-icon" onClick={() => openCampForm(camp)} title="Edit Campaign"><Icon path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sub-tab Performance Logs */}
            {subTab === 'Logs' && (
                <div className="card">
                    <div className="d-flex-between">
                        <div>
                            <h2>Campaign Performance Logs</h2>
                            <p className="page-desc">Review and audit daily or weekly manual advertising conversion entries</p>
                        </div>
                        <button className="btn btn-primary no-print" onClick={() => openLogForm(null)}>+ Log Results Entry</button>
                    </div>

                    <div className="table-responsive-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Campaign</th>
                                    <th>Budget Spent</th>
                                    <th>Scope (Reach & Imps)</th>
                                    <th>Visits (Clicks / Messages)</th>
                                    <th>Leads Formed</th>
                                    <th>Conversions (App / Rej)</th>
                                    <th>Gross Revenue</th>
                                    <th className="no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length === 0 ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No results logged for the active filters. Click "+ Log Results Entry" to record results.</td></tr>
                                ) : (
                                    filteredLogs.map(log => {
                                        const camp = campaigns.find(c => c.id === log.campaignId);
                                        return (
                                            <tr key={log.id}>
                                                <td style={{ whiteSpace: 'nowrap' }}><strong>{formatDate(log.date)}</strong></td>
                                                <td>{camp ? camp.name : 'Unknown Campaign'}</td>
                                                <td style={{ color: 'var(--accent-red)' }}><strong>{formatCurrency(log.amountSpent)}</strong></td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>Reach: {formatNumber(log.reach)}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Imps: {formatNumber(log.impressions)}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>Clicks: {formatNumber(log.clicks)}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Msgs: {formatNumber(log.messages)}</div>
                                                </td>
                                                <td style={{ color: '#8b5cf6' }}><strong>{formatNumber(log.leads)}</strong></td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-green)' }}>App: {log.approvedSales}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)' }}>Rej: {log.rejectedSales}</div>
                                                </td>
                                                <td style={{ color: 'var(--accent-green)' }}><strong>{formatCurrency(log.revenueGenerated)}</strong></td>
                                                <td className="no-print">
                                                    <div className="action-row">
                                                        <button className="btn-icon" onClick={() => openLogForm(log)} title="Edit Log"><Icon path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></button>
                                                        <button className="btn-icon btn-icon-danger" onClick={() => handleDeleteLog(log.id)} title="Delete Log"><Icon path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* --- Modals Rendering --- */}

            {/* Facebook Page Modal */}
            {pageModalOpen && (
                <div className="modal-backdrop" onClick={() => setPageModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{editingPage ? 'Edit Facebook Page' : 'Add Facebook Page'}</h2>
                        <form onSubmit={handleSavePage}>
                            <div className="form-group">
                                <label>Page Name *</label>
                                <input type="text" className="form-control" placeholder="e.g. DITO HOME WIFI - USER" value={pageFormName} onChange={e => setPageFormName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Category *</label>
                                <input type="text" className="form-control" placeholder="e.g. Telecommunications, Home Wifi" value={pageFormCategory} onChange={e => setPageFormCategory(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Assigned Agent *</label>
                                <select className="form-control" value={pageFormAgent} onChange={e => setPageFormAgent(e.target.value)} required>
                                    {agents.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Page Status *</label>
                                <select className="form-control" value={pageFormStatus} onChange={e => setPageFormStatus(e.target.value)} required>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setPageModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Campaign Modal */}
            {campModalOpen && (
                <div className="modal-backdrop" onClick={() => setCampModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{editingCamp ? 'Edit Ad Campaign' : 'Launch New Campaign'}</h2>
                        <form onSubmit={handleSaveCamp}>
                            <div className="form-group">
                                <label>Facebook Page Location *</label>
                                <select className="form-control" value={campFormPageId} onChange={e => setCampFormPageId(e.target.value)} required>
                                    {activePagesList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Campaign Name *</label>
                                <input type="text" className="form-control" placeholder="e.g. March Promos, Home Wireless Launch" value={campFormName} onChange={e => setCampFormName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Date Started</label>
                                <input type="date" className="form-control" value={campFormDateStarted} onChange={e => setCampFormDateStarted(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Daily Budget (₱) *</label>
                                    <input type="number" step="any" className="form-control" value={campFormDailyBudget} onChange={e => setCampFormDailyBudget(e.target.value)} required />
                                </div>
                                <div>
                                    <label>Total Cap Budget (₱) *</label>
                                    <input type="number" step="any" className="form-control" value={campFormTotalBudget} onChange={e => setCampFormTotalBudget(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Number of Creatives *</label>
                                    <input type="number" className="form-control" value={campFormNumCreatives} onChange={e => setCampFormNumCreatives(e.target.value)} required />
                                </div>
                                <div>
                                    <label>Creative Showcase Type</label>
                                    <select className="form-control" value={campFormCreativeType} onChange={e => setCampFormCreativeType(e.target.value as any)}>
                                        <option value="Image">Image</option>
                                        <option value="Video">Video</option>
                                        <option value="Carousel">Carousel</option>
                                        <option value="Reel">Reel</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Assigned Campaign Agent *</label>
                                <select className="form-control" value={campFormAgent} onChange={e => setCampFormAgent(e.target.value)} required>
                                    {agents.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Campaign Status</label>
                                <select className="form-control" value={campFormStatus} onChange={e => setCampFormStatus(e.target.value)}>
                                    <option value="Active">Active</option>
                                    <option value="Paused">Paused</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Processed By Worker</label>
                                <input type="text" className="form-control" placeholder="Workers name" value={campFormProcessedBy} onChange={e => setCampFormProcessedBy(e.target.value)} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setCampModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Performance results log Modal */}
            {logModalOpen && (
                <div className="modal-backdrop" onClick={() => setLogModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{editingLog ? 'Edit Performance Log Entry' : 'Add Cumulative/Periodic Log Results'}</h2>
                        <form onSubmit={handleSaveLog}>
                            <div className="form-group">
                                <label>Target Campaign *</label>
                                <select className="form-control" value={logFormCampId} onChange={e => setLogFormCampId(e.target.value)} required>
                                    {visibleCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Result Logging Date *</label>
                                <input type="date" className="form-control" value={logFormDate} onChange={e => setLogFormDate(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Amount Spent (₱) *</label>
                                    <input type="number" step="any" className="form-control" placeholder="Ad spend budget" value={logFormAmountSpent} onChange={e => setLogFormAmountSpent(e.target.value)} required />
                                </div>
                                <div>
                                    <label>Reach *</label>
                                    <input type="number" className="form-control" placeholder="Users reached" value={logFormReach} onChange={e => setLogFormReach(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Impressions *</label>
                                    <input type="number" className="form-control" placeholder="Views" value={logFormImpressions} onChange={e => setLogFormImpressions(e.target.value)} required />
                                </div>
                                <div>
                                    <label>Clicks *</label>
                                    <input type="number" className="form-control" placeholder="Ad Clicks" value={logFormClicks} onChange={e => setLogFormClicks(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Conversation Messages *</label>
                                    <input type="number" className="form-control" placeholder="Threads" value={logFormMessages} onChange={e => setLogFormMessages(e.target.value)} required />
                                </div>
                                <div>
                                    <label>Leads Formed *</label>
                                    <input type="number" className="form-control" placeholder="Qualified lines" value={logFormLeads} onChange={e => setLogFormLeads(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Approved Sales *</label>
                                    <input type="number" className="form-control" placeholder="Installed" value={logFormApprovedSales} onChange={e => setLogFormApprovedSales(e.target.value)} required />
                                </div>
                                <div>
                                    <label>Rejected Sales *</label>
                                    <input type="number" className="form-control" placeholder="Cancelled" value={logFormRejectedSales} onChange={e => setLogFormRejectedSales(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Revenue Generated (₱) *</label>
                                <input type="number" step="any" className="form-control" placeholder="Sales value multiple" value={logFormRevenueGenerated} onChange={e => setLogFormRevenueGenerated(e.target.value)} required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setLogModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </motion.div>
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

    const [metaPages, setMetaPages] = useState(() => {
        try {
            const saved = localStorage.getItem('hotech_meta_pages');
            if (saved) return JSON.parse(saved);
        } catch {}
        return [];
    });
    const [metaCampaigns, setMetaCampaigns] = useState(() => {
        try {
            const saved = localStorage.getItem('hotech_meta_campaigns');
            if (saved) return JSON.parse(saved);
        } catch {}
        return [];
    });
    const [metaLogs, setMetaLogs] = useState(() => {
        try {
            const saved = localStorage.getItem('hotech_meta_logs');
            if (saved) return JSON.parse(saved);
        } catch {}
        return [];
    });

    useEffect(() => {
        if (!currentUser) { setIsLoading(false); return; }
        const fetchData = async () => {
            setIsLoading(true); setError(null);
            try {
                // Mock data loading if offline or just for structure, usually fetch from GOOGLE_SCRIPT_URL
                // For this environment, we'll initialize with empty or mock if needed, but let'll try fetch
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

                // Safely search for "Meta Ads" worksheet entries from lower-cased and plain keys
                const metaAdsRows = data["meta ads"] || data["metaads"] || data["Meta Ads"] || data["metaAds"] || null;
                if (metaAdsRows && Array.isArray(metaAdsRows)) {
                    const loadedPages = metaAdsRows.filter(r => r.type === 'page').map(item => ({
                        id: item.id || `page-${Date.now()}`,
                        name: item.name || '',
                        category: item.category || '',
                        agent: item.agent || '',
                        status: item.status || 'Active',
                        isArchived: item.isArchived === true || item.isArchived === 'true'
                    }));
                    const loadedCampaigns = metaAdsRows.filter(r => r.type === 'campaign').map(item => ({
                        id: item.id || `camp-${Date.now()}`,
                        pageId: item.pageId || '',
                        name: item.name || '',
                        dateStarted: normalizeDateToYYYYMMDD(item.dateStarted),
                        dailyBudget: parseFloat(item.dailyBudget) || 0,
                        totalBudget: parseFloat(item.totalBudget) || 0,
                        numCreatives: parseInt(item.numCreatives) || 0,
                        creativeType: item.creativeType || 'Image',
                        status: item.status || 'Active',
                        agent: item.agent || '',
                        processedBy: item.processedBy || ''
                    }));
                    const loadedLogs = metaAdsRows.filter(r => r.type === 'log').map(item => ({
                        id: item.id || `log-${Date.now()}`,
                        campaignId: item.campaignId || '',
                        date: normalizeDateToYYYYMMDD(item.date),
                        amountSpent: parseFloat(item.amountSpent) || 0,
                        reach: parseInt(item.reach) || 0,
                        impressions: parseInt(item.impressions) || 0,
                        clicks: parseInt(item.clicks) || 0,
                        messages: parseInt(item.messages) || 0,
                        leads: parseInt(item.leads) || 0,
                        approvedSales: parseInt(item.approvedSales) || 0,
                        rejectedSales: parseInt(item.rejectedSales) || 0,
                        revenueGenerated: parseFloat(item.revenueGenerated) || 0
                    }));

                    setMetaPages(loadedPages);
                    setMetaCampaigns(loadedCampaigns);
                    setMetaLogs(loadedLogs);
                }
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

    const handleSaveMetaAdsData = (newPages, newCampaigns, newLogs) => {
        setMetaPages(newPages);
        setMetaCampaigns(newCampaigns);
        setMetaLogs(newLogs);

        localStorage.setItem('hotech_meta_pages', JSON.stringify(newPages));
        localStorage.setItem('hotech_meta_campaigns', JSON.stringify(newCampaigns));
        localStorage.setItem('hotech_meta_logs', JSON.stringify(newLogs));

        // Flatten structured records to write into a single Google Sheet worksheet called "Meta Ads"
        const rows = [
            ...newPages.map(p => ({ type: 'page', id: p.id, name: p.name, category: p.category, agent: p.agent, status: p.status, isArchived: p.isArchived })),
            ...newCampaigns.map(c => ({ type: 'campaign', id: c.id, pageId: c.pageId, name: c.name, dateStarted: c.dateStarted, dailyBudget: c.dailyBudget, totalBudget: c.totalBudget, numCreatives: c.numCreatives, creativeType: c.creativeType, status: c.status, agent: c.agent, processedBy: c.processedBy })),
            ...newLogs.map(l => ({ type: 'log', id: l.id, campaignId: l.campaignId, date: l.date, amountSpent: l.amountSpent, reach: l.reach, impressions: l.impressions, clicks: l.clicks, messages: l.messages, leads: l.leads, approvedSales: l.approvedSales, rejectedSales: l.rejectedSales, revenueGenerated: l.revenueGenerated }))
        ];

        saveDataToSheet(rows, 'Meta Ads');
    };

    const handleLogin = (user) => { localStorage.setItem('currentUser', JSON.stringify(user)); setCurrentUser(user); setActiveMenu('Overview'); };
    const handleLogout = () => { localStorage.removeItem('currentUser'); setCurrentUser(null); };

    const renderContent = () => {
        switch (activeMenu) {
            case 'Overview': return <Overview subscribers={subscribers} expenses={expenses} agents={agents} currentUser={currentUser} />;
            case 'Subscribers': return <Subscribers subscribers={subscribers} onSave={handleSaveSubscriber} onDelete={handleDeleteSubscriber} agents={agents} currentUser={currentUser} />;
            case 'Calendar':
                const visibleAgents = currentUser.role === 'admin' 
                    ? agents 
                    : (currentUser.name === 'Jackie - Boosting' 
                        ? ['Jackie - Boosting', 'Jackie - Personal'] 
                        : (currentUser.name === 'Lyn - Boosting' 
                            ? ['Lyn - Boosting', 'Lyn Personal'] 
                            : [currentUser.name]));
                return <CalendarView subscribers={subscribers} agents={visibleAgents} />;
            case 'My Performance': return <MyPerformance subscribers={subscribers} currentUser={currentUser} />;
            case 'Agent Performance': return <AgentPerformance subscribers={subscribers} agents={agents} />;
            case 'Payout Reports': return <PayoutReports subscribers={subscribers} agents={agents} currentUser={currentUser} onSaveSubscriber={handleSaveSubscriber} />;
            case 'Accounting & Financial': return <AccountingFinancial subscribers={subscribers} expenses={expenses} onSaveExpense={handleSaveExpense} onDeleteExpense={handleDeleteExpense} />;
            case 'Meta Ads Monitoring': return (
                <MetaAds 
                    agents={agents} 
                    currentUser={currentUser} 
                    initialPages={metaPages}
                    initialCampaigns={metaCampaigns}
                    initialLogs={metaLogs}
                    onSaveMetaAdsData={handleSaveMetaAdsData}
                />
            );
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