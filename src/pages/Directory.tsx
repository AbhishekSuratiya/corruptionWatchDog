import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, MapPin, Calendar, Flag, ExternalLink, Filter, RefreshCw, Eye, X, FileText, Image, Video, Download, ArrowLeft, Clock, CheckCircle, XCircle, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import GradientButton from '../components/UI/GradientButton';
import ModernInput from '../components/UI/ModernInput';
import FloatingCard from '../components/UI/FloatingCard';
import SkeletonLoader from '../components/UI/SkeletonLoader';
import { CORRUPTION_CATEGORIES } from '../lib/constants';
import { DatabaseService } from '../lib/database';
import { FileStorageService } from '../lib/fileStorage';

interface DefaulterProfile {
  corrupt_person_name: string;
  designation: string;
  area_region: string;
  report_count: number;
  latest_report_date: string;
  categories: string[];
  status: string;
}

interface DetailedReport {
  id: string;
  corrupt_person_name: string;
  designation: string;
  address?: string;
  area_region: string;
  description: string;
  category: string;
  approached_authorities: boolean;
  was_resolved: boolean;
  evidence_files?: string[];
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
  status: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
}

interface EvidenceViewerProps {
  fileUrl: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}

// Evidence Viewer Modal Component
function EvidenceViewer({ fileUrl, filename, isOpen, onClose }: EvidenceViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!isOpen) return null;

  const fileType = FileStorageService.getFileType(filename);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl max-h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {fileType === 'image' && <Image className="h-5 w-5 text-blue-600" />}
                {fileType === 'video' && <Video className="h-5 w-5 text-blue-600" />}
                {fileType === 'pdf' && <FileText className="h-5 w-5 text-blue-600" />}
                {fileType === 'document' && <FileText className="h-5 w-5 text-blue-600" />}
                {fileType === 'unknown' && <FileText className="h-5 w-5 text-blue-600" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{filename}</h3>
                <p className="text-sm text-gray-500 capitalize">{fileType} Evidence File</p>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-2">
              {fileType === 'image' && !hasError && (
                <>
                  <button
                    onClick={handleZoomOut}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600 min-w-[3rem] text-center">{zoom}%</span>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleRotate}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Rotate"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                </>
              )}
              
              <a
                href={fileUrl}
                download={filename}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </a>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative overflow-auto max-h-[calc(100vh-200px)]">
            {fileType === 'image' && (
              <div className="flex items-center justify-center p-8 bg-gray-50 min-h-[400px]">
                {isLoading && (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span>Loading image...</span>
                  </div>
                )}
                
                {hasError && (
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Image</h3>
                    <p className="text-gray-600 mb-4">The image file could not be displayed.</p>
                    <a
                      href={fileUrl}
                      download={filename}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download File</span>
                    </a>
                  </div>
                )}

                {!hasError && (
                  <img
                    src={fileUrl}
                    alt={filename}
                    className={`max-w-full max-h-full object-contain transition-all duration-300 shadow-lg rounded-lg ${
                      isLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transformOrigin: 'center'
                    }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                )}
              </div>
            )}

            {fileType === 'video' && (
              <div className="flex items-center justify-center p-8 bg-black">
                <video
                  src={fileUrl}
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-lg"
                  style={{ maxHeight: 'calc(100vh - 300px)' }}
                  onError={() => setHasError(true)}
                >
                  Your browser does not support the video tag.
                </video>
                
                {hasError && (
                  <div className="text-center p-8 text-white">
                    <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Unable to Load Video</h3>
                    <p className="text-gray-300 mb-4">The video file could not be played.</p>
                    <a
                      href={fileUrl}
                      download={filename}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download File</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {fileType === 'pdf' && (
              <div className="h-full">
                <iframe
                  src={fileUrl}
                  className="w-full h-full min-h-[600px]"
                  title={filename}
                  onError={() => setHasError(true)}
                />
                
                {hasError && (
                  <div className="flex items-center justify-center p-16 bg-gray-50">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Display PDF</h3>
                      <p className="text-gray-600 mb-4">The PDF file could not be displayed in the browser.</p>
                      <a
                        href={fileUrl}
                        download={filename}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(fileType === 'document' || fileType === 'unknown') && (
              <div className="flex flex-col items-center justify-center p-16 bg-gray-50">
                <div className="p-6 bg-white rounded-2xl shadow-lg text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Preview</h3>
                  <p className="text-gray-600 mb-6">
                    This file type cannot be previewed directly in the browser.
                  </p>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500">
                      <strong>Filename:</strong> {filename}
                    </div>
                    <div className="text-sm text-gray-500">
                      <strong>Type:</strong> {fileType.charAt(0).toUpperCase() + fileType.slice(1)} file
                    </div>
                  </div>
                  <div className="mt-6">
                    <a
                      href={fileUrl}
                      download={filename}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download File</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Evidence file: <span className="font-medium">{filename}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Use controls above to zoom, rotate, or download</span>
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">ESC</kbd>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [defaulters, setDefaulters] = useState<DefaulterProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showAllReports, setShowAllReports] = useState(false);
  const [minReports, setMinReports] = useState(2);
  
  // Detailed view state
  const [selectedDefaulter, setSelectedDefaulter] = useState<string | null>(null);
  const [detailedReports, setDetailedReports] = useState<DetailedReport[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Evidence viewer state
  const [evidenceViewer, setEvidenceViewer] = useState<{
    isOpen: boolean;
    fileUrl: string;
    filename: string;
  }>({
    isOpen: false,
    fileUrl: '',
    filename: ''
  });

  // Handle ESC key to close evidence viewer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && evidenceViewer.isOpen) {
        setEvidenceViewer({ isOpen: false, fileUrl: '', filename: '' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [evidenceViewer.isOpen]);

  useEffect(() => {
    fetchDefaulters();
  }, [minReports]);

  const fetchDefaulters = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching defaulters from database...');
      
      let data, error;
      
      if (showAllReports) {
        // Show all reports including single ones
        ({ data, error } = await DatabaseService.getAllReportsGrouped());
      } else {
        // Show only defaulters (multiple reports)
        ({ data, error } = await DatabaseService.getDefaulters(minReports));
      }
      
      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message || 'Failed to fetch defaulters');
      }

      console.log('Raw defaulters data:', data);

      if (data) {
        // Transform the data to match our interface
        const transformedData: DefaulterProfile[] = data.map(item => ({
          corrupt_person_name: item.corrupt_person_name,
          designation: item.designation,
          area_region: item.area_region,
          report_count: Number(item.report_count),
          latest_report_date: typeof item.latest_report_date === 'string' 
            ? item.latest_report_date 
            : new Date(item.latest_report_date).toISOString(),
          categories: Array.isArray(item.categories) ? item.categories : [],
          status: item.status || 'low'
        }));
        
        console.log('Transformed defaulters data:', transformedData);
        setDefaulters(transformedData);
        setLastRefresh(new Date());
      } else {
        console.log('No defaulters data returned');
        setDefaulters([]);
      }
    } catch (err) {
      console.error('Error fetching defaulters:', err);
      setError(err instanceof Error ? err.message : 'Failed to load defaulters');
      setDefaulters([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetailedReports = async (personName: string) => {
    try {
      setLoadingDetails(true);
      setDetailsError(null);
      
      console.log('Fetching detailed reports for:', personName);
      
      const { data, error } = await DatabaseService.getReportsByPerson(personName);
      
      if (error) {
        throw new Error(error.message || 'Failed to fetch detailed reports');
      }

      console.log('Detailed reports data:', data);

      if (data) {
        setDetailedReports(data as DetailedReport[]);
      } else {
        setDetailedReports([]);
      }
    } catch (err) {
      console.error('Error fetching detailed reports:', err);
      setDetailsError(err instanceof Error ? err.message : 'Failed to load detailed reports');
      setDetailedReports([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDefaulterClick = (personName: string, event?: React.MouseEvent) => {
    // Prevent event bubbling if needed
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('Clicking on defaulter:', personName);
    setSelectedDefaulter(personName);
    fetchDetailedReports(personName);
  };

  const handleCloseDetails = () => {
    console.log('Closing details view');
    setSelectedDefaulter(null);
    setDetailedReports([]);
    setDetailsError(null);
  };

  const handleEvidenceClick = (fileUrl: string, filename: string) => {
    console.log('Opening evidence viewer for:', filename, 'URL:', fileUrl);
    setEvidenceViewer({
      isOpen: true,
      fileUrl,
      filename
    });
  };

  const handleCloseEvidenceViewer = () => {
    setEvidenceViewer({
      isOpen: false,
      fileUrl: '',
      filename: ''
    });
  };

  const filteredDefaulters = defaulters.filter(defaulter => {
    const matchesSearch = defaulter.corrupt_person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         defaulter.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         defaulter.area_region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || defaulter.categories.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'single': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBadgeColor = (count: number) => {
    if (count >= 20) return 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25';
    if (count >= 10) return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25';
    if (count >= 5) return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25';
    if (count >= 2) return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25';
    return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critical': return 'Critical Risk';
      case 'high': return 'High Risk';
      case 'medium': return 'Medium Risk';
      case 'low': return 'Low Risk';
      case 'single': return 'Single Report';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disputed': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEvidenceIcon = (filename: string) => {
    const fileType = FileStorageService.getFileType(filename);
    switch (fileType) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Extract filename from URL for display
  const getFilenameFromUrl = (url: string): string => {
    try {
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      // Remove any query parameters
      return filename.split('?')[0];
    } catch {
      return 'Evidence File';
    }
  };

  // Debug: Log current state
  console.log('Current state:', {
    selectedDefaulter,
    detailedReports: detailedReports.length,
    loadingDetails,
    detailsError
  });

  // If detailed view is open, show it
  if (selectedDefaulter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Back Button */}
          <div className="mb-8 animate-fade-in-up">
            <div className="flex items-center space-x-4 mb-6">
              <GradientButton
                onClick={handleCloseDetails}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Directory</span>
              </GradientButton>
            </div>
            
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Reports for 
                <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent"> {selectedDefaulter}</span>
              </h1>
              <p className="text-xl text-gray-600">
                All corruption reports filed against this individual with evidence files
              </p>
            </div>
          </div>

          {/* Error Message */}
          {detailsError && (
            <FloatingCard className="mb-8 bg-red-50 border-2 border-red-200">
              <div className="p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Error Loading Reports</h3>
                    <p className="text-red-700">{detailsError}</p>
                    <button 
                      onClick={() => fetchDetailedReports(selectedDefaulter)}
                      className="mt-2 text-red-600 hover:text-red-800 font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </FloatingCard>
          )}

          {/* Reports List */}
          <div className="space-y-6">
            {loadingDetails ? (
              Array.from({ length: 3 }).map((_, index) => (
                <SkeletonLoader key={index} variant="card" className="h-64" />
              ))
            ) : detailedReports.length > 0 ? (
              detailedReports.map((report, index) => (
                <FloatingCard key={report.id} delay={index * 100} className="overflow-hidden">
                  {/* Report Header */}
                  <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{report.corrupt_person_name}</h2>
                        <div className="flex items-center space-x-4 text-red-100">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {report.designation}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium border ${getReportStatusColor(report.status)}`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Report Details */}
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Main Content */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-red-600" />
                            Detailed Description
                          </h3>
                          <div className="bg-gray-50 rounded-xl p-6">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {report.description}
                            </p>
                          </div>
                        </div>

                        {/* Evidence Files */}
                        {report.evidence_files && report.evidence_files.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                              <Flag className="h-5 w-5 mr-2 text-red-600" />
                              Evidence Files ({report.evidence_files.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {report.evidence_files.map((fileUrl, fileIndex) => {
                                const filename = getFilenameFromUrl(fileUrl);
                                return (
                                  <div 
                                    key={fileIndex} 
                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer group hover:border-blue-300"
                                    onClick={() => handleEvidenceClick(fileUrl, filename)}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                        {getEvidenceIcon(filename)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                          {filename}
                                        </p>
                                        <p className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
                                          Click to view evidence file
                                        </p>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <button 
                                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                          title="View Evidence"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEvidenceClick(fileUrl, filename);
                                          }}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </button>
                                        <a
                                          href={fileUrl}
                                          download={filename}
                                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                          title="Download"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Download className="h-4 w-4" />
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center space-x-2 text-sm text-blue-700">
                                <Eye className="h-4 w-4" />
                                <span>Click on any evidence file to view it in full screen with zoom and download options</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sidebar */}
                      <div className="space-y-6">
                        {/* Report Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Category</label>
                              <p className="text-gray-900 font-medium">
                                {CORRUPTION_CATEGORIES[report.category as keyof typeof CORRUPTION_CATEGORIES] || report.category}
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-600">Location</label>
                              <p className="text-gray-900 font-medium">{report.area_region}</p>
                            </div>
                            
                            {report.address && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Address</label>
                                <p className="text-gray-900 font-medium">{report.address}</p>
                              </div>
                            )}

                            <div>
                              <label className="text-sm font-medium text-gray-600">Reported</label>
                              <p className="text-gray-900 font-medium">
                                {new Date(report.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions Taken */}
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions & Status</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Authorities Approached</span>
                              <div className="flex items-center">
                                {report.approached_authorities ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <span className={`ml-2 text-sm font-medium ${
                                  report.approached_authorities ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {report.approached_authorities ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Issue Resolved</span>
                              <div className="flex items-center">
                                {report.was_resolved ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Clock className="h-5 w-5 text-yellow-600" />
                                )}
                                <span className={`ml-2 text-sm font-medium ${
                                  report.was_resolved ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                  {report.was_resolved ? 'Yes' : 'Pending'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Report Type</span>
                              <span className={`text-sm font-medium ${
                                report.is_anonymous ? 'text-purple-600' : 'text-blue-600'
                              }`}>
                                {report.is_anonymous ? 'Anonymous' : 'Verified'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Community Feedback */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Feedback</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{report.upvotes}</div>
                              <div className="text-sm text-gray-600">Upvotes</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">{report.downvotes}</div>
                              <div className="text-sm text-gray-600">Downvotes</div>
                            </div>
                          </div>
                        </div>

                        {/* Reporter Info (if not anonymous) */}
                        {!report.is_anonymous && (report.reporter_name || report.reporter_email) && (
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporter Information</h3>
                            <div className="space-y-2">
                              {report.reporter_name && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Name</label>
                                  <p className="text-gray-900 font-medium">{report.reporter_name}</p>
                                </div>
                              )}
                              {report.reporter_email && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Email</label>
                                  <p className="text-gray-900 font-medium">{report.reporter_email}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </FloatingCard>
              ))
            ) : (
              <FloatingCard className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-500 mb-6">
                  No detailed reports were found for {selectedDefaulter}.
                </p>
                <GradientButton onClick={handleCloseDetails}>
                  Back to Directory
                </GradientButton>
              </FloatingCard>
            )}
          </div>

          {/* Evidence Viewer Modal */}
          <EvidenceViewer
            fileUrl={evidenceViewer.fileUrl}
            filename={evidenceViewer.filename}
            isOpen={evidenceViewer.isOpen}
            onClose={handleCloseEvidenceViewer}
          />
        </div>
      </div>
    );
  }

  // Main directory view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Static Content */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl">
                <AlertTriangle className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Corruption 
            <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent"> Directory</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Public registry of corruption reports from both anonymous and logged-in users. 
            Click on any person to view all reports filed against them with evidence files.
          </p>
        </div>

        {/* Search and Filters - Static Content */}
        <FloatingCard className="p-8 mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <ModernInput
                placeholder="Search by name, designation, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-5 w-5" />}
              />
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-red-500 focus:outline-none focus:ring-0 transition-all duration-300 hover:border-gray-300 appearance-none"
              >
                <option value="">All Categories</option>
                {Object.entries(CORRUPTION_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={minReports}
                onChange={(e) => setMinReports(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:border-red-500 focus:outline-none focus:ring-0 transition-all duration-300 hover:border-gray-300 appearance-none"
              >
                <option value={1}>All Reports (1+)</option>
                <option value={2}>Defaulters (2+)</option>
                <option value={3}>Frequent (3+)</option>
                <option value={5}>High Risk (5+)</option>
                <option value={10}>Critical (10+)</option>
              </select>
            </div>
          </div>
          
          {/* View Toggle and Refresh Button */}
          <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleString()}
              </div>
              <button
                onClick={() => {
                  setShowAllReports(!showAllReports);
                  setMinReports(showAllReports ? 2 : 1);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>{showAllReports ? 'Show Defaulters Only' : 'Show All Reports'}</span>
              </button>
            </div>
            <GradientButton 
              onClick={fetchDefaulters} 
              size="sm"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
            </GradientButton>
          </div>
        </FloatingCard>

        {/* Error Message */}
        {error && (
          <FloatingCard className="mb-8 bg-red-50 border-2 border-red-200">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
                  <p className="text-red-700">{error}</p>
                  <button 
                    onClick={fetchDefaulters}
                    className="mt-2 text-red-600 hover:text-red-800 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </FloatingCard>
        )}

        {/* Results Count - Show only when not loading */}
        {!isLoading && !error && (
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <p className="text-gray-600 text-lg">
              Showing <span className="font-semibold text-red-600">{filteredDefaulters.length}</span> {minReports === 1 ? 'report' : 'defaulter'}{filteredDefaulters.length !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
              {defaulters.length > 0 && (
                <span className="text-sm text-gray-500 ml-2">
                  (Total: {defaulters.length} in database)
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {minReports === 1 
                ? 'Click on any person to view all their reports with full details and evidence files' 
                : `Click on any defaulter to view all ${minReports}+ reports with full details and evidence files`
              }
            </p>
          </div>
        )}

        {/* Defaulters Grid - Data Driven */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            // Show skeleton only for data-driven content
            Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoader key={index} variant="card" className="h-80" />
            ))
          ) : filteredDefaulters.length > 0 ? (
            filteredDefaulters.map((defaulter, index) => (
              <div
                key={`${defaulter.corrupt_person_name}-${defaulter.designation}-${index}`}
                onClick={(e) => handleDefaulterClick(defaulter.corrupt_person_name, e)}
                className="cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                <FloatingCard 
                  delay={index * 100}
                  className="overflow-hidden group h-full"
                >
                  {/* Header with Badge */}
                  <div className="relative p-6 pb-4 bg-gradient-to-br from-white to-gray-50">
                    <div className="absolute top-4 right-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold transform transition-all duration-300 group-hover:scale-110 ${getBadgeColor(defaulter.report_count)}`}>
                        {defaulter.report_count} Report{defaulter.report_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="pr-24">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors duration-300">
                        {defaulter.corrupt_person_name}
                      </h3>
                      <p className="text-gray-600 font-medium mb-2">
                        {defaulter.designation}
                      </p>
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <MapPin className="h-4 w-4 mr-2 text-red-500" />
                        {defaulter.area_region}
                      </div>

                      {/* Status Badge */}
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(defaulter.status)}`}>
                        {getStatusLabel(defaulter.status)}
                      </span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="px-6 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {defaulter.categories.map((category) => (
                        <span key={category} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg border hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all duration-200">
                          {CORRUPTION_CATEGORIES[category as keyof typeof CORRUPTION_CATEGORIES] || category}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-red-500" />
                        Last reported: {new Date(defaulter.latest_report_date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <div className="flex-1 text-center">
                        <div className="flex items-center justify-center space-x-1 text-blue-600 font-medium">
                          <Eye className="h-3 w-3" />
                          <span className="text-xs">Click to View Details & Evidence</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </FloatingCard>
              </div>
            ))
          ) : !error ? (
            // No Results - Show only when not loading and no results
            <div className="col-span-full">
              <FloatingCard className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {defaulters.length === 0 ? `No ${minReports === 1 ? 'reports' : 'defaulters'} found` : `No matching ${minReports === 1 ? 'reports' : 'defaulters'}`}
                </h3>
                <p className="text-gray-500 mb-6">
                  {defaulters.length === 0 
                    ? minReports === 1 
                      ? 'No corruption reports have been found in the database yet.'
                      : `No individuals with ${minReports}+ corruption reports have been found in the database yet.`
                    : 'Try adjusting your search criteria or browse all categories.'
                  }
                </p>
                {filteredDefaulters.length === 0 && defaulters.length > 0 && (
                  <GradientButton onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}>
                    Clear Filters
                  </GradientButton>
                )}
              </FloatingCard>
            </div>
          ) : null}
        </div>

        {/* Warning Notice - Static Content */}
        <FloatingCard className="mt-12 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200" delay={600}>
          <div className="p-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-yellow-800 mb-3">
                  Important Notice
                </h3>
                <p className="text-yellow-700 leading-relaxed">
                  This directory contains corruption reports from our database, 
                  including reports submitted both anonymously and by logged-in users. 
                  Click on any person to view detailed reports with full descriptions and evidence files.
                  All information is based on user submissions and should be verified independently.
                </p>
                <p className="text-yellow-700 leading-relaxed mt-2">
                  <strong>Data Source:</strong> Real-time data from Supabase database aggregating all corruption reports. 
                  Last updated: {lastRefresh.toLocaleString()}
                </p>
                <p className="text-yellow-700 leading-relaxed mt-2">
                  <strong>Note:</strong> {minReports === 1 
                    ? 'Currently showing all reports including single reports.' 
                    : `Currently showing only individuals with ${minReports}+ reports (repeat offenders).`
                  }
                </p>
              </div>
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}