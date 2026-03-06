/**
 * Frontend module for Comm-Forensics visualization and interaction
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  LinearProgress,
  Alert,
  Tooltip,
  Grid,
  Divider
} from '@mui/material';
import {
  Upload,
  Search,
  Visibility,
  Link as LinkIcon,
  Timeline as TimelineIcon,
  Refresh,
  CheckCircle,
  Cancel,
  Warning,
  Info,
  Message,
  AccountBalance,
  Close
} from '@mui/icons-material';
import axios from 'axios';

const CommForensicsDashboard = ({ projectId }) => {
  const [tabValue, setTabValue] = useState(0);
  const [messages, setMessages] = useState([]);
  const [links, setLinks] = useState([]);
  const [exports, setExports] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState(0.5);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      if (tabValue === 0) {
        // Load messages
        const response = await axios.get(`/api/comm-forensics/${projectId}/messages`);
        setMessages(response.data.messages || []);
      } else if (tabValue === 1) {
        // Load transaction links
        const response = await axios.get(`/api/comm-forensics/${projectId}/links`);
        setLinks(response.data.links || []);
      } else if (tabValue === 2) {
        // Load exports
        const response = await axios.get(`/api/comm-forensics/${projectId}/exports`);
        setExports(response.data.exports || []);
      } else if (tabValue === 3) {
        // Load timeline
        const response = await axios.get(`/api/comm-forensics/${projectId}/timeline`);
        setTimeline(response.data.timeline || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, tabValue]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', 'whatsapp'); // Default, should be dynamic

    try {
      setLoading(true);
      await axios.post(`/api/comm-forensics/${projectId}/ingest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Show success message and reload data
      alert('File uploaded successfully!');
      loadData();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/comm-forensics/${projectId}/analyze`);
      alert('Analysis started successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const verifyLink = async (linkId, status) => {
    try {
      await axios.post(`/api/comm-forensics/${projectId}/links/${linkId}/verify`, null, {
        params: { verification_status: status }
      });
      
      // Update local state
      setLinks(links.map(link => 
        link.link.id === linkId 
          ? { ...link, link: { ...link.link, verification_status: status } }
          : link
      ));
    } catch (error) {
      console.error('Verification error:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'linked':
        return <CheckCircle color="success" />;
      case 'flagged':
        return <Warning color="warning" />;
      case 'processed':
        return <Info color="info" />;
      default:
        return <Message color="default" />;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const formatMessageText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderMessagesTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
          <TextField
            size="small"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <Search /> }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="raw">Raw</MenuItem>
              <MenuItem value="processed">Processed</MenuItem>
              <MenuItem value="analyzed">Analyzed</MenuItem>
              <MenuItem value="linked">Linked</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<Upload />}
            disabled={loading}
          >
            Upload
            <input type="file" hidden onChange={handleFileUpload} />
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<TimelineIcon />}
            onClick={triggerAnalysis}
            disabled={loading}
          >
            Analyze
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Sender</TableCell>
              <TableCell>Receiver/Group</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Intent</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages
              .filter(msg => {
                if (searchQuery && !msg.message_text.toLowerCase().includes(searchQuery.toLowerCase())) {
                  return false;
                }
                if (statusFilter && msg.status !== statusFilter) {
                  return false;
                }
                return true;
              })
              .map((message) => (
                <TableRow key={message.id} hover>
                  <TableCell>
                    <Tooltip title={message.status}>
                      {getStatusIcon(message.status)}
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatTimestamp(message.message_timestamp)}</TableCell>
                  <TableCell>{message.sender}</TableCell>
                  <TableCell>{message.receiver || message.group_name || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                      {formatMessageText(message.message_text)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={message.intent_classification || 'unknown'} 
                      size="small"
                      color={message.confidence_score > 0.7 ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedMessage(message);
                        setMessageDialogOpen(true);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderLinksTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Min Confidence</InputLabel>
          <Select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
            label="Min Confidence"
          >
            <MenuItem value={0.3}>30%</MenuItem>
            <MenuItem value={0.5}>50%</MenuItem>
            <MenuItem value={0.7}>70%</MenuItem>
            <MenuItem value={0.8}>80%</MenuItem>
            <MenuItem value={0.9}>90%</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Link Confidence</TableCell>
              <TableCell>Time Delta</TableCell>
              <TableCell>Communication</TableCell>
              <TableCell>Transaction</TableCell>
              <TableCell>Match Details</TableCell>
              <TableCell>Verification</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {links
              .filter(link => link.link.confidence_score >= confidenceFilter)
              .map((item) => (
                <TableRow key={item.link.id} hover>
                  <TableCell>
                    <Chip
                      label={`${(item.link.confidence_score * 100).toFixed(1)}%`}
                      color={getConfidenceColor(item.link.confidence_score)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{item.link.time_delta_minutes} min</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.message.sender}
                      </Typography>
                      <Typography variant="caption">
                        {formatTimestamp(item.message.message_timestamp)}
                      </Typography>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {formatMessageText(item.message.message_text, 80)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.transaction.receiver}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        Rp {item.transaction.actual_amount?.toLocaleString()}
                      </Typography>
                      <Typography variant="caption">
                        {formatTimestamp(item.transaction.timestamp)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ fontSize: '0.8rem' }}>
                      {item.link.matching_entities.length > 0 && (
                        <Typography variant="caption">
                          Entities: {item.link.matching_entities.join(', ')}
                        </Typography>
                      )}
                      {item.link.matching_amounts.length > 0 && (
                        <Typography variant="caption">
                          Amounts: Rp {item.link.matching_amounts.join(', Rp ')}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.link.verification_status}
                      size="small"
                      color={
                        item.link.verification_status === 'confirmed' ? 'success' :
                        item.link.verification_status === 'rejected' ? 'error' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedLink(item);
                        setLinkDialogOpen(true);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                    {item.link.verification_status === 'pending' && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => verifyLink(item.link.id, 'confirmed')}
                        >
                          <CheckCircle />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => verifyLink(item.link.id, 'rejected')}
                        >
                          <Cancel />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderExportsTab = () => (
    <Box>
      <Button
        variant="outlined"
        startIcon={<Refresh />}
        onClick={loadData}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        Refresh
      </Button>

      <Grid container spacing={2}>
        {exports.map((exportRecord) => (
          <Grid item xs={12} sm={6} md={4} key={exportRecord.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{exportRecord.filename}</Typography>
                  <Chip
                    label={exportRecord.status}
                    size="small"
                    color={exportRecord.status === 'analyzed' ? 'success' : 'default'}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Source: {exportRecord.source_type}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Messages: {exportRecord.processed_messages} / {exportRecord.total_messages}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Created: {formatTimestamp(exportRecord.created_at)}
                </Typography>
                
                <LinearProgress
                  variant="determinate"
                  value={(exportRecord.processed_messages / exportRecord.total_messages) * 100}
                  sx={{ mb: 2 }}
                />
                
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  onClick={() => triggerAnalysis()}
                >
                  Analyze Export
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderTimelineTab = () => (
    <Box>
      <Button
        variant="outlined"
        startIcon={<Refresh />}
        onClick={loadData}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        Refresh
      </Button>

      <Paper sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
        <Timeline>
          {timeline.slice(0, 50).map((item, index) => (
            <TimelineItem key={index}>
              <TimelineSeparator>
                <TimelineDot
                  color={item.type === 'communication' ? 'primary' : 'secondary'}
                >
                  {item.type === 'communication' ? <Message /> : <AccountBalance />}
                </TimelineDot>
                {index < timeline.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Card variant="outlined" sx={{ mb: 1 }}>
                  <CardContent sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.type === 'communication' ? 'Communication' : 'Transaction'}
                      </Typography>
                      <Typography variant="caption">
                        {formatTimestamp(item.timestamp)}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      {item.source}
                    </Typography>
                    
                    {item.type === 'communication' ? (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {formatMessageText(item.data.message_text, 150)}
                      </Typography>
                    ) : (
                      <Box>
                        <Typography variant="body2">
                          Amount: Rp {item.data.actual_amount?.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          Description: {item.data.description}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Comm-Forensics Dashboard
      </Typography>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Messages" />
        <Tab label="Transaction Links" />
        <Tab label="Exports" />
        <Tab label="Timeline" />
      </Tabs>

      {tabValue === 0 && renderMessagesTab()}
      {tabValue === 1 && renderLinksTab()}
      {tabValue === 2 && renderExportsTab()}
      {tabValue === 3 && renderTimelineTab()}

      {/* Message Details Dialog */}
      <Dialog
        open={messageDialogOpen}
        onClose={() => setMessageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Message Details</DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Sender:</Typography>
                  <Typography>{selectedMessage.sender}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Timestamp:</Typography>
                  <Typography>{formatTimestamp(selectedMessage.message_timestamp)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Intent:</Typography>
                  <Chip
                    label={selectedMessage.intent_classification}
                    color={selectedMessage.confidence_score > 0.7 ? 'primary' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Confidence:</Typography>
                  <Typography>{(selectedMessage.confidence_score * 100).toFixed(1)}%</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" sx={{ mb: 1 }}>Message Content</Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography>{selectedMessage.message_text}</Typography>
              </Paper>
              
              {Object.keys(selectedMessage.extracted_entities || {}).length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Extracted Entities</Typography>
                  {Object.entries(selectedMessage.extracted_entities).map(([key, values]) => (
                    values.length > 0 && (
                      <Box key={key} sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">{key}:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {values.map((value, idx) => (
                            <Chip key={idx} label={value} size="small" />
                          ))}
                        </Box>
                      </Box>
                    )
                  ))}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Link Details Dialog */}
      <Dialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Transaction Link Details</DialogTitle>
        <DialogContent>
          {selectedLink && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Communication</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {selectedLink.message.sender}
                    </Typography>
                    <Typography variant="caption">
                      {formatTimestamp(selectedLink.message.message_timestamp)}
                    </Typography>
                    <Typography sx={{ mt: 1 }}>
                      {selectedLink.message.message_text}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Transaction</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {selectedLink.transaction.receiver}
                    </Typography>
                    <Typography variant="caption">
                      {formatTimestamp(selectedLink.transaction.timestamp)}
                    </Typography>
                    <Typography sx={{ mt: 1 }}>
                      Amount: Rp {selectedLink.transaction.actual_amount?.toLocaleString()}
                    </Typography>
                    <Typography>
                      Description: {selectedLink.transaction.description}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" sx={{ mb: 2 }}>Link Analysis</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Confidence Score:</Typography>
                  <Typography>
                    {(selectedLink.link.confidence_score * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Time Delta:</Typography>
                  <Typography>{selectedLink.link.time_delta_minutes} minutes</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Verification:</Typography>
                  <Chip
                    label={selectedLink.link.verification_status}
                    size="small"
                    color={
                      selectedLink.link.verification_status === 'confirmed' ? 'success' :
                      selectedLink.link.verification_status === 'rejected' ? 'error' : 'default'
                    }
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Link Type:</Typography>
                  <Typography>{selectedLink.link.link_type}</Typography>
                </Grid>
              </Grid>
              
              {selectedLink.link.matching_entities.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Matching Entities:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedLink.link.matching_entities.map((entity, idx) => (
                      <Chip key={idx} label={entity} size="small" color="primary" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {selectedLink.link.matching_amounts.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Matching Amounts:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedLink.link.matching_amounts.map((amount, idx) => (
                      <Chip key={idx} label={`Rp ${amount.toLocaleString()}`} size="small" color="success" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Close</Button>
          {selectedLink?.link.verification_status === 'pending' && (
            <>
              <Button
                onClick={() => verifyLink(selectedLink.link.id, 'confirmed')}
                color="success"
                startIcon={<CheckCircle />}
              >
                Confirm
              </Button>
              <Button
                onClick={() => verifyLink(selectedLink.link.id, 'rejected')}
                color="error"
                startIcon={<Cancel />}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommForensicsDashboard;