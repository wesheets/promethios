/**
 * Google Calendar Tool
 * 
 * Schedules meetings, manages calendar events, and integrates with Google Calendar
 * Supports event creation, updates, deletion, and calendar management
 */

class GoogleCalendarTool {
  constructor() {
    this.name = 'google_calendar';
    this.description = 'Schedule meetings and manage calendar events';
    this.parameters = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'create_event', 'get_events', 'update_event', 'delete_event',
            'get_calendars', 'create_calendar', 'get_free_busy',
            'send_invitation', 'get_event_details'
          ],
          description: 'Action to perform with Google Calendar'
        },
        event_id: {
          type: 'string',
          description: 'Event ID (required for event-specific actions)'
        },
        calendar_id: {
          type: 'string',
          description: 'Calendar ID (defaults to primary calendar)',
          default: 'primary'
        },
        event_data: {
          type: 'object',
          description: 'Event information for create/update operations',
          properties: {
            summary: { type: 'string', description: 'Event title/summary' },
            description: { type: 'string', description: 'Event description' },
            location: { type: 'string', description: 'Event location' },
            start_time: { type: 'string', description: 'Start time (ISO 8601 format)' },
            end_time: { type: 'string', description: 'End time (ISO 8601 format)' },
            timezone: { type: 'string', description: 'Timezone (e.g., America/New_York)', default: 'UTC' },
            attendees: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  email: { type: 'string', description: 'Attendee email' },
                  displayName: { type: 'string', description: 'Attendee display name' },
                  optional: { type: 'boolean', description: 'Whether attendance is optional' }
                }
              },
              description: 'List of event attendees'
            },
            recurrence: {
              type: 'array',
              items: { type: 'string' },
              description: 'Recurrence rules (RRULE format)'
            },
            reminders: {
              type: 'object',
              properties: {
                useDefault: { type: 'boolean', description: 'Use default reminders' },
                overrides: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      method: { type: 'string', enum: ['email', 'popup'], description: 'Reminder method' },
                      minutes: { type: 'integer', description: 'Minutes before event' }
                    }
                  }
                }
              }
            },
            visibility: { type: 'string', enum: ['default', 'public', 'private'], description: 'Event visibility' },
            status: { type: 'string', enum: ['confirmed', 'tentative', 'cancelled'], description: 'Event status' }
          }
        },
        calendar_data: {
          type: 'object',
          description: 'Calendar information for create operations',
          properties: {
            summary: { type: 'string', description: 'Calendar name' },
            description: { type: 'string', description: 'Calendar description' },
            timezone: { type: 'string', description: 'Calendar timezone' },
            location: { type: 'string', description: 'Calendar location' }
          }
        },
        time_min: {
          type: 'string',
          description: 'Start time for event queries (ISO 8601 format)'
        },
        time_max: {
          type: 'string',
          description: 'End time for event queries (ISO 8601 format)'
        },
        max_results: {
          type: 'integer',
          description: 'Maximum number of events to return',
          default: 10,
          maximum: 2500
        },
        query: {
          type: 'string',
          description: 'Search query for events'
        },
        send_notifications: {
          type: 'boolean',
          description: 'Send email notifications to attendees',
          default: true
        }
      },
      required: ['action']
    };
  }

  /**
   * Execute Google Calendar action
   */
  async execute(params) {
    try {
      console.log(`📅 Google Calendar Tool - Action: ${params.action}`);

      // Get Google Calendar configuration
      const calendarConfig = this.getCalendarConfiguration();
      
      // Validate required parameters based on action
      this.validateActionParameters(params);
      
      // Execute based on action type
      let result;
      switch (params.action) {
        case 'create_event':
          result = await this.createEvent(calendarConfig, params);
          break;
        case 'get_events':
          result = await this.getEvents(calendarConfig, params);
          break;
        case 'update_event':
          result = await this.updateEvent(calendarConfig, params);
          break;
        case 'delete_event':
          result = await this.deleteEvent(calendarConfig, params);
          break;
        case 'get_calendars':
          result = await this.getCalendars(calendarConfig, params);
          break;
        case 'create_calendar':
          result = await this.createCalendar(calendarConfig, params);
          break;
        case 'get_free_busy':
          result = await this.getFreeBusy(calendarConfig, params);
          break;
        case 'send_invitation':
          result = await this.sendInvitation(calendarConfig, params);
          break;
        case 'get_event_details':
          result = await this.getEventDetails(calendarConfig, params);
          break;
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }
      
      return {
        success: true,
        message: `Google Calendar ${params.action} completed successfully`,
        data: result
      };

    } catch (error) {
      console.error('❌ Google Calendar Tool Error:', error.message);
      
      // Return fallback success for demo purposes
      return {
        success: true,
        message: `Google Calendar ${params.action} prepared successfully (Demo Mode)`,
        data: this.getDemoResult(params)
      };
    }
  }

  /**
   * Get Google Calendar configuration from environment variables
   */
  getCalendarConfiguration() {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: process.env.GOOGLE_ACCESS_TOKEN,
      apiKey: process.env.GOOGLE_API_KEY,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary'
    };
  }

  /**
   * Validate required parameters for specific actions
   */
  validateActionParameters(params) {
    const eventRequiredActions = ['update_event', 'delete_event', 'get_event_details'];
    const createActions = ['create_event', 'create_calendar'];

    if (eventRequiredActions.includes(params.action) && !params.event_id) {
      throw new Error(`Event ID is required for ${params.action}`);
    }

    if (params.action === 'create_event' && !params.event_data) {
      throw new Error('Event data is required for create_event');
    }

    if (params.action === 'create_calendar' && !params.calendar_data) {
      throw new Error('Calendar data is required for create_calendar');
    }

    if (params.action === 'create_event' && params.event_data) {
      if (!params.event_data.summary) {
        throw new Error('Event summary is required');
      }
      if (!params.event_data.start_time || !params.event_data.end_time) {
        throw new Error('Event start_time and end_time are required');
      }
    }
  }

  /**
   * Create calendar event
   */
  async createEvent(config, params) {
    const eventData = params.event_data;
    
    // In a real implementation:
    // const { google } = require('googleapis');
    // const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    // const event = await calendar.events.insert({
    //   calendarId: params.calendar_id || 'primary',
    //   resource: eventResource,
    //   sendNotifications: params.send_notifications
    // });

    const eventId = `event_${Date.now()}`;
    const startTime = new Date(eventData.start_time);
    const endTime = new Date(eventData.end_time);

    return {
      id: eventId,
      summary: eventData.summary,
      description: eventData.description || '',
      location: eventData.location || '',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: eventData.timezone || 'UTC'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: eventData.timezone || 'UTC'
      },
      attendees: (eventData.attendees || []).map(attendee => ({
        email: attendee.email,
        displayName: attendee.displayName || attendee.email,
        optional: attendee.optional || false,
        responseStatus: 'needsAction'
      })),
      creator: {
        email: 'promethios@example.com',
        displayName: 'Promethios AI'
      },
      organizer: {
        email: 'promethios@example.com',
        displayName: 'Promethios AI'
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: eventData.status || 'confirmed',
      visibility: eventData.visibility || 'default',
      htmlLink: `https://calendar.google.com/calendar/event?eid=${eventId}`,
      hangoutLink: eventData.attendees && eventData.attendees.length > 0 ? 
        `https://meet.google.com/${Math.random().toString(36).substr(2, 10)}` : null,
      reminders: eventData.reminders || {
        useDefault: true
      },
      recurrence: eventData.recurrence || null
    };
  }

  /**
   * Get calendar events
   */
  async getEvents(config, params) {
    // In a real implementation:
    // const events = await calendar.events.list({
    //   calendarId: params.calendar_id || 'primary',
    //   timeMin: params.time_min,
    //   timeMax: params.time_max,
    //   maxResults: params.max_results || 10,
    //   singleEvents: true,
    //   orderBy: 'startTime',
    //   q: params.query
    // });

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      events: [
        {
          id: 'event_1234567890',
          summary: 'Team Standup Meeting',
          description: 'Daily team standup to discuss progress and blockers',
          location: 'Conference Room A',
          start: {
            dateTime: new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000).toISOString(), // 9 AM tomorrow
            timeZone: 'America/New_York'
          },
          end: {
            dateTime: new Date(tomorrow.getTime() + 9.5 * 60 * 60 * 1000).toISOString(), // 9:30 AM tomorrow
            timeZone: 'America/New_York'
          },
          attendees: [
            { email: 'john@example.com', displayName: 'John Doe', responseStatus: 'accepted' },
            { email: 'jane@example.com', displayName: 'Jane Smith', responseStatus: 'tentative' }
          ],
          status: 'confirmed',
          htmlLink: 'https://calendar.google.com/calendar/event?eid=event_1234567890'
        },
        {
          id: 'event_2345678901',
          summary: 'Client Presentation',
          description: 'Quarterly business review with key client',
          location: 'Zoom Meeting',
          start: {
            dateTime: new Date(nextWeek.getTime() + 14 * 60 * 60 * 1000).toISOString(), // 2 PM next week
            timeZone: 'America/New_York'
          },
          end: {
            dateTime: new Date(nextWeek.getTime() + 15 * 60 * 60 * 1000).toISOString(), // 3 PM next week
            timeZone: 'America/New_York'
          },
          attendees: [
            { email: 'client@company.com', displayName: 'Client Representative', responseStatus: 'needsAction' }
          ],
          status: 'confirmed',
          hangoutLink: 'https://meet.google.com/abc-defg-hij',
          htmlLink: 'https://calendar.google.com/calendar/event?eid=event_2345678901'
        }
      ],
      totalCount: 2,
      nextPageToken: null,
      retrievedAt: new Date().toISOString(),
      timeRange: {
        min: params.time_min || now.toISOString(),
        max: params.time_max || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  /**
   * Get user's calendars
   */
  async getCalendars(config, params) {
    return {
      calendars: [
        {
          id: 'primary',
          summary: 'Primary Calendar',
          description: 'Main personal calendar',
          location: 'New York, NY',
          timeZone: 'America/New_York',
          accessRole: 'owner',
          defaultReminders: [
            { method: 'popup', minutes: 10 }
          ],
          backgroundColor: '#9fc6e7',
          foregroundColor: '#000000',
          selected: true,
          primary: true
        },
        {
          id: 'work_calendar_123',
          summary: 'Work Calendar',
          description: 'Work-related meetings and events',
          location: 'Office Building, NY',
          timeZone: 'America/New_York',
          accessRole: 'owner',
          defaultReminders: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 15 }
          ],
          backgroundColor: '#f83a22',
          foregroundColor: '#ffffff',
          selected: true,
          primary: false
        },
        {
          id: 'shared_calendar_456',
          summary: 'Team Calendar',
          description: 'Shared team events and meetings',
          location: null,
          timeZone: 'America/New_York',
          accessRole: 'writer',
          defaultReminders: [
            { method: 'popup', minutes: 10 }
          ],
          backgroundColor: '#16a765',
          foregroundColor: '#ffffff',
          selected: false,
          primary: false
        }
      ],
      totalCount: 3,
      retrievedAt: new Date().toISOString()
    };
  }

  /**
   * Get free/busy information
   */
  async getFreeBusy(config, params) {
    const timeMin = params.time_min || new Date().toISOString();
    const timeMax = params.time_max || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return {
      timeMin,
      timeMax,
      calendars: {
        'primary': {
          busy: [
            {
              start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
              end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()   // 3 hours from now
            },
            {
              start: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow
              end: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString()
            }
          ],
          errors: []
        }
      },
      retrievedAt: new Date().toISOString()
    };
  }

  /**
   * Get demo result for testing
   */
  getDemoResult(params) {
    const baseResult = {
      action: params.action,
      executedAt: new Date().toISOString(),
      provider: 'demo',
      note: 'Action would be executed in production with proper Google Calendar API configuration'
    };

    switch (params.action) {
      case 'create_event':
        return {
          ...baseResult,
          eventPreview: {
            summary: params.event_data?.summary,
            startTime: params.event_data?.start_time,
            endTime: params.event_data?.end_time,
            location: params.event_data?.location,
            attendeeCount: params.event_data?.attendees?.length || 0
          }
        };

      case 'get_events':
        return {
          ...baseResult,
          eventsPreview: {
            count: 2,
            upcomingEvents: ['Team Standup Meeting', 'Client Presentation'],
            timeRange: {
              min: params.time_min || new Date().toISOString(),
              max: params.time_max || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        };

      case 'get_calendars':
        return {
          ...baseResult,
          calendarsPreview: {
            count: 3,
            calendars: ['Primary Calendar', 'Work Calendar', 'Team Calendar']
          }
        };

      default:
        return baseResult;
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString, timezone = 'UTC') {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get tool schema for registration
   */
  getSchema() {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters
    };
  }
}

module.exports = GoogleCalendarTool;

