import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { FileUp, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MobileLayout from '@/components/layout/MobileLayout';
import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';

interface UploadResult {
  message: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  successfulAssignments: number;
  unfoundOfficerIds: string[];
  createdDuties: Array<{
    dutyId: string;
    officerId: string;
    officerName: string;
    bandobastName: string;
    sector: string;
    zone: string;
    post: string;
    dutyDate: string;
    shift: string;
  }>;
  summary: {
    totalProcessed: number;
    successful: number;
    failed: number;
    successRate: string;
  };
}

const RosterUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuthStore();

  // Mutation for uploading roster
  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      if (!user || user.role !== 'supervisor') {
        throw new Error('Only supervisors can upload duty rosters');
      }

      console.log('Creating FormData for file:', file.name);
      const formData = new FormData();
      formData.append('dutyRoster', file);
      formData.append('supervisorId', user.username); // Add supervisorId

      console.log('Sending request to:', `${API_BASE_URL}/api/duties/upload`);
      console.log('Supervisor ID:', user.username);
      const response = await fetch(`${API_BASE_URL}/api/duties/upload`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      return result;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      toast.success(`Successfully processed ${data.successfulAssignments} duty assignments`);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file. Please try again.');
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type - only accept .xlsx files
      if (!selectedFile.name.endsWith('.xlsx')) {
        toast.error('Please select an Excel file (.xlsx)');
        return;
      }
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.xlsx')) {
        toast.error('Please select an Excel file (.xlsx)');
        return;
      }
      setFile(droppedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    console.log('Starting upload for file:', file.name, file.size);
    setUploadResult(null);
    uploadMutation.mutate(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const content = (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileUp className="h-8 w-8" />
          Upload Duty Roster
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload an Excel file to create duty assignments for officers
        </p>
      </div>

      <div className="grid gap-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Excel File</CardTitle>
            <CardDescription>
              Select an Excel file (.xlsx) containing duty roster information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* File Input Field */}
              <div className="space-y-2">
                <Label htmlFor="rosterFile">Duty Roster File</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <FileUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      {file ? file.name : 'Drag and drop your Excel file here'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse files
                    </p>
                  </div>
                  <Input
                    id="rosterFile"
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="mt-4"
                  />
                </div>
              </div>

                {/* File Info */}
                {file && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || uploadMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Roster
                    </>
                  )}
                </Button>

                {/* Progress Bar */}
                {uploadMutation.isPending && (
                  <div className="space-y-2">
                    <Progress value={50} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">
                      Processing Excel file and creating duty assignments...
                    </p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Results */}
        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Upload Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {uploadResult.successfulAssignments}
                  </p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {uploadResult.unfoundOfficerIds.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {uploadResult.totalRows}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {uploadResult.summary.successRate}
                  </p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>

              {/* Unfound Officers Alert */}
              {uploadResult.unfoundOfficerIds.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Officers not found:</strong>{' '}
                    {uploadResult.unfoundOfficerIds.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Created Duties List */}
              {uploadResult.createdDuties.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Created Duty Assignments</h3>
                  <div className="space-y-2">
                    {uploadResult.createdDuties.map((duty, index) => (
                      <div
                        key={duty.dutyId}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="font-medium">{duty.officerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {duty.bandobastName} • {duty.sector}, {duty.zone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{duty.dutyDate}</p>
                          <p>{duty.shift}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Info */}
              <div className="text-sm text-muted-foreground">
                <p>File: {uploadResult.fileName}</p>
                <p>Size: {formatFileSize(uploadResult.fileSize)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Excel File Format</CardTitle>
            <CardDescription>
              Your Excel file should contain the following columns:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Required Columns:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Officer ID</li>
                  <li>• Duty Name (or Bandobast)</li>
                  <li>• Sector</li>
                  <li>• Zone</li>
                  <li>• Post</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Optional Columns:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Duty Date</li>
                  <li>• Shift</li>
                  <li>• Latitude</li>
                  <li>• Longitude</li>
                  <li>• Description</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render mobile or desktop layout based on screen size
  if (isMobile) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return <DashboardLayout>{content}</DashboardLayout>;
};

export default RosterUploadPage;
