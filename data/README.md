# Data Directory - GitHub Content Management

This directory contains all your content data that gets deployed with your application. You can manage your content by editing these files directly in GitHub.

## Structure

```
data/
├── profiles.json          # Main profiles data
├── posts/                 # Individual posts by profile
│   └── bigtittygothegg/   # Profile-specific posts
│       ├── post-001.json  # Individual post files
│       ├── post-002.json
│       └── post-003.json
└── README.md             # This file
```

## Managing Content

### Adding a New Profile

1. Edit `profiles.json` to add a new profile object:

```json
{
  "id": "newcreator",
  "name": "newcreator", 
  "title": "Content Creator",
  "category": "Lifestyle",
  "location": "United States",
  "description": "Amazing content creator",
  "profilePictureUrl": "https://example.com/profile.jpg",
  "coverPhotoUrl": "https://example.com/cover.jpg",
  "rating": "4.5",
  "reviewCount": "150",
  "likesCount": "5000",
  "mediaCount": "0",
  "viewsCount": "12000",
  "subscribersCount": "1500",
  "tags": ["lifestyle", "content"],
  "isActive": true,
  "createdAt": "2025-08-14T18:00:00.000Z",
  "updatedAt": "2025-08-14T18:00:00.000Z"
}
```

2. Create a new directory: `posts/newcreator/`

### Adding a New Post

1. Create a new file in `posts/[profileId]/post-XXX.json`:

```json
{
  "id": "post-004",
  "profileId": "bigtittygothegg",
  "title": "New Content Title",
  "description": "Description of the content",
  "imageUrl": "https://example.com/image.jpg",
  "isMainImage": false,
  "order": 4,
  "createdAt": "2025-08-14T18:00:00.000Z",
  "tags": ["tag1", "tag2"]
}
```

2. Update the profile's `mediaCount` in `profiles.json`

### Scripts (For Local Development)

Use these scripts locally to add content:

```bash
# Add a new profile
node scripts/add-profile.js "newcreator" "Content Creator" "Lifestyle" "United States" "Amazing content"

# Add a new post
node scripts/add-post.js bigtittygothegg "New Gothic Look" "https://example.com/image.jpg" "Stunning style" "gothic,style"
```

## Deployment

1. Make changes to JSON files in GitHub
2. Commit and push changes
3. Vercel automatically deploys the updated content
4. No database needed - all content served from files

## Current Content

- **1 Profile**: bigtittygothegg (Gothic Content Creator)
- **3 Sample Posts**: Located in `posts/bigtittygothegg/`

All images are hosted externally - just update the URLs in the JSON files.