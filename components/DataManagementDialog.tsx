'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DataManagementDialogProps {
  children: React.ReactNode;
}

export function DataManagementDialog({ children }: DataManagementDialogProps) {
  const { exportData, importData } = useAppStore();
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = exportData();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `uniplan-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setImportMessage({ type: 'success', message: 'Data exported successfully!' });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importData(content);
      setImportMessage({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      if (result.success) {
        setTimeout(() => setIsOpen(false), 2000);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Management
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <Label className="text-sm font-medium">Export Data</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Download your academic data as a JSON file for backup or migration.
            </p>
            <Button onClick={handleExport} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export to JSON
            </Button>
          </div>

          <Separator />

          {/* Import Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <Label className="text-sm font-medium">Import Data</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a previously exported JSON file to restore your data. This will replace your current data.
            </p>
            <Button onClick={handleImportClick} className="w-full" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import from JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Status Message */}
          {importMessage && (
            <Alert className={importMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {importMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={importMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {importMessage.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Importing data will replace all your current semesters, courses, and notes. 
              Make sure to export your current data first if you want to keep it.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}