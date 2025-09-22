const fs = require('fs');
const https = require('https');

// Array of story IDs you want to fetch
const storyIds = [56631]; // Add more IDs as needed

async function fetchStoryCaptions(storyId) {
  return new Promise((resolve, reject) => {
    const postData = `do=story&s=${storyId}`;
    
    const options = {
      hostname: 'mspfa.com',
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function updateAllCaptions() {
  let allCaptions = {};
  
  // Try to read existing file to preserve other data
  try {
    const existingData = fs.readFileSync('pageCaptions.json', 'utf8');
    allCaptions = JSON.parse(existingData);
  } catch (error) {
    console.log('No existing file found, creating new one');
  }
  
  for (const storyId of storyIds) {
    try {
      console.log(`Fetching captions for story ${storyId}...`);
      const data = await fetchStoryCaptions(storyId);
      
      if (data && data.p) {
        const storyCaptions = {};
        data.p.forEach((page, index) => {
          storyCaptions[index + 1] = page.c;
        });
        
        allCaptions[storyId] = storyCaptions;
        console.log(`Successfully fetched ${Object.keys(storyCaptions).length} captions for story ${storyId}`);
      }
    } catch (error) {
      console.error(`Error fetching story ${storyId}:`, error.message);
    }
  }
  
  // Write updated data to file
  fs.writeFileSync('pageCaptions.json', JSON.stringify(allCaptions, null, 2));
  console.log('Successfully updated pageCaptions.json');
}

updateAllCaptions();
