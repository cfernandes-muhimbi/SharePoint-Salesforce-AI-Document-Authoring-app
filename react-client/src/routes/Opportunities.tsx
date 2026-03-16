import React from 'react';
import { useLoaderData, useLocation, useNavigate } from 'react-router-dom';
import { ILoaderParams } from '../common/ILoaderParams';
import { ISalesforceOpportunity, SalesforceApiProvider } from '../providers/SalesforceApiProvider';
import './Opportunities.css';

export async function loader({ params }: ILoaderParams): Promise<ISalesforceOpportunity[]> {
    return SalesforceApiProvider.instance.listOpportunities();
}

const stageColors: Record<string, string> = {
    'Closed Won':   'stage-won',
    'Closed Lost':  'stage-lost',
};
const getStageClass = (stage: string): string => {
    if (stageColors[stage]) return stageColors[stage];
    if (stage.includes('Negotiation') || stage.includes('Proposal')) return 'stage-warning';
    return 'stage-info';
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export const Opportunities: React.FC = () => {
    const opportunities = useLoaderData() as ISalesforceOpportunity[];
    const navigate = useNavigate();
    const location = useLocation();
    const quickMode = (location.state as any)?.quickMode ?? false;

    return (
        <div className="opp-page">

            {/* ── Page header banner ── */}
            <div className="opp-banner">
                <div className="opp-banner-inner">
                    <h1 className="opp-banner-title">Quick AI Templates</h1>
                    <p className="opp-banner-sub">Select a template and generate your document instantly</p>
                </div>
                <button type="button" className="opp-back-btn" onClick={() => navigate(-1)}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
            </div>

            {/* ── Main content ── */}
            <div className="opp-body">
                <div className="opp-card">

                    {/* Table header row */}
                    <div className="opp-table-toolbar">
                        <h2 className="opp-table-title">Opportunities</h2>
                        <span className="opp-table-count">{opportunities.length} records</span>
                    </div>

                    {/* Table */}
                    <div className="opp-table-wrap">
                        <table className="opp-table">
                            <thead>
                                <tr>
                                    <th>Opportunity Name</th>
                                    <th>Account Name</th>
                                    <th>Amount</th>
                                    <th>Close Date</th>
                                    <th>Stage</th>
                                    <th>Owner</th>
                                </tr>
                            </thead>
                            <tbody>
                                {opportunities.map((item) => (
                                    <tr
                                        key={item.Id}
                                        className="opp-row"
                                        onClick={() => navigate(`/opportunities/${item.Id}`, { state: { quickMode } })}
                                    >
                                        <td>
                                            <span className="opp-name-link">{item.Name}</span>
                                        </td>
                                        <td>{item.Account?.Name ?? '—'}</td>
                                        <td className="opp-amount">
                                            {item.Amount != null ? formatCurrency(item.Amount) : '—'}
                                        </td>
                                        <td>{formatDate(item.CloseDate)}</td>
                                        <td>
                                            <span className={`opp-stage ${getStageClass(item.StageName)}`}>
                                                {item.StageName}
                                            </span>
                                        </td>
                                        <td>{item.Owner?.Name ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
};
