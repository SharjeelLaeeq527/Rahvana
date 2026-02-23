import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Eye,
  Scan
} from 'lucide-react';
import Image from 'next/image';
import { DocumentType, DocumentValidationResult, validateByDocumentType } from '../utils/documentValidation';

interface DocumentValidatorProps {
  documentType: DocumentType;
  onValidationComplete: (result: DocumentValidationResult) => void;
  title?: string;
  description?: string;
}

const DocumentValidator = ({
  documentType,
  onValidationComplete,
  title = "Document Validator",
  description = "Upload your document for validation"
}: DocumentValidatorProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<DocumentValidationResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      
      // Reset previous results
      setValidationResult(null);
    }
  };

  const validateDocument = async (): Promise<DocumentValidationResult> => {
    if (!file) {
      return {
        isValid: false,
        issues: [{
          severity: 'critical',
          message: 'No document uploaded',
          suggestion: 'Please upload a document to validate'
        }],
        score: 0
      };
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Check if file is valid before processing
      if (file.size === 0) {
        throw new Error('File is empty');
      }

      // Validate file type before processing
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        throw new Error(`Unsupported file type: ${file.type}. Please upload an image (JPG, PNG) or PDF.`);
      }

      // Use the new OCR processor that handles both images and PDFs
      const { processDocumentOCR } = await import('../utils/ocrProcessor');
      
      const text = await processDocumentOCR(file, (progressInfo) => {
        setProgress(progressInfo.current);
      });

      // Validate based on document type using the utility function
      const result = validateByDocumentType(text, documentType);
      setValidationResult(result);
      onValidationComplete(result);
      return result;
    } catch (error: unknown) {
      console.error('OCR processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's a file format issue
      let suggestion = 'Try uploading a clearer image or PDF file';
      if (errorMessage.includes('image') || errorMessage.includes('read') || errorMessage.includes('decode')) {
        suggestion = 'File format not supported or corrupted. Try JPG, PNG, or PDF format.';
      } else if (errorMessage.includes('empty')) {
        suggestion = 'File is empty. Please select a valid document.';
      } else if (errorMessage.includes('PDF')) {
        suggestion = 'PDF processing failed. Ensure the PDF is not password-protected or corrupted.';
      } else if (file && file.type && !file.type.startsWith('image/') && file.type !== 'application/pdf') {
        suggestion = 'Unsupported file type. Please upload an image (JPG, PNG) or PDF file.';
      }
      
      const errorResult: DocumentValidationResult = {
        isValid: false,
        issues: [{
          severity: 'critical',
          message: `Failed to process document: ${errorMessage}`,
          suggestion
        }],
        score: 0
      };
      setValidationResult(errorResult);
      onValidationComplete(errorResult);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };


  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Eye className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-primary">{title}</CardTitle>
          {file && (
            <Badge variant="outline" className="capitalize">
              {documentType.replace('_', ' ')}
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* File upload section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Upload document</h3>
            <p className="mt-1 text-sm text-gray-500">
              PNG, JPG, PDF up to 10MB
            </p>
            <div className="mt-4">
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                id="document-upload"
              />
              <Label 
                htmlFor="document-upload" 
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Label>
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-600 truncate">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* Preview section */}
          {previewUrl && file && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Document Preview</h4>
              {file.type.startsWith('image/') ? (
                <Image
                  src={previewUrl!}
                  alt="Document preview"
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: '100%', height: 'auto' }}
                  className="max-w-full rounded border"
                />
              ) : (
                <div className="flex items-center justify-center p-8 bg-gray-50 rounded border">
                  <FileText className="h-12 w-12 text-gray-400" />
                  <span className="ml-2 text-gray-600">PDF Preview not available</span>
                </div>
              )}
            </div>
          )}

          {/* Process button */}
          <div className="flex justify-center">
            <Button 
              onClick={validateDocument} 
              disabled={!file || isProcessing}
              className="bg-primary hover:bg-primary/70"
            >
              <Scan className="h-4 w-4 mr-2" />
              {isProcessing ? 'Validating...' : 'Validate Document'}
            </Button>
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing document...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Validation results */}
          {validationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Validation Result</h4>
                  <p className={`text-sm ${validationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {validationResult.isValid ? 'Document appears valid' : 'Issues detected'}
                  </p>
                </div>
                <Badge variant={validationResult.isValid ? 'default' : 'destructive'}>
                  {validationResult.score}% Quality
                </Badge>
              </div>

              {validationResult.issues.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Detected Issues</h4>
                  {validationResult.issues.map((issue, idx) => (
                    <Alert
                      key={idx}
                      className={`${
                        issue.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        issue.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-primary/10 border-primary/30'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {getSeverityIcon(issue.severity)}
                        <div>
                          <AlertDescription>
                            <span className="font-medium">{issue.message}</span>
                            <p className="text-sm mt-1">{issue.suggestion}</p>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              ) : (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    No issues detected. Document appears ready for submission.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Document-specific guidance */}
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-C/30">
            <h4 className="font-medium text-primary flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Document-Specific Guidance
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-primary">
              {documentType === 'passport' && (
                <>
                  <li>• Ensure passport is valid for at least 6 months beyond your intended stay</li>
                  <li>• Check that all personal information is clearly visible</li>
                  <li>• Verify that the photo is clear and recognizable</li>
                </>
              )}
              {documentType === 'nikah_nama' && (
                <>
                  <li>• Verify names match other documents exactly</li>
                  <li>• Check that the Nikah Khwan&apos;s signature and seal are present</li>
                  <li>• Ensure witnesses&apos; names and signatures are visible</li>
                  <li>• For Urdu documents, manual verification is recommended</li>
                </>
              )}
              {documentType === 'birth_certificate' && (
                <>
                  <li>• Ensure it&apos;s a certified copy from the vital records office</li>
                  <li>• Verify all names and dates match other documents</li>
                  <li>• Check that official seal and signature are present</li>
                </>
              )}
              {documentType === 'marriage_certificate' && (
                <>
                  <li>• Ensure it&apos;s a certified copy from the vital records office</li>
                  <li>• Verify both spouses&apos; names are correct</li>
                  <li>• Check that officiant and witness signatures are present</li>
                </>
              )}
              {documentType === 'police_certificate' && (
                <>
                  <li>• Ensure it covers all required periods of residence</li>
                  <li>• Verify it&apos;s not older than 1 year from submission date</li>
                  <li>• Check that it&apos;s from the appropriate authority</li>
                </>
              )}
              {documentType === 'medical_examination' && (
                <>
                  <li>• Ensure it&apos;s Form I-693 completed by a panel physician</li>
                  <li>• Verify all required vaccinations are documented</li>
                  <li>• Check that the medical officer&apos;s determination is clear</li>
                </>
              )}
              {documentType === 'translation' && (
                <>
                  <li>• Ensure it&apos;s a certified translation by a qualified translator</li>
                  <li>• Verify the translator&apos;s signature and credentials are present</li>
                  <li>• Check that the original document is also submitted</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentValidator;