import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Fade,
  Grow,
  LinearProgress,
  Avatar,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  CloudUpload,
  PlayArrow,
  Mic,
  Description,
  Healing,
  Timeline,
  Medication,
  Warning,
  CheckCircle,
  Analytics,
  Assessment,
  Science,
  Biotech,
  Psychology,
  LocalHospital,
  TrendingUp,
  BarChart,
} from '@mui/icons-material';
import axios from 'axios';

interface ProcessingResponse {
  transcript: string;
  entities: {
    symptoms: Array<{ entity: string; confidence: number }>;
    duration: string;
    medication: string[];
    observations: string[];
    negative_findings: string[];
  };
  summary: string;
  negations: string[];
  temporal_phrases: string[];
}

const processingSteps = [
  { label: 'Audio Input', icon: Mic, color: '#2563eb' },
  { label: 'Transcription', icon: Description, color: '#7c3aed' },
  { label: 'NLP Analysis', icon: Psychology, color: '#059669' },
  { label: 'Entity Extraction', icon: Biotech, color: '#dc2626' },
  { label: 'Summary Generation', icon: Assessment, color: '#ea580c' },
  { label: 'Results Display', icon: CheckCircle, color: '#16a34a' },
];

export const ClinicalScribe: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [useSample, setUseSample] = useState(false);
  const [sampleText, setSampleText] = useState('');
  const [useLLM, setUseLLM] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<ProcessingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      
      // Create audio URL for preview
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(selectedFile);
      setAudioUrl(url);
      
      console.log('File selected:', selectedFile.name, 'Type:', selectedFile.type, 'Size:', selectedFile.size);
    }
  };

  const handleProcess = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(0);

    try {
      const formData = new FormData();
      formData.append('use_sample', useSample.toString());
      formData.append('use_llm', useLLM.toString());

      if (useSample && sampleText) {
        formData.append('sample_text', sampleText);
      } else if (!useSample && file) {
        formData.append('file', file);
      }

      // Simulate step progression
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => Math.min(prev + 1, processingSteps.length - 1));
      }, 800);

      const response = await axios.post<ProcessingResponse>('/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(stepInterval);
      setCurrentStep(processingSteps.length - 1);
      setResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const renderEntityChart = () => {
    if (!result) return null;

    const entities = [
      { name: 'Symptoms', count: result.entities.symptoms.length, color: '#2563eb', icon: Healing },
      { name: 'Medications', count: result.entities.medication.length, color: '#7c3aed', icon: Medication },
      { name: 'Observations', count: result.entities.observations.length, color: '#059669', icon: Science },
      { name: 'Negations', count: result.negations.length, color: '#dc2626', icon: Warning },
      { name: 'Temporal', count: result.temporal_phrases.length, color: '#ea580c', icon: Timeline },
    ];

    return (
      <Card sx={{ mt: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <BarChart />
            </Avatar>
            <Typography variant="h6">Entity Analysis Overview</Typography>
          </Box>

          <Grid container spacing={2}>
            {entities.map((entity, index) => (
              <Grid item xs={6} sm={4} md={2.4} key={index}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${entity.color}15 0%, ${entity.color}08 100%)`,
                    border: `1px solid ${entity.color}30`,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}
                >
                  <entity.icon sx={{ fontSize: 32, color: entity.color, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: entity.color }}>
                    {entity.count}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {entity.name}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderSymptomConfidenceChart = () => {
    if (!result || result.entities.symptoms.length === 0) return null;

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
              <TrendingUp />
            </Avatar>
            <Typography variant="h6">Symptom Confidence Levels</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {result.entities.symptoms.map((symptom, index) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {symptom.entity}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    {Math.round(symptom.confidence * 100)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={symptom.confidence * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'primary.light',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'primary.main',
                      borderRadius: 4,
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            <LocalHospital sx={{ mr: 2, fontSize: '2.5rem' }} />
            AI Clinical Scribe
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
            Transform medical consultations into structured clinical documentation with AI-powered analysis
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<Analytics />}
              label="AI-Powered Analysis"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            />
            <Chip
              icon={<Biotech />}
              label="Entity Extraction"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            />
            <Chip
              icon={<Assessment />}
              label="Clinical Summaries"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Processing Pipeline Visualization */}
      {loading && (
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Science sx={{ mr: 1, color: 'primary.main' }} />
              Processing Pipeline
            </Typography>
            <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 2 }}>
              {processingSteps.map((step, index) => (
                <Step key={index}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar sx={{ bgcolor: step.color, width: 40, height: 40 }}>
                        <step.icon sx={{ color: 'white' }} />
                      </Avatar>
                    )}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
            <LinearProgress
              variant="determinate"
              value={(currentStep / (processingSteps.length - 1)) * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'primary.light',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)',
                  borderRadius: 4,
                }
              }}
            />
          </CardContent>
        </Card>
      )}
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Mic sx={{ mr: 1, color: 'primary.main' }} />
        Audio Processing
      </Typography>

      <Box sx={{ mb: 4, p: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
        <FormControlLabel
          control={
            <Switch
              checked={useSample}
              onChange={(e) => setUseSample(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Use sample transcript instead of uploading audio
            </Typography>
          }
          sx={{ mb: 2 }}
        />

        <Fade in={useSample} timeout={500}>
          <Box>
            {useSample && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Sample Transcript Text"
                placeholder="Enter consultation transcript text..."
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                variant="outlined"
              />
            )}
          </Box>
        </Fade>

        <Fade in={!useSample} timeout={500}>
          <Box>
            {!useSample && (
              <Box sx={{ mb: 2 }}>
                <input
                  accept="audio/*"
                  style={{ display: 'none' }}
                  id="audio-file"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="audio-file">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{
                      py: 3,
                      border: '2px dashed',
                      borderColor: 'primary.main',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: 'primary.dark',
                        backgroundColor: 'primary.50',
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {file ? file.name : 'Upload Audio File'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supported formats: MP3, WAV, M4A, OGG, FLAC
                      </Typography>
                    </Box>
                  </Button>
                </label>

                {file && (
                  <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <PlayArrow sx={{ mr: 1, color: 'primary.main' }} />
                      Audio Preview
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => {
                          const audio = document.getElementById('audio-preview') as HTMLAudioElement;
                          if (audio) {
                            audio.play().catch(e => console.log('Audio play failed:', e));
                          }
                        }}
                        sx={{ minWidth: 'auto' }}
                      >
                        Play
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const audio = document.getElementById('audio-preview') as HTMLAudioElement;
                          if (audio) {
                            audio.pause();
                            audio.currentTime = 0;
                          }
                        }}
                        sx={{ minWidth: 'auto' }}
                      >
                        Stop
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </Typography>
                    </Box>
                    <audio
                      id="audio-preview"
                      controls
                      key={audioUrl}
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        display: 'block'
                      }}
                      onError={(e) => console.log('Audio error:', e)}
                      onLoadStart={() => console.log('Audio loading...')}
                      onCanPlay={() => console.log('Audio ready to play')}
                    >
                      <source src={audioUrl || ''} type={file?.type || 'audio/mpeg'} />
                      Your browser does not support the audio element.
                    </audio>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Fade>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useLLM}
                onChange={(e) => setUseLLM(e.target.checked)}
                color="secondary"
              />
            }
            label={
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Use LLM for enhanced summary (requires GROQ_API_KEY)
              </Typography>
            }
          />
        </Box>

        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
          onClick={handleProcess}
          disabled={loading || (!useSample && !file)}
          fullWidth
          size="large"
          sx={{
            py: 1.5,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8 0%, #5b21b6 100%)',
            }
          }}
        >
          {loading ? 'Processing...' : 'Process Audio'}
        </Button>

        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'primary.light',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'primary.main',
                }
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              Analyzing audio and generating clinical summary...
            </Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Grow in={!!error} timeout={500}>
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-icon': {
                color: 'error.main',
              }
            }}
            icon={<Warning />}
          >
            {error}
          </Alert>
        </Grow>
      )}

      {result && (
        <Fade in={!!result} timeout={800}>
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
              Results
            </Typography>

            {/* Entity Analysis Chart */}
            {renderEntityChart()}

            {/* Symptom Confidence Chart */}
            {renderSymptomConfidenceChart()}

            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Card sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <Description />
                      </Avatar>
                      <Typography variant="h6">Transcript</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', pl: 7 }}>
                      {result.transcript}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                        <Healing />
                      </Avatar>
                      <Typography variant="h6">Extracted Entities</Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Healing sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                        Symptoms
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {result.entities.symptoms.map((symptom, index) => (
                          <Chip
                            key={index}
                            label={`${symptom.entity} (${Math.round(symptom.confidence * 100)}%)`}
                            color="primary"
                            variant="outlined"
                            size="small"
                            sx={{
                              borderRadius: 2,
                              fontWeight: 500,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Timeline sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                        Duration
                      </Typography>
                      <Typography variant="body2" sx={{ pl: 4 }}>
                        {result.entities.duration || 'Not specified'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Medication sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                        Medications
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {result.entities.medication.map((med, index) => (
                          <Chip
                            key={index}
                            label={med}
                            color="secondary"
                            size="small"
                            sx={{
                              borderRadius: 2,
                              fontWeight: 500,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Observations
                      </Typography>
                      <List dense sx={{ pl: 2 }}>
                        {result.entities.observations.map((obs, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemText primary={obs} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'error.main' }}>
                        Negative Findings
                      </Typography>
                      <List dense sx={{ pl: 2 }}>
                        {result.entities.negative_findings.map((finding, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemText primary={finding} sx={{ color: 'error.main' }} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                        <Description />
                      </Avatar>
                      <Typography variant="h6">Clinical Summary</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', pl: 7 }}>
                      {result.summary}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {(result.negations.length > 0 || result.temporal_phrases.length > 0) && (
                <>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Negations Detected
                        </Typography>
                        <List dense>
                          {result.negations.map((neg, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={neg} />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Temporal Phrases
                        </Typography>
                        <List dense>
                          {result.temporal_phrases.map((phrase, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={phrase} />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </Fade>
      )}
    </Box>
  );
};