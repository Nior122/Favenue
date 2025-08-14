# CreatorHub - Simplified Data Structure

## ✅ New Super Simple Structure!

Your data management is now **extremely simple**. Everything is in the `data/` folder with this structure:

```
data/
├── bigtittygothegg/           # Profile folder
│   ├── profile.json           # Profile info (optional)
│   ├── post-001.json          # Post files
│   ├── post-002.json
│   └── post-003.json
└── anothercreator/            # Another profile folder  
    ├── profile.json
    ├── post-001.json
    └── post-002.json
```

## 📝 How To Add Content

### **Add a New Post** (Super Easy!)
1. Go to `data/bigtittygothegg/` folder
2. Create a new file: `post-004.json`
3. Paste this content:
```json
{
  "title": "Your Post Title",
  "description": "Your post description", 
  "imageUrl": "https://your-image-url.com/image.jpg",
  "tags": ["tag1", "tag2"]
}
```
4. Commit to GitHub - **Done!**

### **Add a New Profile**
1. Create new folder: `data/newcreator/`
2. Add `profile.json`:
```json
{
  "name": "newcreator",
  "title": "Amazing Creator", 
  "category": "Alternative",
  "description": "Creator description",
  "profilePictureUrl": "https://image-url.com",
  "tags": ["tag1", "tag2"]
}
```
3. Add post files: `post-001.json`, `post-002.json`, etc.
4. Commit to GitHub - **Done!**

## 🎯 Super Simple Rules

- **Each profile = One folder** in `data/`
- **Each post = One JSON file** in the profile folder
- **No IDs needed** - folder name becomes the profile ID
- **No database** - everything in simple JSON files
- **Just commit to GitHub** - auto-deploys!

## 🚀 Helper Script (Optional)

```bash
node scripts/add-post-simple.js bigtittygothegg "New Title" "https://image.jpg" "Description" "tag1,tag2"
```

That's it! Super simple file management with GitHub commits.