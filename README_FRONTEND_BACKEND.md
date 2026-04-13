# AI Clinical Scribe - Frontend & Backend

This project provides a web interface for the AI Clinical Scribe system, with a React frontend and FastAPI backend.

## Architecture

- **Frontend**: React with Material-UI for the user interface
- **Backend**: FastAPI for API endpoints and processing pipeline
- **Processing**: Python modules for audio transcription, NLP analysis, entity extraction, and summary generation

## Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Download spaCy model:
   ```bash
   python -m spacy download en_core_web_sm
   ```

4. (Optional) Set up Groq API key for LLM-enhanced summaries:
   ```bash
   export GROQ_API_KEY=your_api_key_here
   ```

5. Start the backend server:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`

## Usage

1. Open the frontend in your browser
2. Either upload an audio file or use the sample transcript option
3. Toggle LLM enhancement if you have a Groq API key set up
4. Click "Process Audio" to run the pipeline
5. View the transcript, extracted entities, and clinical summary

## API Endpoints

- `POST /process`: Process audio file or sample text
- `GET /health`: Health check

## Development

The backend uses the same processing modules as the original Streamlit app, providing a REST API interface. The frontend provides a modern web interface with file upload, progress indicators, and structured display of results.