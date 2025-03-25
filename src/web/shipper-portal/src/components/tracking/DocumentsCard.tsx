# src/web/shipper-portal/src/components/tracking/DocumentsCard.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10

import Card from '../../../shared/components/cards/Card';
import DocumentsTable from '../loads/DocumentsTable';
import Button from '../../../shared/components/buttons/Button';
import Modal from '../../../shared/components/feedback/Modal';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import { Heading, Text } from '../../../shared/components/typography';
import { LoadDocument, LoadDocumentType } from '../../../common/interfaces/load.interface';
import documentService from '../../services/documentService';
import notificationService from '../../../common/services/notificationService';
import { PlusIcon, DownloadIcon, ViewIcon, EditIcon, FilterIcon, ArrowIcon, AchievementIcon, AlertIcon, CalendarIcon, ClockIcon, DashboardIcon, DriverIcon, LocationIcon, LogoutIcon, MenuIcon, MoneyIcon, NotificationIcon, PhoneIcon, SearchIcon, SettingsIcon, StarIcon, TruckIcon } from '../../../shared/assets/icons';

// Define props for the DocumentsCard component
interface DocumentsCardProps {
  loadId: string;
  className?: string;
  readOnly?: boolean;
  refreshInterval?: number;
}

// Styled components for layout and styling
const StyledCard = styled(Card)`
  width: 100%;
  margin-bottom: 20px;
`;

const CardHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #DADCE0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardContent = styled.div`
  padding: 20px;
  min-height: 200px;
  position: relative;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  color: #5F6368;
  font-style: italic;
`;

const UploadForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #202124;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #DADCE0;
  border-radius: 4px;
  font-size: 14px;
`;

const FileInput = styled.input`
  padding: 8px 0;
  font-size: 14px;
`;

const SelectedFileName = styled.div`
  margin-top: 8px;
  font-size: 14px;
  color: #5F6368;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
`;

// DocumentsCard component definition
const DocumentsCard: React.FC<DocumentsCardProps> = ({ loadId, className, readOnly = false, refreshInterval = 60000 }) => {
  // State variables for managing documents and UI
  const [documents, setDocuments] = useState<LoadDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<LoadDocumentType | ''>('');

  // useCallback hook to memoize the fetchDocuments function
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedDocuments = await documentService.getLoadDocuments(loadId);
      setDocuments(fetchedDocuments);
    } catch (error: any) {
      notificationService.showErrorNotification(`Failed to fetch documents: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  // useEffect hook to fetch documents when the component mounts and when loadId changes
  useEffect(() => {
    fetchDocuments();
  }, [loadId, fetchDocuments]);

  // useEffect hook to set up an interval to refresh the documents periodically
  useEffect(() => {
    const intervalId = setInterval(fetchDocuments, refreshInterval);
    return () => clearInterval(intervalId);
  }, [loadId, refreshInterval, fetchDocuments]);

  // Function to handle viewing a document
  const handleViewDocument = (document: LoadDocument) => {
    try {
      documentService.viewDocument(document);
    } catch (error: any) {
      notificationService.showErrorNotification(`Failed to view document: ${error.message}`);
    }
  };

  // Function to handle downloading a document
  const handleDownloadDocument = (document: LoadDocument) => {
    try {
      documentService.downloadDocument(document);
    } catch (error: any) {
      notificationService.showErrorNotification(`Failed to download document: ${error.message}`);
    }
  };

  // Function to handle opening the upload document modal
  const handleUploadDocument = () => {
    setIsUploadModalOpen(true);
  };

  // Function to handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
      notificationService.showErrorNotification('No file selected.');
    }
  };

  // Function to handle document type selection
  const handleDocumentTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDocumentType(event.target.value as LoadDocumentType);
  };

  // Function to handle the document upload form submission
  const handleUploadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      notificationService.showErrorNotification('Please select a file to upload.');
      return;
    }

    if (!selectedDocumentType) {
      notificationService.showErrorNotification('Please select a document type.');
      return;
    }

    setUploading(true);
    try {
      await documentService.uploadLoadDocument(loadId, selectedFile, selectedDocumentType);
      notificationService.showSuccessNotification('Document uploaded successfully!');
      await fetchDocuments();
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setSelectedDocumentType('');
    } catch (error: any) {
      notificationService.showErrorNotification(`Document upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Function to handle manual refresh of the documents list
  const handleRefresh = () => {
    fetchDocuments();
  };

  // Render the component
  return (
    <StyledCard className={className}>
      <CardHeader>
        <Heading variant="h3">Documents</Heading>
        <HeaderActions>
          <Button variant="text" onClick={handleRefresh} startIcon={<DownloadIcon />}>Refresh</Button>
          {!readOnly && (
            <Button variant="primary" onClick={handleUploadDocument} startIcon={<PlusIcon />}>
              Upload Document
            </Button>
          )}
        </HeaderActions>
      </CardHeader>
      <CardContent>
        {loading && <LoadingIndicator />}
        {!loading && documents.length === 0 && (
          <EmptyState>
            <Text>No documents available for this shipment.</Text>
          </EmptyState>
        )}
        {!loading && documents.length > 0 && (
          <DocumentsTable
            loadId={loadId}
            documents={documents}
            readOnly={readOnly}
            onViewDocument={handleViewDocument}
            onDownloadDocument={handleDownloadDocument}
          />
        )}
      </CardContent>
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload Document"
        >
          <UploadForm onSubmit={handleUploadSubmit}>
            <FormGroup>
              <Label>Document Type</Label>
              <Select value={selectedDocumentType} onChange={handleDocumentTypeChange} required>
                <option value="">Select document type...</option>
                {Object.values(LoadDocumentType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Select File</Label>
              <FileInput type="file" onChange={handleFileSelect} required />
              {selectedFile && <SelectedFileName>{selectedFile.name}</SelectedFileName>}
            </FormGroup>
            <ModalActions>
              <Button variant="text" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={uploading} disabled={!selectedFile || !selectedDocumentType}>
                Upload
              </Button>
            </ModalActions>
          </UploadForm>
        </Modal>
      )}
    </StyledCard>
  );
};

export default DocumentsCard;