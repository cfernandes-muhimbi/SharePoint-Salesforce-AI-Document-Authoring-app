export interface ISelectedRecord {
    opportunityId: string;
    opportunityName: string;
    accountName: string | null;
    contactIds: string[];
}

class SelectionStore {
    private _record: ISelectedRecord | null = null;
    public static readonly instance = new SelectionStore();
    private constructor() {}

    public select(record: ISelectedRecord): void {
        this._record = record;
    }

    public get(): ISelectedRecord | null {
        return this._record;
    }

    public clear(): void {
        this._record = null;
    }
}

export default SelectionStore;
