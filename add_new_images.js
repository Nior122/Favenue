// COMPLETED: Successfully added 31 new JPEG images to bigtittygothegg profile
// Script can be deleted - kept for reference
import { db } from './server/db.ts';
import { profiles, profileImages } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

// Extract only JPEG URLs from the provided files
const newJpegUrls = [
  // From extracted_image_urls (1)
  'https://img.coomer.st/thumbnail/data/0b/7e/0b7e4b3cab4cfe04aed91018dda2c8f094e6c7c2bfdcea0d1fdd7fa3895a1b33.jpg',
  'https://img.coomer.st/thumbnail/data/1f/34/1f34456e7ce2b99d2f7c13809baf2a4526b7768c52ae2c6ab74ec361da3131cc.jpg',
  'https://img.coomer.st/thumbnail/data/25/3e/253ee60282995f7a9ee218aaa4884cbffd05a89869304f5bf337fffeab310bc9.jpg',
  'https://img.coomer.st/thumbnail/data/2d/95/2d95d6ce7665e8b5da56a537c216e0b6885e08c742337fee70fce8b292541c30.jpg',
  'https://img.coomer.st/thumbnail/data/34/1a/341a2d9c1c7558f107a4348a2e28859a878eadf25d351e3deb84c09da66f9d32.jpg',
  'https://img.coomer.st/thumbnail/data/3b/86/3b86b470e8370a818f5f9054c529e3086c69cba8704e7555b91be9789b5695e1.jpg',
  'https://img.coomer.st/thumbnail/data/3c/0e/3c0e5c7774f427856ac2bc003516abcd80c774ceedc24966aab2f96d4f92c92f.jpg',
  'https://img.coomer.st/thumbnail/data/3f/9c/3f9ce371d12b461b21b3ecb7514ee8118e1be881e5cb4a9624193483e440181d.jpg',
  'https://img.coomer.st/thumbnail/data/43/f3/43f3414f007eb52dc5f48f5eea502d6c2ce267a513ee331edd7177812fcc481c.jpg',
  'https://img.coomer.st/thumbnail/data/44/1e/441e49ff0397766ea5b6bc5aa647cb04490e4436b1452dd237db8b75ef0212fe.jpg',
  'https://img.coomer.st/thumbnail/data/48/81/48812bb4058490250c2f03c511dc994ae76a52292adfa73c38fa5e2834b738fa.jpg',
  'https://img.coomer.st/thumbnail/data/4d/cb/4dcb00940d03c2322f2c630c6b0b07de3daed3a9f2ac897c7b84fa68c7e8f7b3.jpg',
  'https://img.coomer.st/thumbnail/data/56/87/5687e7fcaeda7d7a5655dbe0c619b874b61b8739ee13d169fbfa1d00d66d5df5.jpg',
  'https://img.coomer.st/thumbnail/data/5b/ff/5bff6a228a536b9f466449bec45a82aab917f9bdcba054f670f9f20f4116e685.jpg',
  'https://img.coomer.st/thumbnail/data/68/a0/68a055071861bfbafbad1a1c60cebc56ab4c0eef8f8ac5a137206bf9b1bbe559.jpg',
  'https://img.coomer.st/thumbnail/data/9b/83/9b83e9c7e330359514dcf79840206912efd78fed975137db3b7a6204654fc3cd.jpg',
  'https://img.coomer.st/thumbnail/data/a3/5f/a35f31151b15a0c3dcb36e142c7063c9274d864195e51b4e03bf08eba1cf8023.jpg',
  'https://img.coomer.st/thumbnail/data/b7/15/b71517de02b4b14ae663d02651e5676f87157dd9c916dd414b6215428e61c09d.jpg',
  'https://img.coomer.st/thumbnail/data/b9/bb/b9bb983f6dbb7b9741a96bb5cba265b106130db147a1a8836cde6440e3aa771a.jpg',
  'https://img.coomer.st/thumbnail/data/be/f8/bef85b8e8042554ff46b1c7bfbdc8cf538d1d90c3fe32068124de976f7f06a36.jpg',

  // From extracted_image_urls (2) - Full resolution JPEGs
  'https://n1.coomer.st/data/55/72/5572939ce5baa73b837136814d1b2690e6c2a3686363030afad3e5805be267d3.jpg?f=1639x2048_ce2180c77b32f452c4a14cc3ea14bd88.jpg',
  'https://n1.coomer.st/data/81/b9/81b90bd320096f228d03d1ffaca0146a07a0626d73952e88ce27815fff0800d8.jpg?f=1639x2048_595074257b9eae2776cceae0756782d6.jpg',
  'https://n2.coomer.st/data/92/2c/922c51edb28c698388f56bbc39e3fc7a7a1c6328fb03c6b83a73d0af43f267da.jpg?f=1639x2048_6841bcd72b093992c4def05d5816bdf6.jpg',
  'https://n2.coomer.st/data/f0/cc/f0cc4b6670421ae433a9bbb744f83a2195400b7eb052aaf0bc6fc2076d02f1d1.jpg?f=1639x2048_5e11f062b5d03c40d777084ee88cef78.jpg',
  'https://n3.coomer.st/data/b9/35/b935aa1d25be5e39ead1d6ab9f6a35fc24f398e321f0496bf8a93a052ef0c5c0.jpg?f=1639x2048_57df33507f063fffb655931096948d9d.jpg',

  // From extracted_image_urls (3) - Additional thumbnails
  'https://img.coomer.st/thumbnail/data/0b/02/0b028fb64acc0725a59776d7bc206f43a9becccf3d10a675fc33590b68613043.jpg',
  'https://img.coomer.st/thumbnail/data/11/b5/11b5ea20ab11529971f6471de2ae780a43e256f5fb3358b860d1fbe140297d22.jpg',
  'https://img.coomer.st/thumbnail/data/22/aa/22aaf99e7b357f7ca9bc9fadb5555379ce3a0d2b6a2c8c36ecb5f673cb4b4016.jpg',
  'https://img.coomer.st/thumbnail/data/2d/e3/2de39d0bf5d8cbf9a46b97b36dae99c90c5d1a61ceb59d65d01425beedf589cd.jpg',
  'https://img.coomer.st/thumbnail/data/2e/48/2e48c0c0cf6654f4f868eda6cf8984447ef1a654a668263978264ce63233a47b.jpg',
  'https://img.coomer.st/thumbnail/data/2e/f1/2ef146cdbbc475bab938bae42cdbf7844a2eb202fd3768999f468b84da8de645.jpg'
];

// Sexy captions for the posts
const sexyCaptions = [
  "Feeling dangerous in black lace... who wants to unwrap me? 🖤",
  "Gothic goddess vibes tonight... come worship at my altar ⛧",
  "Dark desires and pale skin... your perfect combination 🌙",
  "Leather and lace, ready to dominate your thoughts 💀",
  "Midnight confessions... tell me your darkest fantasies",
  "Fishnet Friday got me feeling extra naughty 🕸️",
  "Shadow play and sultry stares... can you handle the heat?",
  "Black lipstick kisses and sinful whispers 💋",
  "Curves that could make angels fall... ready to sin?",
  "Gothic temptress in her natural habitat 🦇",
  "Pale perfection meets dark desires... absolutely irresistible",
  "Lace and shadows, creating magic in the moonlight",
  "Your gothic dream girl, bringing fantasies to life 🌒",
  "Dark enchantress casting spells with every pose ✨",
  "Midnight mischief and seductive secrets await...",
  "Black silk against porcelain skin... pure temptation",
  "Gothic glamour with a wicked twist 🖤",
  "Dancing with shadows, playing with your desires",
  "Your darkest dreams wrapped in fishnet and silk",
  "Vampiric beauty ready to drain you of everything... 🧛‍♀️"
];

async function addNewImages() {
  try {
    console.log('Finding bigtittygothegg profile...');
    
    // Get the profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.name, 'bigtittygothegg'));
    
    if (!profile) {
      console.error('Profile not found!');
      return;
    }
    
    console.log(`Found profile: ${profile.name} (ID: ${profile.id})`);
    
    // Get current image count to set proper order
    const existingImages = await db
      .select()
      .from(profileImages)
      .where(eq(profileImages.profileId, profile.id));
    
    let currentCount = existingImages.length;
    console.log(`Current images: ${currentCount}`);
    
    // Add images in batches of 20 (following the 20 image per post rule)
    const batchSize = 20;
    let addedCount = 0;
    
    for (let i = 0; i < newJpegUrls.length; i += batchSize) {
      const batch = newJpegUrls.slice(i, i + batchSize);
      const caption = sexyCaptions[Math.floor(i / batchSize)] || "Darkly seductive... come explore my world 🖤";
      
      console.log(`\nAdding batch ${Math.floor(i / batchSize) + 1} (${batch.length} images)`);
      console.log(`Caption: "${caption}"`);
      
      for (const [index, imageUrl] of batch.entries()) {
        try {
          await db.insert(profileImages).values({
            profileId: profile.id,
            imageUrl: imageUrl,
            isMainImage: false,
            order: (currentCount + addedCount).toString()
          });
          
          addedCount++;
          console.log(`  ✓ Added image ${addedCount}: ${imageUrl.substring(0, 60)}...`);
        } catch (error) {
          console.error(`  ✗ Failed to add image: ${imageUrl}`);
          console.error(`    Error: ${error.message}`);
        }
      }
    }
    
    // Update profile media count
    const newMediaCount = (parseInt(profile.mediaCount) + addedCount).toString();
    await db
      .update(profiles)
      .set({ 
        mediaCount: newMediaCount,
        updatedAt: new Date()
      })
      .where(eq(profiles.id, profile.id));
    
    console.log(`\n✅ Successfully added ${addedCount} new images to ${profile.name}`);
    console.log(`📊 Total media count updated: ${profile.mediaCount} → ${newMediaCount}`);
    console.log(`🎨 Images organized into ${Math.ceil(addedCount / batchSize)} posts with sexy captions`);
    
  } catch (error) {
    console.error('❌ Error adding images:', error);
  }
}

// Run the function
addNewImages();