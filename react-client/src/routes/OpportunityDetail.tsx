import React, { useEffect, useState } from 'react';
import { useLoaderData, useLocation, useNavigate } from 'react-router-dom';
import DocumentGenerator from '../components/wizard/DocumentGenerator';
import QuickDocumentGenerator from '../components/wizard/QuickDocumentGenerator';
import SelectionStore from '../stores/SelectionStore';
import {
    Badge,
    Button,
    DataGrid,
    DataGridBody,
    DataGridCell,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridRow,
    TableCellLayout,
    TableColumnDefinition,
    createTableColumn,
} from '@fluentui/react-components';
import { ArrowLeft24Regular, PersonAvailable24Regular } from '@fluentui/react-icons';
import { ILoaderParams } from '../common/ILoaderParams';
import {
    ISalesforceAccountContact,
    ISalesforceContactRole,
    ISalesforceOpportunityDetail,
    SalesforceApiProvider,
} from '../providers/SalesforceApiProvider';
import './OpportunityDetail.css';

export async function loader({ params }: ILoaderParams): Promise<ISalesforceOpportunityDetail> {
    return SalesforceApiProvider.instance.getOpportunity(params.opportunityId!);
}

const stageColor = (stage: string): 'success' | 'warning' | 'danger' | 'informative' => {
    if (stage === 'Closed Won') return 'success';
    if (stage === 'Closed Lost') return 'danger';
    if (stage.includes('Negotiation') || stage.includes('Proposal')) return 'warning';
    return 'informative';
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

const accountContactColumns: TableColumnDefinition<ISalesforceAccountContact>[] = [
    createTableColumn({
        columnId: 'name',
        renderHeaderCell: () => 'Contact Name',
        renderCell: (item) => <TableCellLayout>{item.Name}</TableCellLayout>,
    }),
    createTableColumn({
        columnId: 'title',
        renderHeaderCell: () => 'Title',
        renderCell: (item) => <TableCellLayout>{item.Title ?? '—'}</TableCellLayout>,
    }),
    createTableColumn({
        columnId: 'email',
        renderHeaderCell: () => 'Email',
        renderCell: (item) => (
            <TableCellLayout>
                {item.Email ? <a href={`mailto:${item.Email}`}>{item.Email}</a> : '—'}
            </TableCellLayout>
        ),
    }),
    createTableColumn({
        columnId: 'phone',
        renderHeaderCell: () => 'Phone',
        renderCell: (item) => <TableCellLayout>{item.Phone ?? '—'}</TableCellLayout>,
    }),
];

const accountContactColumnSizing = {
    name:  { minWidth: 160, defaultWidth: 180 },
    title: { minWidth: 130, defaultWidth: 150 },
    email: { minWidth: 200, defaultWidth: 220 },
    phone: { minWidth: 130, defaultWidth: 150 },
};

const contactColumns: TableColumnDefinition<ISalesforceContactRole>[] = [
    createTableColumn({
        columnId: 'name',
        renderHeaderCell: () => 'Contact Name',
        renderCell: (item) => <TableCellLayout>{item.Contact.Name}</TableCellLayout>,
    }),
    createTableColumn({
        columnId: 'title',
        renderHeaderCell: () => 'Title',
        renderCell: (item) => <TableCellLayout>{item.Contact.Title ?? '—'}</TableCellLayout>,
    }),
    createTableColumn({
        columnId: 'email',
        renderHeaderCell: () => 'Email',
        renderCell: (item) => (
            <TableCellLayout>
                {item.Contact.Email
                    ? <a href={`mailto:${item.Contact.Email}`}>{item.Contact.Email}</a>
                    : '—'}
            </TableCellLayout>
        ),
    }),
    createTableColumn({
        columnId: 'phone',
        renderHeaderCell: () => 'Phone',
        renderCell: (item) => <TableCellLayout>{item.Contact.Phone ?? '—'}</TableCellLayout>,
    }),
    createTableColumn({
        columnId: 'role',
        renderHeaderCell: () => 'Role',
        renderCell: (item) => <TableCellLayout>{item.Role ?? '—'}</TableCellLayout>,
    }),
    createTableColumn({
        columnId: 'primary',
        renderHeaderCell: () => 'Primary',
        renderCell: (item) => (
            <TableCellLayout>
                {item.IsPrimary
                    ? <Badge appearance="filled" color="success">Primary</Badge>
                    : <Badge appearance="outline">No</Badge>}
            </TableCellLayout>
        ),
    }),
];

const contactColumnSizing = {
    name:    { minWidth: 160, defaultWidth: 180 },
    title:   { minWidth: 130, defaultWidth: 150 },
    email:   { minWidth: 190, defaultWidth: 210 },
    phone:   { minWidth: 130, defaultWidth: 150 },
    role:    { minWidth: 130, defaultWidth: 150 },
    primary: { minWidth: 90,  defaultWidth: 100 },
};

export const OpportunityDetail: React.FC = () => {
    const opp = useLoaderData() as ISalesforceOpportunityDetail;
    const navigate = useNavigate();
    const location = useLocation();
    const quickMode = (location.state as any)?.quickMode ?? false;
    const contactRoles = opp.OpportunityContactRoles?.records ?? [];
    const accountContacts = opp.accountContacts ?? [];
    const [wizardOpen, setWizardOpen] = useState(false);
    const [quickOpen, setQuickOpen] = useState(false);

    const selectOpportunity = () => {
        SelectionStore.instance.select({
            opportunityId: opp.Id,
            opportunityName: opp.Name,
            accountName: opp.Account?.Name ?? null,
            contactIds: accountContacts.map(c => c.Id),
        });
    };

    // Auto-launch quick pipeline when navigated here from Quick AI Templates
    useEffect(() => {
        if (quickMode) {
            selectOpportunity();
            setQuickOpen(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openWizard = () => {
        selectOpportunity();
        setWizardOpen(true);
    };

    const openQuick = () => {
        selectOpportunity();
        setQuickOpen(true);
    };

    if (quickOpen) {
        return <QuickDocumentGenerator onClose={() => setQuickOpen(false)} />;
    }

    if (wizardOpen) {
        return <DocumentGenerator onClose={() => setWizardOpen(false)} />;
    }

    return (
        <div className="opp-detail">

            <Button
                appearance="subtle"
                icon={<ArrowLeft24Regular />}
                onClick={() => navigate('/opportunities')}
                className="opp-detail-back"
            >
                Back to Opportunities
            </Button>

            {/* ── Header ── */}
            <div className="opp-detail-header">
                <h2 className="opp-detail-name">{opp.Name}</h2>
                <Badge appearance="filled" color={stageColor(opp.StageName)} size="large">
                    {opp.StageName}
                </Badge>
                <Button appearance="secondary" onClick={openQuick} style={{ marginLeft: 'auto' }}>
                    ⚡ Quick Generate
                </Button>
                <Button appearance="primary" onClick={openWizard}>
                    🧙 Generate Document
                </Button>
            </div>

            {/* ── Key fields ── */}
            <div className="opp-detail-fields">
                <div className="opp-detail-card">
                    <span className="opp-field-label">Amount</span>
                    <span className="opp-field-value opp-field-amount">
                        {opp.Amount != null ? formatCurrency(opp.Amount) : '—'}
                    </span>
                </div>
                <div className="opp-detail-card">
                    <span className="opp-field-label">Close Date</span>
                    <span className="opp-field-value">{formatDate(opp.CloseDate)}</span>
                </div>
                <div className="opp-detail-card">
                    <span className="opp-field-label">Account Name</span>
                    <span className="opp-field-value">{opp.Account?.Name ?? '—'}</span>
                </div>
                <div className="opp-detail-card">
                    <span className="opp-field-label">Owner</span>
                    <span className="opp-field-value">{opp.Owner?.Name ?? '—'}</span>
                </div>
                {opp.Probability != null && (
                    <div className="opp-detail-card">
                        <span className="opp-field-label">Probability</span>
                        <span className="opp-field-value">{opp.Probability}%</span>
                    </div>
                )}
                {opp.Type && (
                    <div className="opp-detail-card">
                        <span className="opp-field-label">Type</span>
                        <span className="opp-field-value">{opp.Type}</span>
                    </div>
                )}
                {opp.LeadSource && (
                    <div className="opp-detail-card">
                        <span className="opp-field-label">Lead Source</span>
                        <span className="opp-field-value">{opp.LeadSource}</span>
                    </div>
                )}
                {opp.Description && (
                    <div className="opp-detail-card opp-detail-card--wide">
                        <span className="opp-field-label">Description</span>
                        <span className="opp-field-value">{opp.Description}</span>
                    </div>
                )}
            </div>

            {/* ── Opportunity Contact Roles ── */}
            {contactRoles.length > 0 && (
                <div className="opp-detail-section">
                    <div className="opp-section-header">
                        <PersonAvailable24Regular />
                        <h3>Opportunity Contacts ({contactRoles.length})</h3>
                    </div>
                    <DataGrid
                        items={contactRoles}
                        columns={contactColumns}
                        getRowId={(item) => item.Contact.Id}
                        resizableColumns
                        columnSizingOptions={contactColumnSizing}
                    >
                        <DataGridHeader>
                            <DataGridRow>
                                {({ renderHeaderCell }) => (
                                    <DataGridHeaderCell><b>{renderHeaderCell()}</b></DataGridHeaderCell>
                                )}
                            </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody<ISalesforceContactRole>>
                            {({ item, rowId }) => (
                                <DataGridRow<ISalesforceContactRole> key={rowId}>
                                    {({ renderCell }) => (
                                        <DataGridCell>{renderCell(item)}</DataGridCell>
                                    )}
                                </DataGridRow>
                            )}
                        </DataGridBody>
                    </DataGrid>
                </div>
            )}

            {/* ── Account Contacts ── */}
            <div className="opp-detail-section">
                <div className="opp-section-header">
                    <PersonAvailable24Regular />
                    <h3>
                        Account Contacts — {opp.Account?.Name ?? 'Unknown'} ({accountContacts.length})
                    </h3>
                </div>
                {accountContacts.length === 0 ? (
                    <p className="opp-no-contacts">No contacts found for this account.</p>
                ) : (
                    <DataGrid
                        items={accountContacts}
                        columns={accountContactColumns}
                        getRowId={(item) => item.Id}
                        resizableColumns
                        columnSizingOptions={accountContactColumnSizing}
                    >
                        <DataGridHeader>
                            <DataGridRow>
                                {({ renderHeaderCell }) => (
                                    <DataGridHeaderCell><b>{renderHeaderCell()}</b></DataGridHeaderCell>
                                )}
                            </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody<ISalesforceAccountContact>>
                            {({ item, rowId }) => (
                                <DataGridRow<ISalesforceAccountContact> key={rowId}>
                                    {({ renderCell }) => (
                                        <DataGridCell>{renderCell(item)}</DataGridCell>
                                    )}
                                </DataGridRow>
                            )}
                        </DataGridBody>
                    </DataGrid>
                )}
            </div>
        </div>
    );
};
