# 🎵 Suno x HackMIT 2025 Demo Starter Web App

A demo starter web app for HackMIT 2025 that leverages the Suno external API to generate music with AI! Transform your ideas into beautiful music with just a text description.

**📖 Comprehensive API Documentation:** [suno.com/hackmit](https://suno.com/hackmit)

## 🚀 Quick Start

### 0. Clone This Starter App

Want to use this code to get started, or play with the app? Begin by cloning the repository:

```bash
git clone https://github.com/suno-ai/hackmit-starter-app.git
cd hackmit-starter-app
```

### 1. Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Create the environment file
touch .env.local
```

Add your Suno API key:

```env
# .env.local
SUNO_API_KEY=your_suno_api_key_here
```

**🚨 Important:** One of your team members should have received an email with your team's API key. If not, then please visit the Suno booth at HackMIT 2025!

### 2. Install and Run

Your project already has all the necessary dependencies. Simply run:

```bash
# Install dependencies
yarn install

# Start the development server
yarn dev
```

### 3. Test the Starter App

1. **Open your browser** to `http://localhost:3000`
2. **Enter a song description** like "An upbeat pop song about coding at a hackathon"
3. **Add style tags** (optional) like "pop, electronic, energetic"
4. **Click "Generate Song"** and begin streaming the song as it generates
5. **Wait 1-2 minutes** for generation to complete
6. **Play and download** your generated songs!

## 🎯 Starter Features Implemented

### Frontend Features

- **Dual Input Fields**: Song description + optional style tags
- **Audio Playback**: Built-in play/pause controls with scrubbing
- **Download**: Direct download of MP3 files

### Backend Features

- **Suno HackMIT API Integration**: Uses `/api/v2/external/hackmit/` endpoints
- **Polling Logic**: Automatic status checking until completion
- **Environment Security**: Secure token handling

## 🔍 API Endpoints

### `POST /api/generate-music`

Starts song generation with the Suno HackMIT API.

> **Note**: The HackMIT generate endpoint returns a single clip object, which our API wraps in an array for frontend consistency.

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

Checks the generation status of some clip(s).

> **Note**: The HackMIT clips endpoint returns an array of clip objects (even for a single clip ID).

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

- Song generation typically takes 1-2 minutes
- The app polls every 5 seconds automatically
- Check the status updates in the progress section

### Audio Won't Play

- Some browsers require user interaction before playing audio
- Try clicking play again, or check browser console for errors
- Verify that the audio URL is accessible

## 📝 Main Code Structure

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

Your Suno-powered music generation app is ready to rock for HackMIT 2025! 🎸

Make sure to:

1. Get your API key from the Suno booth
2. Add it to `.env.local` as `SUNO_API_KEY`
3. Start the dev server
4. Create some amazing music! 🎵

---

Built with ❤️ for HackMIT 2025 • Powered by [Suno](https://suno.com) • [API Docs](https://suno.com/hackmit)
