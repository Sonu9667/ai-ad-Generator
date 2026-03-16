# ai-ad-Generator
**Backend (server.py):**
1. User authentication with JWT (register, login, get_me)
2. Campaign generation endpoint with AI integration
3. Campaign CRUD operations (create, list, get, delete)
4. MongoDB models for User, Campaign, and GeneratedAd
5. Integration with emergentintegrations for LlmChat (GPT-5.2) and OpenAIImageGeneration (GPT Image 1)

**Frontend:**
1. App.js - Main app with routing and auth state management
2. LandingPage - Dark mode hero section with auth modal
3. Dashboard - Light mode with stats cards and campaign list
4. AdGenerator - Form for creating campaigns
5. CampaignDetails - View generated ads with images
6. Updated index.css with design guidelines (fonts, colors)
7. App.css with animations and platform badges

**Design Implementation:**
- Using Outfit for headings, Inter for body text
- Electric Indigo (#4F46E5) primary color, Acid Lime accents
- Dark landing page, light dashboard
- Glass-morphism effects
- Platform-specific badges
- Smooth animations with framer-motion
