import React, { useMemo, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10

import {
  LoadDocument,
  LoadDocumentType,
} from '../../../common/interfaces/load.interface';
import DataTable from '../../../shared/components/tables/DataTable';
import Button from '../../../shared/components/buttons/Button';
import IconButton from '../../../shared/components/buttons/IconButton';
import Text from '../../../shared/components/typography/Text';
import Badge from '../../../shared/components/feedback/Badge';
import { DownloadIcon, ViewIcon } from '../../../shared/assets/icons';
import { getDocumentTypeLabel } from '../../services/documentService';
import { formatDate } from '../../../common/utils/dateTimeUtils';

/**
 * Interface defining the props for the DocumentsTable component
 */
interface DocumentsTableProps {
  /** ID of the load associated with the documents */
  loadId: string;
  /** Array of documents to display in the table */
  documents: LoadDocument[];
  /** Whether the table should be in read-only mode (no action buttons) */
  readOnly?: boolean;
  /** Maximum number of documents to display */
  maxItems?: number;
  /** Callback function when a document is viewed */
  onViewDocument?: (document: LoadDocument) => void;
  /** Callback function when a document is downloaded */
  onDownloadDocument?: (document: LoadDocument) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Interface defining the structure for document table row data
 */
interface DocumentTableRow {
  id: string;
  type: React.ReactNode;
  filename: string;
  uploadedAt: string;
  actions: React.ReactNode;
  document: LoadDocument;
}

/**
 * Styled component for the DataTable
 */
const StyledTable = styled(DataTable)`
  width: 100%;
  margin-bottom: 1rem;
`;

/**
 * Styled component for the action buttons container
 */
const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

/**
 * Styled component for the document type badge
 */
const DocumentTypeBadge = styled(Badge)<{ documentType: LoadDocumentType }>`
  background-color: ${({ documentType }) => getDocumentTypeColor(documentType)};
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
`;

/**
 * Styled component for the filename cell
 */
const FilenameCell = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

/**
 * Returns the appropriate color for a document type badge
 * @param documentType The document type
 * @returns Color code for the document type badge
 */
const getDocumentTypeColor = (documentType: LoadDocumentType): string => {
  switch (documentType) {
    case LoadDocumentType.BILL_OF_LADING:
      return '#1A73E8'; // Blue
    case LoadDocumentType.PROOF_OF_DELIVERY:
      return '#34A853'; // Green
    case LoadDocumentType.RATE_CONFIRMATION:
      return '#FBBC04'; // Yellow
    case LoadDocumentType.INVOICE:
      return '#4285F4'; // Light Blue
    case LoadDocumentType.CUSTOMS_DOCUMENT:
      return '#EA4335'; // Red
    case LoadDocumentType.HAZMAT_DOCUMENT:
      return '#673AB7'; // Purple
    case LoadDocumentType.INSPECTION_DOCUMENT:
      return '#00BCD4'; // Cyan
    case LoadDocumentType.OTHER:
      return '#795548'; // Brown
    default:
      return '#9E9E9E'; // Grey
  }
};

/**
 * Component that renders a table of documents associated with a freight load
 * @param props Props for the DocumentsTable component
 * @returns Rendered component
 */
const DocumentsTable: React.FC<DocumentsTableProps> = ({
  loadId,
  documents,
  readOnly = false,
  maxItems,
  onViewDocument,
  onDownloadDocument,
  className,
}) => {
  // Define columns for the data table
  const columns = useMemo(
    () => [
      {
        field: 'type',
        header: 'Type',
        width: '15%',
        renderCell: (row: DocumentTableRow) => row.type,
      },
      {
        field: 'filename',
        header: 'Filename',
        width: '40%',
        renderCell: (row: DocumentTableRow) => (
          <FilenameCell>
            <Text truncate>{row.filename}</Text>
          </FilenameCell>
        ),
      },
      {
        field: 'uploadedAt',
        header: 'Upload Date',
        width: '20%',
        renderCell: (row: DocumentTableRow) => row.uploadedAt,
      },
      {
        field: 'actions',
        header: 'Actions',
        width: '25%',
        align: 'right',
        renderCell: (row: DocumentTableRow) => row.actions,
      },
    ],
    []
  );

  // Format document data for the table
  const formattedDocuments = useMemo(
    () =>
      documents.map((document) => ({
        id: document.id,
        type: (
          <DocumentTypeBadge documentType={document.documentType}>
            {getDocumentTypeLabel(document.documentType)}
          </DocumentTypeBadge>
        ),
        filename: document.filename,
        uploadedAt: formatDate(document.uploadedAt),
        actions: readOnly ? null : (
          <ActionButtons>
            {onViewDocument && (
              <IconButton
                variant="ghost"
                ariaLabel={`View ${document.filename}`}
                onClick={() => onViewDocument(document)}
              >
                <ViewIcon />
              </IconButton>
            )}
            {onDownloadDocument && (
              <IconButton
                variant="ghost"
                ariaLabel={`Download ${document.filename}`}
                onClick={() => onDownloadDocument(document)}
              >
                <DownloadIcon />
              </IconButton>
            )}
          </ActionButtons>
        ),
        document: document,
      })),
    [documents, readOnly, onViewDocument, onDownloadDocument]
  );

  // Apply maxItems limit if specified
  const limitedDocuments = useMemo(() => {
    if (maxItems && formattedDocuments.length > maxItems) {
      return formattedDocuments.slice(0, maxItems);
    }
    return formattedDocuments;
  }, [formattedDocuments, maxItems]);

  // Define callbacks for document actions
  const handleViewDocument = useCallback(
    (document: LoadDocument) => {
      if (onViewDocument) {
        onViewDocument(document);
      }
    },
    [onViewDocument]
  );

  const handleDownloadDocument = useCallback(
    (document: LoadDocument) => {
      if (onDownloadDocument) {
        onDownloadDocument(document);
      }
    },
    [onDownloadDocument]
  );

  return (
    <StyledTable
      className={className}
      data={limitedDocuments}
      columns={columns}
      rowProps={{
        isClickable: !readOnly && !!onViewDocument,
        onClick: (row: DocumentTableRow) => handleViewDocument(row.document),
      }}
      sorting={{ enabled: false }}
      filtering={{ enabled: false }}
      selection={{ enabled: false }}
    />
  );
};

export default DocumentsTable;