# 🎵 Suno API Integration Setup Guide

This guide will help you complete the setup of your Suno-powered music generation app.

## ✅ What's Already Done

- ✅ **Backend API Routes**: Created `/api/generate-music` and `/api/check-status` endpoints
- ✅ **Service Layer**: Built `SunoService` with complete generation and polling logic
- ✅ **Frontend Integration**: Updated the UI to use real API calls with progress tracking
- ✅ **Audio Playback**: Added play/pause functionality for generated songs
- ✅ **Download Feature**: Implemented song download functionality
- ✅ **Error Handling**: Added comprehensive error handling and user feedback

## 🔧 What You Need To Do

### 1. Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Create the environment file
touch .env.local
```

Add your Suno API key:

```env
# .env.local
SUNO_API_KEY=your_actual_api_key_here
```

**🚨 Important:** Get your API key from the Suno booth at HackMIT 2025!

### 2. Install and Run

Your project already has all the necessary dependencies. Simply run:

```bash
# Install dependencies
npm install
# or
yarn install

# Start the development server
npm run dev
# or
yarn dev
```

### 3. Test the Integration

1. **Open your browser** to `http://localhost:3000`
2. **Enter a song description** like "An upbeat pop song about coding at a hackathon"
3. **Add style tags** (optional) like "pop, electronic, energetic"
4. **Click "Generate Song"** and watch the progress bar
5. **Wait 2-4 minutes** for generation to complete
6. **Play and download** your generated songs!

## 🎯 Features Implemented

### Frontend Features

- **Dual Input Fields**: Song description + optional style tags
- **Real-time Progress**: Live progress bar with status updates
- **Audio Playback**: Built-in play/pause controls
- **Download**: Direct download of MP3 files
- **Error Handling**: Clear error messages and API troubleshooting tips
- **Multiple Songs**: Displays all generated variations

### Backend Features

- **Suno API Integration**: Full v2 API implementation
- **Polling Logic**: Automatic status checking until completion
- **Error Handling**: Comprehensive error management
- **Rate Limiting**: Respects Suno API rate limits
- **Environment Security**: Secure API key handling

## 🔍 API Endpoints

### `POST /api/generate-music`

Starts song generation with the Suno API.

**Request Body:**

```json
{
  "prompt": "A cheerful song about HackMIT",
  "tags": "pop, upbeat, electronic",
  "makeInstrumental": false
}
```

**Response:**

```json
{
  "success": true,
  "clips": [
    {
      "id": "clip-uuid-1",
      "status": "submitted",
      "created_at": "2025-01-15T..."
    }
  ]
}
```

### `POST /api/check-status`

Checks the generation status of clips.

**Request Body:**

```json
{
  "clipIds": ["clip-uuid-1", "clip-uuid-2"]
}
```

**Response:**

```json
{
  "success": true,
  "clips": [
    {
      "id": "clip-uuid-1",
      "status": "complete",
      "title": "HackMIT Anthem",
      "audio_url": "https://cdn1.suno.ai/...",
      "metadata": {
        "duration": 180.5,
        "tags": "pop, upbeat, electronic"
      }
    }
  ]
}
```

## 🐛 Troubleshooting

### "API key not configured" Error

- Make sure `.env.local` exists in your project root
- Verify the API key is correctly set as `SUNO_API_KEY=your_key`
- Restart your development server after adding the environment variable

### Generation Takes Too Long

- Song generation typically takes 2-4 minutes
- The app polls every 5 seconds automatically
- Check the status updates in the progress section

### Audio Won't Play

- Some browsers require user interaction before playing audio
- Try clicking play again, or check browser console for errors
- Verify the audio URL is accessible

## 🚀 Next Steps (Optional Enhancements)

1. **User Accounts**: Add authentication to save generated songs
2. **History**: Store generation history in localStorage or database
3. **Sharing**: Add social sharing features
4. **Advanced Controls**: Add more Suno API parameters (instrumental mode, etc.)
5. **Playlists**: Create collections of generated songs

## 📝 Code Structure

```
/app
  /api
    /generate-music/route.ts    # Starts song generation
    /check-status/route.ts      # Checks generation status
  page.tsx                      # Main UI component

/lib
  suno-service.ts              # Service layer for API calls

.env.local                     # Environment variables (create this!)
```

## 🎉 You're All Set!

Your Suno-powered music generation app is ready to rock! 🎸

Make sure to:

1. Get your API key from the Suno booth
2. Add it to `.env.local`
3. Start the dev server
4. Create some amazing music! 🎵
