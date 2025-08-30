# Beta Signup System Analysis & Design

## Current UserProfile Structure

### Existing Fields
- **Basic Info**: id, name, displayName, firstName, lastName, email, phone
- **Profile**: avatar, coverPhoto, headerPhoto, title, company, location, bio, headline, summary
- **Professional**: skills, experience, education, industry, experienceLevel
- **AI Collaboration**: aiAgents, aiSkills, collaborations, responseTime
- **Social**: connections, profileViews, postImpressions, searchAppearances, rating
- **Settings**: isOnline, lastSeen, isPublic, timezone, emailVerified, phoneVerified, twoFactorEnabled
- **External**: website, linkedIn, twitter, github, profileURL
- **Timestamps**: createdAt, updatedAt

### Missing Fields for Beta Signup
- **Approval Status**: approvalStatus ('pending' | 'approved' | 'rejected')
- **Beta Signup Data**: 
  - role (from current waitlist form)
  - aiConcern (from current waitlist form)
  - whyAccess, organization, deploymentUrgency (from step 2)
  - currentAiTools, biggestAiFailure, additionalConcerns
- **Admin Fields**:
  - approvedBy (admin user ID)
  - approvedAt (timestamp)
  - rejectedBy, rejectedAt
  - adminNotes
- **Signup Tracking**:
  - signupSource ('waitlist' | 'invitation' | 'direct')
  - signupAt (timestamp)
  - invitedBy (if invited by another user)

## Current Waitlist Flow Issues

1. **Disconnected Systems**: Waitlist form stores data separately from user accounts
2. **Manual Process**: Admin has to manually create accounts for approved users
3. **No Email Notifications**: Users don't get notified of approval/rejection
4. **Profile Creation Gap**: Google OAuth users bypass profile creation entirely

## Proposed Beta Signup Flow

### User Journey
1. User visits login page
2. Clicks "Sign Up for Beta Access"
3. Fills out enhanced signup form (2 steps)
4. Firebase Auth account created immediately
5. Firestore profile created with approvalStatus: 'pending'
6. User can sign in but sees "Awaiting Approval" screen
7. Admin approves/rejects from admin dashboard
8. Email notification sent to user
9. Approved users get full access

### Technical Implementation
1. **Enhanced UserProfile Interface** - Add approval and beta signup fields
2. **Beta Signup Service** - Handle account creation + profile creation
3. **Approval Gate Component** - Screen for pending users
4. **Admin Dashboard** - Manage pending signups
5. **Email Service** - SendGrid/Resend integration
6. **Updated Auth Flow** - Check approval status after login

## Email Integration Options

### SendGrid (Recommended)
- Enterprise-grade reliability
- Good Firebase Functions integration
- Template system for different email types
- Analytics and tracking

### Resend (Alternative)
- Developer-friendly API
- Modern interface
- Good for smaller scale
- Simpler setup

### Email Templates Needed
1. **Welcome/Confirmation** - "Thanks for signing up, awaiting approval"
2. **Approval Notification** - "You've been approved! Welcome to Promethios"
3. **Rejection Notification** - "Unfortunately, we can't approve your request at this time"
4. **Admin Notification** - "New beta signup awaiting review"

## Next Steps
1. Enhance UserProfile interface with approval fields
2. Create BetaSignupService for account + profile creation
3. Update login page to use new signup flow
4. Build admin approval interface
5. Integrate email provider
6. Test complete flow

