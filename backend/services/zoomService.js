const axios = require('axios');
const logger = require('../config/logger');

/**
 * Generates a JWT token for Zoom API authentication
 * @returns {string} JWT token
 */
async function getZoomAccessToken() {
  try {
    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'account_credentials',
        account_id: process.env.ZOOM_ACCOUNT_ID
      },
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    logger.error('Error getting Zoom access token:', error.message);
    throw new Error('Failed to authenticate with Zoom API');
  }
}

/**
 * Creates a Zoom meeting and returns the join URL
 * @param {string} topic - Meeting topic/title
 * @param {Date} startTime - Meeting start time
 * @param {number} durationMinutes - Meeting duration in minutes
 * @param {string} timezone - Timezone for the meeting (default: 'Europe/Paris')
 * @returns {Object} Meeting details including join URL
 */
async function createZoomMeeting(topic, startTime, durationMinutes, timezone = 'Europe/Paris') {
  try {
    const token = await getZoomAccessToken();
    
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic,
        type: 2, // Scheduled meeting
        start_time: startTime.toISOString(),
        duration: durationMinutes,
        timezone,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          waiting_room: false,
          mute_upon_entry: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    logger.info(`Zoom meeting created successfully with ID: ${response.data.id}`);
    return {
      id: response.data.id,
      join_url: response.data.join_url,
      password: response.data.password,
      start_url: response.data.start_url
    };
  } catch (error) {
    logger.error('Error creating Zoom meeting:', error.response?.data || error.message);
    throw new Error('Failed to create Zoom meeting');
  }
}

module.exports = {
  createZoomMeeting
}; 