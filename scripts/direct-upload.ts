import { createPostsFromMedia } from '../server/scraper';
import { writeFileSync } from 'fs';

async function directUpload() {
  const profileId = 'ruri';

  // Extract image URLs directly from the webpage content
  const imageUrls = [
    'https://img.coomer.st/data/dd/4f/dd4f55b189e4d334d3f81c86a990565b87ab7128d5e06bdd1145f2ab4283afb1.jpg',
    'https://img.coomer.st/data/36/64/3664a8d53b4a928245504c18bd40d4c4ce0441b870cae0cb082ced7a4a55f824.jpg',
    'https://img.coomer.st/data/79/c3/79c32e6274bb0d3e81e04e520d59565ccc125af81a12d6cacaafa9af85102238.jpg',
    'https://img.coomer.st/data/8e/bb/8ebbf32f550f833b5dd33d32d5541fc59d51310b836907a9917f735319b52054.jpg',
    'https://img.coomer.st/data/2d/4b/2d4bb2edd9ede1faf519244698b9b7fb7b09b079915bef964940d9356169a326.jpg',
    'https://img.coomer.st/data/1f/e9/1fe9e970e28819dc0a48b76e829445016f39a19131bed3ae69944cc1b7d9b5e1.jpg',
    'https://img.coomer.st/data/3e/de/3ede97c3b0c0ce41c35a65470bc9291a91f6639d41cc0d468b7f86d33d0170ee.jpg',
    'https://img.coomer.st/data/12/c7/12c7228935f98f4e66deb3619e499d28eea8aaa608432154be2eb30a89df9468.jpg',
    'https://img.coomer.st/data/24/dc/24dcd13cc043478bdaae2333fc8fda1eafdd525b6528930eef8de9b5ef937aea.jpg',
    'https://img.coomer.st/data/26/b6/26b66052f759b08077582ab4ef874cf87fcbe7f5c23d23e850ac0443ac0a7ed5.jpg',
    'https://img.coomer.st/data/20/03/2003232710c02d637c8cfc7db070c2a7197acf64594768701b2cea00a96d65aa.jpg',
    'https://img.coomer.st/data/6d/72/6d7253b76d8956ba9d3718f117bc58f312115553573b6460b6226f0699500d84.jpg',
    'https://img.coomer.st/data/ea/c4/eac459e0a1c5287fd02381551c6ead7930824b97b1cdf1803c8ca10af3858f1e.jpg',
    'https://img.coomer.st/data/51/5a/515aaadfa7f9493a37c090c16bbba2c2d5477bf45e1fa3bf8ed52861cd5530de.jpg',
    'https://img.coomer.st/data/ac/a5/aca52b261ade581928bd623bd98d6554d0d30388049b0bc4c7b1f5d0298da314.jpg',
    'https://img.coomer.st/data/05/d1/05d1cc6d6b2b10f6f8aa47bce4b00b01e54ab6125c8403abdbecfe7521c76f8b.jpg',
    'https://img.coomer.st/data/24/5e/245ec91268b5877889f43f8985e3250a604a42920c251df365a59e3bc0fca279.jpg',
    'https://img.coomer.st/data/96/1e/961e29c7132f909009e4e53ee2f03bca46abea7c01c244c80cd7e612254f471d.jpg',
    'https://img.coomer.st/data/a1/ef/a1ef210952dad2904e91aa105a0841aee286731f315dba35c7babb67964bcefb.jpg',
    'https://img.coomer.st/data/6d/7d/6d7dac6fad8b3b254e3ea142d8e8f4ce70b915ad467e7aecb4baf45214837d0a.jpg',
    'https://img.coomer.st/data/33/68/3368234012f98f7f5725bcf39cbb2b1b3ec7522017906dda055752f20928d499.jpg',
    'https://img.coomer.st/data/bb/6f/bb6ff9918c4cec24fffc61ff301ff4eb156a1fddf0c582151b145e476fb52bed.jpg',
    'https://img.coomer.st/data/c0/97/c09732e4909bd6e63e635e52cf4b359cf012efdc74f33766a27dc8a29d1f3a32.jpg',
    'https://img.coomer.st/data/64/52/64528457935c632290a5bfa353f2c65daeeceafb87ba6a520d28e5383067a711.jpg',
    'https://img.coomer.st/data/7e/0d/7e0de7bece75388c03315e91a056add3948b78693c32e66a344745849b4851dd.jpg',
    'https://img.coomer.st/data/c8/d9/c8d9d1c3e9e5b33a959af1b99a0b481c25b011ee32f165addc678882ab5f4cef.jpg',
    'https://img.coomer.st/data/0b/a1/0ba1df03ad97a9b085e7bdf84804f88725060d7ee3b25cb0b8bc309c23419a6d.jpg',
    'https://img.coomer.st/data/6d/18/6d18d9ff95fd072aa5b8927fe5b5ef743ecf102aae397e8745afb2f0f658be34.jpg',
    'https://img.coomer.st/data/fd/bd/fdbde981be2b529001ec2c40808f1c2e0575a1149d376560b56184bf52491f09.jpg',
    'https://img.coomer.st/data/a0/54/a054c3604c8c18bb0d6f279f3910b85c160a58add9bf54e2ad4ddb24ce3a377c.jpg',
    'https://img.coomer.st/data/40/58/405812b79fa37aa7733763d1e9e0c2cc60167192050f46b5bd08b5a1ac780556.jpg',
    'https://img.coomer.st/data/a0/6b/a06b9f1c5d380ab149386938d3bf953c9b1e327be928c91480f069ce21b8a321.jpg',
    'https://img.coomer.st/data/6f/cc/6fcc6c5b950f015110cab1a5df33635691b75df303a786294ab78734135e49cb.jpg',
    'https://img.coomer.st/data/51/60/5160a93f82999678b21d20b3f70469f5bea91960839f3885479ba5ca8abab0f9.jpg',
    'https://img.coomer.st/data/1f/cc/1fcc3c87e28d7a63db6b93b8a1670ba8cde7e132a2d571f8587e2402dd4d4e0c.jpg',
    'https://img.coomer.st/data/d7/a2/d7a2905c0817f24a1337c43dd066a39aba03952299674e09aa2fb488c59bc9e9.jpg',
    'https://img.coomer.st/data/ac/e1/ace144aa5c0774fb595a636cfdfffe0983f4d94e79007042378932ae0569b9f0.jpg',
    'https://img.coomer.st/data/23/12/231235bc37ca078c38282bc908ae0f1aa6a49f6955573915f06d6a0469c726d0.jpg',
    'https://img.coomer.st/data/41/fd/41fd3f73ebccce59b2fff3c0a2ee5ce8a678478a1134c23f1834d9354054ad38.jpg',
    'https://img.coomer.st/data/6c/05/6c050da69d80ef0674f883912e9feb00c9adab453d498cb517082e0a92716434.jpg',
    'https://img.coomer.st/data/af/f8/aff823059a318b96c28daeaf3ccd8f94d87b2e638331787c35dc2f818150081f.jpg',
    'https://img.coomer.st/data/ba/55/ba550765e22ebf3ea10b80f08a958b286983054a24653f3b0816719e440bedf6.jpg',
    'https://img.coomer.st/data/bf/7b/bf7badc0cdd680dcdd9c08d381a6e232c8402acce72fe1ce118670905a69a46a.jpg',
    'https://img.coomer.st/data/c5/4e/c54ec85fa4f4735f3ce1d7465c904108be57305577c478be32da93a16c399d07.jpg',
    'https://img.coomer.st/data/8f/fb/8ffbb3e32d3a1a0e1052cf1b56040bff9ec194a8252c68ef83cedbdf20b72e90.jpg',
    'https://img.coomer.st/data/7c/1f/7c1f7adf3edb1263ec75fb42ad501b14ba3099073156cb3829bf59c31fbd3669.jpg',
    'https://img.coomer.st/data/bf/17/bf17a25f6d3077cfeab1de128edf061a95927b7d141ea1dc4e9dd339f4114ab1.jpg',
    'https://img.coomer.st/data/14/7a/147af81f8cda6c688ab42c734ba2a895848e0cdfe5223451243e8389c4c5fadc.jpg',
    'https://img.coomer.st/data/ce/5d/ce5d621153968b37b36edf5d9fa2df1a39f29a215cbb1a11eae2fce7645da509.jpg',
    'https://img.coomer.st/data/7a/de/7ade237e28002b0d0ea14e5e142751ca45e09ae36c0412b09eb19641faa67388.jpg'
  ];

  try {
    console.log('🚀 Starting direct image upload...');
    console.log(`📸 Processing ${imageUrls.length} images for profile: ${profileId}`);

    // Convert URLs to MediaItem format
    const mediaItems = imageUrls.map((url, index) => ({
      url,
      type: 'image' as const,
      filename: `ruri-image-${String(index + 1).padStart(3, '0')}.jpg`
    }));

    // Create posts from media items
    await createPostsFromMedia(profileId, mediaItems);
    
    console.log(`🎉 Successfully uploaded ${mediaItems.length} images to profile: ${profileId}`);

  } catch (error) {
    console.error('❌ Error during direct upload:', error);
  }
}

directUpload();