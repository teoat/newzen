
import React, { useEffect, useState } from 'react';
import { useQuarantine, QuarantineRow } from '../hooks/useVisibleAutonomy';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';

export function DataHospitalView({ projectId }: { projectId?: string }) {
    const { listRows, resolveRow, stats, fetchStats } = useQuarantine();
    const [rows, setRows] = useState<QuarantineRow[]>([]);
    const [selectedRow, setSelectedRow] = useState<QuarantineRow | null>(null);
    const [editContent, setEditContent] = useState("");
    
    useEffect(() => {
        fetchStats(projectId);
        listRows(undefined, projectId).then(setRows);
    }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleOpen = (row: QuarantineRow) => {
        setSelectedRow(row);
        setEditContent(row.raw_content);
    };

    const handleSave = async () => {
        if (!selectedRow) return;
        await resolveRow(selectedRow.id, editContent);
        // Refresh
        listRows(undefined, projectId).then(setRows);
        setSelectedRow(null);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800">Critical Attention</h4>
                    <p className="text-2xl font-bold text-red-600">{stats?.needs_attention || 0}</p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800">Repaired (Auto)</h4>
                    <p className="text-2xl font-bold text-yellow-600">{stats?.repaired || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800">Total Cases</h4>
                    <p className="text-2xl font-bold text-blue-600">{stats?.total || 0}</p>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Error Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>{new Date(row.created_at).toLocaleTimeString()}</TableCell>
                                <TableCell>{row.error_type}</TableCell>
                                <TableCell>
                                    <Badge variant={row.status === 'new' ? 'destructive' : 'outline'}>
                                        {row.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">{row.error_message}</TableCell>
                                <TableCell>
                                    <Button size="sm" variant="outline" onClick={() => handleOpen(row)}>
                                        Treat Patient
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Patient Chart Modal */}
            <Dialog open={!!selectedRow} onOpenChange={() => setSelectedRow(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Data Hospital: Patient Chart</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-slate-100 p-3 rounded text-sm font-mono text-red-600">
                            {selectedRow?.error_message}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Raw Content correction</label>
                            <Textarea 
                                className="font-mono min-h-[200px]"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setSelectedRow(null)}>Cancel</Button>
                            <Button onClick={handleSave}>Apply Fix & Re-Ingest</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
