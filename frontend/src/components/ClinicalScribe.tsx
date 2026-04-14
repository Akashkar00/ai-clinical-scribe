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
  StopCircle,
  AutoAwesome,
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

// Health-themed teal/emerald palette
const TEAL   = '#0891b2';
const TEAL_D = '#0e7490';
const TEAL_L = '#cffafe';
const EMR    = '#059669';
const EMR_D  = '#047857';
const EMR_L  = '#d1fae5';
const SKY    = '#0284c7';
const SKY_L  = '#e0f2fe';
const AMB    = '#d97706';
const AMB_L  = '#fef3c7';
const ROSE   = '#e11d48';
const ROSE_L = '#ffe4e6';

const processingSteps = [
  { label: 'Audio Input',         icon: Mic,        color: TEAL },
  { label: 'Transcription',       icon: Description, color: SKY },
  { label: 'NLP Analysis',        icon: Psychology,  color: EMR },
  { label: 'Entity Extraction',   icon: Biotech,     color: AMB },
  { label: 'Summary Generation',  icon: Assessment,  color: EMR_D },
  { label: 'Complete',            icon: CheckCircle, color: '#16a34a' },
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

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(selectedFile));
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

      const stepInterval = setInterval(() => {
        setCurrentStep(prev => Math.min(prev + 1, processingSteps.length - 1));
      }, 800);

      const response = await axios.post<ProcessingResponse>('/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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

  // ── Entity overview cards ──────────────────────────────────────────────────
  const renderEntityChart = () => {
    if (!result) return null;

    const entities = [
      { name: 'Symptoms',    count: result.entities.symptoms.length,  color: TEAL,  bg: TEAL_L,  icon: Healing },
      { name: 'Medications', count: result.entities.medication.length, color: EMR,   bg: EMR_L,   icon: Medication },
      { name: 'Observations',count: result.entities.observations.length,color: SKY, bg: SKY_L,   icon: Science },
      { name: 'Negations',   count: result.negations.length,           color: ROSE,  bg: ROSE_L,  icon: Warning },
      { name: 'Temporal',    count: result.temporal_phrases.length,    color: AMB,   bg: AMB_L,   icon: Timeline },
    ];

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: TEAL_L, mr: 2, width: 40, height: 40 }}>
              <BarChart sx={{ color: TEAL, fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: '#0f172a' }}>Entity Analysis Overview</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Extracted from consultation</Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {entities.map((e, i) => (
              <Grid item xs={6} sm={4} md={2.4} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    borderRadius: 2,
                    background: e.bg,
                    border: `1px solid ${e.color}30`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: `0 8px 20px ${e.color}20`,
                    },
                  }}
                >
                  <e.icon sx={{ fontSize: 28, color: e.color, mb: 0.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 800, color: e.color, lineHeight: 1.2 }}>
                    {e.count}
                  </Typography>
                  <Typography variant="caption" sx={{ color: e.color, fontWeight: 600 }}>
                    {e.name}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // ── Symptom confidence bars ───────────────────────────────────────────────
  const renderSymptomConfidenceChart = () => {
    if (!result || result.entities.symptoms.length === 0) return null;

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: EMR_L, mr: 2, width: 40, height: 40 }}>
              <TrendingUp sx={{ color: EMR, fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography variant="h6">Symptom Confidence Levels</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Detection confidence per symptom</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {result.entities.symptoms.map((symptom, i) => {
              const pct = Math.round(symptom.confidence * 100);
              const barColor = pct >= 80 ? EMR : pct >= 50 ? TEAL : AMB;
              return (
                <Box key={i}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                      {symptom.entity}
                    </Typography>
                    <Chip
                      label={`${pct}%`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        bgcolor: `${barColor}15`,
                        color: barColor,
                        border: `1px solid ${barColor}40`,
                      }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 7,
                      borderRadius: 4,
                      bgcolor: '#f1f5f9',
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}cc 100%)`,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          background: `linear-gradient(135deg, ${TEAL_D} 0%, ${TEAL} 45%, ${EMR} 100%)`,
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          border: 'none',
          boxShadow: `0 16px 40px ${TEAL}40`,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: '-40px',
            left: '30%',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <LocalHospital sx={{ fontSize: 36, mr: 1.5, opacity: 0.95 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
              AI Clinical Scribe
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.88, maxWidth: 560, lineHeight: 1.6 }}>
            Convert doctor-patient consultations into structured SOAP notes with AI-powered speech recognition and NLP.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {[
              { icon: <Analytics sx={{ fontSize: 15 }} />, label: 'AI Analysis' },
              { icon: <Biotech sx={{ fontSize: 15 }} />, label: 'Entity Extraction' },
              { icon: <Assessment sx={{ fontSize: 15 }} />, label: 'SOAP Summaries' },
            ].map((chip, i) => (
              <Chip
                key={i}
                icon={chip.icon}
                label={chip.label}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.18)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.30)',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: 'white' },
                }}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* ── Pipeline stepper ─────────────────────────────────────────────── */}
      {loading && (
        <Card sx={{ mb: 4, background: `linear-gradient(135deg, ${TEAL_L}60 0%, #ffffff 100%)` }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3, color: TEAL_D }}>
              <Science sx={{ mr: 1, color: TEAL }} />
              Processing Pipeline
            </Typography>
            <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 2 }}>
              {processingSteps.map((step, i) => (
                <Step key={i}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar
                        sx={{
                          bgcolor: i <= currentStep ? step.color : '#e2e8f0',
                          width: 38,
                          height: 38,
                          transition: 'background 0.4s',
                          boxShadow: i <= currentStep ? `0 4px 10px ${step.color}50` : 'none',
                        }}
                      >
                        <step.icon sx={{ color: 'white', fontSize: 18 }} />
                      </Avatar>
                    )}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, color: i <= currentStep ? step.color : 'text.secondary' }}>
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
                height: 7,
                borderRadius: 4,
                bgcolor: TEAL_L,
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${TEAL} 0%, ${EMR} 100%)`,
                  borderRadius: 4,
                },
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Input section ────────────────────────────────────────────────── */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 2.5,
          background: '#ffffff',
          border: `1px solid ${TEAL}20`,
          boxShadow: `0 2px 12px ${TEAL}0d`,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3, color: TEAL_D }}>
          <Mic sx={{ mr: 1.5, color: TEAL }} />
          Audio Processing
        </Typography>

        {/* Sample toggle */}
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: 2,
            bgcolor: useSample ? EMR_L : '#f8fafc',
            border: `1px solid ${useSample ? EMR + '40' : '#e2e8f0'}`,
            transition: 'all 0.3s',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={useSample}
                onChange={e => setUseSample(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: EMR },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: EMR },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, color: useSample ? EMR_D : 'text.secondary' }}>
                Use sample transcript (no audio file needed)
              </Typography>
            }
          />
        </Box>

        <Fade in={useSample} timeout={400}>
          <Box>
            {useSample && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Sample Transcript"
                placeholder="E.g. Doctor: What seems to be the problem? Patient: I have had fever for three days and dry cough…"
                value={sampleText}
                onChange={e => setSampleText(e.target.value)}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: EMR },
                    '&.Mui-focused fieldset': { borderColor: EMR },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: EMR },
                }}
              />
            )}
          </Box>
        </Fade>

        <Fade in={!useSample} timeout={400}>
          <Box>
            {!useSample && (
              <Box sx={{ mb: 2.5 }}>
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
                      py: 3.5,
                      border: `2px dashed ${file ? EMR : TEAL}`,
                      borderRadius: 2,
                      color: file ? EMR_D : TEAL_D,
                      bgcolor: file ? EMR_L : TEAL_L + '60',
                      '&:hover': {
                        border: `2px dashed ${file ? EMR_D : TEAL_D}`,
                        bgcolor: file ? EMR_L : TEAL_L,
                      },
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {file ? file.name : 'Upload Audio File'}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        {file ? `${(file.size / 1024).toFixed(1)} KB · ready` : 'MP3, WAV, M4A, OGG, FLAC'}
                      </Typography>
                    </Box>
                  </Button>
                </label>

                {file && audioUrl && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: TEAL_L + '50',
                      border: `1px solid ${TEAL}30`,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1.5, color: TEAL_D, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                      <PlayArrow sx={{ mr: 0.5, fontSize: 18 }} /> Audio Preview
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PlayArrow />}
                        sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_D }, borderRadius: 1.5, py: 0.5 }}
                        onClick={() => (document.getElementById('audio-preview') as HTMLAudioElement)?.play()}
                      >
                        Play
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<StopCircle />}
                        sx={{ borderColor: TEAL, color: TEAL, '&:hover': { borderColor: TEAL_D, bgcolor: TEAL_L }, borderRadius: 1.5, py: 0.5 }}
                        onClick={() => {
                          const a = document.getElementById('audio-preview') as HTMLAudioElement;
                          if (a) { a.pause(); a.currentTime = 0; }
                        }}
                      >
                        Stop
                      </Button>
                    </Box>
                    <audio
                      id="audio-preview"
                      controls
                      key={audioUrl}
                      style={{ width: '100%', borderRadius: 8, display: 'block' }}
                    >
                      <source src={audioUrl} type={file.type || 'audio/mpeg'} />
                    </audio>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Fade>

        {/* LLM toggle */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: useLLM ? AMB_L : '#f8fafc',
            border: `1px solid ${useLLM ? AMB + '50' : '#e2e8f0'}`,
            transition: 'all 0.3s',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={useLLM}
                onChange={e => setUseLLM(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: AMB },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: AMB },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: useLLM ? AMB : 'text.secondary' }}>
                  LLM-Enhanced Summary
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Requires GROQ_API_KEY environment variable
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* Process button */}
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
          onClick={handleProcess}
          disabled={loading || (!useSample && !file)}
          fullWidth
          size="large"
          sx={{
            py: 1.75,
            fontSize: '1rem',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${TEAL_D} 0%, ${TEAL} 50%, ${EMR} 100%)`,
            boxShadow: `0 6px 20px ${TEAL}40`,
            border: 'none',
            '&:hover': {
              background: `linear-gradient(135deg, ${TEAL_D} 0%, ${TEAL_D} 50%, ${EMR_D} 100%)`,
              boxShadow: `0 8px 24px ${TEAL}55`,
            },
            '&:disabled': {
              background: '#e2e8f0',
              boxShadow: 'none',
            },
          }}
        >
          {loading ? 'Analysing Consultation…' : 'Process Audio'}
        </Button>

        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: TEAL_L,
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${TEAL} 0%, ${EMR} 100%)`,
                },
              }}
            />
            <Typography variant="caption" sx={{ mt: 0.75, display: 'block', textAlign: 'center', color: 'text.secondary' }}>
              Running 6-stage clinical NLP pipeline…
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <Grow in={!!error} timeout={400}>
          <Alert
            severity="error"
            icon={<Warning />}
            sx={{ mb: 3, borderRadius: 2, border: `1px solid ${ROSE}30` }}
          >
            {error}
          </Alert>
        </Grow>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {result && (
        <Fade in={!!result} timeout={700}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
              <CheckCircle sx={{ color: EMR, fontSize: 28 }} />
              <Typography variant="h5" sx={{ color: EMR_D, fontWeight: 700 }}>
                Results
              </Typography>
              <Chip
                label="Analysis complete"
                size="small"
                sx={{ bgcolor: EMR_L, color: EMR_D, fontWeight: 600, border: `1px solid ${EMR}30` }}
              />
            </Box>

            {renderEntityChart()}
            {renderSymptomConfidenceChart()}

            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Transcript */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: TEAL_L, mr: 2, width: 38, height: 38 }}>
                        <Description sx={{ color: TEAL, fontSize: 20 }} />
                      </Avatar>
                      <Typography variant="h6" sx={{ color: TEAL_D }}>Transcript</Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#1e293b', lineHeight: 1.8 }}>
                        {result.transcript}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Extracted Entities */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                      <Avatar sx={{ bgcolor: TEAL_L, mr: 2, width: 38, height: 38 }}>
                        <Healing sx={{ color: TEAL, fontSize: 20 }} />
                      </Avatar>
                      <Typography variant="h6" sx={{ color: TEAL_D }}>Extracted Entities</Typography>
                    </Box>

                    {/* Symptoms */}
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: TEAL_D }}>
                        <Healing sx={{ mr: 0.75, fontSize: 16, color: TEAL }} /> Symptoms
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {result.entities.symptoms.length ? result.entities.symptoms.map((s, i) => (
                          <Chip
                            key={i}
                            label={`${s.entity} · ${Math.round(s.confidence * 100)}%`}
                            size="small"
                            sx={{ bgcolor: TEAL_L, color: TEAL_D, border: `1px solid ${TEAL}30`, fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        )) : <Typography variant="caption" color="text.secondary">None detected</Typography>}
                      </Box>
                    </Box>

                    {/* Duration */}
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: SKY }}>
                        <Timeline sx={{ mr: 0.75, fontSize: 16, color: SKY }} /> Duration
                      </Typography>
                      <Typography variant="body2" sx={{ pl: 3, color: '#334155' }}>
                        {result.entities.duration || 'Not specified'}
                      </Typography>
                    </Box>

                    {/* Medications */}
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: EMR_D }}>
                        <Medication sx={{ mr: 0.75, fontSize: 16, color: EMR }} /> Medications
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {result.entities.medication.length ? result.entities.medication.map((m, i) => (
                          <Chip
                            key={i}
                            label={m}
                            size="small"
                            sx={{ bgcolor: EMR_L, color: EMR_D, border: `1px solid ${EMR}30`, fontWeight: 600 }}
                          />
                        )) : <Typography variant="caption" color="text.secondary">None detected</Typography>}
                      </Box>
                    </Box>

                    {/* Observations */}
                    {result.entities.observations.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569' }}>
                          Observations
                        </Typography>
                        <List dense disablePadding>
                          {result.entities.observations.map((obs, i) => (
                            <ListItem key={i} sx={{ px: 0, py: 0.25 }}>
                              <ListItemText
                                primary={obs}
                                primaryTypographyProps={{ variant: 'body2', color: '#334155' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {result.entities.negative_findings.length > 0 && (
                      <>
                        <Divider sx={{ my: 2, borderColor: ROSE_L }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: ROSE, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Warning sx={{ fontSize: 15 }} /> Negative Findings
                          </Typography>
                          <List dense disablePadding>
                            {result.entities.negative_findings.map((f, i) => (
                              <ListItem key={i} sx={{ px: 0, py: 0.25 }}>
                                <ListItemText
                                  primary={f}
                                  primaryTypographyProps={{ variant: 'body2', color: ROSE }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Clinical Summary */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', background: `linear-gradient(160deg, ${EMR_L}50 0%, #ffffff 40%)` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                      <Avatar sx={{ bgcolor: EMR_L, mr: 2, width: 38, height: 38 }}>
                        <Description sx={{ color: EMR, fontSize: 20 }} />
                      </Avatar>
                      <Typography variant="h6" sx={{ color: EMR_D }}>Clinical Summary</Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        border: `1px solid ${EMR}20`,
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, color: '#1e293b' }}>
                        {result.summary}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Negations & Temporal */}
              {(result.negations.length > 0 || result.temporal_phrases.length > 0) && (
                <>
                  {result.negations.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Card sx={{ background: `linear-gradient(160deg, ${ROSE_L}40 0%, #ffffff 50%)` }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <Avatar sx={{ bgcolor: ROSE_L, mr: 1.5, width: 34, height: 34 }}>
                              <Warning sx={{ color: ROSE, fontSize: 18 }} />
                            </Avatar>
                            <Typography variant="h6" sx={{ color: ROSE, fontSize: '1rem' }}>Negations Detected</Typography>
                          </Box>
                          <List dense disablePadding>
                            {result.negations.map((n, i) => (
                              <ListItem key={i} sx={{ px: 0, py: 0.25 }}>
                                <ListItemText primary={n} primaryTypographyProps={{ variant: 'body2', color: '#64748b' }} />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {result.temporal_phrases.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Card sx={{ background: `linear-gradient(160deg, ${AMB_L}40 0%, #ffffff 50%)` }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <Avatar sx={{ bgcolor: AMB_L, mr: 1.5, width: 34, height: 34 }}>
                              <Timeline sx={{ color: AMB, fontSize: 18 }} />
                            </Avatar>
                            <Typography variant="h6" sx={{ color: AMB, fontSize: '1rem' }}>Temporal Phrases</Typography>
                          </Box>
                          <List dense disablePadding>
                            {result.temporal_phrases.map((p, i) => (
                              <ListItem key={i} sx={{ px: 0, py: 0.25 }}>
                                <ListItemText primary={p} primaryTypographyProps={{ variant: 'body2', color: '#64748b' }} />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </Box>
        </Fade>
      )}
    </Box>
  );
};
