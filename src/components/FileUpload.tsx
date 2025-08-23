import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  IconButton,
  Chip,
  Grid,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useSnackbar } from '../contexts/SnackbarContext';
import { AssetResponseDto } from '../service/service.api.service';

interface FileUploadProps {
  serviceId: string;
  existingAssets?: AssetResponseDto[];
  onUploadComplete?: (asset: AssetResponseDto) => void;
  onUploadError?: (error: string) => void;
  onAssetDeleted?: (assetId: string) => void;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  serviceId,
  existingAssets = [],
  onUploadComplete,
  onUploadError,
  onAssetDeleted,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  acceptedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  multiple = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAssets, setUploadedAssets] = useState<AssetResponseDto[]>(existingAssets);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useSnackbar();

  // Update uploaded assets when existing assets change
  useEffect(() => {
    setUploadedAssets(existingAssets);
  }, [existingAssets]);

  const validateFile = (file: File): string | null => {
    if (!acceptedFileTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedFileTypes.join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum size of ${(maxFileSize / 1024 / 1024).toFixed(2)}MB`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<AssetResponseDto> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/service/${serviceId}/assets/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const error = validateFile(file);
      if (error) {
        showError(error);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const progress = ((i + 1) / validFiles.length) * 100;
        setUploadProgress(progress);

        const asset = await uploadFile(file);
        setUploadedAssets(prev => [...prev, asset]);
        onUploadComplete?.(asset);
        showSuccess(`Successfully uploaded ${file.name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      showError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/service/${serviceId}/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }

      setUploadedAssets(prev => prev.filter(asset => asset.id !== assetId));
      onAssetDeleted?.(assetId);
      showSuccess('Asset deleted successfully');
    } catch (error) {
      showError('Failed to delete asset');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Upload Area */}
      <Paper
        sx={{
          p: 3,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : 'grey.300',
          backgroundColor: isDragOver ? 'primary.50' : 'background.paper',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          mb: 3
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Upload Images
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drag & drop images here, or click to select files
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supports: JPEG, PNG, GIF, WebP (max 5MB each)
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          You can also paste images from clipboard (Ctrl+V)
        </Typography>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Paper>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Uploading... {Math.round(uploadProgress)}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {/* Uploaded Assets Grid */}
      {uploadedAssets.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Service Images ({uploadedAssets.length})
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: 2 
          }}>
            {uploadedAssets.map((asset) => (
              <Card key={asset.id}>
                <CardMedia
                  component="img"
                  height="140"
                  image={asset.url}
                  alt={asset.fileName}
                  sx={{ objectFit: 'cover' }}
                />
                <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteAsset(asset.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}; 