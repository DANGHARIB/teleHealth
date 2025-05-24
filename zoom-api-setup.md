# Zoom API Integration Guide

## Overview
This guide will help you set up the Zoom API integration for your TeleHealth application, which enables the creation of real Zoom meetings when patients book appointments.

## Step 1: Create a Zoom Developer Account
1. Go to the [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Click on "Develop" in the top-right corner
3. Choose "Build App"

## Step 2: Create a Server-to-Server OAuth App
1. Select "Server-to-Server OAuth" app type
2. Name your app (e.g., "TeleHealth Integration")
3. Click "Create"

## Step 3: Configure App Scopes
Add the following scopes to your app:
- `meeting:write:admin` or `meeting:write` (to create meetings)
- `user:read:admin` or `user:read` (to get user information)

## Step 4: Collect Credentials
After creating your app, collect the following credentials:
- Client ID
- Client Secret
- Account ID

## Step 5: Add Credentials to .env File
Add the following to your `.env` file:

```
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_ACCOUNT_ID=your_zoom_account_id
```

## Step 6: Install Dependencies
Run the following command to install the required dependencies:

```bash
cd backend
npm install
```

## Testing
To test that your Zoom integration is working correctly:
1. Create a patient account
2. Book an appointment with a doctor
3. Check that a real Zoom meeting link is generated
4. Click the link to verify it leads to a valid Zoom meeting page

## Troubleshooting
If you encounter issues:
1. Check the server logs for errors
2. Verify your Zoom API credentials
3. Make sure your Zoom account has the necessary permissions
4. Check that your Zoom app has the correct scopes 