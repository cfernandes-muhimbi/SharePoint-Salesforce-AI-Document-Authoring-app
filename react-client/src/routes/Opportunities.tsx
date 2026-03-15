import React from 'react';
import { useLoaderData, useLocation, useNavigate } from 'react-router-dom';
import {
    DataGrid,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridBody,
    DataGridRow,
    DataGridCell,
    TableColumnDefinition,
    TableCellLayout,
    createTableColumn,
    Badge,
} from '@fluentui/react-components';
import { ILoaderParams } from '../common/ILoaderParams';
import { ISalesforceOpportunity, SalesforceApiProvider } from '../providers/SalesforceApiProvider';
import './Opportunities.css';

export async function loader({ params }: ILoaderParams): Promise<ISalesforceOpportunity[]> {
    return SalesforceApiProvider.instance.listOpportunities();
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
    new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

const columnSizingOptions = {
    name:      { minWidth: 220, defaultWidth: 260 },
    account:   { minWidth: 180, defaultWidth: 220 },
    amount:    { minWidth: 110, defaultWidth: 130 },
    closeDate: { minWidth: 110, defaultWidth: 130 },
    stage:     { minWidth: 160, defaultWidth: 190 },
    owner:     { minWidth: 140, defaultWidth: 160 },
};

export const Opportunities: React.FC = () => {
    const opportunities = useLoaderData() as ISalesforceOpportunity[];
    const navigate = useNavigate();
    const location = useLocation();
    const quickMode = (location.state as any)?.quickMode ?? false;

    const columns: TableColumnDefinition<ISalesforceOpportunity>[] = [
        createTableColumn({
            columnId: 'name',
            renderHeaderCell: () => 'Opportunity Name',
            renderCell: (item) => (
                <TableCellLayout>
                    <span className="opp-name-link" onClick={() => navigate(`/opportunities/${item.Id}`, { state: { quickMode } })}>
                        {item.Name}
                    </span>
                </TableCellLayout>
            ),
        }),
        createTableColumn({
            columnId: 'account',
            renderHeaderCell: () => 'Account Name',
            renderCell: (item) => <TableCellLayout>{item.Account?.Name ?? '—'}</TableCellLayout>,
        }),
        createTableColumn({
            columnId: 'amount',
            renderHeaderCell: () => 'Amount',
            renderCell: (item) => (
                <TableCellLayout>{item.Amount != null ? formatCurrency(item.Amount) : '—'}</TableCellLayout>
            ),
        }),
        createTableColumn({
            columnId: 'closeDate',
            renderHeaderCell: () => 'Close Date',
            renderCell: (item) => <TableCellLayout>{formatDate(item.CloseDate)}</TableCellLayout>,
        }),
        createTableColumn({
            columnId: 'stage',
            renderHeaderCell: () => 'Stage',
            renderCell: (item) => (
                <TableCellLayout>
                    <Badge appearance="filled" color={stageColor(item.StageName)}>
                        {item.StageName}
                    </Badge>
                </TableCellLayout>
            ),
        }),
        createTableColumn({
            columnId: 'owner',
            renderHeaderCell: () => 'Opportunity Owner',
            renderCell: (item) => <TableCellLayout>{item.Owner?.Name ?? '—'}</TableCellLayout>,
        }),
    ];

    return (
        <div className="opportunities-container">
            <div className="opportunities-header">
                <h2 className="opportunities-title">Opportunities</h2>
                <span className="opportunities-count">{opportunities.length} records</span>
            </div>
            <DataGrid
                items={opportunities}
                columns={columns}
                getRowId={(item) => item.Id}
                resizableColumns
                sortable
                columnSizingOptions={columnSizingOptions}
            >
                <DataGridHeader>
                    <DataGridRow>
                        {({ renderHeaderCell }) => (
                            <DataGridHeaderCell>
                                <b>{renderHeaderCell()}</b>
                            </DataGridHeaderCell>
                        )}
                    </DataGridRow>
                </DataGridHeader>
                <DataGridBody<ISalesforceOpportunity>>
                    {({ item, rowId }) => (
                        <DataGridRow<ISalesforceOpportunity> key={rowId}>
                            {({ renderCell }) => (
                                <DataGridCell>{renderCell(item)}</DataGridCell>
                            )}
                        </DataGridRow>
                    )}
                </DataGridBody>
            </DataGrid>
        </div>
    );
};
