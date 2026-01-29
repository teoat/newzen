import { 
    Database, FileText, Calculator, Search, 
    Landmark, CreditCard, Layers, MapPin, Activity 
} from 'lucide-react';
import { SchemaField } from './types';

export const CORE_SCHEMA: SchemaField[] = [
    { field: 'date', label: 'Transaction Date', required: true, icon: Database },
    { field: 'description', label: 'Description', required: true, icon: FileText },
    { field: 'amount', label: 'Amount', required: true, icon: Calculator },
    { field: 'reference', label: 'Reference ID', required: false, icon: Search },
    { field: 'balance', label: 'Balance', required: false, icon: Landmark },
    { field: 'credit', label: 'Credit/Inflow', required: false, icon: CreditCard },
    { field: 'debit', label: 'Debit/Outflow', required: false, icon: CreditCard },
    { field: 'receiver', label: 'Receiver/Beneficiary', required: false, icon: Search },
    { field: 'sender', label: 'Sender/Originator', required: false, icon: Search },
    { field: 'account_number', label: 'Account Number', required: false, icon: CreditCard },
    { field: 'category', label: 'Category', required: false, icon: Layers },
    { field: 'sub_group', label: 'Sequence / Sub-Group', required: false, icon: Layers },
    { field: 'city', label: 'City', required: false, icon: MapPin },
    { field: 'timeline', label: 'Timeline / Phase', required: false, icon: Activity },
];
